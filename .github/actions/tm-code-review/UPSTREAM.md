# TM reviewer provenance

Source: https://git.tmflix.com/tmwhead/ops-brain/-/tree/d99e9832f170364b8f61697bcd75c3135aace1b9/tools/ci/code-review

Vendored review.py SHA-256: 64f65bd1bd23a65c49724f9245e461971c47b18a871a2ccc5187a8702f97a2c8.
Upstream action.yml SHA-256: d64754eb2830ec0cfc9c14638f8dc7e9375a79f151f33e9befe805749c1d087b.
Tests and fixtures copied from the same revision.
Local action adjustment: check all three credentials and report missing provisioning in the job summary. Forks are skipped by the workflow before checkout.

Run offline verification: `python3 -m unittest discover -s .github/actions/tm-code-review/tests -v`.
