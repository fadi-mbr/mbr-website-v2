#!/usr/bin/env python3
"""Unit tests for tools/ci/code-review/review.py — all HTTP is mocked.

Run: python3 -m unittest discover -s tools/ci/code-review/tests -v
"""
from __future__ import annotations

import io
import json
import pathlib
import sys
import unittest
import urllib.error
from contextlib import redirect_stdout, redirect_stderr
from unittest import mock

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))

import review  # noqa: E402


def file_diff(path: str, body: str = "@@ -1,2 +1,3 @@\n a\n+b\n c\n") -> str:
    return "diff --git a/%s b/%s\n--- a/%s\n+++ b/%s\n%s" % (path, path, path, path, body)


class FakeResponse:
    def __init__(self, status: int, payload, headers=None):
        self.status = status
        self._raw = payload if isinstance(payload, (bytes, str)) else json.dumps(payload)
        self.headers = headers or {}

    def read(self):
        return self._raw.encode() if isinstance(self._raw, str) else self._raw

    def __enter__(self):
        return self

    def __exit__(self, *a):
        return False


def chat_reply(findings, summary="ok"):
    return {"model": "tier/code", "choices": [{"message": {"content": json.dumps({"summary": summary, "findings": findings})}}],
            "usage": {"prompt_tokens": 10, "completion_tokens": 5}}


# ---------------------------------------------------------------- diff parsing
class SplitDiffTests(unittest.TestCase):
    def test_splits_per_file_and_keeps_paths(self):
        d = file_diff("a.py") + file_diff("dir/b.ts")
        files = review.split_diff(d)
        self.assertEqual([f.path for f in files], ["a.py", "dir/b.ts"])

    def test_deleted_file_uses_old_path(self):
        d = "diff --git a/gone.py b/gone.py\ndeleted file mode 100644\n--- a/gone.py\n+++ /dev/null\n@@ -1 +0,0 @@\n-x\n"
        self.assertEqual(review.split_diff(d)[0].path, "gone.py")

    def test_empty_diff(self):
        self.assertEqual(review.split_diff(""), [])


class AnnotateTests(unittest.TestCase):
    def test_new_line_numbers_are_prefixed(self):
        body = "@@ -10,3 +20,4 @@ def f():\n ctx\n-old\n+new1\n+new2\n ctx2\n"
        out = review.annotate(file_diff("x.py", body))
        self.assertIn("  20  ctx", out)
        self.assertIn("     -old", out)
        self.assertIn("  21 +new1", out)
        self.assertIn("  22 +new2", out)
        self.assertIn("  23  ctx2", out)

    def test_changed_lines_collected(self):
        body = "@@ -1,1 +5,2 @@\n a\n+b\n"
        f = review.split_diff(file_diff("x.py", body))[0]
        self.assertEqual(review.changed_lines(f), {6})


# ---------------------------------------------------------------- denylist
class DenylistTests(unittest.TestCase):
    def test_secret_paths_are_withheld(self):
        for p in [".env", "app/.env.production", "config/prod.env", "certs/server.pem", "k/id_rsa",
                  "k/id_ed25519.pub", "tls/site.key", "store.p12", "a/secrets.yaml", "x/credentials.json",
                  "vault.kdbx", "infra/terraform.tfstate", "deploy/secret/values.yml"]:
            self.assertEqual(review.classify_path(p, []), "withheld", p)

    def test_noise_paths_are_skipped(self):
        for p in ["package-lock.json", "pnpm-lock.yaml", "web/app.min.js", "img/logo.png", "dist/out.js", "uv.lock"]:
            self.assertEqual(review.classify_path(p, []), "skipped", p)

    def test_normal_paths_reviewed(self):
        for p in ["src/main.py", "README.md", ".gitlab-ci.yml", "src/envelope.ts", "keyboard.c"]:
            self.assertEqual(review.classify_path(p, []), "review", p)

    def test_extra_exclude_globs(self):
        self.assertEqual(review.classify_path("vendor/lib.go", ["vendor/*"]), "skipped")

    def test_key_material_in_content_withholds_file(self):
        body = "@@ -0,0 +1,3 @@\n+-----BEGIN OPENSSH PRIVATE KEY-----\n+abc\n+-----END OPENSSH PRIVATE KEY-----\n"
        plan = review.plan_review(file_diff("notes.txt", body), [], max_total=10_000, chunk_chars=5_000, max_chunks=4)
        self.assertEqual(plan.withheld, ["notes.txt"])
        self.assertEqual(plan.chunks, [])

    def test_provider_key_in_content_withholds_file(self):
        body = "@@ -0,0 +1 @@\n+API = 'sk-abcdefghijklmnopqrstuvwxyz0123'\n"
        plan = review.plan_review(file_diff("cfg.py", body), [], max_total=10_000, chunk_chars=5_000, max_chunks=4)
        self.assertEqual(plan.withheld, ["cfg.py"])


