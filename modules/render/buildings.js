import { renderBuildingSvg, renderResSvg } from "./rpg_svg_icons.js";

const BUILDING_MAX_LEVEL = 50;

const BUILDING_VISUALS = {
  field: { icon: "🍓", tone: "emerald", tag: "自动产果", perLvl: "灵果 +0.15/秒" },
  granary: { icon: "🏺", tone: "emerald", tag: "果仓扩容", perLvl: "灵果上限 +20" },
  berryPress: { icon: "🍷", tone: "emerald", tag: "精酿增产", perLvl: "灵果 +0.11/秒" },
  hut: { icon: "🌲", tone: "amber", tag: "伐木营地", perLvl: "灵木 +0.025/秒 · 上限 +10" },
  storehouse: { icon: "🛖", tone: "amber", tag: "原木仓储", perLvl: "灵木上限 +28" },
  lumberYard: { icon: "🪓", tone: "amber", tag: "重型锯木", perLvl: "灵木 +0.045/秒 · 上限 +15" },
  workshop: { icon: "🔮", tone: "cyan", tag: "晶石精炼", perLvl: "灵晶 +0.015/秒" },
  quarry: { icon: "⛏️", tone: "cyan", tag: "深层采晶", perLvl: "灵晶 +0.03/秒 · 上限 +13" },
  mineralSilo: { icon: "💎", tone: "cyan", tag: "晶簇秘库", perLvl: "灵晶上限 +45" },
  rangerPost: { icon: "🏹", tone: "cyan", tag: "勘探哨塔", perLvl: "灵晶上限 +18" },
  researchLab: { icon: "🔭", tone: "violet", tag: "星轨科研", perLvl: "科研耗时 -2%" },
  ballBench: { icon: "🔴", tone: "rose", tag: "手工球台", perLvl: "灵球上限 +3" },
  ballFactory: { icon: "⚙️", tone: "rose", tag: "自动球厂", perLvl: "灵球上限 +6" },
  trainingGround: { icon: "🥋", tone: "gold", tag: "演武圣域", perLvl: "训练槽位 +1" },
  breedingHouse: { icon: "🥚", tone: "gold", tag: "温养灵巢", perLvl: "孵蛋效率提升" },
  expeditionPost: { icon: "🧭", tone: "gold", tag: "星门远征", perLvl: "解锁高阶远征" },
  library: { icon: "📚", tone: "violet", tag: "古籍典藏", perLvl: "灵果上限 +28" },
  commandCenter: { icon: "🏰", tone: "gold", tag: "中枢要塞", perLvl: "灵木上限 +80" },
};

const CATEGORY_META = {
  "灵果": { icon: "🍓", sub: "营地生机之源 · 供给采集、投喂与基础扩建" },
  "灵木": { icon: "🌲", sub: "营地构筑栋梁 · 支撑仓储、工坊与制球产线" },
  "灵晶": { icon: "💎", sub: "高阶灵脉结晶 · 驱动科研院与育灵圣域" },
  "研究": { icon: "🔭", sub: "星轨推演中枢 · 大幅缩短全科技树研发耗时" },
  "灵球": { icon: "🔴", sub: "秘境捕猎储备 · 扩充灵球携带与搓球容量" },
  "功能建筑": { icon: "⛩️", sub: "解锁萌灵特训、繁育生蛋与跨界秘境远征" },
  "存储": { icon: "🏛️", sub: "大型战略储备仓库 · 突破资源囤积上限" },
};

const RES_ICONS = {
  catnip: "🍓",
  wood: "🌲",
  minerals: "💎",
  science: "🔬",
  pokeball: "🔴",
  futurecoin: "🪙",
  stardust: "✨",
};

