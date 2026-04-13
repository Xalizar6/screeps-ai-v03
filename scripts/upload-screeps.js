const fs = require("fs/promises");

const SCREEPS_HOST = process.env.SCREEPS_HOST || "screeps.com";
const SCREEPS_BRANCH = process.env.SCREEPS_BRANCH || "main";
const SCREEPS_TOKEN = (process.env.SCREEPS_TOKEN || "").trim();
const SCREEPS_USERNAME = (
  process.env.SCREEPS_USERNAME ||
  process.env.SCREEPS_EMAIL ||
  ""
).trim();
const SCREEPS_PASSWORD = (process.env.SCREEPS_PASSWORD || "").trim();
const BUILD_OUTPUT_PATH = "dist/main.js";

/**
 * Official `screeps.com` uses https on 443 (defaults). Many community servers
 * use http on port 80 (omit SCREEPS_PORT) or http on 21025 (set SCREEPS_PORT).
 */
function getApiOrigin() {
  let protocol = (process.env.SCREEPS_PROTOCOL || "https")
    .trim()
    .replace(/:$/, "");
  if (!protocol) {
    protocol = "https";
  }
  protocol = protocol.toLowerCase();

  const port = (process.env.SCREEPS_PORT || "").trim();
  const portPart = port ? `:${port}` : "";

  return `${protocol}://${SCREEPS_HOST}${portPart}`;
}

/**
 * Many community / private servers use email+password sign-in instead of
 * long-lived auth tokens. Flow: POST /api/auth/signin → use returned token
 * on POST /api/user/code (often with X-Username as well).
 */
async function signIn() {
  const response = await fetch(`${getApiOrigin()}/api/auth/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: SCREEPS_USERNAME,
      password: SCREEPS_PASSWORD,
    }),
  });

  const bodyText = await response.text();
  let body;
  try {
    body = JSON.parse(bodyText);
  } catch {
    body = {};
  }

  if (!response.ok) {
    throw new Error(
      `Screeps sign-in failed (${response.status} ${response.statusText}): ${bodyText}`,
    );
  }

  const token =
    (typeof body.token === "string" && body.token) ||
    (typeof body.auth === "string" && body.auth) ||
    "";

  if (!token) {
    throw new Error(
      `Screeps sign-in returned no token. Expected JSON with "token" (or legacy "auth"). Body: ${bodyText}`,
    );
  }

  return token;
}

async function upload() {
  let token = SCREEPS_TOKEN;
  let usedPasswordAuth = false;

  if (!token) {
    if (!SCREEPS_USERNAME || !SCREEPS_PASSWORD) {
      throw new Error(
        "Missing credentials: set SCREEPS_TOKEN for token auth, or set SCREEPS_USERNAME (or SCREEPS_EMAIL) and SCREEPS_PASSWORD for password auth.",
      );
    }
    token = await signIn();
    usedPasswordAuth = true;
  }

  const code = await fs.readFile(BUILD_OUTPUT_PATH, "utf8");

  const headers = {
    "Content-Type": "application/json",
    "X-Token": token,
  };
  if (usedPasswordAuth && SCREEPS_USERNAME) {
    headers["X-Username"] = SCREEPS_USERNAME;
  }

  const response = await fetch(`${getApiOrigin()}/api/user/code`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      branch: SCREEPS_BRANCH,
      modules: {
        main: code,
      },
    }),
  });

  const bodyText = await response.text();
  let body;
  try {
    body = JSON.parse(bodyText);
  } catch {
    body = bodyText;
  }

  if (!response.ok) {
    throw new Error(
      `Screeps upload failed (${response.status} ${response.statusText}): ${bodyText}`,
    );
  }

  console.log("Screeps upload successful.");
  console.log(body);
}

upload().catch((error) => {
  console.error(error);
  process.exit(1);
});
