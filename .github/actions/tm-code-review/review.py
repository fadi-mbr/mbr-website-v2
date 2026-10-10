#!/usr/bin/env python3
"""review.py — shared, advisory MR/PR code reviewer for tmwhead GitLab CI and GitHub Actions.

Collects the merge-request (or pull-request) diff, withholds secret-looking files, chunks
the rest, asks the tm-llm-gateway (OpenAI-compatible) for structured findings, dedupes them
and upserts ONE MR note / PR comment identified by a marker. Stdlib only (Python 3.11+).

Advisory by contract: exit 0 on every path (gateway down, bad key, crash) unless
CODE_REVIEW_BLOCKING=true AND the review completed AND a finding reaches
CODE_REVIEW_BLOCK_SEVERITY. Logs metadata only — never diff or note content in CI.

Usage:
  review.py                                   # CI: diff from GitLab/GitHub API / git, post note
  review.py --dry-run --diff-file x.diff      # print the would-be note, post nothing
  review.py --dry-run --diff-file x.diff --mock-reply reply.json   # no network at all
  review.py ... --json out.json               # also write the outcome (no diff content)

Docs: tools/ci/code-review/README.md
"""
from __future__ import annotations

import argparse
import dataclasses
import fnmatch
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass, field

MARKER = "<!-- tm-code-review:v1 -->"
DEFAULT_GATEWAY = "https://llm.infra.tmflix.com/v1"
DEFAULT_MODEL = "tier/code"
# Cloudflare's Browser Integrity Check answers 403 (error 1010) to the default
# "Python-urllib/3.x" agent, so the public review ingress needs our own name.
USER_AGENT = "tm-code-review/1.1 (+https://git.tmflix.com/tmwhead/ops-brain)"

SEVERITIES = ["critical", "major", "minor", "info"]  # most → least severe
CATEGORIES = {"correctness", "security", "performance", "reliability", "maintainability", "other"}
CONFIDENCES = {"high", "medium", "low"}
CONFIDENCE_CAP = {"high": "critical", "medium": "major", "low": "minor"}

# Files whose content must never leave the runner (matched on basename, lowercased).
WITHHELD_NAMES = [
    ".env", ".env.*", "*.env", "*.pem", "*.key", "*.crt", "*.p12", "*.pfx", "*.jks", "*.keystore",
    "id_rsa*", "id_dsa*", "id_ecdsa*", "id_ed25519*", "*.kdbx", "*.tfstate", "*.tfstate.*", "*.tfvars",
    "*.gpg", "*.age", ".npmrc", ".pypirc", ".netrc", "*secret*", "*credential*", "*.ovpn", "wg*.conf",
    "auth.json", "identity.env",
]
WITHHELD_DIRS = {"secret", "secrets", ".ssh", ".gnupg", "credentials"}
# Low-signal files: lockfiles, generated, binary.
SKIPPED_NAMES = [
    "*.lock", "package-lock.json", "pnpm-lock.yaml", "yarn.lock", "go.sum", "*.min.js", "*.min.css", "*.map",
    "*.snap", "*.png", "*.jpg", "*.jpeg", "*.gif", "*.webp", "*.ico", "*.pdf", "*.woff", "*.woff2", "*.ttf",
    "*.zip", "*.gz", "*.tar", "*.mp3", "*.mp4", "*.wav", "*.bin", "*.so", "*.dylib", "*.exe", "*.jar",
]
SKIPPED_DIRS = {"dist", "build", "node_modules", ".next", "__pycache__", ".venv", "coverage"}
# Added-line content that marks key material; the whole file is withheld.
SECRET_CONTENT = re.compile(
    r"-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----"
    r"|sk-[A-Za-z0-9_-]{16,}"
    r"|AKIA[0-9A-Z]{16}"
    r"|glpat-[A-Za-z0-9_-]{20,}"
    r"|gh[pousr]_[A-Za-z0-9]{30,}"
    r"|xox[abprs]-[A-Za-z0-9-]{10,}"
    r"|AIza[0-9A-Za-z_-]{35}"
)

SYSTEM_PROMPT = """You review one part of a merge request diff for concrete defects.
Each changed line is prefixed with its line number in the new file; removed lines have no number.

Report only issues with a reachable failure path that you can ground in the lines shown:
correctness bugs, security problems (injection, auth bypass, secrets or personal data written
to logs or output, unsafe deserialization, path traversal), data loss, broken error handling,
race conditions, resource leaks and real performance regressions.

Do not report: formatting or naming preferences, requests for more tests or comments without a
concrete defect, speculation about code you cannot see, or empty-string assignments that blank
a credential on purpose.

Severity: critical = outage, data loss, security breach; major = broken feature or likely bug;
minor = edge case or future hazard; info = worth a look. Low confidence must not exceed minor.
"line" is the new-file line number shown in the diff, or null. "file" is the path exactly as shown.
Prefer a short list of strong findings; an empty list is a valid answer.
Answer with JSON only, matching the provided schema."""