# ---------------------------------------------------------------- chunking
class ChunkingTests(unittest.TestCase):
    def test_small_files_pack_into_one_chunk(self):
        d = "".join(file_diff("f%d.py" % i) for i in range(3))
        plan = review.plan_review(d, [], max_total=10_000, chunk_chars=5_000, max_chunks=4)
        self.assertEqual(len(plan.chunks), 1)
        self.assertEqual(plan.chunks[0].paths, ["f0.py", "f1.py", "f2.py"])

    def test_chunks_respect_chunk_size(self):
        big = "@@ -0,0 +1,60 @@\n" + "".join("+line %d xxxxxxxxxxxxxxxxxxxxxxxxxxx\n" % i for i in range(60))
        d = file_diff("a.py", big) + file_diff("b.py", big) + file_diff("c.py", big)
        plan = review.plan_review(d, [], max_total=100_000, chunk_chars=3_000, max_chunks=10)
        self.assertGreaterEqual(len(plan.chunks), 3)
        for c in plan.chunks:
            self.assertLessEqual(len(c.text), 3_000 + 200)  # header slack

    def test_oversized_single_file_is_split_by_hunk(self):
        hunks = "".join("@@ -%d,1 +%d,2 @@\n a\n+%s\n" % (i * 10, i * 10, "y" * 400) for i in range(1, 20))
        plan = review.plan_review(file_diff("huge.py", hunks), [], max_total=100_000, chunk_chars=2_000, max_chunks=20)
        self.assertGreater(len(plan.chunks), 1)
        self.assertTrue(all(c.paths == ["huge.py"] for c in plan.chunks))

    def test_total_cap_skips_remaining_files(self):
        big = "@@ -0,0 +1,40 @@\n" + "".join("+%s\n" % ("z" * 80) for _ in range(40))
        d = "".join(file_diff("f%d.py" % i, big) for i in range(6))
        plan = review.plan_review(d, [], max_total=8_000, chunk_chars=4_000, max_chunks=10)
        self.assertTrue(plan.truncated)
        self.assertTrue(plan.over_budget)
        self.assertLess(len(plan.reviewed), 6)

    def test_max_chunks_cap(self):
        big = "@@ -0,0 +1,40 @@\n" + "".join("+%s\n" % ("z" * 80) for _ in range(40))
        d = "".join(file_diff("f%d.py" % i, big) for i in range(6))
        plan = review.plan_review(d, [], max_total=1_000_000, chunk_chars=4_000, max_chunks=2)
        self.assertEqual(len(plan.chunks), 2)
        self.assertTrue(plan.truncated)


# ---------------------------------------------------------------- parsing
class ParseTests(unittest.TestCase):
    def test_parses_plain_json(self):
        txt = json.dumps({"summary": "s", "findings": [{"file": "a.py", "line": 3, "severity": "major", "category": "correctness",
                                                        "title": "off by one", "rationale": "loop", "confidence": "high"}]})
        res = review.parse_reply(txt)
        self.assertTrue(res.ok)
        self.assertEqual(res.findings[0].line, 3)
        self.assertEqual(res.findings[0].severity, "major")

    def test_parses_fenced_json_with_chatter(self):
        txt = "Sure!\n```json\n{\"summary\": \"x\", \"findings\": []}\n```\nbye"
        self.assertTrue(review.parse_reply(txt).ok)

    def test_garbage_is_not_ok(self):
        self.assertFalse(review.parse_reply("no json here").ok)
        self.assertFalse(review.parse_reply("{broken").ok)

    def test_coerces_bad_fields(self):
        txt = json.dumps({"findings": [{"file": "a.py", "line": "x", "severity": "HUGE", "title": "t"}, {"nope": 1}]})
        res = review.parse_reply(txt)
        self.assertEqual(len(res.findings), 1)
        self.assertIsNone(res.findings[0].line)
        self.assertEqual(res.findings[0].severity, "info")

    def test_low_confidence_caps_severity(self):
        txt = json.dumps({"findings": [{"file": "a.py", "line": 1, "severity": "critical", "title": "t", "confidence": "low"}]})
        self.assertEqual(review.parse_reply(txt).findings[0].severity, "minor")


