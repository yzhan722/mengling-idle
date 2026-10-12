// defs 组装：资源/萌灵/科技/建筑 + 平衡系数重标定（SECTION:DEFS_AND_BALANCE 拆出）
// 维护者窗口：A
// 科技核心表复用 defs_tech_core.js（与 player-sim 同一数据源，消除双份真相）

import { beasts } from "./beast_defs.js";
import { EXTRA_TECH_DEFS } from "./tech_defs.js";
import { CORE_TECH_DEFS } from "./defs_tech_core.js";
import { RESOURCE_DEFS } from "./defs_resources.js";
import { BUILDING_DEFS } from "./defs_buildings.js";

// 已从建筑池剪除的旧建筑（旧存档兼容期遗留；新档不再出现）
const PRUNED_BUILDINGS = [
  "sawmill",
  "greenhouse",
  "mine",
  "refinery",
  "oreWarehouse",
  "supplyDepot",
  "library",
  "archive",
  "warehouse",
  "commandCenter",
];

// 建筑平衡系数已预乘到 defs_buildings.js，此处全部设为 1.0（rebalanceBuildingDefs 变为无操作）
const BUILDING_BALANCE = {
  costMul: 1.0,
  prodMul: 1.0,
  capAddMul: 1.0,
};

function rebalanceBuildingDefs(defs) {
  const scaleCost = (cost) => {
    const out = {};
    for (const [rid, v] of Object.entries(cost ?? {})) {
      if (typeof v !== "number" || !Number.isFinite(v) || v <= 0) continue;
      out[rid] = Math.max(1, Math.floor(v * BUILDING_BALANCE.costMul));
    }
    return out;
  };

  const scalePerSec = (v) => {
    if (typeof v !== "number" || !Number.isFinite(v)) return v;
    const x = v * BUILDING_BALANCE.prodMul;
    return Math.round(x * 10000) / 10000;
  };

  const scaleCapAdd = (v) => {
    if (typeof v !== "number" || !Number.isFinite(v)) return v;
    return Math.max(0, Math.floor(v * BUILDING_BALANCE.capAddMul));
  };

  for (const b of Object.values(defs.buildings ?? {})) {
    if (!b || typeof b !== "object") continue;

    if (b.baseCost && typeof b.baseCost === "object") {
      b.baseCost = scaleCost(b.baseCost);
    }

    if (typeof b.effects === "function") {
      const old = b.effects;
      b.effects = (state) => {
        const e0 = old(state);
        if (!e0 || typeof e0 !== "object") return e0;
        const e = { ...e0 };
        for (const [k, v] of Object.entries(e)) {
          if (typeof v !== "number" || !Number.isFinite(v)) continue;
          if (k.endsWith("PerSec")) e[k] = scalePerSec(v);
          else if (k.startsWith("cap") && k.endsWith("Add")) e[k] = scaleCapAdd(v);
        }
        return e;
      };
    }
  }
}

const TECH_BALANCE = {
  researchCostMul: 2,
  prodMulNerf: 0.7,
  woodProdMulNerf: 0.35,
  capAddBuff: 1.25,
};