RESPONSE_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "required": ["summary", "findings"],
    "properties": {
        "summary": {"type": "string"},
        "findings": {
            "type": "array",
            "maxItems": 20,
            "items": {
                "type": "object",
                "additionalProperties": False,
                "required": ["file", "line", "severity", "category", "title", "rationale", "confidence"],
                "properties": {
                    "file": {"type": "string"},
                    "line": {"type": ["integer", "null"]},
                    "severity": {"type": "string", "enum": SEVERITIES},
                    "category": {"type": "string", "enum": sorted(CATEGORIES)},
                    "title": {"type": "string"},
                    "rationale": {"type": "string"},
                    "confidence": {"type": "string", "enum": ["high", "medium", "low"]},
                },
            },
        },
    },
}


def log(msg: str) -> None:
    print("code-review: " + msg, file=sys.stderr)


# ================================================================== config
def _int(env, key, default):
    try:
        return int(env.get(key, "") or default)
    except ValueError:
        return default


@dataclass
class Config:
    gateway_url: str = DEFAULT_GATEWAY
    key: str = ""
    model: str = DEFAULT_MODEL
    max_tokens: int = 1500
    timeout: int = 180
    max_diff_chars: int = 60_000
    chunk_chars: int = 12_000
    max_chunks: int = 6
    exclude: list = field(default_factory=list)
    blocking: bool = False
    block_severity: str = "critical"
    reasoning_effort: str = ""
    cf_access_id: str = ""
    cf_access_secret: str = ""

    @classmethod
    def from_env(cls, env) -> "Config":
        sev = (env.get("CODE_REVIEW_BLOCK_SEVERITY") or "critical").lower()
        return cls(
            gateway_url=(env.get("CODE_REVIEW_GATEWAY_URL") or DEFAULT_GATEWAY).rstrip("/"),
            key=env.get("CODE_REVIEW_GATEWAY_KEY", ""),
            model=env.get("CODE_REVIEW_MODEL") or DEFAULT_MODEL,
            max_tokens=min(_int(env, "CODE_REVIEW_MAX_TOKENS", 1500), 4000),
            timeout=_int(env, "CODE_REVIEW_TIMEOUT", 180),
            max_diff_chars=min(_int(env, "CODE_REVIEW_MAX_DIFF_CHARS", 60_000), 2_000_000),
            chunk_chars=_int(env, "CODE_REVIEW_CHUNK_CHARS", 12_000),
            max_chunks=min(_int(env, "CODE_REVIEW_MAX_CHUNKS", 6), 160),
            exclude=[g.strip() for g in (env.get("CODE_REVIEW_EXCLUDE") or "").split(",") if g.strip()],
            blocking=(env.get("CODE_REVIEW_BLOCKING", "").lower() == "true"),
            block_severity=sev if sev in SEVERITIES else "critical",
            reasoning_effort=env.get("CODE_REVIEW_REASONING_EFFORT", ""),
            cf_access_id=env.get("CODE_REVIEW_CF_ACCESS_CLIENT_ID", ""),
            cf_access_secret=env.get("CODE_REVIEW_CF_ACCESS_CLIENT_SECRET", ""),
        )


# ================================================================== diff model
@dataclass
class FileDiff:
    path: str
    header: str
    hunks: list

    @property
    def text(self) -> str:
        return self.header + "".join(self.hunks)


def _path_of(block: str) -> str:
    new = re.search(r"^\+\+\+ (?:b/)?(.+)$", block, re.M)
    if new and new.group(1).strip() != "/dev/null":
        return new.group(1).strip()
    old = re.search(r"^--- (?:a/)?(.+)$", block, re.M)
    if old and old.group(1).strip() != "/dev/null":
        return old.group(1).strip()
    m = re.search(r"^diff --git a/\S+ b/(\S+)", block, re.M)
    return m.group(1) if m else ""


def split_diff(diff: str) -> list:
    files = []
    for block in re.split(r"(?=^diff --git )", diff, flags=re.M):
        if not block.startswith("diff --git "):
            continue
        parts = re.split(r"(?=^@@ )", block, flags=re.M)
        path = _path_of(parts[0])
        if path:
            files.append(FileDiff(path=path, header=parts[0], hunks=parts[1:]))
    return files


HUNK_RE = re.compile(r"^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@")


def _annotate_hunk(hunk: str) -> str:
    lines = hunk.splitlines()
    if not lines:
        return ""
    m = HUNK_RE.match(lines[0])
    n = int(m.group(1)) if m else 0
    out = [lines[0]]
    for ln in lines[1:]:
        if ln.startswith("-"):
            out.append("     " + ln)
        elif ln.startswith("+") or ln.startswith(" "):
            out.append("%4d %s" % (n, ln))
            n += 1
        elif ln == "":
            out.append("%4d  " % n)
            n += 1
        else:  # "\ No newline at end of file"
            out.append("     " + ln)
    return "\n".join(out) + "\n"


