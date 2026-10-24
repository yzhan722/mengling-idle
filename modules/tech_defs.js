export function buildExtraTechDefs() {
  const tech = {};

  const roman = (n) => {
    const map = [
      [1000, "M"],
      [900, "CM"],
      [500, "D"],
      [400, "CD"],
      [100, "C"],
      [90, "XC"],
      [50, "L"],
      [40, "XL"],
      [10, "X"],
      [9, "IX"],
      [5, "V"],
      [4, "IV"],
      [1, "I"],
    ];
    let x = Math.max(1, Math.floor(n));
    let out = "";
    for (const [v, s] of map) {
      while (x >= v) {
        out += s;
        x -= v;
      }
    }
    return out;
  };

  const chain = (prefix, baseName, prereqBase, reqFn, count, costFn, effectsFn, descFn, timeMul = 1) => {
    for (let i = 1; i <= count; i += 1) {
      const tid = `${prefix}${i}`;
      const prev = i === 1 ? prereqBase : `${prefix}${i - 1}`;
      tech[tid] = {
        name: `${baseName} ${roman(i)}`,
        desc: descFn(i),
        cost: costFn(i),
        prereq: prev ? [prev] : [],
        req: reqFn,
        effects: effectsFn(i),
        timeMul: timeMul,
      };
    }
  };

  const allOtherTechResearched = (state) => {
    const t = state && typeof state === "object" ? state.tech : null;
    if (!t || typeof t !== "object") return false;
    for (const k of Object.keys(t)) {
      if (k.startsWith("hyperGrowth")) continue;
      if (!t[k]) return false;
    }
    return true;
  };

  chain(
    "agroBoost",
    "灵果飞跃",
    "greenhouse",
    (state) => state.buildings.field.owned >= 3,
    3,
    (i) => ({ catnip: Math.ceil(1400 * Math.pow(2.2, i - 1)), wood: Math.ceil(180 * Math.pow(2.0, i - 1)) }),
    (i) => ({ catnipPerSecMul: 1 + 0.5 * i }),
    () => `灵果产量大幅跃升，阶段越高提升越显著。`,
    8
  );

  chain(
    "forestryBoost",
    "灵木飞跃",
    "carpentry",
    (state) => (state.buildings.lumberYard?.owned ?? 0) >= 2,
    3,
    (i) => ({ catnip: Math.ceil(1000 * Math.pow(2.0, i - 1)), wood: Math.ceil(1800 * Math.pow(2.2, i - 1)) }),
    (i) => ({ woodRateMul: 1 + 0.55 * i }),
    () => `灵木产量大幅跃升，进入高产阶段。`,
    8
  );

  chain(
    "miningBoost",
    "灵晶飞跃",
    "excavationTools",
    (state) => (state.buildings.workshop?.owned ?? 0) >= 2 || (state.buildings.mineralSilo?.owned ?? 0) >= 2,
    3,
    (i) => ({ wood: Math.ceil(1300 * Math.pow(2.1, i - 1)), minerals: Math.ceil(1500 * Math.pow(2.2, i - 1)) }),
    (i) => ({ mineralsRateMul: 1 + 0.6 * i }),
    () => `灵晶产量大幅跃升，满足高阶建造与合成。`,
    8
  );

  for (let i = 1; i <= 3; i += 1) {
    const tid = `catnipStorageBoost${i}`;
    const r = 0.75;
    tech[tid] = {
      name: `仓储飞跃·灵果 ${roman(i)}`,
      desc: i < 3 ? "灵果上限 ×1.8。" : "灵果上限 ×2.5。",
      cost: {
        catnip: Math.ceil(2200 * r * Math.pow(2.2, i - 1)),
        wood: Math.ceil(600 * r * Math.pow(2.05, i - 1)),
        minerals: Math.ceil(320 * r * Math.pow(2.1, i - 1)),
      },
      prereq: i === 1 ? ["ultraStorage"] : [`catnipStorageBoost${i - 1}`],
      req: () => true,
      effects: { capCatnipMul: i < 3 ? 1.8 : 2.5 },
      timeMul: 10,
    };
  }

  for (let i = 1; i <= 3; i += 1) {
    const tid = `woodStorageBoost${i}`;
    tech[tid] = {
      name: `仓储飞跃·灵木 ${roman(i)}`,
      desc: "灵木上限 ×1.8。",
      cost: {
        catnip: Math.ceil(1800 * 0.75 * Math.pow(2.2, i - 1)),
        wood: Math.ceil(2200 * 0.75 * Math.pow(2.2, i - 1)),
        minerals: Math.ceil(420 * 0.75 * Math.pow(2.1, i - 1)),
      },
      prereq: i === 1 ? ["ultraStorage"] : [`woodStorageBoost${i - 1}`],
      req: () => true,
      effects: { capWoodMul: 1.8 },
      timeMul: 10,
    };
  }

  for (let i = 1; i <= 3; i += 1) {
    const tid = `mineralsStorageBoost${i}`;
    tech[tid] = {
      name: `仓储飞跃·灵晶 ${roman(i)}`,
      desc: "灵晶上限 ×1.8。",
      cost: {
        catnip: Math.ceil(1600 * 0.75 * Math.pow(2.25, i - 1)),
        wood: Math.ceil(1600 * 0.75 * Math.pow(2.2, i - 1)),
        minerals: Math.ceil(2200 * 0.75 * Math.pow(2.25, i - 1)),
      },
      prereq: i === 1 ? ["ultraStorage"] : [`mineralsStorageBoost${i - 1}`],
      req: () => true,
      effects: { capMineralsMul: 1.8 },
      timeMul: 10,
    };
  }

  chain(
    "hyperGrowth",
    "指数引擎",
    "ultraStorage",
    allOtherTechResearched,
    3,
    (i) => ({
      catnip: Math.ceil(8000 * Math.pow(2.5, i - 1)),
      wood: Math.ceil(5000 * Math.pow(2.5, i - 1)),
      minerals: Math.ceil(4000 * Math.pow(2.5, i - 1)),
    }),
    (i) => {
      const m = i === 1 ? 2.5 : i === 2 ? 5.0 : 10.0;
      return {
        catnipPerSecMul: m,
        woodRateMul: m,
        mineralsRateMul: m,
        capCatnipAdd: 1500 * i,
        capWoodAdd: 1500 * i,
        capMineralsAdd: 1500 * i,
        catchChanceAdd: 0.03 * i,
      };
    },
    () => `大幅提升全资源增长与上限，轻松迈入终局。`,
    8
  );

  return tech;
}

