// tab_stages.js — 全页面沉浸式全景视觉舞台引擎（v0.4.0）
// 让每一个主面板（研究、捕捉、萌灵、功能、商店、图鉴、挑战、道具、社交、排行榜、帮助、设置）
// 都拥有与「篝火主页」同等级别的 16:9 手绘场景原画 + 动态 SVG 光效 + 实时数据交互舞台。

import { pad3 } from "../utils.js";

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
    const newRows = containerEl.querySelector(":scope > .tab-stage-rows");
    if (newRows) newRows.__lastHtml = restHtml;
    return;
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

/** 2. 捕捉页：「九域生态实景猎场」 */
export function renderCaptureStageHtml({
  state,
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
  const BIOME_ICONS = {
    meadow: "🌿",
    forest: "🌲",
    lake: "💧",
    cave: "🪨",
    desert: "🏜️",
    peak: "⛰️",
    tundra: "❄️",
    volcano: "🌋",
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
      </div>`
    : "";

  let centerHtml = "";
  if (enc) {
    const tierText = enc.tier === "common" ? "常见" : enc.tier === "uncommon" ? "少见" : enc.tier === "rare" ? "稀有" : "史诗";
    const typeBadges = (encTypes || [])
      .map((t) => `<span class="badge type type-${escapeHtml(t)}">${escapeHtml(typeZh(t))}</span>`)
      .join("");
    const pct = Math.round((effChance || 0) * 100);
    centerHtml = `
      <div class="capture-stage-encounter">
        <div class="capture-stage-encounter__pedestal ${encIsShiny ? "is-shiny" : ""} ${encIsMythic ? "is-mythic" : ""}">
          <div class="capture-stage-encounter__ring"></div>
          <div class="capture-stage-encounter__art">${renderBeastIcon(enc.dex, enc.name, encIsShiny)}</div>
          <div class="capture-stage-encounter__tag">${encIsShiny ? "★ 闪光现身" : encIsMythic ? "✦ 幻灵降临" : `No.${pad3(enc.order || enc.dex)}`}</div>
        </div>
        <div class="capture-stage-encounter__hud">
          <div class="tab-stage__eyebrow">🎯 野外实景遭遇 · ${escapeHtml(area.name)}</div>
          <div class="tab-stage__title">
            ${escapeHtml(enc.name)}
            ${enc.title ? `<span class="beast-title-tag">【${escapeHtml(enc.title)}】</span>` : ""}
            <span class="badge">${tierText}</span>
            ${typeBadges}
          </div>
          <div class="tab-stage__desc">${escapeHtml(enc.desc || "栖息于秘境深处的奇异灵兽。")}</div>
          <div class="tab-stage__pills">
            <span class="tab-stage__pill tab-stage__pill--gold">🎯 捕获成功率 ${pct}%</span>
            <span class="tab-stage__pill">🛡️ 保底加成 +${Math.round((pity2 || 0) * 100)}%</span>
            <span class="tab-stage__pill">🔴 灵球库存 ${pbVal}</span>
          </div>
        </div>
        <div class="tab-stage__cta">
          <button type="button" class="btn btn--primary" data-capture-action="throw" ${throwOk ? "" : "disabled"}>🎯 投掷灵球</button>
          <button type="button" class="btn btn--small" data-stage-act="encounter-bait" title="消耗 15 灵果安抚野生灵兽，提升捕获率">🍓 投喂安抚</button>
          <button type="button" class="btn btn--small btn--ghost" data-capture-action="run">逃跑</button>
        </div>
      </div>
    `;
  } else {
    // Pick up to 3 habitat creatures to display wandering in the biome clearing
    const sample = pool.slice(0, 3);
    const wanderersHtml = sample
      .map((p, idx) => {
        const caughtN = caughtMap && typeof caughtMap[p.id] === "number" ? caughtMap[p.id] : 0;
        const seen = caughtN > 0;
        const iconHtml = renderBeastIcon(p.dex, seen ? p.name : "未知灵兽", false);
        return `
          <button type="button" class="capture-wanderer capture-wanderer--slot${idx} ${seen ? "" : "is-silhouette"}" data-stage-act="bush-rustle" title="点击草丛直接扑击搜寻灵兽！">
            <span class="capture-wanderer__spark">🌿 扑击</span>
            <div class="capture-wanderer__art">${iconHtml}</div>
            <div class="capture-wanderer__tag">${seen ? escapeHtml(p.name) : "????"}</div>
          </button>
        `;
      })
      .join("");

    centerHtml = `
      <div class="capture-stage-explore">
        <div class="capture-stage-explore__clearing">
          ${wanderersHtml || `<div class="camp-stage__emptyHint">当前生态区暂无灵兽出没</div>`}
        </div>
        <div class="capture-stage-explore__hud">
          <div class="tab-stage__eyebrow">🌿 秘境探索待命 · 栖息物种 ${pool.length} 种</div>
          <div class="tab-stage__title">${escapeHtml(area.name)}</div>
          <div class="tab-stage__desc">消耗遭遇充能在秘境林间搜寻野生灵兽；集齐本区图鉴可解锁更高阶生态秘境。</div>
          <div class="tab-stage__ctaRow">
            <button type="button" class="btn btn--primary btn--small" data-capture-action="encounter" ${encOk ? "" : "disabled"}>🔍 搜寻灵兽 (${encCharges}/100)</button>
            <button type="button" class="btn btn--small" data-capture-action="encounterPlus" ${advOk ? "" : "disabled"}>✨ 高级搜寻 (${advCharges}/${advMaxCharges})</button>
          </div>
        </div>
      </div>
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
        <span class="camp-stage__badge">🧭 ${escapeHtml(area.name)} · 生态实景猎场</span>
        <span class="camp-stage__sub">${luckyBadge}${streakBadge} · 灵球 ${pbVal}</span>
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
                <button type="button" class="squad-micro-btn" data-stage-act="mon-feed" data-mon-id="${m.id}" title="直接投喂灵果（饱腹 +18）">🍓 喂食</button>
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
        <span class="camp-stage__sub">灵兽盒共 ${list.length} 只 · 技能就绪 ${skillReadyCount} · 可进化 ${evoReadyCount} · 饥饿 ${hungryCount}</span>
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
        <div class="sanctuary-diorama">
          <div class="sanctuary-diorama__head">
            <span class="sanctuary-diorama__title">⚔️ 灵兽训练场</span>
            <span class="badge">${activeTrain.length}/${slotSize} 槽</span>
          </div>
          <div class="sanctuary-diorama__stage">${trainIcons}</div>
          <div class="sanctuary-diorama__foot">
            <span>${slotSize > 0 ? "受训灵兽经验获取 ×10" : "建造「训练场」后开启"}</span>
            <button type="button" class="btn btn--small sanctuary-diorama__btn" data-stage-act="train-cheer">🥁 擂鼓助威</button>
          </div>
        </div>

        <div class="sanctuary-diorama">
          <div class="sanctuary-diorama__head">
            <span class="sanctuary-diorama__title">🥚 星露育灵屋</span>
            <span class="badge ${eggOn ? "badge--ok" : ""}">${eggOn ? `孵化 ${eggPct}%` : breedLvl > 0 ? `Lv.${breedLvl}` : "未建造"}</span>
          </div>
          <div class="sanctuary-diorama__stage">
            <button type="button" class="spirit-egg-visual spirit-egg-visual--btn ${eggOn ? "is-hatching" : ""}" data-stage-act="egg-warm" title="点击温养灵蛋（每次孵化耗时 -5秒）">
              <svg viewBox="0 0 64 64" width="52" height="52" aria-hidden="true">
                <defs>
                  <radialGradient id="eggGlow" cx="45%" cy="38%" r="58%">
                    <stop offset="0%" stop-color="#fef08a" />
                    <stop offset="55%" stop-color="#f59e0b" />
                    <stop offset="100%" stop-color="#7c2d12" />
                  </radialGradient>
                </defs>
                <ellipse cx="32" cy="54" rx="18" ry="5" fill="rgba(250,204,21,0.28)" />
                <path d="M32 8 C19 8 14 26 14 39 C14 50 22 56 32 56 C42 56 50 50 50 39 C50 26 45 8 32 8 Z" fill="url(#eggGlow)" stroke="#fde047" stroke-width="2" />
                <circle cx="26" cy="26" r="3" fill="#fffbeb" opacity="0.85" />
                <circle cx="38" cy="36" r="2.2" fill="#fffbeb" opacity="0.7" />
              </svg>
            </button>
          </div>
          <div class="sanctuary-diorama__foot">
            <span>${eggOn ? `剩余 ${escapeHtml(fmtDuration(eggRem))}` : breedLvl > 0 ? "双亲配对继承高个体值" : "建造「育灵屋」后开启"}</span>
            <button type="button" class="btn btn--small sanctuary-diorama__btn" data-stage-act="egg-warm">🥚 灵温抚育</button>
          </div>
        </div>

        <div class="sanctuary-diorama">
          <div class="sanctuary-diorama__head">
            <span class="sanctuary-diorama__title">🗺️ 次元远征门</span>
            <span class="badge ${expOn ? "badge--ok" : ""}">${expOn ? "远征中" : expLvl > 0 ? `Lv.${expLvl}` : "未建造"}</span>
          </div>
          <div class="sanctuary-diorama__stage">${expIcons}</div>
          <div class="sanctuary-diorama__foot">
            <span>${expOn ? `归来剩余 ${escapeHtml(fmtDuration(expRem))}` : expLvl > 0 ? "派遣编队赢取未来币与经验" : "建造「远征所」后开启"}</span>
            <button type="button" class="btn btn--small sanctuary-diorama__btn" data-stage-act="exp-boost">🧭 星门共鸣</button>
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
            <span class="bazaar-vault__label">🪙 未来币储备</span>
            <span class="bazaar-vault__val">${fmt(fc)}</span>
          </div>
          <div class="bazaar-vault__item">
            <span class="bazaar-vault__label">🔮 轮回灵珀</span>
            <span class="bazaar-vault__val">${fmt(essence)}</span>
          </div>
          <div class="bazaar-vault__item">
            <span class="bazaar-vault__label">🍓 灵果库存</span>
            <span class="bazaar-vault__val">${fmt(catnip)}</span>
          </div>
          <div class="bazaar-vault__item">
            <span class="bazaar-vault__label">🪵 灵木库存</span>
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
            <span class="bazaar-vault__label">🔴 灵球匣总计</span>
            <span class="bazaar-vault__val">${ballTotal}</span>
          </div>
          <div class="bazaar-vault__item">
            <span class="bazaar-vault__label">🍬 灵果与糖丸</span>
            <span class="bazaar-vault__val">${foodTotal}</span>
          </div>
          <div class="bazaar-vault__item">
            <span class="bazaar-vault__label">🧪 六维强化秘药</span>
            <span class="bazaar-vault__val">${potionTotal}</span>
          </div>
          <div class="bazaar-vault__item">
            <span class="bazaar-vault__label">🔮 灵石与奇珍</span>
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
