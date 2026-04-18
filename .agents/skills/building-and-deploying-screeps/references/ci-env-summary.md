# Environment summary

- Local: optional repo-root `.env` loaded by `scripts/run-upload.js` when present.
- CI: workflow `env` block; no `.env` file.
- Never commit tokens, passwords, or `.env`.

See `.env.example` for `SCREEPS_PROTOCOL`, `SCREEPS_PORT`, token vs username/password upload modes.
