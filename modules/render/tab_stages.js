// tab_stages.js — 全页面沉浸式全景视觉舞台引擎（v0.4.0）
// 让每一个主面板（研究、捕捉、萌灵、功能、商店、图鉴、挑战、道具、社交、排行榜、帮助、设置）
// 都拥有与「篝火主页」同等级别的 16:9 手绘场景原画 + 动态 SVG 光效 + 实时数据交互舞台。

import { pad3 } from "../utils.js";
import { renderOrbSvg, renderResSvg, renderBuildingSvg, renderUiIcon } from "./rpg_svg_icons.js";

/**
 * 将全景舞台 (stageHtml) 与列表内容 (rowsHtml) 挂载到容器，
 * 在高频 Tick 刷新时保留已挂载的 .tab-stage__artWrap (<img class="tab-stage__bgImg">)，
 * 避免每 200ms 重建 DOM 导致背景原画闪烁或丢失解码缓存。
 */
export function setHtmlPreservingStage(containerEl, fullHtmlString) {
  if (!containerEl) return;
  const html = String(fullHtmlString || "");
  if (typeof document === "undefined" || typeof containerEl.querySelector !== "function") {
    containerEl.innerHTML = html;
    return;
  }
  const existingStage = containerEl.querySelector(":scope > .tab-stage");
  const existingRows = containerEl.querySelector(":scope > .tab-stage-rows");
  if (!existingStage || !existingRows) {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    const firstStage = tmp.querySelector(":scope > .tab-stage");
    if (!firstStage) {
      containerEl.innerHTML = html;
      return;
    }
    const stageOuter = firstStage.outerHTML;
    firstStage.remove();
    const restHtml = tmp.innerHTML;
    containerEl.innerHTML = `${stageOuter}<div class="tab-stage-rows" style="display:contents">${restHtml}</div>`;
    containerEl.__lastFullHtml = html;
    const newStage = containerEl.querySelector(":scope > .tab-stage");
    const newRows = containerEl.querySelector(":scope > .tab-stage-rows");
    if (newRows) newRows.__lastHtml = restHtml;
    const parentPanel = containerEl.closest?.(".panel");
    const panelActions = parentPanel?.querySelector?.(":scope > .actions");
    if (panelActions && newStage && (containerEl.id === "tech" || containerEl.id === "monList")) {
      newStage.insertAdjacentElement("afterend", panelActions);
    }
    return;
  }
  const parentPanel0 = containerEl.closest?.(".panel");
  const panelActions0 = parentPanel0?.querySelector?.(":scope > .actions");
  if (panelActions0 && existingStage && (containerEl.id === "tech" || containerEl.id === "monList")) {
    existingStage.insertAdjacentElement("afterend", panelActions0);
  }
  if (containerEl.__lastFullHtml === html) return;
  containerEl.__lastFullHtml = html;

  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  const nextStage = tmp.querySelector(":scope > .tab-stage");
  if (!nextStage) {
    containerEl.innerHTML = html;
    return;
  }
  if (existingStage.className !== nextStage.className) {
    existingStage.className = nextStage.className;
  }
  const curHead = existingStage.querySelector(".tab-stage__header");
  const nextHead = nextStage.querySelector(".tab-stage__header");
  if (curHead && nextHead && curHead.innerHTML !== nextHead.innerHTML) {
    curHead.innerHTML = nextHead.innerHTML;
  }
  const curRibbon = existingStage.querySelector(".capture-biome-ribbon");
  const nextRibbon = nextStage.querySelector(".capture-biome-ribbon");
  if (curRibbon && nextRibbon && curRibbon.innerHTML !== nextRibbon.innerHTML) {
    curRibbon.innerHTML = nextRibbon.innerHTML;
  }
  const curBody = existingStage.querySelector(".tab-stage__body");
  const nextBody = nextStage.querySelector(".tab-stage__body");
  if (curBody && nextBody) {
    if (curBody.className !== nextBody.className) curBody.className = nextBody.className;
    if (curBody.innerHTML !== nextBody.innerHTML) curBody.innerHTML = nextBody.innerHTML;
  }
  nextStage.remove();
  const restHtml = tmp.innerHTML;
  if (existingRows.__lastHtml !== restHtml) {
    existingRows.innerHTML = restHtml;
    existingRows.__lastHtml = restHtml;
  }
}

function renderSparksSvg(color1 = "#fde047", color2 = "#38bdf8") {
  return `
    <svg class="tab-stage__sparksSvg" viewBox="0 0 800 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <circle class="camp-spark camp-spark--1" cx="140" cy="150" r="2.2" fill="${color1}" />
      <circle class="camp-spark camp-spark--2" cx="280" cy="135" r="1.8" fill="${color2}" />
      <circle class="camp-spark camp-spark--3" cx="420" cy="155" r="2.4" fill="${color1}" />
      <circle class="camp-spark camp-spark--4" cx="560" cy="140" r="2.0" fill="${color2}" />
      <circle class="camp-spark camp-spark--5" cx="680" cy="148" r="1.9" fill="${color1}" />
    </svg>
  `;
}

