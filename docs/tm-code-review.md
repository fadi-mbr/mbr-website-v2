# Required AI review — October 10 owner decision

Fadi requested AI review instead of a second human GitHub approver. The required `code-review` check replaces the one-person approval count; the five website checks, strict up-to-date checking, administrator enforcement, conversation resolution, force-push and deletion protections remain.

The upstream reviewer still posts advisory findings. A separate pinned gate fails for missing reports/secrets, unavailable or partial review, stale commit, incomplete chunks, reported budget truncation, unreviewed files, and major/critical findings. Minor/info findings remain advisory. Forks, drafts and Dependabot cannot silently pass this required job; use a trusted same-repository branch for review. Filtered secret-like files and generated/lock files remain outside model coverage. AI review is not a guarantee of correctness.

Publication still needs the concrete release approval. The workflow never deploys. To update the trusted reviewer, inspect and commit the action first, then update the immutable checkout pin in a second commit.

The three Gateway secrets were provisioned and actual model access verified October 10. Missing credentials or cold-start timeout block merging; rerun after repair. No credentials belong in task comments or code.

The notes below describe the earlier advisory-only setup and are superseded by this gate policy.

---

# TM AI Gateway review in GitHub CI

The repository-local reviewer runs on pull_request only, uses tier/code, and updates one advisory PR comment. It does not count as an approving GitHub review and does not replace required checks or publication approval. Fork and Dependabot reviews are skipped without secrets. The secret-bearing job executes the inspected action at an immutable commit, not PR code. Review updates to that pin independently.

## Provisioning handoff

The authorized Gateway secrets keeper must deliver these directly from the vault to fadi-mbr/mbr-website-v2 Actions secrets; never paste values into tasks or source:

| GitHub secret | Vault source, TM LLM Gateway /llm-gateway |
| --- | --- |
| TM_CODE_REVIEW_GATEWAY_KEY | TM_LLM_GATEWAY_KEY_CODE_REVIEW_GITHUB |
| TM_CODE_REVIEW_CF_ACCESS_ID | CF_ACCESS_LLM_REVIEW_CLIENT_ID |
| TM_CODE_REVIEW_CF_ACCESS_SECRET | CF_ACCESS_LLM_REVIEW_CLIENT_SECRET |

Endpoint: https://llm-review.tmflix.com/v1. Both gateway key and Cloudflare service token are required. MBR CTO has no vault grant for these keys. GitHub repository secret names were verified empty on 2026-10-10. No live review is claimed.

## Acceptance and failure handling

1. Provision the three secrets through the authorized operator, verify review-only ingress is live, then rerun CI on a same-repository PR.
2. Verify the job summary records a completed review and one bot comment with the exact PR head; rerun and confirm the same comment is updated.
3. Missing secrets produce a warning and summary saying no review occurred. Auth rejection, unreachable gateway and timeout produce an unavailable advisory review, never a false approval. Cold model loading may require a rerun after the 95-second request timeout.
4. Check withheld and truncated file lists: the 60,000-character and six-chunk budget can leave files unreviewed. Advisory success is not proof of complete coverage.
5. Keep the independent approving review and five required website checks. Do not add this advisory job as a replacement gate.

Upstream unit tests cover auth rejection, connection failure, credential filtering, GitHub comment upsert and advisory behavior. Python YAML-template validation is upstream GitLab-specific and may skip when PyYAML is unavailable. Live endpoint and comment behavior remain pending secret provisioning.

## Rollback and release scope

Revert the CI integration PR to disable the workflow; revoke only this consumer's credentials through the secrets keeper if needed. This separate PR changes no website behavior. Booking removal remains in PR #71 at 15520b046b91afc1a59c4c7636467638fa7ed55c, with its recorded production approval. Do not merge either PR until its applicable GitHub gates pass. No production deployment is part of this CI change.

## Large removal reviews

The booking retirement diff exceeds the upstream 60,000-character / six-chunk default. This repository requests a bounded 2,000,000-character / 160-chunk review, retaining the same tier/code model and all fail-closed checks. The job has a 260-minute ceiling for 160 sequential 95-second requests plus overhead; normal completion should be much faster. No added exclusions. Lock/generated files and secret-like files retain the upstream exclusions.

The local reviewer patch splits oversized hunks without discarding text; upstream previously silently shortened each oversized hunk. The offline booking-removal coverage audit includes 86 eligible files, approximately 705k annotated characters across 79 chunks, with no unreviewed files or truncation. This is a coverage-plan result, not completed model review.

The first model pass incorrectly reported optional commit matching: gate.py already rejects empty expected IDs and mismatches. Regression now explicitly covers empty/missing IDs. The removed booking iframe exception is replaced by site-wide `frame-ancestors 'self'`, alongside the existing SAMEORIGIN header. Hosted model findings and website checks still govern merge.
