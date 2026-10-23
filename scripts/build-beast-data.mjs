// build-beast-data.mjs — 生成 data/beasts.js：roster 裁剪后的全部物种数据。
// 输入：scripts/_srcdata/pokemon_*.js（原始全量，build-time only，不随站点发布）、
//       data/beast_roster.gen.json、data/beasts_zh.js
// 输出：data/beasts.js
// 用法：node scripts/build-beast-data.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const load = (dir, f) => eval(readFileSync(join(root, dir, f), "utf8"));
for (const f of [
  "pokemon_types.js", "pokemon_evo.js",
  "pokemon_evo_req.js", "pokemon_tier.js", "pokemon_catch_rate.js",
]) load("scripts/_srcdata", f);
load("data", "beasts_zh.js");

const rawRoster = JSON.parse(readFileSync(join(root, "data", "beast_roster.gen.json"), "utf8")).roster;
const roster = Array.isArray(globalThis.BEAST_ORDERED_DEX) && globalThis.BEAST_ORDERED_DEX.length === rawRoster.length
  ? globalThis.BEAST_ORDERED_DEX
  : rawRoster;
const pad3 = (n) => String(n).padStart(3, "0");
const inRoster = new Set(roster.map((d) => `p${pad3(d)}`));

const zh = {};
const titleMap = {};
const descMap = {};
const orderMap = {};
const types = {};   // 键 = 数字 dex（与 POKEMON_TYPES 一致）
const evo = {};     // 键 = pid；仅保留 roster 内边
const evoReq = {};  // pid -> {childPid: req}
const tier = {};
const catchRate = {};

roster.forEach((dex, idx) => {
  const id = `p${pad3(dex)}`;
  zh[id] = globalThis.BEAST_ZH[id];
  if (!zh[id]) throw new Error(`missing beast name for ${id}`);
  titleMap[id] = globalThis.BEAST_TITLE?.[id] || "星野幻灵";
  descMap[id] = globalThis.BEAST_DESC?.[id] || "栖息于星野秘境的奇异生灵。";
  orderMap[id] = globalThis.BEAST_ORDER?.[id] || (idx + 1);
  types[String(dex)] = globalThis.POKEMON_TYPES[String(dex)] ?? ["normal"];
  tier[id] = globalThis.POKEMON_TIER[id] ?? "common";
  catchRate[id] = globalThis.POKEMON_CATCH_RATE[id] ?? 45;

  const tos = (globalThis.POKEMON_EVO[id] ?? []).filter((t) => inRoster.has(t));
  if (tos.length) evo[id] = tos;
  const reqSrc = globalThis.POKEMON_EVO_REQ[id] ?? {};
  const req = Object.fromEntries(Object.entries(reqSrc).filter(([t]) => inRoster.has(t)));
  if (Object.keys(req).length) evoReq[id] = req;
});

// ---- 本地属性表 BEAST_STATS：替代 pokeapi 运行时拉取 ----
// total = tierBase × stageMul；按类型权重分配 + dex 抖动（确定性）。
const TIER_TOTAL = { common: 300, uncommon: 340, rare: 395, epic: 470 };
const STAGE_MUL = [0.62, 0.82, 1.0, 1.08]; // 进化阶段 0-based（三段链终点=1.0，再深给到1.08）