/** 1. 研究页：「星轨灵研天象台」 */
export function renderScienceStageHtml({
  state,
  defs,
  activeResearchTid,
  activeRemain,
  activeTotal,
  recommendTid,
  recommendDef,
  researchEff,
  stageCounts,
  fmtDuration,
  escapeHtml,
}) {
  const totalTech = Object.keys(defs.tech || {}).length;
  const doneTech = Object.values(state.tech || {}).filter(Boolean).length;
  const totalPct = totalTech > 0 ? Math.round((doneTech / totalTech) * 100) : 0;

  let activePct = 0;
  let centerTitle = "星轨天象推演待命";
  let centerSub = "选择下方任一课题，或点击右侧推荐课题立即启动推演。";
  let centerBadge = `已点亮 ${doneTech}/${totalTech} (${totalPct}%)`;
  let actionHtml = "";

  if (activeResearchTid && defs.tech?.[activeResearchTid]) {
    const tdef = defs.tech[activeResearchTid];
    activePct = activeTotal > 0 ? Math.max(2, Math.min(99, Math.round(((activeTotal - activeRemain) / activeTotal) * 100))) : 50;
    centerTitle = `正在推演：${escapeHtml(tdef.name)}`;
    centerSub = escapeHtml(tdef.desc || "星轨灵研院正在全力解析该法则…");
    centerBadge = `推演进度 ${activePct}% · 剩余 ${escapeHtml(fmtDuration(activeRemain))}`;
  } else if (recommendTid && recommendDef) {
    activePct = totalPct;
    centerTitle = `推荐课题：${escapeHtml(recommendDef.name)}`;
    centerSub = escapeHtml(recommendDef.desc || "点亮此项星轨课题以推进营地生产力。");
    centerBadge = "天象就绪 · 可立即研究";
    actionHtml = `<button type="button" class="btn btn--primary btn--small" data-research="${escapeHtml(recommendTid)}">✨ 立即推演</button>`;
  }

  const dash = Math.round((activePct / 100) * 264);

  return `
    <div class="tab-stage tab-stage--science" aria-label="星轨灵研天象台">
      <div class="tab-stage__artWrap">
        <img class="tab-stage__bgImg" src="./assets/ui/stage_science.jpg" alt="" loading="eager" decoding="sync" onerror="this.style.display='none'" />
        <div class="tab-stage__aura tab-stage__aura--cyan"></div>
        ${renderSparksSvg("#38bdf8", "#fde047")}
      </div>
      <div class="tab-stage__header">
        <span class="camp-stage__badge">🔭 星轨灵研天象台 · 已点亮 ${doneTech}/${totalTech}</span>
        <span class="camp-stage__sub">灵研院 ×${researchEff.n} · 科研耗时 -${Math.round(researchEff.reduce * 100)}%</span>
      </div>
      <div class="tab-stage__body tab-stage__body--science">
        <button type="button" class="science-astrolabe science-astrolabe--interactive" data-stage-act="astrolabe-pulse" title="点击凝星推演（科研耗时 -2秒 / 感悟灵果）">
          <svg class="science-astrolabe__svg" viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="42" fill="rgba(11,15,25,0.72)" stroke="rgba(56,189,248,0.25)" stroke-width="4" />
            <circle class="science-astrolabe__orbit" cx="50" cy="50" r="35" fill="none" stroke="rgba(250,204,21,0.35)" stroke-width="1.5" stroke-dasharray="6 4" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="#38bdf8" stroke-width="4.5" stroke-linecap="round"
              stroke-dasharray="${dash} 264" transform="rotate(-90 50 50)" />
          </svg>
          <div class="science-astrolabe__core">
            <div class="science-astrolabe__pct">${activeResearchTid ? `${activePct}%` : `${totalPct}%`}</div>
            <div class="science-astrolabe__label">${activeResearchTid ? "点击加速" : "点击凝星"}</div>
          </div>
        </button>
        <div class="tab-stage__focal">
          <div class="tab-stage__eyebrow">${centerBadge}</div>
          <div class="tab-stage__title">${centerTitle}</div>
          <div class="tab-stage__desc">${centerSub}</div>
          <div class="tab-stage__pills">
            <button type="button" class="tab-stage__pill tab-stage__pill--btn" data-stage-act="tech-filter" data-tech-stage="early">🌱 起步科技 ${stageCounts.earlyDone}/${stageCounts.earlyTotal}</button>
            <button type="button" class="tab-stage__pill tab-stage__pill--btn" data-stage-act="tech-filter" data-tech-stage="mid">⚙️ 扩产科技 ${stageCounts.midDone}/${stageCounts.midTotal}</button>
            <button type="button" class="tab-stage__pill tab-stage__pill--btn" data-stage-act="tech-filter" data-tech-stage="late">🚀 飞跃科技 ${stageCounts.lateDone}/${stageCounts.lateTotal}</button>
          </div>
        </div>
        <div class="tab-stage__cta">
          ${actionHtml}
          <button type="button" class="btn btn--small" data-stage-act="astrolabe-pulse">🔭 凝星加速</button>
        </div>
      </div>
    </div>
  `;
}

