/**
 * Runs upload-screeps.js with `--env-file=.env` only when `.env` exists so
 * `npm run upload` works in CI (no .env) and locally (optional .env).
 */
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const cwd = process.cwd();
const envPath = path.join(cwd, ".env");
const uploadScript = path.join(__dirname, "upload-screeps.js");

const nodeArgs = fs.existsSync(envPath)
  ? ["--env-file=.env", uploadScript]
  : [uploadScript];

const result = spawnSync(process.execPath, nodeArgs, {
  cwd,
  env: process.env,
  stdio: "inherit",
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status === null ? 1 : result.status);