def _annotate_header(header: str) -> str:
    keep = [ln for ln in header.splitlines() if ln.startswith(("diff --git", "--- ", "+++ ", "new file", "deleted file", "rename "))]
    return "\n".join(keep) + "\n"


def annotate(diff_text: str) -> str:
    return "".join(_annotate_header(f.header) + "".join(_annotate_hunk(h) for h in f.hunks) for f in split_diff(diff_text))


def changed_lines(f: FileDiff) -> set:
    got = set()
    for hunk in f.hunks:
        lines = hunk.splitlines()
        m = HUNK_RE.match(lines[0]) if lines else None
        n = int(m.group(1)) if m else 0
        for ln in lines[1:]:
            if ln.startswith("+"):
                got.add(n)
                n += 1
            elif ln.startswith(" ") or ln == "":
                n += 1
    return got


# ================================================================== denylist
def _match_any(name: str, globs) -> bool:
    return any(fnmatch.fnmatch(name, g) for g in globs)


def classify_path(path: str, extra_excludes) -> str:
    """'withheld' (never sent), 'skipped' (low signal) or 'review'."""
    low = path.lower()
    parts = low.split("/")
    base = parts[-1]
    if _match_any(base, WITHHELD_NAMES) or WITHHELD_DIRS.intersection(parts[:-1]):
        return "withheld"
    if extra_excludes and (_match_any(path, extra_excludes) or _match_any(base, extra_excludes)):
        return "skipped"
    if _match_any(base, SKIPPED_NAMES) or SKIPPED_DIRS.intersection(parts[:-1]):
        return "skipped"
    return "review"


def has_secret_content(f: FileDiff) -> bool:
    added = "\n".join(ln for h in f.hunks for ln in h.splitlines() if ln.startswith("+"))
    return bool(SECRET_CONTENT.search(added))


# ================================================================== chunking
@dataclass
class Chunk:
    text: str
    paths: list


@dataclass
class Plan:
    chunks: list = field(default_factory=list)
    reviewed: list = field(default_factory=list)
    withheld: list = field(default_factory=list)
    skipped: list = field(default_factory=list)
    unreviewed: list = field(default_factory=list)  # reviewable but over budget
    truncated: bool = False
    over_budget: bool = False
    files_total: int = 0
    chars_sent: int = 0


def _file_units(f: FileDiff, chunk_chars: int) -> list:
    """Annotated text units for one file, each <= chunk_chars (+ one header)."""
    header = _annotate_header(f.header)
    hunks = [_annotate_hunk(h) for h in f.hunks]
    whole = header + "".join(hunks)
    if len(whole) <= chunk_chars:
        return [whole]
    units, cur = [], ""
    budget = max(chunk_chars - len(header), 200)
    for h in hunks:
        # Preserve every annotated character, including large deletion hunks.
        # Each continuation repeats the file header; line numbers stay annotated.
        while len(h) > budget:
            if cur:
                units.append(header + cur)
                cur = ""
            cut = h.rfind("\n", 0, budget)
            cut = cut + 1 if cut >= 0 else budget
            units.append(header + h[:cut])
            h = h[cut:]
        if cur and len(cur) + len(h) > budget:
            units.append(header + cur)
            cur = ""
        cur += h
    if cur:
        units.append(header + cur)
    return units


def plan_review(diff: str, extra_excludes, max_total: int, chunk_chars: int, max_chunks: int) -> Plan:
    plan = Plan()
    files = split_diff(diff)
    plan.files_total = len(files)
    units = []  # (path, text)
    total = 0
    for f in files:
        kind = classify_path(f.path, extra_excludes)
        if kind == "review" and has_secret_content(f):
            kind = "withheld"
        if kind == "withheld":
            plan.withheld.append(f.path)
            continue
        if kind == "skipped" or not f.hunks:
            plan.skipped.append(f.path)
            continue
        fu = _file_units(f, chunk_chars)
        size = sum(len(u) for u in fu)
        if total + size > max_total:
            plan.unreviewed.append(f.path)
            plan.truncated = plan.over_budget = True
            continue
        total += size
        units.extend((f.path, u) for u in fu)

    chunks = []
    for path, text in units:
        if chunks and len(chunks[-1].text) + len(text) <= chunk_chars:
            chunks[-1].text += text
            if path not in chunks[-1].paths:
                chunks[-1].paths.append(path)
        else:
            chunks.append(Chunk(text=text, paths=[path]))
    if len(chunks) > max_chunks:
        plan.truncated = True
        kept_paths = {p for c in chunks[:max_chunks] for p in c.paths}
        for c in chunks[max_chunks:]:
            for p in c.paths:
                if p not in kept_paths and p not in plan.unreviewed:
                    plan.unreviewed.append(p)
        chunks = chunks[:max_chunks]
    plan.chunks = chunks
    seen = []
    for c in chunks:
        seen.extend(p for p in c.paths if p not in seen)
    plan.reviewed = seen
    plan.chars_sent = sum(len(c.text) for c in chunks)
    return plan


