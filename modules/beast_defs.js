// beast_defs.js — 萌灵物种定义（替代 pokemon_defs.js）
// 数据源：data/beasts.js（生成）· roster 驱动，不在 roster 内的物种不进入图鉴/捕捉池。
// 旧存档兼容：legacyIdMap 保留旧英文存档键 → pid（仅迁移用，不外显）。

const pad3 = (n) => String(n).padStart(3, "0");

const getBeastZhName = (dex) => {
  const map = globalThis.BEAST_ZH;
  const v = map?.[`p${pad3(dex)}`];
  return typeof v === "string" && v.trim() ? v.trim() : null;
};

const getCatchRate = (dex) => {
  const map = globalThis.BEAST_CATCH_RATE;
  const v = map?.[`p${pad3(dex)}`];
  return typeof v === "number" && v >= 0 && v <= 255 ? v : 45;
};

const getBeastTier = (dex) => {
  const v = globalThis.BEAST_TIER?.[`p${pad3(dex)}`];
  if (typeof v === "string" && v) return v;
  const rate = getCatchRate(dex);
  if (rate < 10) return "epic";
  if (rate < 50) return "rare";
  if (rate < 150) return "uncommon";
  return "common";
};

// 旧英文存档键 → dex（SAVE_VERSION<2 时代的存档迁移用；不再外显）
const LEGACY_DEX = {
  bulbasaur: 1, ivysaur: 2, venusaur: 3, charmander: 4, charmeleon: 5, charizard: 6,
  squirtle: 7, wartortle: 8, blastoise: 9, caterpie: 10, metapod: 11, butterfree: 12,
  weedle: 13, kakuna: 14, beedrill: 15, pidgey: 16, pidgeotto: 17, pidgeot: 18,
  rattata: 19, raticate: 20, spearow: 21, fearow: 22, ekans: 23, arbok: 24,
  pikachu: 25, raichu: 26, sandshrew: 27, sandslash: 28, nidoran_f: 29, nidorina: 30,
  nidoqueen: 31, nidoran_m: 32, nidorino: 33, nidoking: 34, clefairy: 35, clefable: 36,
  vulpix: 37, ninetales: 38, jigglypuff: 39, wigglytuff: 40, zubat: 41, golbat: 42,
  oddish: 43, gloom: 44, vileplume: 45, paras: 46, parasect: 47, venonat: 48,
  venomoth: 49, diglett: 50, dugtrio: 51, meowth: 52, persian: 53, psyduck: 54,
  golduck: 55, mankey: 56, primeape: 57, growlithe: 58, arcanine: 59, poliwag: 60,
  poliwhirl: 61, poliwrath: 62, abra: 63, kadabra: 64, alakazam: 65,
};

export function buildLegacyIdMap() {
  const map = {};
  for (const [legacyId, dex] of Object.entries(LEGACY_DEX)) map[legacyId] = `p${pad3(dex)}`;
  return map;
}

/** roster 内物种列表；roster 外物种不进图鉴/捕捉池。zone = 生态区序号（见 CAPTURE_AREAS）。 */
export function buildBeastList() {
  const roster = Array.isArray(globalThis.BEAST_ROSTER) ? globalThis.BEAST_ROSTER : [];
  const zoneMap = globalThis.BEAST_ZONES ?? {};
  return roster.map((dex) => ({
    id: `p${pad3(dex)}`,
    dex,
    name: getBeastZhName(dex) ?? `萌灵${pad3(dex)}`,
    tier: getBeastTier(dex),
    zone: typeof zoneMap[dex] === "number" ? zoneMap[dex] : 0,
  }));
}

/** roster 外物种的旧存档兜底：图鉴/萌灵页显示为逸散状态。 */
export const STRAY_BEAST = { name: "逸散的萌灵", tier: "common", stray: true };

// 生态区 id ↔ BEAST_ZONES 序号（顺序与 CAPTURE_AREAS 一致）
export const ZONE_IDS = [
  "meadow", "woods", "brook", "plateau", "dunes", "garden", "ridge", "hollow", "sanctum",
];
export const ZONE_INDEX = Object.fromEntries(ZONE_IDS.map((id, i) => [id, i]));
export const ZONE_LABELS = {
  meadow: "芽芽草甸", woods: "蜜露林径", brook: "溪光浅滩", plateau: "风铃高原",
  dunes: "星砂荒漠", garden: "月见花园", ridge: "霜晶山脊", hollow: "龙眠幽谷",
  sanctum: "幻梦秘境",
};
export const beastZone = (dex) => globalThis.BEAST_ZONES?.[dex] ?? null;

export { getCatchRate, getBeastTier };

export const legacyIdMap = buildLegacyIdMap();
export const beasts = buildBeastList();