class DedupeTests(unittest.TestCase):
    def F(self, **kw):
        base = dict(file="a.py", line=3, severity="minor", category="correctness", title="Null deref", rationale="", confidence="high")
        base.update(kw)
        return review.Finding(**base)

    def test_dedupes_same_file_line_title_keeping_highest_severity(self):
        out = review.dedupe([self.F(), self.F(title="null  DEREF.", severity="major"), self.F(line=9)])
        self.assertEqual(len(out), 2)
        self.assertEqual(out[0].severity, "major")

    def test_drops_findings_for_files_not_in_chunk(self):
        f = [self.F(file="a.py"), self.F(file="ghost.py")]
        self.assertEqual([x.file for x in review.scope_findings(f, ["a.py"])], ["a.py"])

    def test_sorted_by_severity(self):
        out = review.dedupe([self.F(severity="info", title="a"), self.F(severity="critical", title="b")])
        self.assertEqual([x.severity for x in out], ["critical", "info"])


# ---------------------------------------------------------------- gateway
class GatewayTests(unittest.TestCase):
    def cfg(self, **kw):
        env = {"CODE_REVIEW_GATEWAY_KEY": "k"}
        env.update(kw)
        return review.Config.from_env(env)

    def test_request_shape(self):
        seen = {}

        def fake_urlopen(req, timeout=None):
            seen["url"] = req.full_url
            seen["auth"] = req.headers.get("Authorization")
            seen["body"] = json.loads(req.data)
            return FakeResponse(200, chat_reply([]))

        with mock.patch.object(review.urllib.request, "urlopen", fake_urlopen):
            res = review.call_gateway(self.cfg(), "diff text", ["a.py"])
        self.assertTrue(res.ok)
        self.assertEqual(seen["url"], "https://llm.infra.tmflix.com/v1/chat/completions")
        self.assertEqual(seen["auth"], "Bearer k")
        b = seen["body"]
        self.assertEqual(b["model"], "tier/code")
        self.assertEqual(b["max_tokens"], 1500)
        self.assertEqual(b["response_format"]["type"], "json_schema")
        self.assertNotIn("metadata", b)
        self.assertFalse(b["stream"])

    def test_cf_access_headers_sent_only_when_both_set(self):
        seen = []

        def fake_urlopen(req, timeout=None):
            seen.append({k.lower(): v for k, v in req.header_items()})
            return FakeResponse(200, chat_reply([]))

        with mock.patch.object(review.urllib.request, "urlopen", fake_urlopen):
            review.call_gateway(self.cfg(CODE_REVIEW_CF_ACCESS_CLIENT_ID="id"), "d", ["a.py"])
            review.call_gateway(self.cfg(CODE_REVIEW_CF_ACCESS_CLIENT_ID="id", CODE_REVIEW_CF_ACCESS_CLIENT_SECRET="s"), "d", ["a.py"])
        self.assertNotIn("cf-access-client-id", seen[0])
        self.assertEqual(seen[1]["cf-access-client-id"], "id")
        self.assertEqual(seen[1]["cf-access-client-secret"], "s")

    def test_model_override(self):
        with mock.patch.object(review.urllib.request, "urlopen", lambda req, timeout=None: FakeResponse(200, chat_reply([]))):
            cfg = self.cfg(CODE_REVIEW_MODEL="gemini/flash")
        self.assertEqual(cfg.model, "gemini/flash")

    def test_connection_error_is_unavailable(self):
        def boom(req, timeout=None):
            raise urllib.error.URLError("connection refused")

        with mock.patch.object(review.urllib.request, "urlopen", boom):
            res = review.call_gateway(self.cfg(), "d", ["a.py"])
        self.assertFalse(res.ok)
        self.assertEqual(res.kind, "unavailable")

    def test_auth_error_is_reported_as_key(self):
        def denied(req, timeout=None):
            raise urllib.error.HTTPError(req.full_url, 401, "Unauthorized", {}, io.BytesIO(b"{}"))

        with mock.patch.object(review.urllib.request, "urlopen", denied):
            res = review.call_gateway(self.cfg(), "d", ["a.py"])
        self.assertEqual(res.kind, "key")

    def test_model_not_allowed_is_reported(self):
        def nope(req, timeout=None):
            raise urllib.error.HTTPError(req.full_url, 400, "Bad", {}, io.BytesIO(b'{"error":{"message":"key not allowed to access model"}}'))

        with mock.patch.object(review.urllib.request, "urlopen", nope):
            res = review.call_gateway(self.cfg(CODE_REVIEW_MODEL="gemini/flash"), "d", ["a.py"])
        self.assertEqual(res.kind, "model")