/** 2. 捕捉页：「九域生态实景猎场与星环缩圈捕捉剧场」 */
export function renderCaptureStageHtml({
  state,
  ui,
  area,
  unlockedAreas,
  nextLockedArea,
  pool,
  caughtMap,
  enc,
  encIsShiny,
  encIsMythic,
  encTypes,
  effChance,
  pity2,
  encCharges,
  advCharges,
  advMaxCharges,
  encOk,
  advOk,
  throwOk,
  lucky,
  week,
  streak,
  renderBeastIcon,
  typeZh,
  escapeHtml,
}) {
  const biomeId = area?.id || "meadow";
  const pbVal = Math.max(0, Math.floor(state.res?.pokeball?.value ?? 0));
  const ubVal = Math.max(0, Math.floor(state.res?.ultraball?.value ?? 0));
  const qbVal = Math.max(0, Math.floor(state.res?.quickball?.value ?? 0));
  const lbVal = Math.max(0, Math.floor(state.res?.luxuryball?.value ?? 0));
  const nbVal = Math.max(0, Math.floor(state.res?.netball?.value ?? 0));
  const dbVal = Math.max(0, Math.floor(state.res?.duskball?.value ?? 0));
  const mbVal = Math.max(0, Math.floor(state.res?.masterball?.value ?? 0));
  const selectedBall = ui?.selectedBallType || "pokeball";

  const lureStacks = Math.max(0, Math.floor(ui?.lureStacks || 0));
  const baitStacks = Math.max(0, Math.floor(ui?.encounterBaitStacks || 0));
  const mudStacks = Math.max(0, Math.floor(ui?.encounterMudStacks || 0));
  const ambushBonus = Math.max(0, Number(ui?.encounterAmbushBonus || 0));

  const BIOME_ICONS = {
    meadow: "🌿",
    woods: "🍯",
    brook: "💧",
    plateau: "🎐",
    dunes: "🏜️",
    garden: "🌙",
    ridge: "❄️",
    hollow: "🐉",
    sanctum: "🌌",
  };
  const biomeRibbonHtml = Array.isArray(unlockedAreas) && unlockedAreas.length
    ? `<div class="capture-biome-ribbon" role="tablist" aria-label="生态秘境地图切换">
        ${unlockedAreas
          .map((a) => {
            const active = a.id === area?.id;
            const ico = BIOME_ICONS[a.id] || "🧭";
            return `<button type="button" class="biome-pill ${active ? "is-active" : ""}" data-stage-act="biome-switch" data-area-id="${escapeHtml(a.id)}">${ico} ${escapeHtml(a.name)}</button>`;
          })
          .join("")}
        ${nextLockedArea ? `<span class="biome-pill is-locked" title="集齐更多图鉴后解锁">🔒 ${escapeHtml(nextLockedArea.name)} (${nextLockedArea.unlockReq}图鉴)</span>` : ""}
        <button type="button" class="biome-pill biome-pill--lure ${lureStacks > 0 ? "is-lured" : ""}" data-stage-act="field-lure" title="消耗 15 灵果撒播诱灵香果，接下来 3 次遭遇捕获率 +6%">
          🍯 ${lureStacks > 0 ? `诱饵生效 ×${lureStacks}` : "撒播诱灵香果"}
        </button>
      </div>`
    : "";

  const BALL_BELT_DEFS = [
    { id: "pokeball", name: "灵球", tag: "1.0x", count: pbVal, always: true },
    { id: "ultraball", name: "高级灵球", tag: "2.0x", count: ubVal },
    { id: "quickball", name: "迅捷灵球", tag: "首发5x", count: qbVal },
    { id: "luxuryball", name: "豪华灵球", tag: "亲密+20", count: lbVal },
    { id: "netball", name: "捕灵球", tag: "水草3x", count: nbVal },
    { id: "duskball", name: "暗夜灵球", tag: "夜间3x", count: dbVal },
  ];

  const ballBeltHtml = `
    <div class="capture-ball-belt" role="group" aria-label="灵球战术腰带">
      <span class="capture-ball-belt__label">${renderOrbSvg("pokeball", 16)} 灵球战术腰带：</span>
      <div class="capture-ball-belt__slots">
        ${BALL_BELT_DEFS.filter((b) => b.always || b.count > 0 || selectedBall === b.id)
          .map(
            (b) => `
          <button type="button" class="ball-slot ${selectedBall === b.id ? "is-selected" : ""} ${b.count <= 0 ? "is-empty" : ""}" data-stage-act="select-ball" data-ball-type="${b.id}" title="切换为 ${b.name}（库存 ${b.count}）">
            <span class="ball-slot__icon">${renderOrbSvg(b.id, 18)}</span>
            <span class="ball-slot__name">${b.name}</span>
            <span class="ball-slot__tag">${b.tag}</span>
            <span class="ball-slot__cnt">×${b.count}</span>
          </button>`
          )
          .join("")}
        ${
          mbVal > 0
            ? `<button type="button" class="ball-slot ball-slot--master" data-capture-action="masterball" ${enc ? "" : "disabled"} title="使用究极灵球 100% 必中捕获！">
                <span class="ball-slot__icon">${renderOrbSvg("masterball", 18)}</span>
                <span class="ball-slot__name">究极灵球</span>
                <span class="ball-slot__tag">100%必中</span>
                <span class="ball-slot__cnt">×${mbVal}</span>
              </button>`
            : ""
        }
      </div>
    </div>
  `;

  let centerHtml = "";
  if (enc) {
    const tierText = enc.tier === "common" ? "常见" : enc.tier === "uncommon" ? "少见" : enc.tier === "rare" ? "稀有" : "史诗";
    const typeBadges = (encTypes || [])
      .map((t) => `<span class="badge type type-${escapeHtml(t)}">${escapeHtml(typeZh(t))}</span>`)
      .join("");
    const pct = Math.round((effChance || 0) * 100);
    const encCaughtN = caughtMap && typeof caughtMap[enc.id] === "number" ? caughtMap[enc.id] : 0;
    const isNewDex = encCaughtN <= 0;

    const tacticalTags = [];
    if (ambushBonus > 0) tacticalTags.push(`<span class="tactical-chip tactical-chip--emerald">⚡ 先手奇袭 +${Math.round(ambushBonus * 100)}%</span>`);
    if (lureStacks > 0) tacticalTags.push(`<span class="tactical-chip tactical-chip--gold">🍯 香果诱饵 +6%</span>`);
    if (baitStacks > 0) tacticalTags.push(`<span class="tactical-chip tactical-chip--emerald">🍓 浆果安抚 +${baitStacks * 4}% (${baitStacks}/3)</span>`);
    if (mudStacks > 0) tacticalTags.push(`<span class="tactical-chip tactical-chip--cyan">💣 泥团封路 +${mudStacks * 5}% · 防逃逸 (${mudStacks}/2)</span>`);
    if ((pity2 || 0) > 0) tacticalTags.push(`<span class="tactical-chip">🛡️ 失败保底 +${Math.round((pity2 || 0) * 100)}%</span>`);

    centerHtml = `
      <div class="capture-stage-encounter">
        <button type="button" class="capture-stage-encounter__pedestal capture-reticle-btn ${encIsShiny ? "is-shiny" : ""} ${encIsMythic ? "is-mythic" : ""}" data-stage-act="reticle-throw" title="待绿色星环收缩至中心时点击，触发【完美缩圈投球】额外提升 +15% 捕获率！">
          <svg class="capture-reticle-svg" viewBox="0 0 140 140" aria-hidden="true">
            <circle cx="70" cy="70" r="62" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="1.5" stroke-dasharray="6 4"/>
            <circle cx="70" cy="70" r="24" fill="none" stroke="rgba(250,204,21,0.45)" stroke-width="1.2" stroke-dasharray="3 3"/>
            <circle class="capture-reticle__shrinkRing" cx="70" cy="70" r="56" fill="none" stroke="#4ade80" stroke-width="2.8"/>
            <line x1="70" y1="2" x2="70" y2="14" stroke="rgba(250,204,21,0.65)" stroke-width="1.6"/>
            <line x1="70" y1="126" x2="70" y2="138" stroke="rgba(250,204,21,0.65)" stroke-width="1.6"/>
            <line x1="2" y1="70" x2="14" y2="70" stroke="rgba(250,204,21,0.65)" stroke-width="1.6"/>
            <line x1="126" y1="70" x2="138" y2="70" stroke="rgba(250,204,21,0.65)" stroke-width="1.6"/>
          </svg>
          <div class="capture-stage-encounter__art">${renderBeastIcon(enc.dex, enc.name, encIsShiny)}</div>
          <div class="capture-stage-encounter__tag">${encIsShiny ? "★ 闪光现身" : encIsMythic ? "✦ 幻灵降临" : isNewDex ? "★ 首次发现 NEW" : `No.${pad3(enc.order || enc.dex)}`}</div>
          <span class="capture-reticle__hint">🎯 点击缩圈投球</span>
        </button>

        <div class="capture-stage-encounter__hud">
          <div class="tab-stage__eyebrow">🎯 野外实景遭遇 · ${escapeHtml(area.name)} ${isNewDex ? "· 【图鉴未收录！】" : `· 已捕获 ${encCaughtN} 次`}</div>
          <div class="tab-stage__title">
            ${escapeHtml(enc.name)}
            ${enc.title ? `<span class="beast-title-tag">【${escapeHtml(enc.title)}】</span>` : ""}
            <span class="badge">${tierText}</span>
            ${typeBadges}
          </div>
          <div class="tab-stage__desc">${escapeHtml(enc.desc || "栖息于秘境深处的奇异灵兽。")}</div>
          <div class="capture-chance-meter">
            <div class="capture-chance-meter__top">
              <span>🎯 综合捕获率预估：<strong>${pct}%</strong>（缩圈完美命中可再 +15%）</span>
              <span>当前球种：${renderOrbSvg(selectedBall, 14)} ${selectedBall === "pokeball" ? "灵球" : selectedBall === "ultraball" ? "高级灵球" : selectedBall === "quickball" ? "迅捷灵球" : selectedBall === "luxuryball" ? "豪华灵球" : selectedBall === "netball" ? "捕灵球" : "暗夜灵球"}</span>
            </div>
            <div class="capture-chance-meter__bar">
              <div class="capture-chance-meter__fill" style="width:${Math.max(6, pct)}%"></div>
            </div>
          </div>
          <div class="tab-stage__pills">
            ${tacticalTags.length ? tacticalTags.join("") : `<span class="tab-stage__pill">💡 提示：投喂浆果或投掷泥团可大幅提高捕获率并防止逃跑</span>`}
          </div>
        </div>

        <div class="tab-stage__cta capture-stage-encounter__cta">
          <button type="button" class="btn btn--primary capture-throw-hero-btn" data-stage-act="reticle-throw" ${throwOk ? "" : "disabled"}>🎯 缩圈精准投球</button>
          <div class="capture-tactical-btns">
            <button type="button" class="btn btn--small" data-stage-act="encounter-bait" title="消耗 10 灵果安抚野生灵兽，本场捕获率 +4%（最高3层）">🍓 浆果 (${baitStacks}/3)</button>
            <button type="button" class="btn btn--small" data-stage-act="encounter-mud" title="消耗 5 灵果声东击西，本场捕获率 +5% 且防止失败逃跑（最高2层）">💣 泥团 (${mudStacks}/2)</button>
            <button type="button" class="btn btn--small btn--ghost" data-capture-action="run">💨 撤离</button>
          </div>
        </div>
      </div>
      ${ballBeltHtml}
    `;
  } else {
    // 探索模式：四象实景猎场热点 + 生态雷达扫描仪
    const sample = pool.slice(0, 3);
    const SPOT_SPOTS = [
      { spot: "bush", badge: "🌿 摇曳草丛", actionLabel: "潜行奇袭 (+8%捕获)", tone: "emerald" },
      { spot: "stream", badge: "💧 星辉浅滩", actionLabel: "声波探测 (+8%捕获)", tone: "cyan" },
      { spot: "crystal", badge: "💎 灵脉晶洞", actionLabel: "气味追踪 (+8%捕获)", tone: "gold" },
    ];
    const wanderersHtml = sample
      .map((p, idx) => {
        const caughtN = caughtMap && typeof caughtMap[p.id] === "number" ? caughtMap[p.id] : 0;
        const seen = caughtN > 0;
        const iconHtml = renderBeastIcon(p.dex, seen ? p.name : "未知灵兽", false);
        const meta = SPOT_SPOTS[idx % SPOT_SPOTS.length];
        return `
          <button type="button" class="capture-wanderer capture-wanderer--slot${idx} ${seen ? "" : "is-silhouette"}" data-stage-act="field-hunt" data-spot="${meta.spot}" title="点击直接潜行奇袭！触发遭遇并获得【先手奇袭：捕获率 +8%】">
            <span class="capture-wanderer__spark">${meta.badge}</span>
            <div class="capture-wanderer__art">${iconHtml}</div>
            <div class="capture-wanderer__tag">${seen ? escapeHtml(p.name) : "???? 未收录"}</div>
            <span class="capture-wanderer__sub">${meta.actionLabel}</span>
          </button>
        `;
      })
      .join("");

    const caughtInArea = pool.filter((p) => (caughtMap?.[p.id] || 0) > 0).length;

    centerHtml = `
      <div class="capture-stage-explore">
        <div class="capture-stage-explore__clearing">
          ${wanderersHtml || `<div class="camp-stage__emptyHint">当前生态区暂无灵兽出没</div>`}
          <button type="button" class="capture-wanderer capture-wanderer--altar" data-stage-act="field-hunt-plus" ${advOk ? "" : "disabled"} title="催动高阶星界灵脉阵，优先引出本区未收录/高稀有度萌灵！">
            <span class="capture-wanderer__spark">${renderResSvg("evolutionStone", 14)} 灵脉祭坛</span>
            <div class="capture-wanderer__altarOrb">${renderResSvg("megaStone", 46)}</div>
            <div class="capture-wanderer__tag">高级定向寻踪</div>
            <span class="capture-wanderer__sub">充能 ${advCharges}/${advMaxCharges} · 优先未收录</span>
          </button>
        </div>
        <div class="capture-stage-explore__hud">
          <div class="capture-radar-head">
            <svg class="capture-radar-svg" viewBox="0 0 64 64" aria-hidden="true">
              <circle cx="32" cy="32" r="28" fill="rgba(6, 78, 59, 0.45)" stroke="rgba(74, 222, 128, 0.55)" stroke-width="1.5"/>
              <circle cx="32" cy="32" r="18" fill="none" stroke="rgba(74, 222, 128, 0.3)" stroke-width="1" stroke-dasharray="3 3"/>
              <line x1="32" y1="4" x2="32" y2="60" stroke="rgba(74, 222, 128, 0.25)" stroke-width="1"/>
              <line x1="4" y1="32" x2="60" y2="32" stroke="rgba(74, 222, 128, 0.25)" stroke-width="1"/>
              <path class="capture-radar-sweep" d="M32 32 L32 4 A28 28 0 0 1 56 18 Z" fill="rgba(74, 222, 128, 0.32)"/>
              <circle cx="22" cy="20" r="2.5" fill="#fde047"/>
              <circle cx="44" cy="26" r="2.5" fill="#4ade80"/>
              <circle cx="26" cy="44" r="2.2" fill="#38bdf8"/>
            </svg>
            <div>
              <div class="tab-stage__eyebrow">📡 秘境生态雷达扫描中 · 已收录 ${caughtInArea}/${pool.length} 种</div>
              <div class="tab-stage__title">${escapeHtml(area.name)}</div>
            </div>
          </div>
          <div class="tab-stage__desc">点击左侧 <strong>草丛 / 浅滩 / 晶洞</strong> 可直接潜行奇袭（先手捕获率 +8%），或使用下方寻踪按钮搜索灵兽。</div>
          <div class="tab-stage__ctaRow">
            <button type="button" class="btn btn--primary btn--small" data-stage-act="field-hunt" ${encOk ? "" : "disabled"}>⚡ 潜行寻踪 (${encCharges}/100)</button>
            <button type="button" class="btn btn--small" data-stage-act="field-hunt-plus" ${advOk ? "" : "disabled"}>🌟 灵脉高阶寻踪 (${advCharges}/${advMaxCharges})</button>
          </div>
        </div>
      </div>
      ${ballBeltHtml}
    `;
  }

  const luckyBadge = lucky?.type ? `今日幸运：${escapeHtml(typeZh(lucky.type))}系` : "星野猎场";
  const streakBadge = streak > 0 ? ` · 连捕 ×${streak}` : "";

  return `
    <div class="tab-stage tab-stage--capture tab-stage--biome-${escapeHtml(biomeId)}" aria-label="九域生态实景猎场">
      <div class="tab-stage__artWrap">
        <img class="tab-stage__bgImg" src="./assets/ui/stage_capture.jpg" alt="" loading="eager" decoding="sync" onerror="this.style.display='none'" />
        <div class="tab-stage__aura tab-stage__aura--biome"></div>
        ${renderSparksSvg("#4ade80", "#fde047")}
      </div>
      <div class="tab-stage__header">
        <span class="camp-stage__badge">🧭 ${escapeHtml(area.name)} · 实景生态猎场与缩圈捕猎剧场</span>
        <span class="camp-stage__sub">${luckyBadge}${streakBadge} · 灵球 ${pbVal} · 高级灵球 ${ubVal}</span>
      </div>
      ${biomeRibbonHtml}
      <div class="tab-stage__body">
        ${centerHtml}
      </div>
    </div>
  `;
}

