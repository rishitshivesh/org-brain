import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const indexName = "org-brain-memory";
const configPath = new URL("../wrangler.jsonc", import.meta.url);

function wrangler(args, options = {}) {
  return execFileSync("yarn", ["dlx", "wrangler@latest", ...args], {
    cwd: new URL("..", import.meta.url),
    stdio: options.quiet ? "ignore" : "inherit",
  });
}

try {
  wrangler(["vectorize", "get", indexName], { quiet: true });
  console.log(`Vectorize index ${indexName} already exists.`);
} catch {
  wrangler([
    "vectorize",
    "create",
    indexName,
    "--dimensions=768",
    "--metric=cosine",
  ]);
}

const config = JSON.parse(readFileSync(configPath, "utf8"));
config.vectorize = [
  {
    binding: "MEMORY",
    index_name: indexName,
  },
];
writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
console.log("Bound MEMORY to org-brain-memory in wrangler.jsonc.");
