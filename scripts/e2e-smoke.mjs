#!/usr/bin/env node
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let failed = 0;

function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error("FAIL:", msg);
  }
}

const criticalFiles = [
  "index.html",
  "app.js",
  "main.js",
  "modules/app/capture_award.js",
  "modules/analytics.js",
  "modules/systems/era.js",
  "modules/systems/rebirth.js",
  "functions/api/health.js",
  "migrations/007_daily_tasks_progress.sql",
  "migrations/008_rebirth_count.sql",
];

for (const rel of criticalFiles) {
  assert(existsSync(path.join(root, rel)), `missing ${rel}`);
}

const childChecks = [
  "analytics-selfcheck.mjs",
  "era-selfcheck.mjs",
  "migrations-selfcheck.mjs",
  "save-stress-selfcheck.mjs",
  "apply-d1-migrations.mjs",
  "pvp-flow-selfcheck.mjs",
  "cloud-save-selfcheck.mjs",
  "newbie-path-selfcheck.mjs",
  "restart-p1-p13-selfcheck.mjs",
  "playwright-smoke.mjs",
];
for (const script of childChecks) {
  const r = spawnSync(process.execPath, [path.join(root, "scripts", script)], {
    stdio: "inherit",
  });
  if (r.status !== 0) failed += 1;
}

if (failed) {
  console.error(`e2e-smoke: ${failed} failed`);
  process.exit(1);
}
console.log("e2e-smoke: OK");