# ---------------------------------------------------------------- note rendering + posting
class NoteTests(unittest.TestCase):
    def test_marker_first_line(self):
        note = review.render_note(review.Outcome(status="ok", model="tier/code", findings=[], reviewed=["a.py"]))
        self.assertTrue(note.startswith(review.MARKER))
        self.assertIn("No findings", note)

    def test_unavailable_note(self):
        note = review.render_note(review.Outcome(status="unavailable", model="tier/code", reason="gateway unreachable"))
        self.assertIn("Review unavailable", note)
        self.assertIn("gateway unreachable", note)
        self.assertIn("not reviewed", note)

    def test_withheld_and_truncated_listed(self):
        o = review.Outcome(status="ok", model="m", reviewed=["a.py"], withheld=[".env"], skipped=["pnpm-lock.yaml"], truncated=True)
        note = review.render_note(o)
        self.assertIn("`.env`", note)
        self.assertIn("truncated", note.lower())

    def test_findings_rendered_with_location(self):
        f = review.Finding(file="a.py", line=7, severity="major", category="security", title="SQL injection",
                           rationale="string concat", confidence="high")
        note = review.render_note(review.Outcome(status="ok", model="m", reviewed=["a.py"], findings=[f]))
        self.assertIn("`a.py:7`", note)
        self.assertIn("SQL injection", note)

    def test_note_neutralises_mentions_and_markers(self):
        f = review.Finding(file="a.py", line=1, severity="info", category="other", title="ping @all <!-- x -->",
                           rationale="", confidence="high")
        note = review.render_note(review.Outcome(status="ok", model="m", reviewed=["a.py"], findings=[f]))
        self.assertNotIn("@all", note)
        self.assertEqual(note.count("<!--"), 1)


class PostTests(unittest.TestCase):
    def gl(self):
        return review.GitLab(api="https://git.example/api/v4", project="12", iid="5", token="t")

    def test_creates_note_when_no_marker_note(self):
        calls = []

        def fake(req, timeout=None):
            calls.append((req.get_method(), req.full_url))
            if req.get_method() == "GET":
                return FakeResponse(200, [{"id": 1, "body": "hello"}], {"X-Next-Page": ""})
            return FakeResponse(201, {"id": 99})

        with mock.patch.object(review.urllib.request, "urlopen", fake):
            action = self.gl().upsert_note(review.MARKER + "\nbody")
        self.assertEqual(action, "created")
        self.assertEqual(calls[-1][0], "POST")

    def test_updates_existing_marker_note(self):
        calls = []

        def fake(req, timeout=None):
            calls.append((req.get_method(), req.full_url))
            if req.get_method() == "GET":
                return FakeResponse(200, [{"id": 1, "body": "x"}, {"id": 42, "body": review.MARKER + "\nold"}], {"X-Next-Page": ""})
            return FakeResponse(200, {"id": 42})

        with mock.patch.object(review.urllib.request, "urlopen", fake):
            action = self.gl().upsert_note(review.MARKER + "\nnew")
        self.assertEqual(action, "updated")
        self.assertEqual(calls[-1][0], "PUT")
        self.assertTrue(calls[-1][1].endswith("/notes/42"))

    def test_ignores_marker_notes_by_other_authors(self):
        calls = []

        def fake(req, timeout=None):
            calls.append((req.get_method(), req.full_url))
            if req.full_url.endswith("/user"):
                return FakeResponse(200, {"id": 7})
            if req.get_method() == "GET":
                return FakeResponse(200, [{"id": 3, "author": {"id": 1}, "body": review.MARKER + " pasted"},
                                          {"id": 4, "author": {"id": 7}, "body": review.MARKER + "\nmine"}], {"X-Next-Page": ""})
            return FakeResponse(200, {"id": 4})

        with mock.patch.object(review.urllib.request, "urlopen", fake):
            action = self.gl().upsert_note(review.MARKER + "\nnew")
        self.assertEqual(action, "updated")
        self.assertTrue(calls[-1][1].endswith("/notes/4"))

    def test_post_failure_is_swallowed(self):
        def boom(req, timeout=None):
            raise urllib.error.URLError("down")

        with mock.patch.object(review.urllib.request, "urlopen", boom), redirect_stderr(io.StringIO()):
            self.assertEqual(self.gl().upsert_note("x"), "failed")

    def test_fetch_mr_diff_builds_git_headers(self):
        payload = [{"old_path": "a.py", "new_path": "a.py", "diff": "@@ -1 +1 @@\n-a\n+b\n", "new_file": False,
                    "deleted_file": False, "renamed_file": False}]

        with mock.patch.object(review.urllib.request, "urlopen", lambda req, timeout=None: FakeResponse(200, payload, {"X-Next-Page": ""})):
            d = self.gl().fetch_diff()
        self.assertTrue(d.startswith("diff --git a/a.py b/a.py\n"))
        self.assertEqual(review.split_diff(d)[0].path, "a.py")