/** 3. 萌灵页：「首席灵兽星阵检阅台」 */
export function renderMonsStageHtml({
  list,
  evoReadyCount,
  hungryCount,
  skillReadyCount,
  renderBeastIcon,
  monPower,
  escapeHtml,
}) {
  const topSquad = (list || [])
    .slice()
    .sort((a, b) => monPower(b) - monPower(a) || (b.isShiny ? 1 : 0) - (a.isShiny ? 1 : 0))
    .slice(0, 6);
  const squadPower = topSquad.reduce((acc, m) => acc + monPower(m), 0);

  const slotsHtml = topSquad.length
    ? topSquad
        .map((m, idx) => {
          const sat = Math.max(0, Math.min(100, Math.ceil(typeof m.satiety === "number" ? m.satiety : 100)));
          const aff = Math.max(0, Math.min(100, Math.floor(typeof m.affection === "number" ? m.affection : 0)));
          return `
            <div class="squad-pedestal squad-pedestal--slot${idx} ${m.isShiny ? "is-shiny" : ""}">
              <button type="button" class="squad-pedestal__mainBtn" data-mon-open="${m.id}" title="点击查看 ${escapeHtml(m.name)} 详情">
                <div class="squad-pedestal__art">${renderBeastIcon(m.dex, m.name, Boolean(m.isShiny))}</div>
                <div class="squad-pedestal__name">${escapeHtml(m.name)}${m.isShiny ? " ✨" : ""}</div>
                <div class="squad-pedestal__meta">Lv.${m.lvl} · 战力 ${monPower(m)} · 💖${aff}</div>
                <div class="squad-pedestal__sat"><span style="width:${sat}%"></span></div>
              </button>
              <div class="squad-pedestal__actions">
                <button type="button" class="squad-micro-btn" data-stage-act="mon-pet" data-mon-id="${m.id}" title="抚摸互动（亲密度 +2）">💖 抚摸</button>
              </div>
            </div>
          `;
        })
        .join("")
    : `<div class="camp-stage__emptyHint">尚未捕获灵兽 — 前往【捕捉】页结识你的第一只星野伙伴吧！</div>`;

  return `
    <div class="tab-stage tab-stage--mons" aria-label="首席灵兽星阵检阅台">
      <div class="tab-stage__artWrap">
        <img class="tab-stage__bgImg" src="./assets/ui/stage_sanctuary.jpg" alt="" loading="eager" decoding="sync" onerror="this.style.display='none'" />
        <div class="tab-stage__aura tab-stage__aura--gold"></div>
        ${renderSparksSvg("#fde047", "#34d399")}
      </div>
      <div class="tab-stage__header">
        <span class="camp-stage__badge">👑 首席灵兽星阵 · 主力战力 ${squadPower}</span>
        <span class="camp-stage__sub">灵兽盒共 ${list.length} 只 · 技能就绪 ${skillReadyCount} · 可进化 ${evoReadyCount}</span>
      </div>
      <div class="tab-stage__body tab-stage__body--squad">
        ${slotsHtml}
      </div>
    </div>
  `;
}

