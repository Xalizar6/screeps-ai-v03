const fs = require("fs/promises");

const SCREEPS_HOST = process.env.SCREEPS_HOST || "screeps.com";
const SCREEPS_BRANCH = process.env.SCREEPS_BRANCH || "main";
const SCREEPS_TOKEN = process.env.SCREEPS_TOKEN;
const BUILD_OUTPUT_PATH = "dist/main.js";

async function upload() {
  if (!SCREEPS_TOKEN) {
    throw new Error("Missing SCREEPS_TOKEN environment variable.");
  }

  const code = await fs.readFile(BUILD_OUTPUT_PATH, "utf8");

  const response = await fetch(`https://${SCREEPS_HOST}/api/user/code`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Token": SCREEPS_TOKEN,
    },
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
