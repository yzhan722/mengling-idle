#!/usr/bin/env node
// P2 转生循环自检（无测试框架，assert 风格）
import {
  emptyEraState,
  instantiateQuests,
  previewPrestige,
  confirmPrestige,
  canPrestige,
  syncEraQuests,
  bumpEraCounter,
  PRESTIGE_KEEP_FIELDS,
} from "../modules/systems/era.js";
import {
  LEGACY_PERKS,
  LEGACY_PERK_ORDER,
  normalizeLegacy,
  ensureLegacy,
  perkLevel,
  perkCost,
  canBuyPerk,
  buyPerk,
  computeEssence,
  legacyProdMul,
  legacyCatchAdd,
  legacyCapMul,
  REBIRTH_SHINY_REQ,
} from "../modules/systems/rebirth.js";
import { ERA_DEFS, getEraDefByIndex } from "../modules/defs_eras.js";

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error(`FAIL: ${msg}`);
  }
}

const paradoxDef = getEraDefByIndex(ERA_DEFS.length - 1);

/** 构造「悖梦主线全清」的可转生存档夹具。 */
function clearedState(overrides = {}) {
  const state = {
    dex: { caught: Object.fromEntries([...Array(155)].map((_, i) => [String(i + 1), 1])) },
    tech: Object.fromEntries([...Array(16)].map((_, i) => [`t${i}`, true])),
    buildings: { field: { owned: 60 } },
    res: { catnip: { value: 999, cap: 1000 } },
    mons: [{ id: 1, pid: "test", level: 50 }],
    auto: { clicker: true },
    permanentBoosts: { exp: 2 },
    shinyCount: REBIRTH_SHINY_REQ,
    catchCount: 999,
    meta: { createdAt: Date.now() - 200 * 3600e3, legacy: { essence: 0, essenceEarned: 0, perks: {} } },
    era: emptyEraState(ERA_DEFS.length - 1),
    ...overrides,
  };
  bumpEraCounter(state, "catch_count", 999);
  bumpEraCounter(state, "pokeball_earned", 999);
  bumpEraCounter(state, "gather_total", 999);
  bumpEraCounter(state, "berry_earned", 999);
  syncEraQuests(state);
  return state;
}

// ── 门槛 ──────────────────────────────────────────────
{
  const state = clearedState({ shinyCount: 0 });
  const p = previewPrestige(state);
  assert(p.ok === false && p.reason === "need_shiny", "no shiny → need_shiny");
  assert(canPrestige(state) === false, "canPrestige blocked without shiny");
}
{
  const state = clearedState();
  const p = previewPrestige(state);
  assert(p.ok === true, "paradox cleared + shiny → can prestige");
  assert(p.essence > 0, "preview exposes essence");
  assert(p.prestigeCountAfter === 1, "first prestige → count 1");
  assert(p.keeps.length === PRESTIGE_KEEP_FIELDS.length, "keeps list intact");
}

// ── 灵珀公式 ──────────────────────────────────────────
{
  const state = clearedState();
  state.era.cycleStartMs = 1000; // 旧 cycle → 无速度加成
  const noSpeed = computeEssence(state, 200 * 3600e3);
  assert(noSpeed === 50 + 155 + REBIRTH_SHINY_REQ * 10 + 0, "essence = 50+dex+shiny*10, slow cycle");
  const fast = computeEssence(state, 1000 + 10 * 3600e3);
  assert(fast === noSpeed + 80, "fast cycle <36h → +80 speed bonus");
  const mid = computeEssence(state, 1000 + 50 * 3600e3);
  assert(mid === noSpeed + 40, "cycle <72h → +40 speed bonus");
}

