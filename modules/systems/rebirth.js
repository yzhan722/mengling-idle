/**
 * 转生（prestige/rebirth）元进度：灵珀结算 + 轮回加成树。
 * 状态存于 state.meta.legacy —— meta 不在 PRESTIGE_RESET_FIELDS 里，天然跨周目存活。
 * 轮回次数单一数据源 = state.era.prestigeCount（不建 meta.rebirths 冗余字段）。
 */
import { dexCaughtCount } from "./effects.js";

export const LEGACY_PERKS = {
  prod:      { name: "轮回余泽", desc: "全资源产出 +12%/级", max: 10, baseCost: 8 },
  catch:     { name: "轮回灵契", desc: "捕获率 +4%/级", max: 10, baseCost: 8 },
  cap:       { name: "轮回仓廪", desc: "资源上限 +15%/级", max: 10, baseCost: 8 },
  startTech: { name: "轮回开物", desc: "转生后开局自带「灵果培育」「灵球基础」科技", max: 1, baseCost: 60 },
  starterMon:{ name: "轮回之缘", desc: "转生后开局赠一只稀有萌灵入队", max: 1, baseCost: 90 },
};
export const LEGACY_PERK_ORDER = ["prod", "catch", "cap", "startTech", "starterMon"];

/** 转生仪式门槛：需拥有至少 1 只闪光萌灵（图鉴门槛由悖梦主线 dex_unique 150 隐含）。 */
export const REBIRTH_SHINY_REQ = 1;

export function normalizeLegacy(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const perks = {};
  for (const id of Object.keys(LEGACY_PERKS)) {
    const lvl = typeof src.perks?.[id] === "number" ? src.perks[id] : 0;
    perks[id] = Math.max(0, Math.min(LEGACY_PERKS[id].max, Math.floor(lvl)));
  }
  const essence = typeof src.essence === "number" && Number.isFinite(src.essence) ? src.essence : 0;
  const earned = typeof src.essenceEarned === "number" && Number.isFinite(src.essenceEarned) ? src.essenceEarned : 0;
  return { essence: Math.max(0, Math.floor(essence)), essenceEarned: Math.max(0, Math.floor(earned)), perks };
}

export function ensureLegacy(state) {
  if (!state.meta || typeof state.meta !== "object") state.meta = {};
  state.meta.legacy = normalizeLegacy(state.meta.legacy);
  return state.meta.legacy;
}

export function perkLevel(state, id) {
  const lvl = state?.meta?.legacy?.perks?.[id];
  return Math.max(0, Math.min(LEGACY_PERKS[id]?.max ?? 0, Math.floor(typeof lvl === "number" ? lvl : 0)));
}

export function perkCost(id, level) {
  const def = LEGACY_PERKS[id];
  return def ? def.baseCost * (Math.max(0, Math.floor(level)) + 1) : Infinity;
}

export function canBuyPerk(state, id) {
  const def = LEGACY_PERKS[id];
  if (!def) return false;
  const lvl = perkLevel(state, id);
  if (lvl >= def.max) return false;
  return (state?.meta?.legacy?.essence || 0) >= perkCost(id, lvl);
}

export function buyPerk(state, id) {
  const def = LEGACY_PERKS[id];
  if (!def) return { ok: false, reason: "unknown_perk" };
  const legacy = ensureLegacy(state);
  const lvl = legacy.perks[id];
  if (lvl >= def.max) return { ok: false, reason: "maxed" };
  const cost = perkCost(id, lvl);
  if (legacy.essence < cost) return { ok: false, reason: "essence", need: cost - legacy.essence };
  legacy.essence -= cost;
  legacy.perks[id] = lvl + 1;
  return { ok: true, level: lvl + 1, cost };
}

/**
 * 灵珀结算：主线全通基数 + 图鉴 + 闪光 + 速度加成 + 周目递增。
 * nowMs 显式传入便于 selfcheck 确定性。
 */
export function computeEssence(state, nowMs = Date.now()) {
  const { unique } = dexCaughtCount(state);
  const shiny = Math.max(0, Math.floor(state?.shinyCount || 0));
  const rebirths = Math.max(0, Math.floor(state?.era?.prestigeCount || 0));
  const cycleStart = state?.era?.cycleStartMs || state?.meta?.createdAt || 0;
  const cycleMs = cycleStart > 0 ? Math.max(0, nowMs - cycleStart) : Infinity;
  const speedBonus = cycleMs < 36 * 3600e3 ? 80 : cycleMs < 72 * 3600e3 ? 40 : 0;
  return 50 + unique + shiny * 10 + speedBonus + rebirths * 15;
}

export function legacyProdMul(state) {
  return 1 + 0.12 * perkLevel(state, "prod");
}

export function legacyCatchAdd(state) {
  return 0.04 * perkLevel(state, "catch");
}

export function legacyCapMul(state) {
  return 1 + 0.15 * perkLevel(state, "cap");
}