// 类型 → 六维权重倾向
const TYPE_BIAS = {
  normal:   { hp: 1.2, atk: 1, def: 1, spa: 1, spd: 1, spe: 1 },
  fire:     { hp: 1, atk: 1.1, def: 0.9, spa: 1.2, spd: 0.95, spe: 1 },
  water:    { hp: 1.15, atk: 1, def: 1.05, spa: 1.05, spd: 1.1, spe: 0.95 },
  grass:    { hp: 1.1, atk: 0.95, def: 1.1, spa: 1.1, spd: 1.1, spe: 0.9 },
  electric: { hp: 0.9, atk: 1.05, def: 0.95, spa: 1.15, spd: 0.95, spe: 1.25 },
  ice:      { hp: 1, atk: 0.95, def: 1.2, spa: 1.05, spd: 1.1, spe: 0.9 },
  fighting: { hp: 0.95, atk: 1.3, def: 1.05, spa: 0.8, spd: 0.9, spe: 1.05 },
  poison:   { hp: 1.05, atk: 1, def: 1.05, spa: 1, spd: 1.15, spe: 0.95 },
  ground:   { hp: 1.1, atk: 1.15, def: 1.15, spa: 0.85, spd: 0.95, spe: 0.85 },
  flying:   { hp: 0.95, atk: 1.05, def: 0.9, spa: 1, spd: 0.95, spe: 1.3 },
  psychic:  { hp: 0.95, atk: 0.85, def: 0.95, spa: 1.35, spd: 1.15, spe: 1 },
  bug:      { hp: 0.95, atk: 1.05, def: 0.95, spa: 0.95, spd: 0.95, spe: 1.2 },
  rock:     { hp: 1.05, atk: 1.1, def: 1.35, spa: 0.8, spd: 1.05, spe: 0.7 },
  ghost:    { hp: 0.9, atk: 1, def: 0.9, spa: 1.2, spd: 1.05, spe: 1.15 },
  dragon:   { hp: 1.1, atk: 1.2, def: 1, spa: 1.1, spd: 1, spe: 1 },
  dark:     { hp: 0.95, atk: 1.2, def: 0.9, spa: 1, spd: 0.95, spe: 1.15 },
  steel:    { hp: 1, atk: 1.05, def: 1.35, spa: 0.9, spd: 1.05, spe: 0.75 },
  fairy:    { hp: 1.1, atk: 0.85, def: 0.95, spa: 1.15, spd: 1.25, spe: 0.95 },
};

// 进化阶段 = 链内最长入度路径（无父=0）
const parent = {};
for (const [f, tos] of Object.entries(evo)) for (const t of tos) parent[t] = f;
const stageCache = {};
function evoStage(id) {
  if (id in stageCache) return stageCache[id];
  let s = 0, cur = id;
  const guard = new Set();
  while (parent[cur] && !guard.has(cur)) { guard.add(cur); cur = parent[cur]; s += 1; }
  stageCache[id] = s;
  return s;
}

// 确定性抖动：dex 驱动的伪随机
const jitter = (dex, i) => 0.92 + (((dex * 31 + i * 17) % 13) / 13) * 0.16;

const stats = {};
for (const dex of roster) {
  const id = `p${pad3(dex)}`;
  const t = tier[id] ?? "common";
  // 无进化链的单体（神兽/拉普拉斯类）按满档算，不背幼体惩罚
  const solo = evoStage(id) === 0 && !evo[id];
  const stageMul = solo ? 1.05 : (STAGE_MUL[Math.min(evoStage(id), 3)] ?? 1);
  const total = TIER_TOTAL[t] * stageMul;
  const tlist = types[String(dex)] ?? ["normal"];
  const bias = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
  for (const ty of tlist) {
    const b = TYPE_BIAS[ty] ?? TYPE_BIAS.normal;
    for (const k of Object.keys(bias)) bias[k] += b[k];
  }
  const n = tlist.length || 1;
  const out6 = {};
  ["hp", "atk", "def", "spa", "spd", "spe"].forEach((k, i) => {
    out6[k] = Math.max(5, Math.round((total / 6) * (bias[k] / n) * jitter(dex, i)));
  });
  stats[dex] = out6;
}

// ---- 生态区 BEAST_ZONES：dex -> 区域序号（与 modules/config.js CAPTURE_AREAS 顺序一致）----
// 规则：主类型命中最早的亲和区；副类型兜底；进化终段顺延一区（终段更稀有→更靠后）；
//      epic 恒入最后一区（幻梦秘境）。
const ZONE_AFFINITY = [
  ["normal", "grass", "bug"],                    // 0 芽芽草甸
  ["grass", "bug", "fairy", "normal"],           // 1 蜜露林径
  ["water"],                                     // 2 溪光浅滩
  ["flying", "electric", "fighting"],            // 3 风铃高原
  ["ground", "rock", "fire"],                    // 4 星砂荒漠
  ["fairy", "psychic", "ghost"],                 // 5 月见花园
  ["ice", "steel", "rock", "fighting"],          // 6 霜晶山脊
  ["dragon", "dark", "ghost", "poison"],         // 7 龙眠幽谷
];
const ZONES_TOTAL = 9;

