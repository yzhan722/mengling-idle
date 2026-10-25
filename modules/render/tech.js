import { techReqHint } from "../tech_req_hint.js";
import { getTechStage, TECH_STAGE_LABELS, TECH_STAGE_ORDER } from "../tech_defs.js";
import { researchProgressTheater } from "../systems/gameplay_fun.js";
import { escapeHtml } from "../utils.js";
import { renderScienceStageHtml, setHtmlPreservingStage } from "./tab_stages.js";
import { renderTechSvg, renderResSvg } from "./rpg_svg_icons.js";

const TECH_PACING_BLURB =
  "研究耗时随投入分档：起步科技约数秒～半分钟，中期扩产约 1 分钟，后期飞跃链显著更长；建研究所可缩短耗时。";

const RES_ICONS = {
  catnip: "🍓",
  wood: "🌲",
  minerals: "💎",
  science: "🔬",
  pokeball: "🔴",
  futurecoin: "🪙",
  stardust: "✨",
};

function getTechVisualMeta(tid, tdef, stg) {
  const id = String(tid || "").toLowerCase();
  const nm = String(tdef?.name || "");
  if (id.includes("ball") || nm.includes("球") || nm.includes("捕捉")) {
    return { svgKind: "ball", tone: "rose", tag: "灵球工艺" };
  }
  if (id.includes("berry") || id.includes("compost") || id.includes("field") || nm.includes("灵果") || nm.includes("堆肥")) {
    return { svgKind: "berry", tone: "emerald", tag: "灵植农学" };
  }
  if (id.includes("wood") || id.includes("carpent") || id.includes("lumber") || nm.includes("木") || nm.includes("锯")) {
    return { svgKind: "wood", tone: "amber", tag: "林木工程" };
  }
  if (id.includes("mine") || id.includes("mineral") || id.includes("quarry") || nm.includes("晶") || nm.includes("矿")) {
    return { svgKind: "mineral", tone: "cyan", tag: "晶脉勘探" };
  }
  if (id.includes("shiny") || id.includes("myth") || nm.includes("闪光") || nm.includes("幻")) {
    return { svgKind: "shiny", tone: "gold", tag: "星辉异象" };
  }
  if (id.includes("research") || id.includes("lib") || nm.includes("研究") || nm.includes("观测")) {
    return { svgKind: "science", tone: "violet", tag: "星轨学派" };
  }
  if (stg === "early") return { svgKind: "berry", tone: "emerald", tag: "营地起步" };
  if (stg === "late") return { svgKind: "shiny", tone: "gold", tag: "飞跃奥秘" };
  return { svgKind: "science", tone: "cyan", tag: "中枢扩产" };
}

