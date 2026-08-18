---
"@seatgeek/next-fastly-image": minor
---

Require Node.js >= 22 (was >= 20). Node 20 reached end-of-life in April 2026; the supported range now matches the active LTS lines (22 and 24), which is also what CI tests against. No code changes - the package uses only web-standard APIs (`URL`, `URLSearchParams`) available in every supported runtime.
