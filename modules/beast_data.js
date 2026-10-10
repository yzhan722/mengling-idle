// beast_data.js — 本地萌灵数据查询（本地数据，无网络请求）
// 同步返回 {types, baseStats}；数据来自 data/beasts.js（生成文件）。

export function createBeastDataClient() {
  function getBeastDataByDex(dex) {
    if (typeof dex !== "number" || !Number.isFinite(dex)) return null;
    const d = Math.floor(dex);
    if (d <= 0) return null;
    const types = globalThis.BEAST_TYPES?.[String(d)];
    const baseStats = globalThis.BEAST_STATS?.[d];
    if (!types && !baseStats) return null;
    return {
      types: Array.isArray(types) ? types : ["normal"],
      baseStats: baseStats && typeof baseStats === "object" ? baseStats : null,
    };
  }
  return { getBeastDataByDex };
}