export function createRenderTech({ elTech, elAutoResearchToggle, elAutoResearchMode, elResearchEff, defs, canAfford, computeResearchTimeSec, fmtDuration, getResearchEfficiency, getState, getResearchCost }) {
  return function renderTech() {
    const state = getState();
    const byStage = new Map(TECH_STAGE_ORDER.map((s) => [s, []]));

    const researchEff = typeof getResearchEfficiency === "function" ? getResearchEfficiency() : { n: 0, reduce: 0 };

    if (elAutoResearchToggle) {
      const unlocked = Boolean(state.unlocks?.autoResearch);
      elAutoResearchToggle.disabled = !unlocked;
      elAutoResearchToggle.checked = unlocked ? Boolean(state.autoResearchOn) : false;
    }

    if (elAutoResearchMode) {
      const unlocked = Boolean(state.unlocks?.autoResearch);
      elAutoResearchMode.disabled = !unlocked;
      const m = typeof state.autoResearchMode === "string" ? state.autoResearchMode : "time";
      elAutoResearchMode.value = m === "cost" ? "cost" : "time";
    }

    if (elResearchEff) {
      elResearchEff.textContent = `研究效率提高：研究时间-${Math.round(researchEff.reduce * 100)}%（研究建筑×${researchEff.n}）`;
    }

    const activeResearchTid =
      state.research && typeof state.research === "object" && typeof state.research.tid === "string" ? state.research.tid : null;
    const activeRemain =
      state.research && typeof state.research === "object" && typeof state.research.remainingSec === "number" ? state.research.remainingSec : 0;
    const activeTotal =
      state.research && typeof state.research === "object" && typeof state.research.totalSec === "number" && state.research.totalSec > 0
        ? state.research.totalSec
        : 0;

    const stageCounts = {
      earlyDone: 0, earlyTotal: 0,
      midDone: 0, midTotal: 0,
      lateDone: 0, lateTotal: 0,
    };

    for (const [tid, tdef] of Object.entries(defs.tech)) {
      const stg = getTechStage(tid);
      const owned = Boolean(state.tech[tid]);
      if (stg === "early") {
        stageCounts.earlyTotal += 1;
        if (owned) stageCounts.earlyDone += 1;
      } else if (stg === "late") {
        stageCounts.lateTotal += 1;
        if (owned) stageCounts.lateDone += 1;
      } else {
        stageCounts.midTotal += 1;
        if (owned) stageCounts.midDone += 1;
      }

      if (owned) continue;
      const prereqOk = (tdef.prereq ?? []).every((p) => Boolean(state.tech[p]));
      const reqOk = typeof tdef.req === "function" ? Boolean(tdef.req(state)) : true;

      const visible = owned || prereqOk || (tdef.prereq ?? []).length === 0;
      if (!visible) continue;

      const cost = typeof getResearchCost === "function" ? getResearchCost(tdef) : (tdef.cost ?? {});
      const afford = canAfford(cost);
      const isActive = Boolean(activeResearchTid && activeResearchTid === tid);
      const researchBusy = Boolean(activeResearchTid && activeResearchTid !== tid);
      const canBuy = !owned && prereqOk && reqOk && afford && !activeResearchTid;
      const locked = !prereqOk || !reqOk;

      const costText = Object.entries(cost)
        .map(([rid, v]) => `${defs.resources[rid].name}${v}`)
        .join(" / ");
      const costChipsHtml = Object.entries(cost)
        .map(([rid, v]) => {
          const curVal = state.res?.[rid]?.value ?? 0;
          const enough = curVal >= v;
          const rName = defs.resources[rid]?.name || rid;
          return `<span class="cost-chip ${enough ? "is-ok" : "is-short"}">${renderResSvg(rid, 14)} ${rName}${v}</span>`;
        })
        .join("");

      const timeText = fmtDuration(computeResearchTimeSec(tdef));
      const vis = getTechVisualMeta(tid, tdef, stg);

      let statusText = "可研究";
      let progressHtml = "";
      if (owned) statusText = "已研究";
      else if (!prereqOk) statusText = "缺少前置";
      else if (!reqOk) statusText = "条件不足";
      else if (isActive) {
        const theater = researchProgressTheater(activeRemain, activeTotal || computeResearchTimeSec(tdef));
        statusText = theater.label;
        progressHtml = `<div class="dex-progress" aria-label="研究进度 ${theater.pct}%"><div class="dex-progress__fill" style="width:${theater.pct}%"></div></div>`;
      } else if (researchBusy) statusText = "研究中";
      else if (!afford) statusText = "资源不足";

      const btnText = isActive ? `⏳ ${fmtDuration(activeRemain)}` : canBuy ? "🔭 立项研究" : "研究";

      const missingPrereq = (tdef.prereq ?? []).filter((p) => !state.tech[p]);
      const depHint =
        !prereqOk && missingPrereq.length
          ? `需要：${missingPrereq.map((p) => defs.tech[p]?.name ?? p).join("、")}`
          : "";
      const reqHint = prereqOk && !reqOk ? techReqHint(state, tid, tdef) : "";
      const gateHint = depHint || reqHint;

      const rowClass = [
        "row",
        "bcard",
        `bcard--${vis.tone}`,
        locked ? "is-locked" : "",
        isActive ? "row--researching" : "",
        canBuy ? "row--researchable row--buildable" : "",
      ]
        .filter(Boolean)
        .join(" ");

      const bucket = byStage.get(stg) ?? byStage.get("mid");
      const descLine =
        typeof tdef.desc === "string" && tdef.desc.trim()
          ? locked || !canBuy
            ? `解锁预览：${tdef.desc}`
            : tdef.desc
          : "";
      bucket.push(`
        <div class="${rowClass}">
          <div class="row__left bcard__main">
            <div class="bcard__head">
              <div class="bcard__emblem bcard__emblem--${vis.tone}" aria-hidden="true">
                <span class="bcard__icon">${renderTechSvg(vis.svgKind, 34)}</span>
                <span class="bcard__lvlBadge">⏱${timeText}</span>
              </div>
              <div class="bcard__titleWrap">
                <div class="bcard__titleLine">
                  <span class="row__title">${tdef.name}</span>
                  <span class="bcard__tag">${vis.tag}</span>
                </div>
                <div class="row__desc">${descLine}${gateHint ? `<span class="tech-dep">${gateHint}</span>` : ""}</div>
              </div>
            </div>
            ${progressHtml}
          </div>
          <div class="row__right bcard__actions">
            <div class="badge ${owned || canBuy ? "badge--ok" : ""}${isActive && statusText.includes("即将完成") ? " badge--ok" : ""}">${statusText}</div>
            <div class="bcard__costs" title="花费：${costText || "-"}">${costChipsHtml || `<span class="badge">花费：-</span>`}</div>
            <div class="badge">耗时：${timeText}</div>
            <button class="btn btn--primary btn--small bcard__btn" data-research="${tid}" ${canBuy ? "" : "disabled"}>${btnText}</button>
          </div>
        </div>
      `);
    }

    let recommendTid = "";
    let recommendDef = null;
    let recommendHtml = "";
    for (const stage of TECH_STAGE_ORDER) {
      const rows = byStage.get(stage) ?? [];
      for (const row of rows) {
        if (row.includes("row--researchable") && row.includes('data-research="')) {
          const m = row.match(/data-research="([^"]+)"/);
          const tid = m ? m[1] : "";
          const tdef = tid ? defs.tech[tid] : null;
          if (tdef) {
            recommendTid = tid;
            recommendDef = tdef;
            recommendHtml = `
              <div class="row row--researchable tech-recommend-banner">
                <div class="row__left">
                  <div class="row__title row__titleLine">${renderResSvg("science", 18)}<span>🌟 推荐下一研究：${tdef.name}</span><span class="tag">耗时 ${fmtDuration(computeResearchTimeSec(tdef))}</span></div>
                  <div class="row__desc">${typeof tdef.desc === "string" && tdef.desc.trim() ? tdef.desc : ""}</div>
                  <div class="row__desc muted">${TECH_PACING_BLURB}</div>
                </div>
                <div class="row__right">
                  <button class="btn btn--primary" data-research="${tid}">🔭 立即研究</button>
                </div>
              </div>
            `;
          }
          break;
        }
      }
      if (recommendHtml) break;
    }

    const stageHeroHtml = renderScienceStageHtml({
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
    });

    const sections = [
      stageHeroHtml,
    ];

    if (activeResearchTid && defs.tech[activeResearchTid]) {
      const tdef = defs.tech[activeResearchTid];
      const theater = researchProgressTheater(activeRemain, activeTotal || computeResearchTimeSec(tdef));
      recommendHtml = `
        <div class="row row--researching tech-recommend-banner">
          <div class="row__left">
            <div class="row__title row__titleLine">${renderResSvg("science", 18)}<span>⏳ 正在研究：${tdef.name}</span><span class="tag">${theater.pct}%</span></div>
            <div class="row__desc">${theater.label} · 点击上方星盘可手动凝星加速</div>
            <div class="dex-progress" aria-label="研究进度 ${theater.pct}%"><div class="dex-progress__fill" style="width:${theater.pct}%"></div></div>
          </div>
        </div>
      `;
    }
    if (recommendHtml) {
      sections.push(recommendHtml);
    } else {
      sections.push(`<div class="row"><div class="row__left"><div class="row__desc muted">${TECH_PACING_BLURB}</div></div></div>`);
    }

    const STAGE_ICONS = {
      early: { icon: renderTechSvg("berry", 22), sub: "营地开拓基石 · 快速解锁核心资源与灵球工艺", done: stageCounts.earlyDone, total: stageCounts.earlyTotal },
      mid: { icon: renderTechSvg("ball", 22), sub: "中枢自动化扩产 · 大幅提升产能、球台与探索效率", done: stageCounts.midDone, total: stageCounts.midTotal },
      late: { icon: renderTechSvg("shiny", 22), sub: "高阶星轨飞跃 · 突破产能极限与高维秘境法则", done: stageCounts.lateDone, total: stageCounts.lateTotal },
    };

    for (const stage of TECH_STAGE_ORDER) {
      const rows = byStage.get(stage) ?? [];
      if (rows.length === 0) continue;
      const label = TECH_STAGE_LABELS[stage] ?? stage;
      const meta = STAGE_ICONS[stage] || { icon: "🔭", sub: "", done: 0, total: rows.length };
      sections.push(`
        <div class="building-section tech-section" data-tech-stage-group="${stage}" role="group" aria-label="${label}">
          <div class="building-section__title">
            <span class="building-section__icon">${meta.icon}</span>
            <span>${label}</span>
            <span class="building-section__meta">已点亮 ${meta.done}/${meta.total} · 待研 ${rows.length} 项</span>
          </div>
          ${meta.sub ? `<div class="building-section__sub">${meta.sub}</div>` : ""}
        </div>
      `);
      sections.push(...rows);
    }

    setHtmlPreservingStage(elTech, sections.join(""));
  };
}