export function createRenderBuildings({ elBuildings, defs, canAfford, getBuildingCost, getState }) {
  return function renderBuildings() {
    const state = getState();

    const activeEl = typeof document !== "undefined" ? document.activeElement : null;
    if (activeEl && elBuildings && elBuildings.contains(activeEl) && activeEl.matches?.("select[data-auto-build-mode]")) {
      return;
    }

    const groups = new Map();
    const groupLevels = new Map();
    const groupOrder = ["灵果", "灵木", "灵晶", "研究", "灵球", "功能建筑", "存储"];
    for (const k of groupOrder) {
      groups.set(k, []);
      groupLevels.set(k, 0);
    }

    const auto = state.auto && typeof state.auto === "object" ? state.auto : null;
    const autoOn = Boolean(auto && auto.autoBuildOn);
    const autoMode = typeof auto?.autoBuildMode === "string" && auto.autoBuildMode ? auto.autoBuildMode : "prod";
    const autoUnlocked = Boolean(state.unlocks?.autoBuild);

    for (const [bid, bdef] of Object.entries(defs.buildings)) {
      if (!bdef.visible(state)) continue;
      const owned = state.buildings[bid].owned;
      const cost = getBuildingCost(bid);
      const maxLvl = typeof bdef.maxLevel === "number" && Number.isFinite(bdef.maxLevel) ? Math.max(1, Math.floor(bdef.maxLevel)) : BUILDING_MAX_LEVEL;
      const isMax = owned >= maxLvl;
      const ok = !isMax && canAfford(cost);
      const pct = isMax ? 100 : Math.min(100, Math.round((owned / maxLvl) * 100));

      const vis = BUILDING_VISUALS[bid] || { icon: "🏛️", tone: "gold", tag: bdef.category || "建筑", perLvl: bdef.desc };
      const costChipsHtml = Object.entries(cost)
        .map(([rid, v]) => {
          const curVal = state.res?.[rid]?.value ?? 0;
          const enough = curVal >= v;
          const rName = defs.resources[rid]?.name || rid;
          return `<span class="cost-chip ${enough ? "is-ok" : "is-short"}" title="当前 ${Math.floor(curVal)} / 需要 ${v}">${renderResSvg(rid, 14)} ${rName}${v}</span>`;
        })
        .join("");

      const costText = Object.entries(cost)
        .map(([rid, v]) => `${defs.resources[rid].name}${v}`)
        .join(" / ");

      const cat = typeof bdef.category === "string" && bdef.category ? bdef.category : "存储";
      if (!groups.has(cat)) {
        groups.set(cat, []);
        groupLevels.set(cat, 0);
      }
      groupLevels.set(cat, (groupLevels.get(cat) || 0) + owned);

      groups.get(cat).push(`
        <div class="row bcard bcard--${vis.tone}${ok ? " row--buildable" : ""}${isMax ? " is-maxed" : ""}">
          <div class="row__left bcard__main">
            <div class="bcard__head">
              <div class="bcard__emblem bcard__emblem--${vis.tone}" aria-hidden="true">
                <span class="bcard__icon">${renderBuildingSvg(bid, 26)}</span>
                <span class="bcard__lvlBadge">Lv.${owned}</span>
              </div>
              <div class="bcard__titleWrap">
                <div class="bcard__titleLine">
                  <span class="row__title">${bdef.name}</span>
                  <span class="bcard__tag">${vis.tag}</span>
                </div>
                <div class="row__desc">${bdef.desc}</div>
                <div class="bcard__effect">✨ 单级效果：${vis.perLvl}</div>
              </div>
            </div>
            <div class="building-level-bar" aria-label="等级 ${owned}/${maxLvl}">
              <div class="building-level-bar__track">
                <div class="building-level-bar__fill${isMax ? " is-maxed" : ""}" style="width:${pct}%"></div>
              </div>
              <div class="building-level-bar__label">Lv.${owned}${isMax ? " 满级" : `/${maxLvl}`}</div>
            </div>
          </div>
          <div class="row__right bcard__actions">
            <div class="badge ${isMax ? "badge--muted" : ok ? "badge--ok" : ""}">拥有：${owned}${isMax ? " / 满级" : ""}</div>
            <div class="bcard__costs" title="花费：${costText}">${isMax ? `<span class="badge badge--ok">★ 已满级</span>` : costChipsHtml}</div>
            <button class="btn btn--primary btn--small bcard__btn" data-buy="${bid}" aria-label="${isMax ? `${bdef.name} 已满级` : `建造 ${bdef.name}`}" ${ok ? "" : "disabled"}>${isMax ? "已满级" : "🔨 建造"}</button>
          </div>
        </div>
      `);
    }

    const sections = [];

    if (autoUnlocked) {
      sections.push(`
        <div class="row bcard-autobuild">
          <div class="row__left">
            <div class="row__title">⚙️ 自动建造鲁班枢机</div>
            <div class="row__desc">开启后会自动尝试建造可负担的营地建筑（每秒最多 1 次）。</div>
          </div>
          <div class="row__right">
            <label class="check">
              <input type="checkbox" data-auto-build-toggle ${autoOn ? "checked" : ""} />
              <span>开启</span>
            </label>
            <select class="input" data-auto-build-mode>
              <option value="prod" ${autoMode === "prod" ? "selected" : ""}>产量优先</option>
              <option value="storage" ${autoMode === "storage" ? "selected" : ""}>存储优先</option>
            </select>
          </div>
        </div>
      `);
    } else {
      sections.push(`
        <div class="row is-locked bcard-autobuild">
          <div class="row__left">
            <div class="row__title">⚙️ 自动建造</div>
            <div class="row__desc">在“未来币商店”解锁后可用，自动托管营地扩建。</div>
          </div>
          <div class="row__right">
            <div class="badge badge--muted">未解锁</div>
          </div>
        </div>
      `);
    }

    const pushCat = (cat, rows) => {
      if (!rows || rows.length === 0) return;
      const meta = CATEGORY_META[cat] || { icon: "🏛️", sub: "" };
      const totLv = groupLevels.get(cat) || 0;
      sections.push(`
        <div class="building-section" role="group" aria-label="${cat}">
          <div class="building-section__title">
            <span class="building-section__icon">${meta.icon}</span>
            <span>${cat}建筑群</span>
            <span class="building-section__meta">共 ${rows.length} 项 · 累计 Lv.${totLv}</span>
          </div>
          ${meta.sub ? `<div class="building-section__sub">${meta.sub}</div>` : ""}
        </div>
      `);
      sections.push(rows.join(""));
    };

    for (const cat of groupOrder) {
      pushCat(cat, groups.get(cat) ?? []);
    }
    for (const [cat, rows] of groups.entries()) {
      if (groupOrder.includes(cat)) continue;
      pushCat(cat, rows);
    }

    elBuildings.innerHTML = sections.join("");
  };
}
