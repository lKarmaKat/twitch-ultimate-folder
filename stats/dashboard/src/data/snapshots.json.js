import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const workerDir = fileURLToPath(new URL("../../../worker/", import.meta.url));
const target = process.env.STATS_DB === "local" ? "--local" : "--remote";
const query = "SELECT received_at, payload FROM snapshots ORDER BY received_at";

const output = execSync(`npx wrangler d1 execute ut-folders-stats ${target} --json --command "${query}"`, {
  cwd: workerDir,
  encoding: "utf8",
  maxBuffer: 512 * 1024 * 1024,
  stdio: ["ignore", "pipe", "inherit"]
});

const rows = JSON.parse(output)[0].results;
process.stdout.write(JSON.stringify(rows.map((row) => ({ receivedAt: row.received_at, ...JSON.parse(row.payload) }))));
