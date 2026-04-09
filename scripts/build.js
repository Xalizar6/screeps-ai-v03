const esbuild = require("esbuild");

async function build() {
  await esbuild.build({
    entryPoints: ["src/index.ts"],
    bundle: true,
    outfile: "dist/main.js",
    platform: "node",
    format: "cjs",
    target: "es2022",
    sourcemap: false,
    minify: false,
  });
}

build().catch((error) => {
  console.error(error);
  process.exit(1);
});