export const EXTRA_TECH_DEFS = buildExtraTechDefs();

export const EXTRA_TECH_FLAGS = Object.fromEntries(Object.keys(EXTRA_TECH_DEFS).map((k) => [k, false]));

/** ponytail: static map + prefix rules; new tech without label falls back to mid */
export const TECH_STAGE_ORDER = ["early", "mid", "late"];

export const TECH_STAGE_LABELS = {
  early: "早期 · 营地起步",
  mid: "中期 · 扩产与工具",
  late: "后期 · 飞跃与指数",
};

const TECH_STAGE_BY_ID = {
  pokeballBasics: "early",
  berryCultivation: "early",
  composting: "early",
  backpackWeaving: "early",
  ballMolds: "early",
  campLogistics: "early",
  trainerDrills: "early",
  irrigation: "mid",
  greenhouse: "mid",
  carpentry: "mid",
  fieldResearch: "mid",
  fieldGuide: "mid",
  apricornCrafting: "mid",
  reinforcedBalls: "mid",
  captureTraining: "mid",
  mineralSurvey: "mid",
  excavationTools: "mid",
  refining: "mid",
  sawmillPlans: "mid",
  oreStorage: "mid",
  supplyLines: "mid",
  efficientConstruction: "mid",
  advancedGear: "mid",
  researchMethod: "mid",
  ultraStorage: "late",
};

const TECH_STAGE_PREFIX = [
  ["agroBoost", "late"],
  ["forestryBoost", "late"],
  ["miningBoost", "late"],
  ["catnipStorageBoost", "late"],
  ["woodStorageBoost", "late"],
  ["mineralsStorageBoost", "late"],
  ["hyperGrowth", "late"],
];

export function getTechStage(tid) {
  if (typeof tid !== "string" || !tid) return "mid";
  if (TECH_STAGE_BY_ID[tid]) return TECH_STAGE_BY_ID[tid];
  for (const [prefix, stage] of TECH_STAGE_PREFIX) {
    if (tid.startsWith(prefix)) return stage;
  }
  return "mid";
}