# ================================================================== findings
@dataclass
class Finding:
    file: str
    line: object
    severity: str
    category: str
    title: str
    rationale: str
    confidence: str


@dataclass
class Parsed:
    ok: bool
    findings: list = field(default_factory=list)
    summary: str = ""
    error: str = ""


def _extract_json(text: str):
    text = (text or "").strip()
    candidates = [text]
    fence = re.search(r"```(?:json)?\s*(.*?)```", text, re.S | re.I)
    if fence:
        candidates.append(fence.group(1))
    s, e = text.find("{"), text.rfind("}")
    if s != -1 and e > s:
        candidates.append(text[s:e + 1])
    for c in candidates:
        try:
            obj = json.loads(c)
        except (ValueError, TypeError):
            continue
        if isinstance(obj, dict):
            return obj
    return None


def _calibrate(sev: str, conf: str) -> str:
    cap = CONFIDENCE_CAP[conf]
    return cap if SEVERITIES.index(sev) < SEVERITIES.index(cap) else sev


def _coerce(item):
    if not isinstance(item, dict):
        return None
    title = str(item.get("title") or item.get("finding") or item.get("message") or "").strip()
    if not title:
        return None
    sev = str(item.get("severity", "")).lower()
    sev = sev if sev in SEVERITIES else "info"
    conf = str(item.get("confidence", "")).lower()
    conf = conf if conf in CONFIDENCES else "medium"
    cat = str(item.get("category", "")).lower()
    try:
        line = int(item.get("line"))
        line = line if line > 0 else None
    except (TypeError, ValueError):
        line = None
    return Finding(
        file=str(item.get("file") or item.get("path") or "").strip(),
        line=line,
        severity=_calibrate(sev, conf),
        category=cat if cat in CATEGORIES else "other",
        title=title,
        rationale=str(item.get("rationale") or item.get("reason") or "").strip(),
        confidence=conf,
    )


def parse_reply(text: str) -> Parsed:
    obj = _extract_json(text)
    if obj is None:
        return Parsed(ok=False, error="no JSON object in reply")
    raw = obj.get("findings") if isinstance(obj.get("findings"), list) else []
    findings = [f for f in (_coerce(x) for x in raw) if f]
    return Parsed(ok=True, findings=findings, summary=str(obj.get("summary") or "").strip())


def _norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", s.lower()).strip()


def dedupe(findings) -> list:
    best = {}
    for f in findings:
        k = (f.file, f.line, _norm(f.title))
        if k not in best or SEVERITIES.index(f.severity) < SEVERITIES.index(best[k].severity):
            best[k] = f
    return sorted(best.values(), key=lambda f: (SEVERITIES.index(f.severity), f.file, f.line or 0))


def scope_findings(findings, paths) -> list:
    out = []
    for f in findings:
        p = re.sub(r"^[ab]/", "", f.file)
        if p in paths:
            f.file = p
            out.append(f)
        elif not p and len(paths) == 1:
            f.file = paths[0]
            out.append(f)
    return out


# ================================================================== gateway
@dataclass
class GatewayResult:
    ok: bool
    kind: str = "ok"  # ok | unavailable | key | model | bad_request | parse
    findings: list = field(default_factory=list)
    summary: str = ""
    error: str = ""
    latency_ms: int = 0
    tokens_in: int = 0
    tokens_out: int = 0


