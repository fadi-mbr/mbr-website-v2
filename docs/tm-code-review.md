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
