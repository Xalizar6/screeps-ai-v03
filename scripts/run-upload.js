/**
 * Runs `upload-screeps.js`. When a repo-root env file exists, its variables
 * override the current process environment for the child so you can run several
 * uploads in one shell session (live, PTR, etc.) without stray `SCREEPS_*` from
 * a previous command winning over the file.
 *
 * Optional CLI arg selects the filename (default `.env`), e.g. `.env.ptr`.
 * CI omits the file and uses the workflow `env` block only.
 */
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const cwd = process.cwd();
const envFile = process.argv[2] || ".env";
const envPath = path.join(cwd, envFile);
const uploadScript = path.join(__dirname, "upload-screeps.js");

/**
 * Parses dotenv-style `NAME=VALUE` lines; `#` comments and blank lines ignored.
 * @param {string} text Raw file contents.
 * @returns {Record<string, string>}
 */
function parseDotenvText(text) {
  /** @type {Record<string, string>} */
  const out = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }
    const withoutExport = line.startsWith("export ")
      ? line.slice(7).trimStart()
      : line;
    const eq = withoutExport.indexOf("=");
    if (eq <= 0) {
      continue;
    }
    const key = withoutExport.slice(0, eq).trim();
    let value = withoutExport.slice(eq + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const fileEnv = fs.existsSync(envPath)
  ? parseDotenvText(fs.readFileSync(envPath, "utf8"))
  : {};
const mergedEnv =
  Object.keys(fileEnv).length === 0
    ? process.env
    : { ...process.env, ...fileEnv };

const nodeArgs = [uploadScript];

const result = spawnSync(process.execPath, nodeArgs, {
  cwd,
  env: mergedEnv,
  stdio: "inherit",
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status === null ? 1 : result.status);