def call_gateway(cfg: Config, chunk_text: str, paths) -> GatewayResult:
    body = {
        "model": cfg.model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": "Files in this part: %s\n\n```diff\n%s```" % (", ".join(paths), chunk_text)},
        ],
        "max_tokens": cfg.max_tokens,
        "temperature": 0.1,
        "stream": False,
        "response_format": {"type": "json_schema", "json_schema": {"name": "code_review", "strict": True, "schema": RESPONSE_SCHEMA}},
    }
    if cfg.reasoning_effort:
        body["reasoning_effort"] = cfg.reasoning_effort
    headers = {"Content-Type": "application/json", "Authorization": "Bearer " + cfg.key, "User-Agent": USER_AGENT}
    if cfg.cf_access_id and cfg.cf_access_secret:
        # Public review ingress (llm-review.tmflix.com): Cloudflare Access service token at the edge.
        headers["CF-Access-Client-Id"] = cfg.cf_access_id
        headers["CF-Access-Client-Secret"] = cfg.cf_access_secret
    req = urllib.request.Request(cfg.gateway_url + "/chat/completions", data=json.dumps(body).encode(),
                                 method="POST", headers=headers)
    started = time.monotonic()
    try:
        with urllib.request.urlopen(req, timeout=cfg.timeout) as resp:
            payload = json.loads(resp.read() or b"{}")
    except urllib.error.HTTPError as e:
        ms = int((time.monotonic() - started) * 1000)
        try:
            detail = e.read().decode("utf-8", "replace")[:400].lower()
        except Exception:  # noqa: BLE001
            detail = ""
        finally:
            e.close()
        if e.code in (401, 403) and "error code: 10" in detail:  # Cloudflare 1010/1020 etc.
            return GatewayResult(False, "edge", error="HTTP %d cloudflare" % e.code, latency_ms=ms)
        if e.code in (401, 403):
            return GatewayResult(False, "key", error="HTTP %d" % e.code, latency_ms=ms)
        if e.code in (400, 404) and "model" in detail:
            return GatewayResult(False, "model", error="HTTP %d model not permitted or unknown" % e.code, latency_ms=ms)
        if e.code in (400, 413, 422):
            return GatewayResult(False, "bad_request", error="HTTP %d" % e.code, latency_ms=ms)
        return GatewayResult(False, "unavailable", error="HTTP %d" % e.code, latency_ms=ms)
    except (urllib.error.URLError, TimeoutError, OSError, ValueError) as e:
        return GatewayResult(False, "unavailable", error=type(e).__name__, latency_ms=int((time.monotonic() - started) * 1000))
    ms = int((time.monotonic() - started) * 1000)
    usage = payload.get("usage") or {}
    try:
        content = payload["choices"][0]["message"].get("content") or ""
    except (KeyError, IndexError, TypeError, AttributeError):
        content = ""
    parsed = parse_reply(content)
    res = GatewayResult(parsed.ok, "ok" if parsed.ok else "parse", error=parsed.error, latency_ms=ms,
                        tokens_in=int(usage.get("prompt_tokens") or 0), tokens_out=int(usage.get("completion_tokens") or 0))
    if parsed.ok:
        res.findings = scope_findings(parsed.findings, paths)
        res.summary = parsed.summary
    return res


# ================================================================== outcome + note
@dataclass
class Outcome:
    status: str  # ok | partial | unavailable
    model: str = ""
    reason: str = ""
    findings: list = field(default_factory=list)
    reviewed: list = field(default_factory=list)
    withheld: list = field(default_factory=list)
    skipped: list = field(default_factory=list)
    unreviewed: list = field(default_factory=list)
    truncated: bool = False
    chunks: int = 0
    chunks_ok: int = 0
    chars_sent: int = 0
    latency_ms: int = 0
    tokens_in: int = 0
    tokens_out: int = 0
    commit: str = ""


REASONS = {
    "unavailable": "the gateway could not be reached or returned a server error",
    "edge": "the Cloudflare edge refused the request before it reached the gateway",
    "key": "the gateway rejected the review key or access token (missing, expired or revoked)",
    "model": "the model is not on this project's key allow-list, or unknown",
    "bad_request": "the gateway refused the request",
    "parse": "the model reply was not valid JSON",
}


def run_review(cfg: Config, diff: str) -> Outcome:
    plan = plan_review(diff, cfg.exclude, cfg.max_diff_chars, cfg.chunk_chars, cfg.max_chunks)
    o = Outcome(status="ok", model=cfg.model, reviewed=plan.reviewed, withheld=plan.withheld, skipped=plan.skipped,
                unreviewed=plan.unreviewed, truncated=plan.truncated, chunks=len(plan.chunks), chars_sent=plan.chars_sent)
    if not cfg.key:
        o.status, o.reason = "unavailable", "no gateway key configured (CODE_REVIEW_GATEWAY_KEY)"
        return o
    if not plan.chunks:
        return o
    findings, failures = [], []
    for i, chunk in enumerate(plan.chunks):
        r = call_gateway(cfg, chunk.text, chunk.paths)
        o.latency_ms += r.latency_ms
        o.tokens_in += r.tokens_in
        o.tokens_out += r.tokens_out
        if r.ok:
            o.chunks_ok += 1
            findings.extend(r.findings)
            continue
        failures.append(r.kind)
        # Stop early on errors that will repeat for every chunk; don't hammer a down gateway.
        if r.kind in ("key", "model", "edge") or (r.kind == "unavailable" and o.chunks_ok == 0):
            break
    o.findings = dedupe(findings)
    if o.chunks_ok == 0:
        o.status = "unavailable"
        o.reason = REASONS.get(failures[0] if failures else "unavailable", "unknown error")
    elif failures:
        o.status = "partial"
        o.reason = "%d of %d part(s) failed: %s" % (len(plan.chunks) - o.chunks_ok, len(plan.chunks), REASONS.get(failures[0], failures[0]))
    return o