class GitHubTests(unittest.TestCase):
    def gh(self):
        return review.GitHub(api="https://api.github.example", repo="o/r", number=7, token="t")

    def test_fetch_diff_asks_for_diff_media_type(self):
        seen = {}

        def fake(req, timeout=None):
            seen["url"], seen["accept"] = req.full_url, req.headers.get("Accept")
            return FakeResponse(200, file_diff("a.py"))

        with mock.patch.object(review.urllib.request, "urlopen", fake):
            d = self.gh().fetch_diff()
        self.assertEqual(seen["url"], "https://api.github.example/repos/o/r/pulls/7")
        self.assertEqual(seen["accept"], "application/vnd.github.diff")
        self.assertEqual(review.split_diff(d)[0].path, "a.py")

    def test_too_large_diff_is_reported(self):
        def fake(req, timeout=None):
            raise urllib.error.HTTPError(req.full_url, 406, "too large", {}, io.BytesIO(b"{}"))

        with mock.patch.object(review.urllib.request, "urlopen", fake):
            with self.assertRaises(review.GitHubDiffTooLarge):
                self.gh().fetch_diff()

    def test_creates_comment_when_none_is_ours(self):
        calls = []

        def fake(req, timeout=None):
            calls.append((req.get_method(), req.full_url))
            if req.get_method() == "GET":
                return FakeResponse(200, [{"id": 1, "user": {"login": "someone"}, "body": review.MARKER + " pasted"}])
            return FakeResponse(201, {"id": 9})

        with mock.patch.object(review.urllib.request, "urlopen", fake):
            self.assertEqual(self.gh().upsert_note(review.MARKER + "\nbody"), "created")
        self.assertEqual(calls[-1], ("POST", "https://api.github.example/repos/o/r/issues/7/comments"))

    def test_updates_own_marker_comment_across_pages(self):
        calls = []
        nxt = '<https://api.github.example/repos/o/r/issues/7/comments?per_page=100&page=2>; rel="next"'

        def fake(req, timeout=None):
            calls.append((req.get_method(), req.full_url))
            if req.get_method() == "GET" and "page=2" not in req.full_url:
                return FakeResponse(200, [{"id": 1, "user": {"login": "github-actions[bot]"}, "body": "other"}], {"Link": nxt})
            if req.get_method() == "GET":
                return FakeResponse(200, [{"id": 5, "user": {"login": "github-actions[bot]"}, "body": review.MARKER + "\nold"}])
            return FakeResponse(200, {"id": 5})

        with mock.patch.object(review.urllib.request, "urlopen", fake):
            self.assertEqual(self.gh().upsert_note(review.MARKER + "\nnew"), "updated")
        self.assertEqual(calls[-1], ("PATCH", "https://api.github.example/repos/o/r/issues/comments/5"))

    def test_post_failure_is_swallowed(self):
        def boom(req, timeout=None):
            raise urllib.error.URLError("down")

        with mock.patch.object(review.urllib.request, "urlopen", boom), redirect_stderr(io.StringIO()):
            self.assertEqual(self.gh().upsert_note("x"), "failed")

    def test_context_from_pull_request_event(self):
        import tempfile
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as fh:
            json.dump({"pull_request": {"number": 3, "base": {"sha": "b" * 40}, "head": {"sha": "h" * 40}}}, fh)
        self.addCleanup(pathlib.Path(fh.name).unlink)
        env = {"GITHUB_ACTIONS": "true", "GITHUB_EVENT_PATH": fh.name, "GITHUB_REPOSITORY": "o/r",
               "CODE_REVIEW_GITHUB_TOKEN": "t"}
        gh, base, head = review.github_context(env)
        self.assertEqual((gh.repo, gh.number, base, head), ("o/r", "3", "b" * 40, "h" * 40))
        self.assertIsNone(review.github_context({"GITHUB_ACTIONS": "true"}))
        env.pop("CODE_REVIEW_GITHUB_TOKEN")
        self.assertIsNone(review.github_context(env)[0])