const zoneOf = (dex, id) => {
  if ((tier[id] ?? "common") === "epic") return ZONES_TOTAL - 1;
  const tlist = types[String(dex)] ?? ["normal"];
  let idx = -1;
  for (const t of tlist) {
    const hit = ZONE_AFFINITY.findIndex((set) => set.includes(t));
    if (hit >= 0 && (idx < 0 || hit < idx)) idx = hit;
  }
  if (idx < 0) idx = 0;
  // 终段进化往后顺延
  const stage = evoStage(id);
  if (stage > 0) idx = Math.min(idx + stage, ZONES_TOTAL - 2);
  return idx;
};

const zones = {};
for (const dex of roster) zones[dex] = zoneOf(dex, `p${pad3(dex)}`);

const zoneCounts = {};
for (const z of Object.values(zones)) zoneCounts[z] = (zoneCounts[z] ?? 0) + 1;

// ---- 9 系精简：原 18 系（宝可梦式）→ 原创 9 系，仅改输出类型；
//      属性偏置与生态区亲和仍按原系计算（保持已验证的分布与数值风味）。
const TYPE_REMAP = {
  normal: "wind", flying: "wind", ice: "wind",
  fire: "fire", water: "water", grass: "grass", bug: "grass", electric: "electric",
  fighting: "stone", ground: "stone", rock: "stone", steel: "stone",
  psychic: "mystic", dragon: "mystic",
  dark: "dark", ghost: "dark", poison: "dark",
  fairy: "light",
};
const typesOut = {};
for (const dex of roster) {
  const tlist = types[String(dex)] ?? ["normal"];
  const mapped = [...new Set(tlist.map((t) => TYPE_REMAP[t] ?? "wind"))];
  typesOut[String(dex)] = mapped;
}
const typeCounts = {};
for (const tl of Object.values(typesOut)) for (const t of tl) typeCounts[t] = (typeCounts[t] ?? 0) + 1;

const out = `// beasts.js — GENERATED by scripts/build-beast-data.mjs；勿手改。
// 萌灵数据（roster ${roster.length} 种）：名表与图鉴志手写于 data/beasts_zh.js，其余从原始数据裁剪/合成。
globalThis.BEAST_ROSTER=${JSON.stringify(roster)};
globalThis.BEAST_ZH=${JSON.stringify(zh)};
globalThis.BEAST_TITLE=${JSON.stringify(titleMap)};
globalThis.BEAST_DESC=${JSON.stringify(descMap)};
globalThis.BEAST_ORDER=${JSON.stringify(orderMap)};
globalThis.BEAST_TYPES=${JSON.stringify(typesOut)};
globalThis.BEAST_EVO=${JSON.stringify(evo)};
globalThis.BEAST_EVO_REQ=${JSON.stringify(evoReq)};
globalThis.BEAST_TIER=${JSON.stringify(tier)};
globalThis.BEAST_CATCH_RATE=${JSON.stringify(catchRate)};
globalThis.BEAST_STATS=${JSON.stringify(stats)};
globalThis.BEAST_ZONES=${JSON.stringify(zones)};
`;
writeFileSync(join(root, "data", "beasts.js"), out);

// 自动同步 modules/pve_defs.js 中的敌人名称以匹配最新 BEAST_ZH
const pvePath = join(root, "modules", "pve_defs.js");
const pveRaw = readFileSync(pvePath, "utf8");
const pveSynced = pveRaw.replace(/\{\s*dex:\s*(\d+)\s*,\s*name:\s*"[^"]*"/g, (m, dStr) => {
  const pid = `p${pad3(Number(dStr))}`;
  const newName = zh[pid];
  return newName ? `{ dex: ${dStr}, name: "${newName}"` : m;
});
if (pveSynced !== pveRaw) {
  writeFileSync(pvePath, pveSynced);
  console.log("synced enemy names in modules/pve_defs.js");
}

console.log(`wrote data/beasts.js — ${roster.length} species, ${Object.keys(evo).length} evo edges, stats generated`);
console.log("zones:", JSON.stringify(zoneCounts));
console.log("types9:", JSON.stringify(typeCounts));