/** 4. 功能页：「育灵圣域三联实景台（训练 · 孵蛋 · 远征）」 */
export function renderFunctionsStageHtml({
  state,
  activeTrain,
  slotSize,
  renderBeastIcon,
  fmtDuration,
  escapeHtml,
}) {
  // 1) Training Diorama
  const trainSamples = (activeTrain || []).slice(0, 3);
  const trainIcons = trainSamples.length
    ? trainSamples.map((m) => `<div class="diorama-mini-mon">${renderBeastIcon(m.dex, m.name, Boolean(m.isShiny))}<span>Lv.${m.lvl}</span></div>`).join("")
    : `<div class="diorama-empty">⚔️ 暂无受训灵兽</div>`;

  // 2) Breeding Diorama
  const breedLvl = Math.max(0, Math.floor(state.buildings?.breedingHouse?.owned ?? 0));
  const eggOn = Boolean(state.breeding?.on) && (state.breeding?.eggRemainingSec ?? 0) > 0;
  const eggRem = eggOn ? Math.max(0, state.breeding.eggRemainingSec) : 0;
  const eggTotal = eggOn && (state.breeding?.eggTotalSec ?? 0) > 0 ? state.breeding.eggTotalSec : 900;
  const eggPct = eggOn ? Math.max(4, Math.min(99, Math.round(((eggTotal - eggRem) / eggTotal) * 100))) : 0;

  // 3) Expedition Diorama
  const expLvl = Math.max(0, Math.floor(state.buildings?.expeditionPost?.owned ?? 0));
  const expOn = Boolean(state.expedition?.on) && (state.expedition?.remainingSec ?? 0) > 0;
  const expRem = expOn ? Math.max(0, state.expedition.remainingSec) : 0;
  const list = state.mons?.list ?? [];
  const expMons = Array.isArray(state.expedition?.activeIds)
    ? state.expedition.activeIds.map((id) => list.find((m) => m && m.id === id)).filter(Boolean).slice(0, 3)
    : [];
  const expIcons = expMons.length
    ? expMons.map((m) => `<div class="diorama-mini-mon">${renderBeastIcon(m.dex, m.name, Boolean(m.isShiny))}</div>`).join("")
    : `<div class="diorama-empty">🗺️ 远征门待命</div>`;

  return `
    <div class="tab-stage tab-stage--functions" aria-label="育灵圣域三联实景台">
      <div class="tab-stage__artWrap">
        <img class="tab-stage__bgImg" src="./assets/ui/stage_sanctuary.jpg" alt="" loading="eager" decoding="sync" onerror="this.style.display='none'" />
        <div class="tab-stage__aura tab-stage__aura--emerald"></div>
        ${renderSparksSvg("#34d399", "#fde047")}
      </div>
      <div class="tab-stage__header">
        <span class="camp-stage__badge">🏛️ 育灵圣域三联实景台 · 训练 / 繁育 / 远征</span>
        <span class="camp-stage__sub">离线挂机全自动结算经验、灵蛋孵化与次元远征战利品</span>
      </div>
      <div class="tab-stage__body tab-stage__body--triptych">
        <div class="stage-scene-actors stage-scene-actors--triptych">
          <div class="scene-actor-group">${trainIcons}</div>
          <div class="scene-actor-group">
            <button type="button" class="spirit-egg-visual spirit-egg-visual--btn ${eggOn ? "is-hatching" : ""}" data-stage-act="egg-warm" title="点击温养灵蛋（每次孵化耗时 -5秒）">
              ${renderResSvg("luckyEgg", 62)}
            </button>
          </div>
          <div class="scene-actor-group">${expIcons}</div>
        </div>
        <div class="sanctuary-diorama">
          <div class="sanctuary-diorama__head">
            <span class="sanctuary-diorama__title">${renderBuildingSvg("trainingGround", 20)} 灵兽训练场</span>
            <span class="badge">${activeTrain.length}/${slotSize} 槽</span>
          </div>
          <div class="sanctuary-diorama__foot">
            <span>${slotSize > 0 ? "受训灵兽经验获取 ×10" : "建造「训练场」后开启"}</span>
            <button type="button" class="btn btn--small sanctuary-diorama__btn" data-stage-act="train-cheer">${renderUiIcon("tab_pve", 14)} 擂鼓助威</button>
          </div>
        </div>

        <div class="sanctuary-diorama">
          <div class="sanctuary-diorama__head">
            <span class="sanctuary-diorama__title">${renderBuildingSvg("breedingHouse", 20)} 星露育灵屋</span>
            <span class="badge ${eggOn ? "badge--ok" : ""}">${eggOn ? `孵化 ${eggPct}%` : breedLvl > 0 ? `Lv.${breedLvl}` : "未建造"}</span>
          </div>
          <div class="sanctuary-diorama__foot">
            <span>${eggOn ? `剩余 ${escapeHtml(fmtDuration(eggRem))}` : breedLvl > 0 ? "双亲配对继承高个体值" : "建造「育灵屋」后开启"}</span>
            <button type="button" class="btn btn--small sanctuary-diorama__btn" data-stage-act="egg-warm">${renderResSvg("luckyEgg", 14)} 灵温抚育</button>
          </div>
        </div>

        <div class="sanctuary-diorama">
          <div class="sanctuary-diorama__head">
            <span class="sanctuary-diorama__title">${renderBuildingSvg("expeditionPost", 20)} 次元远征门</span>
            <span class="badge ${expOn ? "badge--ok" : ""}">${expOn ? "远征中" : expLvl > 0 ? `Lv.${expLvl}` : "未建造"}</span>
          </div>
          <div class="sanctuary-diorama__foot">
            <span>${expOn ? `归来剩余 ${escapeHtml(fmtDuration(expRem))}` : expLvl > 0 ? "派遣编队赢取未来币与经验" : "建造「远征所」后开启"}</span>
            <button type="button" class="btn btn--small sanctuary-diorama__btn" data-stage-act="exp-boost">${renderUiIcon("tab_capture", 14)} 星门共鸣</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

/** 5. 商店与合成页：「星辉奇珍炼金坊」 */
export function renderFutureStageHtml({
  state,
  fmt,
  claimedDailyFree,
  claimedDailySpin,
}) {
  const fc = Math.max(0, Math.floor(state.res?.futurecoin?.value ?? 0));
  const essence = Math.max(0, Math.floor(state.res?.essence?.value ?? 0));
  const catnip = Math.max(0, Math.floor(state.res?.catnip?.value ?? 0));
  const wood = Math.max(0, Math.floor(state.res?.wood?.value ?? 0));

  return `
    <div class="tab-stage tab-stage--future" aria-label="星辉奇珍炼金坊">
      <div class="tab-stage__artWrap">
        <img class="tab-stage__bgImg" src="./assets/ui/stage_bazaar.jpg" alt="" loading="eager" decoding="sync" onerror="this.style.display='none'" />
        <div class="tab-stage__aura tab-stage__aura--gold"></div>
        ${renderSparksSvg("#fde047", "#c084fc")}
      </div>
      <div class="tab-stage__header">
        <span class="camp-stage__badge">🏺 星辉奇珍炼金坊 · 贸易与奇物合成</span>
        <span class="camp-stage__sub">灵果 / 灵木可兑换未来币 · 每日星盘免费抽取奇珍</span>
      </div>
      <div class="tab-stage__body tab-stage__body--bazaar">
        <div class="bazaar-vault">
          <div class="bazaar-vault__item">
            <span class="bazaar-vault__label">${renderResSvg("futurecoin", 16)} 未来币储备</span>
            <span class="bazaar-vault__val">${fmt(fc)}</span>
          </div>
          <div class="bazaar-vault__item">
            <span class="bazaar-vault__label">${renderResSvg("minerals", 16)} 轮回灵珀</span>
            <span class="bazaar-vault__val">${fmt(essence)}</span>
          </div>
          <div class="bazaar-vault__item">
            <span class="bazaar-vault__label">${renderResSvg("catnip", 16)} 灵果库存</span>
            <span class="bazaar-vault__val">${fmt(catnip)}</span>
          </div>
          <div class="bazaar-vault__item">
            <span class="bazaar-vault__label">${renderResSvg("wood", 16)} 灵木库存</span>
            <span class="bazaar-vault__val">${fmt(wood)}</span>
          </div>
        </div>
        <div class="bazaar-wheel-actions">
          <div class="bazaar-cauldron-row">
            <button type="button" class="btn btn--small" data-stage-act="cauldron-transmute" data-res="catnip" title="投入 1000 灵果凝练 1 未来币">⚗️ 灵果炼金</button>
            <button type="button" class="btn btn--small" data-stage-act="cauldron-transmute" data-res="wood" title="投入 500 灵木凝练 1 未来币">⚗️ 灵木炼金</button>
          </div>
          <button type="button" class="btn btn--primary btn--small" data-fc-daily-free ${claimedDailyFree ? "disabled" : ""}>
            ${claimedDailyFree ? "✓ 今日免费币已领" : "🎁 领每日 +5 未来币"}
          </button>
          <button type="button" class="btn btn--small" data-fc-daily-spin ${claimedDailySpin ? "disabled" : ""}>
            ${claimedDailySpin ? "✓ 今日幸运转盘已转" : "🎡 免费转幸运星盘"}
          </button>
        </div>
      </div>
    </div>
  `;
}

/** 6. 图鉴页：「《星野灵兽录》万灵星图殿堂」 */
export function renderDexStageHtml({
  state,
  defs,
  unique,
  totalSpecies,
  dexPct,
  shinyUnique,
  dexEff,
  gallery,
  renderBeastIcon,
  escapeHtml,
}) {
  const dash = Math.round((dexPct / 100) * 264);
  const caughtMap = state.dex?.caught || {};
  const crownPets =
    gallery && gallery.length > 0
      ? gallery.slice(0, 4).map((g) => ({ dex: g.dex, name: g.name, isShiny: true }))
      : (defs.beasts || [])
          .filter((p) => (caughtMap[p.id] || 0) > 0)
          .slice(-4)
          .map((p) => ({ dex: p.dex, name: p.name, isShiny: false }));

  const pedestalsHtml = crownPets.length
    ? crownPets
        .map(
          (p) => `
          <div class="dex-stage-pedestal">
            <div class="dex-stage-pedestal__art">${renderBeastIcon(p.dex, p.name, p.isShiny)}</div>
            <div class="dex-stage-pedestal__name">${escapeHtml(p.name)}${p.isShiny ? " ★" : ""}</div>
          </div>
        `,
        )
        .join("")
    : `<div class="camp-stage__emptyHint">捕捉灵兽点亮星图后，镇馆灵兽将陈列于此</div>`;

  return `
    <div class="tab-stage tab-stage--dex" aria-label="星野灵兽录万灵星图殿堂">
      <div class="tab-stage__artWrap">
        <img class="tab-stage__bgImg" src="./assets/ui/stage_science.jpg" alt="" loading="eager" decoding="sync" onerror="this.style.display='none'" />
        <div class="tab-stage__aura tab-stage__aura--violet"></div>
        ${renderSparksSvg("#fde047", "#a78bfa")}
      </div>
      <div class="tab-stage__header">
        <span class="camp-stage__badge">📜 《星野灵兽录》万灵星图殿堂</span>
        <span class="camp-stage__sub">图鉴加成：灵果 ×${dexEff.catnipPerSecMul.toFixed(2)} · 灵木 ×${dexEff.woodRateMul.toFixed(2)} · 灵晶 ×${dexEff.mineralsRateMul.toFixed(2)}</span>
      </div>
      <div class="tab-stage__body tab-stage__body--dex">
        <div class="science-astrolabe">
          <svg class="science-astrolabe__svg" viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="42" fill="rgba(11,15,25,0.75)" stroke="rgba(167,139,250,0.28)" stroke-width="4" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="#facc15" stroke-width="4.5" stroke-linecap="round"
              stroke-dasharray="${dash} 264" transform="rotate(-90 50 50)" />
          </svg>
          <div class="science-astrolabe__core">
            <div class="science-astrolabe__pct">${dexPct}%</div>
            <div class="science-astrolabe__label">${unique}/${totalSpecies}</div>
          </div>
        </div>
        <div class="tab-stage__focal">
          <div class="tab-stage__eyebrow">✨ 已收录 ${unique} / ${totalSpecies} 种星野灵兽 · 闪光珍藏 ${shinyUnique} 种</div>
          <div class="tab-stage__title">星野生态全图鉴</div>
          <div class="tab-stage__desc">每收录一种新灵兽都会永久提升营地全资源产出效率；集齐区域全图鉴还可领取额外未来币悬赏。</div>
        </div>
        <div class="dex-stage-pedestals">
          ${pedestalsHtml}
        </div>
      </div>
    </div>
  `;
}

/** 7. 挑战页（PvE）：「星穹试炼竞技场 · 实景对决台」 */
export function renderPveStageHtml({
  chapter,
  stage,
  teamMons,
  tower,
  towerDone,
  TYPE_ZH,
  renderBeastIcon,
  monPower,
  estimateStageEnemyPower,
  recommendedTypes,
  escapeHtml,
}) {
  const allies = (teamMons || []).slice(0, 3);
  const enemies = (stage?.enemies || []).slice(0, 3);
  const allyPower = (teamMons || []).reduce((acc, m) => acc + monPower(m), 0);
  const enemyPower = stage ? estimateStageEnemyPower(stage) : 0;
  const recTypes = stage?.type ? recommendedTypes(stage.type) : [];
  const recHtml = recTypes
    .map((t) => `<span class="badge type type-${escapeHtml(t)}">${escapeHtml(TYPE_ZH?.[t] || t)}</span>`)
    .join("");

  const alliesHtml = allies.length
    ? allies
        .map(
          (m) => `
          <div class="arena-fighter arena-fighter--ally">
            <div class="arena-fighter__art">${renderBeastIcon(m.dex, m.name, Boolean(m.isShiny))}</div>
            <div class="arena-fighter__tag">${escapeHtml(m.name)} Lv.${m.lvl}</div>
          </div>
        `,
        )
        .join("")
    : `<div class="diorama-empty">先在下方勾选出战阵容</div>`;

  const enemiesHtml = enemies.length
    ? enemies
        .map(
          (e) => `
          <div class="arena-fighter arena-fighter--enemy">
            <div class="arena-fighter__art">${renderBeastIcon(e.dex || 1, e.name || "守关灵兽", false)}</div>
            <div class="arena-fighter__tag">${escapeHtml(e.name || "守关灵兽")} Lv.${e.lvl || stage?.recLvl || 1}</div>
          </div>
        `,
        )
        .join("")
    : `<div class="diorama-empty">选择关卡查看守关首领</div>`;

  return `
    <div class="tab-stage tab-stage--pve" aria-label="星穹试炼竞技场">
      <div class="tab-stage__artWrap">
        <img class="tab-stage__bgImg" src="./assets/ui/stage_arena.jpg" alt="" loading="eager" decoding="sync" onerror="this.style.display='none'" />
        <div class="tab-stage__aura tab-stage__aura--arena"></div>
        ${renderSparksSvg("#f87171", "#fde047")}
      </div>
      <div class="tab-stage__header">
        <span class="camp-stage__badge">⚔️ 星穹试炼竞技场 · ${escapeHtml(chapter?.name || "试炼巡礼")}</span>
        <span class="camp-stage__sub">🗼 每周试炼塔：${towerDone ? "已通关" : `第 ${tower?.floor || 1} 层`} · 最佳 ${tower?.best || 0}F</span>
      </div>
      <div class="tab-stage__body tab-stage__body--arena">
        <div class="arena-side arena-side--ally">
          <div class="arena-side__title">🛡️ 我方先锋 · 战力 ${allyPower}</div>
          <div class="arena-side__fighters">${alliesHtml}</div>
        </div>
        <div class="arena-vs">
          <button type="button" class="arena-vs__badge arena-vs__badge--btn" data-stage-act="pve-quick-fight" title="点击立即发起试炼对决！">⚔️ 开战</button>
          <div class="arena-vs__stage">${escapeHtml(stage?.name || "选择关卡")}</div>
          ${recHtml ? `<div class="arena-vs__rec">推荐克制：${recHtml}</div>` : ""}
        </div>
        <div class="arena-side arena-side--enemy">
          <div class="arena-side__title">🔥 守关阵容 · 预估 ${enemyPower}</div>
          <div class="arena-side__fighters">${enemiesHtml}</div>
        </div>
      </div>
    </div>
  `;
}

/** 8. 道具页：「星辉百宝囊与炼金陈列柜」 */
export function renderItemsStageHtml({ state, care }) {
  const res = state.res || {};
  const countKeys = (keys) => keys.reduce((acc, k) => acc + Math.max(0, Math.floor(res[k]?.value ?? 0)), 0);
  const ballTotal = countKeys(["pokeball", "ultraball", "quickball", "luxuryball", "netball", "duskball", "masterball"]);
  const foodTotal = countKeys(["bigBerry", "hugeBerry", "rareCandy", "expCandyS", "expCandy", "expCandyL", "expCandyXL", "affectionTreat"]);
  const potionTotal = countKeys(["hpPotion", "atkPotion", "defPotion", "spaPotion", "spdPotion", "spePotion"]);
  const relicTotal = countKeys(["evolutionStone", "evolutionEnergy", "linkRope", "megaStone", "shinyCharm", "luckyEgg", "bottleCap", "goldBottleCap"]);

  return `
    <div class="tab-stage tab-stage--items" aria-label="星辉百宝囊与炼金陈列柜">
      <div class="tab-stage__artWrap">
        <img class="tab-stage__bgImg" src="./assets/ui/stage_bazaar.jpg" alt="" loading="eager" decoding="sync" onerror="this.style.display='none'" />
        <div class="tab-stage__aura tab-stage__aura--gold"></div>
        ${renderSparksSvg("#fde047", "#67e8f9")}
      </div>
      <div class="tab-stage__header">
        <span class="camp-stage__badge">🎒 星辉百宝囊 · 炼金奇物陈列柜</span>
        <span class="camp-stage__sub">今日护理进度：${Math.min(care.uses || 0, care.goal || 3)}/${care.goal || 3} 次 ${care.done ? "（已达成）" : "（达成可领 +8 未来币）"}</span>
      </div>
      <div class="tab-stage__body tab-stage__body--bazaar">
        <div class="bazaar-vault">
          <div class="bazaar-vault__item">
            <span class="bazaar-vault__label">${renderOrbSvg("pokeball", 16)} 灵球匣总计</span>
            <span class="bazaar-vault__val">${ballTotal}</span>
          </div>
          <div class="bazaar-vault__item">
            <span class="bazaar-vault__label">${renderResSvg("catnip", 16)} 灵果与糖丸</span>
            <span class="bazaar-vault__val">${foodTotal}</span>
          </div>
          <div class="bazaar-vault__item">
            <span class="bazaar-vault__label">${renderResSvg("science", 16)} 六维强化秘药</span>
            <span class="bazaar-vault__val">${potionTotal}</span>
          </div>
          <div class="bazaar-vault__item">
            <span class="bazaar-vault__label">${renderResSvg("minerals", 16)} 灵石与奇珍</span>
            <span class="bazaar-vault__val">${relicTotal}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

/** 9. 社交页：「星野演武会馆」 */
export function renderSocialStageHtml({ state, selectedTeam, renderBeastIcon, escapeHtml }) {
  const list = state?.mons?.list ?? [];
  const previewMons = (selectedTeam && selectedTeam.length ? selectedTeam : list.slice(0, 3)).slice(0, 3);
  const myIcons = previewMons.length
    ? previewMons
        .map(
          (m) => `
          <div class="arena-fighter arena-fighter--ally">
            <div class="arena-fighter__art">${renderBeastIcon(m.dex || 1, m.name || "灵兽", Boolean(m.isShiny))}</div>
            <div class="arena-fighter__tag">${escapeHtml(m.name || "灵兽")} Lv.${m.level || m.lvl || 1}</div>
          </div>
        `,
        )
        .join("")
    : `<div class="diorama-empty">选择队伍后在此列阵</div>`;

  const rivalDexes = [
    { dex: 26, name: "雷鼓天貂" },
    { dex: 6, name: "焚天煌龙" },
    { dex: 149, name: "天穹皇龙" },
  ];
  const rivalIcons = rivalDexes
    .map(
      (r) => `
      <div class="arena-fighter arena-fighter--enemy">
        <div class="arena-fighter__art">${renderBeastIcon(r.dex, r.name, false)}</div>
        <div class="arena-fighter__tag">${escapeHtml(r.name)}</div>
      </div>
    `,
    )
    .join("");

  return `
    <div class="tab-stage tab-stage--social" aria-label="星野演武会馆">
      <div class="tab-stage__artWrap">
        <img class="tab-stage__bgImg" src="./assets/ui/stage_arena.jpg" alt="" loading="eager" decoding="sync" onerror="this.style.display='none'" />
        <div class="tab-stage__aura tab-stage__aura--violet"></div>
        ${renderSparksSvg("#fde047", "#38bdf8")}
      </div>
      <div class="tab-stage__header">
        <span class="camp-stage__badge">🏮 星野演武会馆 · 离线宗师切磋与云端好友约战</span>
        <span class="camp-stage__sub">无需登录即可挑战 5 位星野馆主赢取每周未来币</span>
      </div>
      <div class="tab-stage__body tab-stage__body--arena">
        <div class="arena-side arena-side--ally">
          <div class="arena-side__title">🛡️ 我的演武编队</div>
          <div class="arena-side__fighters">${myIcons}</div>
        </div>
        <div class="arena-vs">
          <div class="arena-vs__badge">切磋</div>
          <div class="arena-vs__stage">演武擂台</div>
        </div>
        <div class="arena-side arena-side--enemy">
          <div class="arena-side__title">👑 馆主王牌灵兽</div>
          <div class="arena-side__fighters">${rivalIcons}</div>
        </div>
      </div>
    </div>
  `;
}

/** 10. 排行榜页：「星穹名人堂 · 荣耀圣坛」 */
export function renderLeaderboardStageHtml({
  ui,
  dexNow,
  teamNow,
  totalPowerNow,
  shinyNow,
  topMons,
  renderBeastIcon,
  escapeHtml,
}) {
  const podium = (topMons || []).slice(0, 3);
  const podiumHtml = podium.length
    ? podium
        .map(
          (m, idx) => `
          <div class="arena-fighter arena-fighter--ally">
            <div class="arena-fighter__art">${renderBeastIcon(m.dex, m.name, Boolean(m.isShiny))}</div>
            <div class="arena-fighter__tag">#${idx + 1} ${escapeHtml(m.name)}</div>
          </div>
        `,
        )
        .join("")
    : `<div class="diorama-empty">捕捉灵兽后登上个人荣耀台</div>`;

  return `
    <div class="tab-stage tab-stage--leaderboard" aria-label="星穹名人堂">
      <div class="tab-stage__artWrap">
        <img class="tab-stage__bgImg" src="./assets/ui/stage_arena.jpg" alt="" loading="eager" decoding="sync" onerror="this.style.display='none'" />
        <div class="tab-stage__aura tab-stage__aura--gold"></div>
        ${renderSparksSvg("#fde047", "#f59e0b")}
      </div>
      <div class="tab-stage__header">
        <span class="camp-stage__badge">🏆 星穹名人堂 · 全服育灵师荣耀圣坛</span>
        <span class="camp-stage__sub">100% 真实玩家提交成绩 · 绝无虚假机器人垫场</span>
      </div>
      <div class="tab-stage__body tab-stage__body--arena">
        <div class="tab-stage__focal">
          <div class="tab-stage__eyebrow">🪪 我的育灵师荣耀名片 · ${escapeHtml(ui.lbName || "星野育灵师")}</div>
          <div class="tab-stage__title">主力战力 ${teamNow} · 图鉴 ${dexNow}/160</div>
          <div class="tab-stage__pills">
            <span class="tab-stage__pill tab-stage__pill--gold">⚔️ 总战力 ${totalPowerNow}</span>
            <span class="tab-stage__pill">✨ 闪光收藏 ${shinyNow}</span>
            <span class="tab-stage__pill">📜 图鉴进度 ${Math.round((dexNow / 160) * 100)}%</span>
          </div>
        </div>
        <div class="arena-side arena-side--ally">
          <div class="arena-side__title">👑 我的三甲王牌伙伴</div>
          <div class="arena-side__fighters">${podiumHtml}</div>
        </div>
      </div>
    </div>
  `;
}

/** 11. 帮助页：「星野冒险百科图卷」 */
export function renderHelpStageHtml({ nextGoal, dexPct, escapeHtml }) {
  return `
    <div class="tab-stage tab-stage--help" aria-label="星野冒险百科图卷">
      <div class="tab-stage__artWrap">
        <img class="tab-stage__bgImg" src="./assets/ui/stage_science.jpg" alt="" loading="eager" decoding="sync" onerror="this.style.display='none'" />
        <div class="tab-stage__aura tab-stage__aura--cyan"></div>
        ${renderSparksSvg("#fde047", "#38bdf8")}
      </div>
      <div class="tab-stage__header">
        <span class="camp-stage__badge">📖 星野冒险百科图卷 · 育灵师指南</span>
        <span class="camp-stage__sub">图鉴完成度 ${dexPct}% · 随时查阅生态克制与时代主线</span>
      </div>
      <div class="tab-stage__body">
        <div class="tab-stage__focal">
          <div class="tab-stage__eyebrow">🧭 当前冒险罗盘指引</div>
          <div class="tab-stage__title">${escapeHtml(nextGoal || "继续采集、研究与捕捉循环")}</div>
          <div class="tab-stage__desc">完成下方「今日下一目标」三项日常活跃清单，每天可额外领取 +12 未来币奖励。</div>
        </div>
      </div>
    </div>
  `;
}
