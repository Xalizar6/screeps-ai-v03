# Environment summary

- Local: optional repo-root `.env` parsed by `scripts/run-upload.js` when present and merged **over** `process.env` (file wins per key), so multiple uploads in one shell stay predictable. Use `npm run upload -- other.env` for more profiles.
- CI: workflow `env` block; no `.env` file.
- Never commit tokens, passwords, or `.env`.

See `.env.example` for `SCREEPS_PROTOCOL`, `SCREEPS_PORT`, token vs username/password upload modes, and PTR (`SCREEPS_HOST=screeps.com/ptr`).
