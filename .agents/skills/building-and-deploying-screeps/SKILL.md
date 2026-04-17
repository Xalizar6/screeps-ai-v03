---
name: building-and-deploying-screeps
description: Verify, build, and deploy this repo to Screeps with correct npm order and CI branch mapping. Use when running npm scripts locally, uploading code, configuring GitHub Actions secrets, or pushing to main vs test branches.
---

# Building and Deploying Screeps

## Local verify

1. Run `npm run fix` then `npm run build`.
2. On **Windows PowerShell 5.1**, `&&` may fail; use separate lines or:

```powershell
npm run fix; if ($LASTEXITCODE -eq 0) { npm run build }
```

3. Optional upload: `npm run deploy` or `npm run upload` with env from `.env.example` (never commit secrets).

## CI and branches

- Push **`main`**: official `screeps.com`, editor branch `main`, secret `SCREEPS_TOKEN`.
- Push **`test`**: community server; see README table for `SCREEPS_TEST_*` variables.

Details: root `README.md` CI section and `scripts/upload-screeps.js`.

## References

- [ci-env-summary.md](references/ci-env-summary.md)
