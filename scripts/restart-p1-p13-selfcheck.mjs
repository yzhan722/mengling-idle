#!/usr/bin/env node
/**
 * Restart P1–P13 contract tests. Written to fail before the production patch.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { cleanLeaderboard, displayTrainerId } from "../modules/systems/world_presence.js";
import { liveNextGoalLine } from "../modules/systems/gameplay_fun.js";
import { buildShinyShareText, shinyShareCardPayload } from "../modules/systems/collection_fun.js";
import { maybeNewbieHandoff } from "../modules/guide.js";
import { hatchEgg } from "../modules/systems/breeding.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

{
  assert.equal(cleanLeaderboard([]).length, 0, "empty board honest");
  const onlyReal = cleanLeaderboard([{ score: 999, name: "RealPlayer", attrs: { ownerName: "RealPlayer" } }]);
  assert.equal(onlyReal.length, 1, "real row kept");
  assert.equal(onlyReal[0].attrs.ownerName, "RealPlayer", "real name kept");
}

{
  const remapped = displayTrainerId("allf5fec93a50", "176e158a-5df8-460a-815d-30a69106cb49");
  assert.match(remapped, /^T_[A-Za-z0-9]+$/, "stable T_ handle");
  assert.equal(displayTrainerId("RealPlayer", "uid"), "RealPlayer", "keep real nicknames");
  const hashed = cleanLeaderboard([
    { score: 3, attrs: { ownerName: "allf5fec93a50", uid: "176e158a-5df8-460a-815d-30a69106cb49" } },
  ]);
  assert.equal(hashed.length, 1, "one real row");
  assert.match(hashed[0].name, /^T_/, "broken name remapped to T_ handle");
}

{
  const line = liveNextGoalLine({ catchCount: 0 }, { dexPct: 0 });
  assert.ok(line.includes("捕捉"), `first-catch goal, got: ${line}`);
  const after = liveNextGoalLine({ catchCount: 1 }, { dexPct: 3 });
  assert.ok(after.includes("图鉴") || after.includes("3%"), `post-catch dex goal, got: ${after}`);
}

{
  const state = {
    dex: {
      shiny: {
        p25: { dex: 25, name: "电毛球", at: 3 },
        p001b: { dex: 1, name: "芽苞苞", at: 2 },
      },
    },
  };
  const text = buildShinyShareText(state);
  assert.ok(text.includes("闪光馆"), "share mentions gallery");
  assert.ok(text.includes("电毛球"), "share names shiny");
  assert.ok(text.includes("2"), "share unique count");
  const card = shinyShareCardPayload(state);
  assert.equal(card.unique, 2, "card unique");
  assert.ok(Array.isArray(card.entries) && card.entries.length === 2, "card entries");
  assert.equal(buildShinyShareText({ dex: { shiny: {} } }), "", "empty gallery no share");
}

{
  const mem = {};
  globalThis.localStorage = {
    getItem: (k) => (Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null),
    setItem: (k, v) => {
      mem[k] = String(v);
    },
  };
  const tabs = [];
  maybeNewbieHandoff({
    state: { meta: { starterBallsGranted: true }, res: { pokeball: { value: 5 } }, catchCount: 0 },
    activateTab: (t) => tabs.push(t),
    addLog: () => {},
  });
  assert.ok(tabs.includes("capture"), "handoff to capture");
}

{
  assert.equal(typeof hatchEgg, "function", "hatchEgg extracted");
  const state = {
    breeding: { aId: 1, bId: 2, eggRemainingSec: 0 },
    mons: { nextId: 3, list: [] },
    meta: {},
  };
  const logs = [];
  const hatched = hatchEgg(state, {
    mons: {
      list: [
        { id: 1, pid: "p25", name: "电毛球" },
        { id: 2, pid: "p25", name: "电毛球" },
      ],
    },
    monById: null,
    getMonById: (_mons, _map, id) => ({ id, pid: "p25", name: "电毛球" }),
    getBasePid: (pid) => pid,
    sameFamily: () => true,
    getSpeciesByPid: () => ({ id: "p25", pid: "p25", dex: 25, name: "电毛球", tier: "common" }),
    createMonInstance: (sp) => ({ id: 9, pid: sp.pid, dex: sp.dex, name: sp.name, isShiny: false }),
    randFloat: () => 0.5,
    addLog: (m) => logs.push(m),
    addRes: () => {},
    ui: {},
  });
  assert.equal(hatched, true, "hatch succeeds");
  assert.equal(state.mons.list.length, 1, "mon added");
  assert.ok(logs.some((x) => String(x).includes("生蛋成功")), "hatch log");
}

{
  const saveApi = readFileSync(join(root, "functions/api/save/index.js"), "utf8");
  assert.ok(saveApi.includes("status: 409"), "optimistic lock 409");
  const app = readFileSync(join(root, "app.js"), "utf8") + readFileSync(join(root, "modules/app/save_cloud.js"), "utf8");
  assert.ok(app.includes("exportSaveJson") && app.includes("importSaveJsonFile"), "json io");
  assert.ok(app.includes("mengling_idle_save_slot_1") || app.includes("SAVE_SLOT_KEY"), "slot1 wired");
  const social = readFileSync(join(root, "modules/render/social.js"), "utf8");
  assert.ok(social.includes("还没有好友动态") || social.includes("暂无好友动态"), "honest social empty copy");
  const dex = readFileSync(join(root, "modules/render/dex.js"), "utf8");
  assert.ok(dex.includes("data-dex-shiny-card") || dex.includes("data-dex-shiny-share"), "shiny share control");
}

console.log("restart-p1-p13-selfcheck: ok");