function rebalanceTechDefs(defs) {
  const scaleCost = (cost) => {
    const out = {};
    for (const [rid, v] of Object.entries(cost ?? {})) {
      if (typeof v !== "number" || !Number.isFinite(v) || v <= 0) continue;
      out[rid] = Math.ceil(v * TECH_BALANCE.researchCostMul);
    }
    return out;
  };

  const nerfMul = (v) => 1 + (v - 1) * TECH_BALANCE.prodMulNerf;
  const nerfMulWood = (v) => 1 + (v - 1) * TECH_BALANCE.woodProdMulNerf;
  const CAP_ADD_KEYS = ["capCatnipAdd", "capWoodAdd", "capMineralsAdd", "capPokeballAdd"];
  const CAP_TO_MUL = {
    capCatnipAdd: "capCatnipMul",
    capWoodAdd: "capWoodMul",
    capMineralsAdd: "capMineralsMul",
    capPokeballAdd: "capPokeballMul",
  };
  const CAP_DENOM = {
    capCatnipAdd: 400,
    capWoodAdd: 500,
    capMineralsAdd: 600,
    capPokeballAdd: 1200,
  };
  const CAP_MUL_MAX = {
    capCatnipMul: 6,
    capWoodMul: 6,
    capMineralsMul: 6,
    capPokeballMul: 3,
  };
  const PROD_KEYS = ["catnipPerSecMul", "woodRateMul", "mineralsRateMul"];

  const pctFromMul = (mul) => Math.round((mul - 1) * 100);
  const adjustDesc = (desc, eff) => {
    if (typeof desc !== "string") return desc;
    if (!desc.includes("%") && !desc.includes("上限")) return desc;
    let d = desc;

    const c = typeof eff.catnipPerSecMul === "number" && Number.isFinite(eff.catnipPerSecMul) ? eff.catnipPerSecMul : null;
    const w = typeof eff.woodRateMul === "number" && Number.isFinite(eff.woodRateMul) ? eff.woodRateMul : null;
    const m = typeof eff.mineralsRateMul === "number" && Number.isFinite(eff.mineralsRateMul) ? eff.mineralsRateMul : null;

    if (c) d = d.replace(/灵果产量\s*\+\s*\d+%/g, `灵果产量 +${pctFromMul(c)}%`);
    if (w) d = d.replace(/灵木产量\s*\+\s*\d+%/g, `灵木产量 +${pctFromMul(w)}%`);
    if (m) d = d.replace(/(灵晶碎片|灵晶)产量\s*\+\s*\d+%/g, `$1产量 +${pctFromMul(m)}%`);

    if (c && w && m && pctFromMul(c) === pctFromMul(w) && pctFromMul(w) === pctFromMul(m)) {
      const p = pctFromMul(c);
      d = d.replace(/灵果\s*\/\s*灵木\s*\/\s*灵晶产量\s*\+\s*\d+%/g, `灵果/灵木/灵晶产量 +${p}%`);
    }

    if (w && m && pctFromMul(w) === pctFromMul(m)) {
      const p = pctFromMul(w);
      d = d.replace(/灵木与灵晶碎片产量\s*\+\s*\d+%/g, `灵木与灵晶碎片产量 +${p}%`);
    }

    const cCap = typeof eff.capCatnipMul === "number" && Number.isFinite(eff.capCatnipMul) ? eff.capCatnipMul : null;
    const wCap = typeof eff.capWoodMul === "number" && Number.isFinite(eff.capWoodMul) ? eff.capWoodMul : null;
    const mCap = typeof eff.capMineralsMul === "number" && Number.isFinite(eff.capMineralsMul) ? eff.capMineralsMul : null;
    const pCap = typeof eff.capPokeballMul === "number" && Number.isFinite(eff.capPokeballMul) ? eff.capPokeballMul : null;

    if (cCap) d = d.replace(/灵果上限\s*\+\s*\d+/g, `灵果上限 +${pctFromMul(cCap)}%`);
    if (wCap) d = d.replace(/灵木上限\s*\+\s*\d+/g, `灵木上限 +${pctFromMul(wCap)}%`);
    if (mCap) d = d.replace(/(灵晶碎片|灵晶)上限\s*\+\s*\d+/g, `$1上限 +${pctFromMul(mCap)}%`);
    if (pCap) d = d.replace(/灵球上限\s*\+\s*\d+/g, `灵球上限 +${pctFromMul(pCap)}%`);

    return d;
  };

  for (const tdef of Object.values(defs.tech ?? {})) {
    if (!tdef || typeof tdef !== "object") continue;
    tdef.cost = scaleCost(tdef.cost ?? {});
    const eff0 = tdef.effects ?? {};
    const eff = { ...eff0 };
    for (const k of PROD_KEYS) {
      if (typeof eff[k] !== "number" || !Number.isFinite(eff[k])) continue;
      if (k === "woodRateMul") eff[k] = nerfMulWood(eff[k]);
      else eff[k] = nerfMul(eff[k]);
    }
    for (const k of CAP_ADD_KEYS) {
      if (typeof eff[k] !== "number" || !Number.isFinite(eff[k])) continue;
      const mulKey = CAP_TO_MUL[k];
      const denom = CAP_DENOM[k] ?? 600;
      const capMax = CAP_MUL_MAX[mulKey] ?? 6;
      const add = eff[k] * TECH_BALANCE.capAddBuff;
      const mul = 1 + add / denom;
      eff[mulKey] = Math.min(capMax, (typeof eff[mulKey] === "number" && Number.isFinite(eff[mulKey]) ? eff[mulKey] : 1) * mul);
      delete eff[k];
    }
    tdef.effects = eff;
    if (typeof tdef.desc === "string") tdef.desc = adjustDesc(tdef.desc, eff);
  }
}

// 组出唯一权威 defs：应用平衡系数 + 剪除废弃建筑
export function buildDefs() {
  const defs = {
    resources: RESOURCE_DEFS,
    beasts,
    tech: {
      ...CORE_TECH_DEFS,
      ...EXTRA_TECH_DEFS,
    },
    buildings: BUILDING_DEFS,
  };

  rebalanceBuildingDefs(defs);
  rebalanceTechDefs(defs);

  for (const id of PRUNED_BUILDINGS) {
    delete defs.buildings[id];
  }

  return defs;
}