def _clean(s: str, limit: int) -> str:
    s = re.sub(r"\s+", " ", str(s or "")).strip()
    s = s.replace("<!--", "&lt;!--").replace("-->", "--&gt;")
    s = re.sub(r"@(?=[A-Za-z0-9_])", "@​", s)  # no pings from model text
    s = s.replace("`", "'")
    return s if len(s) <= limit else s[:limit - 1] + "…"


def _paths(paths, limit=15) -> str:
    shown = ", ".join("`%s`" % _clean(p, 200) for p in paths[:limit])
    return shown + (" and %d more" % (len(paths) - limit) if len(paths) > limit else "")


def render_note(o: Outcome, max_findings: int = 25) -> str:
    lines = [MARKER, "### Automated code review (advisory)", ""]
    meta = "Model `%s` via tm-llm-gateway · %d file(s) %s" % (
        _clean(o.model, 80), len(o.reviewed), "in scope, not reviewed" if o.status == "unavailable" else "reviewed")
    if o.commit:
        meta += " · commit `%s`" % o.commit[:8]
    lines += ["_%s_" % meta, ""]
    if o.status == "unavailable":
        lines += ["**Review unavailable:** %s. This does not block the merge." % _clean(o.reason, 200), ""]
    else:
        if o.status == "partial":
            lines += ["**Partial review:** %s." % _clean(o.reason, 200), ""]
        if not o.findings:
            lines += ["No findings in the reviewed files.", ""]
        else:
            for f in o.findings[:max_findings]:
                loc = "%s:%s" % (f.file, f.line) if f.line else f.file
                lines.append("- **%s** · %s · `%s` — %s" % (f.severity, f.category, _clean(loc, 200), _clean(f.title, 200)))
                if f.rationale:
                    lines.append("  %s _(confidence: %s)_" % (_clean(f.rationale, 600), f.confidence))
            if len(o.findings) > max_findings:
                lines.append("- … %d more finding(s) not shown." % (len(o.findings) - max_findings))
            lines.append("")
    if o.withheld:
        lines.append("Withheld, never sent to the model (secret-like path or content): %s" % _paths(o.withheld))
    if o.skipped:
        lines.append("Skipped (lockfile, generated, binary or excluded): %s" % _paths(o.skipped))
    if o.truncated:
        lines.append("Diff truncated at the review budget; not reviewed: %s" % (_paths(o.unreviewed) or "remaining hunks"))
    lines += ["", "<sub>Shared tmwhead code-review component (ops-brain `tools/ci/code-review`). "
              "Advisory; the model can be wrong and a human reviewer decides. Re-runs update this note.</sub>"]
    return "\n".join(lines)


def should_block(cfg: Config, o: Outcome) -> bool:
    if not cfg.blocking or o.status == "unavailable":
        return False
    limit = SEVERITIES.index(cfg.block_severity)
    return any(SEVERITIES.index(f.severity) <= limit for f in o.findings)


