// beast_defs.js — 萌灵物种定义
// 数据源：data/beasts.js（生成）· roster 驱动，不在 roster 内的物种不进入图鉴/捕捉池。

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

/** roster 内物种列表；roster 外物种不进图鉴/捕捉池。zone = 生态区序号（见 CAPTURE_AREAS）。 */
export function buildBeastList() {
  const roster = Array.isArray(globalThis.BEAST_ROSTER) ? globalThis.BEAST_ROSTER : [];
  const zoneMap = globalThis.BEAST_ZONES ?? {};
  const titleMap = globalThis.BEAST_TITLE ?? {};
  const descMap = globalThis.BEAST_DESC ?? {};
  const orderMap = globalThis.BEAST_ORDER ?? {};
  return roster.map((dex, idx) => {
    const pid = `p${pad3(dex)}`;
    return {
      id: pid,
      dex,
      order: typeof orderMap[pid] === "number" ? orderMap[pid] : idx + 1,
      name: getBeastZhName(dex) ?? `萌灵${pad3(dex)}`,
      title: titleMap[pid] || "星野幻灵",
      desc: descMap[pid] || "栖息于星野秘境的奇异生灵。",
      tier: getBeastTier(dex),
      zone: typeof zoneMap[dex] === "number" ? zoneMap[dex] : 0,
    };
  });
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

export const beasts = buildBeastList();
