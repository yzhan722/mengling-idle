// 核心玩法函数：经济/研究/图鉴/科技/addRes/computeDerived（SECTION:DEX_EFFECTS + TECH_EFFECTS + ECONOMY + RESOURCES + COMPUTE_DERIVED 拆出）
// 维护者窗口：A

import { clamp } from "../utils.js";
import {
  dexCaughtCount as dexCaughtCount0,
  computeDexEffects as computeDexEffects0,
  computeTechEffects as computeTechEffects0,
  getBuildingCost as getBuildingCost0,
  getResearchCost as getResearchCost0,
  computeResearchTimeSec as computeResearchTimeSec0,
  getResearchEfficiency as getResearchEfficiency0,
  getPokeballMakeCost as getPokeballMakeCost0,
} from "../systems/effects.js";
import { computeDerived as computeDerivedCore } from "../systems/compute_derived.js";
import { maybeNewbieHandoff } from "../guide.js";

export function createCoreFns({ getState, ui, defs, analytics, addLog, serverBuffMul, activateTab, pushTickerEvent, hint, render }) {
  // ---- 图鉴/科技/建筑 ----
  function dexCaughtCount() {
    return dexCaughtCount0(getState());
  }

  function dexCaughtUnique() {
    return dexCaughtCount().unique;
  }

  function computeDexEffects() {
    return computeDexEffects0(getState());
  }

  function computeTechEffects() {
    return computeTechEffects0(getState(), defs, ui);
  }

  function getBuildingCost(id) {
    return getBuildingCost0(id, getState(), defs, ui);
  }

  function getResearchCost(tdef) {
    return getResearchCost0(tdef, getState());
  }

  function computeResearchTimeSec(tdef) {
    return computeResearchTimeSec0(tdef, getState(), ui);
  }

  function getResearchEfficiency() {
    return getResearchEfficiency0(getState());
  }

  // ---- 经济 ----
  function canAfford(cost) {
    const state = getState();
    for (const [rid, v] of Object.entries(cost)) {
      if ((state.res[rid]?.value ?? 0) < v) return false;
    }
    return true;
  }

  function pay(cost) {
    const state = getState();
    for (const [rid, v] of Object.entries(cost)) {
      state.res[rid].value = Math.max(0, state.res[rid].value - v);
    }
    const fc = cost?.futurecoin;
    if (typeof fc === "number" && Number.isFinite(fc) && fc > 0) analytics.trackFuturecoinSpend(fc, "pay");
  }

  function canStartResearch(tid) {
    const state = getState();
    const tdef = defs.tech[tid];
    if (!tdef) return false;
    if (state.tech[tid]) return false;
    if (state.research && typeof state.research === "object" && state.research.tid) return false;

    const prereqOk = (tdef.prereq ?? []).every((p) => Boolean(state.tech[p]));
    const reqOk = typeof tdef.req === "function" ? Boolean(tdef.req(state)) : true;
    if (!prereqOk || !reqOk) return false;
    const cost = getResearchCost(tdef);
    if (!canAfford(cost)) return false;
    return true;
  }

  function startResearchByTid(tid, source = "manual") {
    const state = getState();
    const tdef = defs.tech[tid];
    if (!tdef) return false;
    if (!canStartResearch(tid)) return false;

    const cost = getResearchCost(tdef);
    pay(cost);
    const t = computeResearchTimeSec(tdef);
    state.research = {
      tid,
      remainingSec: t,
      totalSec: t,
    };
    addLog(`开始研究：${tdef.name}${source === "auto" ? "（自动）" : ""}`);
    render();
    return true;
  }

  function tryAutoResearch() {
    const state = getState();
    if (!state.unlocks?.autoResearch) return false;
    if (!state.autoResearchOn) return false;
    if (state.research && typeof state.research === "object" && state.research.tid) return false;

    const candidates = [];
    for (const [tid, tdef] of Object.entries(defs.tech)) {
      if (canStartResearch(tid)) {
        candidates.push({ tid, tdef });
      }
    }
    if (candidates.length <= 0) return false;

    const costScore = (tdef) => {
      const cost = getResearchCost(tdef);
      let sum = 0;
      for (const v of Object.values(cost)) {
        if (typeof v === "number" && Number.isFinite(v)) sum += Math.max(0, v);
      }
      return sum;
    };

    const mode = state.autoResearchMode === "cost" ? "cost" : "time";
    let best = candidates[0];
    let bestTime = computeResearchTimeSec(best.tdef);
    let bestCost = costScore(best.tdef);

    for (let i = 1; i < candidates.length; i += 1) {
      const c = candidates[i];
      const t = computeResearchTimeSec(c.tdef);
      const k = costScore(c.tdef);

      if (mode === "time") {
        if (t < bestTime || (t === bestTime && k < bestCost)) {
          best = c;
          bestTime = t;
          bestCost = k;
        }
      } else {
        if (k < bestCost || (k === bestCost && t < bestTime)) {
          best = c;
          bestTime = t;
          bestCost = k;
        }
      }
    }

    return startResearchByTid(best.tid, "auto");
  }

  // ---- 资源 ----
  function addRes(rid, amount) {
    const state = getState();
    const r = state.res[rid];
    if (!r) return;
    const def = defs.resources[rid];
    if (def && def.noCap) {
      r.value = Math.max(0, r.value + amount);
      if (ui.activeTab === "future") ui.futureDirty = true;
      if (ui.activeTab === "capture") ui.captureDirty = true;
      if (ui.activeTab === "mons") ui.monsDirty = true;
      return;
    }
    r.value = clamp(r.value + amount, 0, r.cap);
    if (ui.activeTab === "future") ui.futureDirty = true;
    if (ui.activeTab === "capture") ui.captureDirty = true;
    if (ui.activeTab === "mons") ui.monsDirty = true;
  }

  function getPokeballMakeCost(qty = 1, opts = null) {
    return getPokeballMakeCost0(qty, getState(), ui, opts, defs);
  }

  // ---- 派生数值 ----
  function computeDerived() {
    const eff = computeDerivedCore(getState(), {
      defs,
      computeTechEffects,
      serverBuffMul,
      clamp,
      addLog,
    });
    try {
      maybeNewbieHandoff({
        state: getState(),
        activateTab,
        addLog,
        pushTickerEvent,
        hint,
      });
    } catch {
      // ignore
    }
    return eff;
  }

  return {
    dexCaughtCount,
    dexCaughtUnique,
    computeDexEffects,
    computeTechEffects,
    getBuildingCost,
    getResearchCost,
    computeResearchTimeSec,
    getResearchEfficiency,
    canAfford,
    pay,
    canStartResearch,
    startResearchByTid,
    tryAutoResearch,
    addRes,
    getPokeballMakeCost,
    computeDerived,
  };
}