# ================================================================== GitLab
class GitLab:
    def __init__(self, api: str, project: str, iid: str, token: str, timeout: int = 30):
        self.api, self.project, self.iid, self.token, self.timeout = api.rstrip("/"), project, iid, token, timeout

    def _mr(self, suffix: str) -> str:
        return "%s/projects/%s/merge_requests/%s%s" % (self.api, urllib.parse.quote(str(self.project), safe=""), self.iid, suffix)

    def _req(self, method: str, url: str, data=None):
        body = json.dumps(data).encode() if data is not None else None
        req = urllib.request.Request(url, data=body, method=method, headers={"PRIVATE-TOKEN": self.token, "Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=self.timeout) as resp:
            return json.loads(resp.read() or b"null"), (resp.headers.get("X-Next-Page") or "")

    def _pages(self, suffix: str, per_page: int, max_pages: int = 20):
        page = "1"
        for _ in range(max_pages):
            sep = "&" if "?" in suffix else "?"
            items, nxt = self._req("GET", self._mr("%s%sper_page=%d&page=%s" % (suffix, sep, per_page, page)))
            yield from (items or [])
            if not nxt:
                return
            page = nxt

    def fetch_diff(self) -> str:
        out = []
        for d in self._pages("/diffs", 50):
            old, new = d.get("old_path", ""), d.get("new_path", "")
            head = "diff --git a/%s b/%s\n" % (old, new)
            if d.get("new_file"):
                head += "new file mode 100644\n"
            if d.get("deleted_file"):
                head += "deleted file mode 100644\n"
            head += "--- %s\n+++ %s\n" % ("/dev/null" if d.get("new_file") else "a/" + old,
                                          "/dev/null" if d.get("deleted_file") else "b/" + new)
            body = d.get("diff") or ""
            out.append(head + body + ("" if body.endswith("\n") or not body else "\n"))
        return "".join(out)

    def upsert_note(self, body: str) -> str:
        try:
            me = None
            try:  # the token's own user; only its marker notes are ours to edit
                who, _ = self._req("GET", self.api + "/user")
                me = who.get("id") if isinstance(who, dict) else None
            except (urllib.error.URLError, OSError, ValueError):
                me = None
            existing = None
            for n in self._pages("/notes?sort=desc&order_by=updated_at", 100, max_pages=10):
                if me is not None and (n.get("author") or {}).get("id") != me:
                    continue
                if str(n.get("body", "")).startswith(MARKER):
                    existing = n
                    break
            if existing:
                self._req("PUT", self._mr("/notes/%s" % existing["id"]), {"body": body})
                return "updated"
            self._req("POST", self._mr("/notes"), {"body": body})
            return "created"
        except (urllib.error.URLError, OSError, ValueError, KeyError) as e:
            code = getattr(e, "code", "")
            log("note upsert failed: %s %s" % (type(e).__name__, code))
            return "failed"


def git_diff(base: str, head: str) -> str:
    subprocess.run(["git", "fetch", "--quiet", "--depth=1", "origin", base], check=False, capture_output=True, timeout=120)
    res = subprocess.run(["git", "diff", "--no-color", "--no-ext-diff", base, head], check=True, capture_output=True, timeout=120)
    return res.stdout.decode("utf-8", "replace")


# ================================================================== GitHub
class GitHubDiffTooLarge(RuntimeError):
    pass


class GitHub:
    """Pull-request diff + one marker comment, via the REST API with the workflow's GITHUB_TOKEN."""

    def __init__(self, api: str, repo: str, number, token: str, author: str = "github-actions[bot]", timeout: int = 30):
        self.api, self.repo, self.number, self.token = api.rstrip("/"), repo, str(number), token
        self.author, self.timeout = author, timeout

    def _headers(self, accept: str = "application/vnd.github+json") -> dict:
        return {"Authorization": "Bearer " + self.token, "Accept": accept, "X-GitHub-Api-Version": "2022-11-28",
                "User-Agent": "tm-code-review", "Content-Type": "application/json"}

    def _req(self, method: str, url: str, data=None):
        body = json.dumps(data).encode() if data is not None else None
        req = urllib.request.Request(url, data=body, method=method, headers=self._headers())
        with urllib.request.urlopen(req, timeout=self.timeout) as resp:
            return json.loads(resp.read() or b"null"), (resp.headers.get("Link") or "")

    def fetch_diff(self) -> str:
        url = "%s/repos/%s/pulls/%s" % (self.api, self.repo, self.number)
        req = urllib.request.Request(url, method="GET", headers=self._headers("application/vnd.github.diff"))
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                return resp.read().decode("utf-8", "replace")
        except urllib.error.HTTPError as e:
            e.close()
            if e.code == 406:  # GitHub refuses diffs over its size limits
                raise GitHubDiffTooLarge("pull-request diff too large for the GitHub API") from None
            raise

    def _comments(self, max_pages: int = 10):
        url = "%s/repos/%s/issues/%s/comments?per_page=100" % (self.api, self.repo, self.number)
        for _ in range(max_pages):
            items, link = self._req("GET", url)
            yield from (items or [])
            m = re.search(r'<([^>]+)>;\s*rel="next"', link)
            if not m:
                return
            url = m.group(1)

    def upsert_note(self, body: str) -> str:
        try:
            existing = None
            for c in self._comments():
                if (c.get("user") or {}).get("login") != self.author:
                    continue  # only the workflow identity's own marker comment is ours to edit
                if str(c.get("body", "")).startswith(MARKER):
                    existing = c  # oldest first: keep editing the first one
                    break
            if existing:
                self._req("PATCH", "%s/repos/%s/issues/comments/%s" % (self.api, self.repo, existing["id"]), {"body": body})
                return "updated"
            self._req("POST", "%s/repos/%s/issues/%s/comments" % (self.api, self.repo, self.number), {"body": body})
            return "created"
        except (urllib.error.URLError, OSError, ValueError, KeyError) as e:
            log("comment upsert failed: %s %s" % (type(e).__name__, getattr(e, "code", "")))
            return "failed"


def github_context(env):
    """(GitHub client, base sha, head sha) for a pull_request run, else None."""
    if env.get("GITHUB_ACTIONS") != "true" or not env.get("GITHUB_EVENT_PATH"):
        return None
    try:
        event = json.loads(pathlib_read(env["GITHUB_EVENT_PATH"]))
    except (OSError, ValueError):
        return None
    pr = event.get("pull_request") if isinstance(event, dict) else None
    if not isinstance(pr, dict) or not pr.get("number"):
        return None
    gh = None
    if env.get("CODE_REVIEW_GITHUB_TOKEN") and env.get("GITHUB_REPOSITORY"):
        gh = GitHub(env.get("GITHUB_API_URL") or "https://api.github.com", env["GITHUB_REPOSITORY"], pr["number"],
                    env["CODE_REVIEW_GITHUB_TOKEN"], author=env.get("CODE_REVIEW_GITHUB_AUTHOR") or "github-actions[bot]")
    return gh, (pr.get("base") or {}).get("sha", ""), (pr.get("head") or {}).get("sha", "")


# ================================================================== CLI
def _mock_gateway(reply_path: str):
    reply = pathlib_read(reply_path)

    class _Resp:
        headers: dict = {}

        def read(self):
            return json.dumps({"model": "mock", "choices": [{"message": {"content": reply}}], "usage": {}}).encode()

        def __enter__(self):
            return self

        def __exit__(self, *a):
            return False

    return lambda req, timeout=None: _Resp()


def pathlib_read(p: str) -> str:
    with open(p, encoding="utf-8") as fh:
        return fh.read()


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="Advisory MR code review via tm-llm-gateway")
    ap.add_argument("--dry-run", action="store_true", help="print the would-be note; post nothing")
    ap.add_argument("--diff-file", help="review this unified diff instead of the MR")
    ap.add_argument("--mock-reply", help="dry-run only: use this file as the model reply (no network)")
    ap.add_argument("--json", help="write the outcome (findings + metadata, no diff) to this path")
    args = ap.parse_args(argv)
    env = os.environ
    cfg = Config.from_env(env)
    if args.mock_reply:
        if not args.dry_run:
            ap.error("--mock-reply requires --dry-run")
        urllib.request.urlopen = _mock_gateway(args.mock_reply)  # type: ignore[assignment]
        cfg.key = cfg.key or "mock"

    gl, gh_ctx = None, github_context(env)
    gh, gh_base, gh_head = gh_ctx if gh_ctx else (None, "", "")
    if gh_ctx is None and env.get("CI_MERGE_REQUEST_IID") and env.get("CODE_REVIEW_GITLAB_TOKEN"):
        api = env.get("CI_API_V4_URL") or (env.get("CI_SERVER_URL", "").rstrip("/") + "/api/v4")
        gl = GitLab(api, env.get("CI_PROJECT_ID", ""), env["CI_MERGE_REQUEST_IID"], env["CODE_REVIEW_GITLAB_TOKEN"])
    poster = gl or gh

    try:
        if args.diff_file:
            diff, source = pathlib_read(args.diff_file), "file"
        elif gl:
            diff, source = gl.fetch_diff(), "api"
        elif gh:
            diff, source = gh.fetch_diff(), "github-api"
        elif gh_ctx and gh_base:
            diff, source = git_diff(gh_base, gh_head or "HEAD"), "git"
        elif env.get("CI_MERGE_REQUEST_DIFF_BASE_SHA"):
            diff, source = git_diff(env["CI_MERGE_REQUEST_DIFF_BASE_SHA"], env.get("CI_COMMIT_SHA") or "HEAD"), "git"
        else:
            raise RuntimeError("no diff source (need --diff-file, MR/PR API token, or a base SHA)")
        outcome = run_review(cfg, diff)
    except GitHubDiffTooLarge:
        source = "error"
        outcome = Outcome(status="unavailable", model=cfg.model, reason="the pull-request diff is too large for the GitHub API")
    except Exception as e:  # noqa: BLE001 — advisory: any failure becomes an 'unavailable' note
        source = "error"
        outcome = Outcome(status="unavailable", model=cfg.model, reason="reviewer error (%s)" % type(e).__name__)
    outcome.commit = gh_head if gh_ctx else env.get("CI_COMMIT_SHA", "")

    log("source=%s status=%s model=%s files_reviewed=%d withheld=%d skipped=%d unreviewed=%d chunks=%d chunks_ok=%d "
        "chars=%d findings=%d latency_ms=%d tokens_in=%d tokens_out=%d" % (
            source, outcome.status, outcome.model, len(outcome.reviewed), len(outcome.withheld), len(outcome.skipped),
            len(outcome.unreviewed), outcome.chunks, outcome.chunks_ok, outcome.chars_sent, len(outcome.findings),
            outcome.latency_ms, outcome.tokens_in, outcome.tokens_out))

    note = render_note(outcome)
    if args.json:
        with open(args.json, "w", encoding="utf-8") as fh:
            json.dump(dataclasses.asdict(outcome), fh, indent=2)
    summary = env.get("GITHUB_STEP_SUMMARY")
    if summary and not args.dry_run:
        try:
            with open(summary, "a", encoding="utf-8") as fh:
                fh.write(note + "\n")
        except OSError:
            pass
    if args.dry_run or poster is None:
        if not args.dry_run:
            log("no MR/PR context or API token; printing note instead of posting")
        print(note)
    else:
        log("note %s" % poster.upsert_note(note))

    if should_block(cfg, outcome):
        log("blocking: finding at or above %s (CODE_REVIEW_BLOCKING=true)" % cfg.block_severity)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
