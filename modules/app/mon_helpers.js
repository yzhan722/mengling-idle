// 萌灵辅助函数（SECTION:MON_HELPERS + 物种查询 拆出）
// 维护者窗口：B

import { STRAY_BEAST } from "../beast_defs.js";
import {
  getMonCurrentStatsWith,
  createMonInstanceWith,
  addExpToMonWith,
  evolveMonWith,
} from "../systems/mon_stats.js";
import { monPower as monPower0, expNeedForLevel as expNeedForLevel0 } from "../mons.js";

export function createMonHelpers({ getState, ui, defs, getBeastDataByDex, serverBuffMul, addLog }) {
  const speciesByPid = new Map(Array.isArray(defs.beasts) ? defs.beasts.map((x) => [x.id, x]) : []);

  // roster 外物种（旧存档捕获的被裁物种）：显示为逸散萌灵，不删数据
  function getSpeciesByPid(pid) {
    const hit = speciesByPid.get(pid);
    if (hit) return hit;
    const dex = Number(String(pid).slice(1));
    if (!pid || !Number.isFinite(dex)) return null;
    return { id: pid, dex, ...STRAY_BEAST };
  }

  function monStatsDeps() {
    return { state: getState(), ui, getBeastDataByDex, getSpeciesByPid, serverBuffMul, addLog };
  }

  function getMonCurrentStats(mon) {
    return getMonCurrentStatsWith(monStatsDeps(), mon);
  }

  function createMonInstance(species, idOverride = null) {
    return createMonInstanceWith(monStatsDeps(), species, idOverride);
  }

  function addExpToMon(mon, expAdd) {
    return addExpToMonWith(monStatsDeps(), mon, expAdd);
  }

  function evolveMon(mon, toPid) {
    return evolveMonWith(monStatsDeps(), mon, toPid);
  }

  function expNeedForLevel(lvl) {
    return expNeedForLevel0(lvl);
  }

  function monPower(mon) {
    return monPower0(mon, getBeastDataByDex);
  }

  function maxSingleMonPower() {
    const list = getState().mons?.list ?? [];
    let best = 0;
    for (const m of list) {
      if (!m) continue;
      const p = Math.floor(monPower(m));
      if (Number.isFinite(p) && p > best) best = p;
    }
    return Math.max(0, best);
  }

  return {
    getSpeciesByPid,
    getMonCurrentStats,
    createMonInstance,
    addExpToMon,
    evolveMon,
    expNeedForLevel,
    monPower,
    maxSingleMonPower,
  };
}