# ---------------------------------------------------------------- end to end
class RunTests(unittest.TestCase):
    def run_main(self, argv, env, urlopen):
        out, errs = io.StringIO(), io.StringIO()
        with mock.patch.dict(review.os.environ, env, clear=True), \
                mock.patch.object(review.urllib.request, "urlopen", urlopen), \
                redirect_stdout(out), redirect_stderr(errs):
            code = review.main(argv)
        return code, out.getvalue(), errs.getvalue()

    def diff_file(self, content):
        import tempfile
        tmp = tempfile.NamedTemporaryFile("w", suffix=".diff", delete=False)
        tmp.write(content)
        tmp.close()
        self.addCleanup(pathlib.Path(tmp.name).unlink)
        return tmp.name

    def test_gateway_down_dry_run_exits_zero_with_unavailable_note(self):
        def boom(req, timeout=None):
            raise urllib.error.URLError("refused")

        p = self.diff_file(file_diff("a.py"))
        code, out, _ = self.run_main(["--dry-run", "--diff-file", p], {"CODE_REVIEW_GATEWAY_KEY": "k"}, boom)
        self.assertEqual(code, 0)
        self.assertIn("Review unavailable", out)

    def test_missing_key_is_unavailable_and_no_http(self):
        def never(req, timeout=None):
            raise AssertionError("no HTTP expected")

        p = self.diff_file(file_diff("a.py"))
        code, out, _ = self.run_main(["--dry-run", "--diff-file", p], {}, never)
        self.assertEqual(code, 0)
        self.assertIn("CODE_REVIEW_GATEWAY_KEY", out)

    def test_blocking_fails_on_critical(self):
        f = [{"file": "a.py", "line": 2, "severity": "critical", "category": "security", "title": "t", "rationale": "r", "confidence": "high"}]
        p = self.diff_file(file_diff("a.py"))
        env = {"CODE_REVIEW_GATEWAY_KEY": "k", "CODE_REVIEW_BLOCKING": "true"}
        code, _, _ = self.run_main(["--dry-run", "--diff-file", p], env, lambda req, timeout=None: FakeResponse(200, chat_reply(f)))
        self.assertEqual(code, 1)

    def test_advisory_by_default_even_with_critical(self):
        f = [{"file": "a.py", "line": 2, "severity": "critical", "category": "security", "title": "t", "rationale": "r", "confidence": "high"}]
        p = self.diff_file(file_diff("a.py"))
        code, out, _ = self.run_main(["--dry-run", "--diff-file", p], {"CODE_REVIEW_GATEWAY_KEY": "k"},
                                     lambda req, timeout=None: FakeResponse(200, chat_reply(f)))
        self.assertEqual(code, 0)
        self.assertIn("critical", out)

    def test_blocking_never_blocks_on_unavailable(self):
        def boom(req, timeout=None):
            raise urllib.error.URLError("refused")

        p = self.diff_file(file_diff("a.py"))
        code, _, _ = self.run_main(["--dry-run", "--diff-file", p], {"CODE_REVIEW_GATEWAY_KEY": "k", "CODE_REVIEW_BLOCKING": "true"}, boom)
        self.assertEqual(code, 0)

    def test_logs_metadata_only(self):
        secretish = "+very_distinctive_source_line_42\n"
        p = self.diff_file(file_diff("a.py", "@@ -0,0 +1 @@\n" + secretish))
        code, _, errs = self.run_main(["--dry-run", "--diff-file", p], {"CODE_REVIEW_GATEWAY_KEY": "k"},
                                      lambda req, timeout=None: FakeResponse(200, chat_reply([])))
        self.assertEqual(code, 0)
        self.assertNotIn("very_distinctive_source_line_42", errs)
        self.assertIn("chunks=", errs)

    def test_withheld_file_never_sent(self):
        sent = []

        def capture(req, timeout=None):
            sent.append(req.data.decode())
            return FakeResponse(200, chat_reply([]))

        d = file_diff(".env", "@@ -0,0 +1 @@\n+PASSWORD=hunter2\n") + file_diff("a.py")
        p = self.diff_file(d)
        code, out, _ = self.run_main(["--dry-run", "--diff-file", p], {"CODE_REVIEW_GATEWAY_KEY": "k"}, capture)
        self.assertEqual(code, 0)
        self.assertTrue(sent)
        self.assertFalse(any("hunter2" in s for s in sent))
        self.assertIn("`.env`", out)

    def test_github_run_posts_comment_and_step_summary(self):
        import tempfile
        tmp = pathlib.Path(tempfile.mkdtemp())
        self.addCleanup(lambda: [f.unlink() for f in tmp.iterdir()] and None)
        (tmp / "event.json").write_text(json.dumps({"pull_request": {"number": 4, "base": {"sha": "b"}, "head": {"sha": "abcdef1234"}}}))
        calls = []

        def fake(req, timeout=None):
            calls.append((req.get_method(), req.full_url))
            if req.full_url.endswith("/pulls/4"):
                return FakeResponse(200, file_diff("a.py"))
            if "/chat/completions" in req.full_url:
                return FakeResponse(200, chat_reply([]))
            if req.get_method() == "GET":
                return FakeResponse(200, [])
            return FakeResponse(201, {"id": 1})

        env = {"GITHUB_ACTIONS": "true", "GITHUB_EVENT_PATH": str(tmp / "event.json"), "GITHUB_REPOSITORY": "o/r",
               "GITHUB_API_URL": "https://api.github.example", "GITHUB_STEP_SUMMARY": str(tmp / "summary.md"),
               "CODE_REVIEW_GITHUB_TOKEN": "t", "CODE_REVIEW_GATEWAY_KEY": "k"}
        code, _, errs = self.run_main([], env, fake)
        self.assertEqual(code, 0)
        self.assertIn("source=github-api status=ok", errs)
        self.assertEqual(calls[-1], ("POST", "https://api.github.example/repos/o/r/issues/4/comments"))
        summary = (tmp / "summary.md").read_text()
        self.assertTrue(summary.startswith(review.MARKER))
        self.assertIn("`abcdef12`", summary)

    def test_crash_inside_review_is_advisory(self):
        p = self.diff_file(file_diff("a.py"))
        with mock.patch.object(review, "run_review", side_effect=RuntimeError("bug")):
            code, out, _ = self.run_main(["--dry-run", "--diff-file", p], {"CODE_REVIEW_GATEWAY_KEY": "k"},
                                         lambda req, timeout=None: FakeResponse(200, chat_reply([])))
        self.assertEqual(code, 0)
        self.assertIn("Review unavailable", out)


if __name__ == "__main__":
    unittest.main()


class TemplateTest(unittest.TestCase):
    """The CI template must parse as GitLab expects: every script item a string.

    An unquoted ': ' inside a plain scalar turns a script line into a mapping,
    and GitLab then rejects every pipeline that includes the template.
    """

    def test_script_items_are_strings(self):
        try:
            import yaml  # type: ignore
        except ImportError:  # pragma: no cover - stdlib-only environments
            self.skipTest("PyYAML not installed")
        doc = yaml.safe_load((HERE.parent / "code-review.gitlab-ci.yml").read_text())
        for section in ("script", "before_script", "after_script"):
            for item in doc[".tm-code-review"].get(section, []) or []:
                self.assertIsInstance(item, str, f"{section} item is not a string: {item!r}")