// ── 转生执行：重置/保留/奖励 ──────────────────────────
{
  const state = clearedState();
  state.meta.legacy.perks.startTech = 1;
  state.meta.legacy.perks.starterMon = 1;
  const expectedEssence = computeEssence(state); // 结算用重置前的 era.cycleStartMs
  let starterCalled = 0;
  const result = confirmPrestige(state, {
    addLog: () => {},
    starterMonFactory: () => {
      starterCalled += 1;
      return { id: 77, pid: "giftmon", level: 5 };
    },
  });
  assert(result.ok === true, "confirmPrestige ok");
  assert(state.era.mode === "distortion", "mode → distortion");
  assert(state.era.index === 0 && state.era.id === "dawn", "era restarts at dawn");
  assert(state.era.prestigeCount === 1, "prestigeCount 1");
  assert(state.res.catnip.value === 0, "res reset");
  assert(state.buildings.field.owned === 0, "buildings reset");
  assert(state.tech.t0 !== true && state.tech.berryCultivation === true && state.tech.pokeballBasics === true,
    "tech reset but startTech perk grants starter techs");
  assert(state.auto.clicker === false, "auto reset");
  assert(state.mons.length === 1 && state.mons[0].pid === "giftmon", "mons cleared + starterMon perk grants gift");
  assert(state.dex.caught["1"] === 1, "dex kept");
  assert(state.permanentBoosts.exp === 2, "permanentBoosts kept");
  assert(starterCalled === 1, "starterMonFactory invoked once");
  assert(state.meta.legacy.essence > 0 && state.meta.legacy.essenceEarned === state.meta.legacy.essence,
    "essence granted to meta.legacy");
  assert(state.meta.legacy.essence === expectedEssence, "granted essence matches preview formula");
}

// ── 扭曲循环：第二次转生（旧 canPrestige 在 distortion 下永远 false）──
{
  const state = clearedState();
  confirmPrestige(state, { addLog: () => {} });
  // 二周目再打到悖梦
  state.era.index = ERA_DEFS.length - 1;
  state.era.id = paradoxDef.id;
  state.era.quests = instantiateQuests(paradoxDef, state.era.prestigeCount);
  bumpEraCounter(state, "catch_count", 9999);
  bumpEraCounter(state, "pokeball_earned", 9999);
  state.tech = Object.fromEntries([...Array(16)].map((_, i) => [`t${i}`, true]));
  syncEraQuests(state);
  const p2 = previewPrestige(state);
  assert(p2.ok === true, "distortion cycle can prestige again (loop)");
  assert(p2.prestigeCountAfter === 2, "second prestige → count 2");
  const catchQ = state.era.quests.find((q) => q.id === "paradox_catch_360");
  assert(catchQ.target === Math.ceil(360 * 1.5), "cycle-2 era target scaled ×1.5");
  const dexQ = state.era.quests.find((q) => q.id === "paradox_dex_150");
  assert(dexQ.target === 150, "absolute quest not scaled");
}

// ── 加成树 ────────────────────────────────────────────
{
  const state = clearedState();
  ensureLegacy(state);
  state.meta.legacy.essence = 100;
  assert(canBuyPerk(state, "prod") === true, "can buy prod lvl1");
  const r1 = buyPerk(state, "prod");
  assert(r1.ok && r1.cost === LEGACY_PERKS.prod.baseCost, "prod lvl1 costs baseCost");
  assert(perkLevel(state, "prod") === 1, "prod lvl 1");
  assert(Math.abs(legacyProdMul(state) - 1.12) < 1e-9, "prod mul +12%");
  assert(legacyCatchAdd(state) === 0, "catch add 0 before perk");
  buyPerk(state, "catch");
  assert(Math.abs(legacyCatchAdd(state) - 0.04) < 1e-9, "catch add +4% at lvl1");
  buyPerk(state, "cap");
  assert(Math.abs(legacyCapMul(state) - 1.15) < 1e-9, "cap mul +15% at lvl1");
  const depleted = buyPerk(state, "starterMon");
  assert(depleted.ok === false && depleted.reason === "essence", "insufficient essence blocked");
  state.meta.legacy.essence = 500;
  for (let i = 0; i < 12; i += 1) buyPerk(state, "prod");
  assert(perkLevel(state, "prod") === 10, "prod caps at max 10");
  assert(buyPerk(state, "prod").ok === false, "maxed perk rejected");
  assert(LEGACY_PERK_ORDER.every((id) => LEGACY_PERKS[id]), "perk order ⊆ defs");
}

// ── normalizeLegacy 容错 ─────────────────────────────
{
  const n = normalizeLegacy({ essence: 12.7, perks: { prod: 99, catch: "x" } });
  assert(n.essence === 12, "essence floored");
  assert(n.perks.prod === 10, "perk level clamped to max");
  assert(n.perks.catch === 0, "non-number perk → 0");
  const n2 = normalizeLegacy(null);
  assert(n2.essence === 0 && n2.perks.prod === 0, "null legacy → defaults");
}

if (failed) {
  console.error(`rebirth-selfcheck: ${failed} failed`);
  process.exit(1);
}
console.log("rebirth-selfcheck: OK");
