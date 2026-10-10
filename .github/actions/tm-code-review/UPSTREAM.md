# TM reviewer provenance

Original action/fixtures source: https://git.tmflix.com/tmwhead/ops-brain/-/tree/d99e9832f170364b8f61697bcd75c3135aace1b9/tools/ci/code-review

Reviewer and test_review.py updated from ops-brain `c3a7dbceec8701219d62098e8a320137690e19da` (MR !244).
Original upstream review.py SHA-256: abe14cc4e5932aeb6a01a0a89945bba50167e67b5d2c4863794efbecabc8a2f4.
Upstream action.yml SHA-256: d64754eb2830ec0cfc9c14638f8dc7e9375a79f151f33e9befe805749c1d087b.
Action and fixtures remain from the original revision.
Local action adjustment: check all three credentials and report missing provisioning in the job summary. Forks are skipped by the workflow before checkout.

Run offline verification: `python3 -m unittest discover -s .github/actions/tm-code-review/tests -v`.

Local coverage patch (October 10): preserve oversized hunks across chunks instead of silently truncating; raise configurable ceilings to 2,000,000 annotated characters / 160 chunks. Defaults remain unchanged. Regression verifies all 800 deleted lines appear exactly once.
Current review.py SHA-256: 7d6edbe30accf5d27f183334bd2475300467df5c4e0865adf872a017124683a9.
