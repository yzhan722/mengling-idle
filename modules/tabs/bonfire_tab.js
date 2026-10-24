import { eraPokeballBonusCrafted } from "../systems/era.js";
import {
  bumpGatherCombo,
  bumpGatherDaily,
  gatherDailyProgress,
  gatherNextMilestone,
  localDateStr,
  markGatherDailyClaimed,
} from "../systems/gameplay_fun.js";
import {
  computeNewbieCompass,
  getCampfireVisualTier,
  selectCampCompanions,
} from "../systems/newbie_compass.js";
import { renderBeastIcon } from "../sprites.js";
import { renderResSvg, renderUiIcon } from "../render/rpg_svg_icons.js";
import { escapeHtml } from "../utils.js";

function renderCampStageSvg(fireTier) {
  const glowOpacity = (0.28 + fireTier * 0.08).toFixed(2);
  return `
    <div class="camp-stage__artWrap" aria-hidden="true">
      <img class="camp-stage__bgImg" src="./assets/ui/camp_stage_night.jpg" alt="" loading="eager" decoding="async" />
      <div class="camp-stage__fireGlow" style="--fire-glow-opacity:${glowOpacity}"></div>
      <svg class="camp-stage__sparksSvg" viewBox="0 0 680 210" xmlns="http://www.w3.org/2000/svg">
        <circle class="camp-spark camp-spark--1" cx="332" cy="118" r="2.6" fill="#fde047"/>
        <circle class="camp-spark camp-spark--2" cx="354" cy="108" r="2.2" fill="#fb923c"/>
        <circle class="camp-spark camp-spark--3" cx="340" cy="92" r="2.0" fill="#fef08a"/>
        <circle class="camp-spark camp-spark--4" cx="228" cy="134" r="2.4" fill="#86efac" opacity="0.88"/>
        <circle class="camp-spark camp-spark--5" cx="468" cy="126" r="2.4" fill="#86efac" opacity="0.88"/>
      </svg>
    </div>
  `;
}

export function createRenderBonfireActions({ elBonfireActions, elBtnGather, ui, getState }) {
  let lastBonfireSig = "";
  let lastStageSig = "";
  const fmtRemain = (sec) => {
    const s = Math.max(0, Math.ceil(typeof sec === "number" && Number.isFinite(sec) ? sec : 0));
    const mm = Math.floor(s / 60);
    const ss = s % 60;
    const pad2 = (x) => String(x).padStart(2, "0");
    return `${mm}:${pad2(ss)}`;
  };

  return function renderBonfireActions() {
    const state = typeof getState === "function" ? getState() : null;
    if (elBtnGather && state && typeof state === "object") {
      const charges0 =
        typeof state.gatherCharges === "number" && Number.isFinite(state.gatherCharges) ? state.gatherCharges : 1000;
      const charges = Math.max(0, Math.min(1000, Math.floor(charges0)));
      const cd0 = typeof state.gatherCdSec === "number" && Number.isFinite(state.gatherCdSec) ? state.gatherCdSec : 0;
      const cd = Math.max(0, Math.ceil(cd0));
      const combo = Math.max(0, Math.floor(state.fun?.gatherCombo || 0));
      const text =
        charges <= 0
          ? `采集 0${cd > 0 ? ` (${fmtRemain(cd)})` : ""}`
          : `采集 ${charges}`;
      if (elBtnGather.textContent !== text) {
        elBtnGather.textContent = text;
      }
      elBtnGather.title =
        charges <= 0
          ? cd > 0
            ? `次数用尽，${fmtRemain(cd)} 后 +1`
            : "次数用尽"
          : `采集 ${charges}/1000${cd > 0 ? ` · 回充 ${fmtRemain(cd)}` : ""}${combo >= 2 ? ` · 连击 x${combo}` : ""}`;
      elBtnGather.disabled = charges <= 0;
    }
    if (!elBonfireActions) return;
    if (state && typeof state === "object") {
      const charges0 =
        typeof state.gatherCharges === "number" && Number.isFinite(state.gatherCharges) ? state.gatherCharges : 1000;
      const charges = Math.max(0, Math.min(1000, Math.floor(charges0)));
      const cd0 = typeof state.gatherCdSec === "number" && Number.isFinite(state.gatherCdSec) ? state.gatherCdSec : 0;
      const cd = Math.max(0, Math.ceil(cd0));
      const clicks =
        typeof state.gatherClicks === "number" && Number.isFinite(state.gatherClicks)
          ? Math.max(0, Math.floor(state.gatherClicks))
          : 0;
      const cdText = charges >= 1000 ? "已满" : cd > 0 ? `回充 +1 ${fmtRemain(cd)}` : "可采集";
      const mile = gatherNextMilestone(clicks);
      const mileText = mile.done
        ? "采集里程碑：已达成 1000"
        : `下一里程碑 ${mile.next}（还差 ${mile.left}）`;
      const daily = gatherDailyProgress(state, localDateStr());
      const dailyText = daily.claimed
        ? `今日采集任务已领 · ${Math.min(daily.count, daily.goal)}/${daily.goal}`
        : `今日采集 ${Math.min(daily.count, daily.goal)}/${daily.goal} → +6 未来币`;

      const compass = computeNewbieCompass(state);
      const companions = selectCampCompanions(state);
      const fireInfo = getCampfireVisualTier(state);

      const stageSig = [
        fireInfo.tier,
        fireInfo.label,
        companions.map((c) => `${c.id}:${c.lvl}:${c.isShiny ? 1 : 0}:${c.mood}`).join(","),
      ].join("|");

      const sig = [
        charges,
        cd,
        clicks,
        daily.count,
        daily.claimed ? 1 : 0,
        compass.id,
        compass.progressCur,
        compass.progressMax,
        compass.title,
        stageSig,
      ].join("|");

      if (!ui?.bonfireDirty && sig === lastBonfireSig && elBonfireActions.childElementCount > 0) {
        return;
      }
      lastBonfireSig = sig;

      const stepDotsHtml = Array.from({ length: compass.totalSteps }, (_, i) => {
        const sNum = i + 1;
        const cls = sNum < compass.stepIndex ? "is-done" : sNum === compass.stepIndex ? "is-active" : "";
        return `<span class="compass-dot ${cls}" title="阶段 ${sNum}"></span>`;
      }).join("");

      const gatherLine1 = `顶栏【采集】消耗次数换灵果。当前 ${charges}/1000 · ${cdText} · 累计 ${clicks} 次`;
      const gatherLine2 = `${mileText} · ${dailyText}`;

      if (stageSig === lastStageSig && elBonfireActions.querySelector("#campStage")) {
        const cardEl = elBonfireActions.querySelector(".compass-card");
        if (cardEl) {
          cardEl.setAttribute("data-compass-step", compass.id);
          const badgeEl = cardEl.querySelector(".compass-card__badge");
          if (badgeEl) badgeEl.textContent = compass.badge;
          const dotsEl = cardEl.querySelector(".compass-card__dots");
          if (dotsEl) dotsEl.innerHTML = stepDotsHtml;
          const titleEl = cardEl.querySelector(".compass-card__title");
          if (titleEl) titleEl.textContent = compass.title;
          const descEl = cardEl.querySelector("[data-compass-desc]");
          if (descEl) descEl.textContent = compass.desc;
          const whyEl = cardEl.querySelector(".compass-card__why");
          if (whyEl) whyEl.textContent = compass.whyText;
          const fillEl = cardEl.querySelector(".compass-bar__fill");
          if (fillEl) fillEl.style.width = `${compass.pct}%`;
          const labelEl = cardEl.querySelector(".compass-bar__label");
          if (labelEl) labelEl.textContent = `${compass.progressCur} / ${compass.progressMax}（${compass.pct}%）`;
          const ctaEl = cardEl.querySelector(".compass-card__cta");
          if (ctaEl) {
            ctaEl.setAttribute("data-compass-action", compass.ctaAction);
            ctaEl.textContent = `${compass.ctaLabel} →`;
          }
        }
        const g1 = elBonfireActions.querySelector("[data-bonfire-gather-line1]");
        if (g1) g1.textContent = gatherLine1;
        const g2 = elBonfireActions.querySelector("[data-bonfire-gather-line2]");
        if (g2) g2.textContent = gatherLine2;
        const qBtn = elBonfireActions.querySelector("button[data-camp-quick-gather]");
        if (qBtn) qBtn.disabled = charges <= 0;
        const cBtn = elBonfireActions.querySelector("button[data-gather-daily-claim]");
        if (cBtn) {
          cBtn.disabled = !daily.canClaim;
          cBtn.textContent = daily.claimed ? "今日已领" : "领取 +6";
        }
        if (ui) ui.bonfireDirty = false;
        return;
      }

      lastStageSig = stageSig;

      const companionSlotsHtml =
        companions.length > 0
          ? companions
              .map(
                (c, idx) => `
                <button type="button" class="camp-companion camp-companion--slot${idx}" data-camp-pet="${escapeHtml(String(c.id))}" data-camp-name="${escapeHtml(c.name)}" title="点击与 ${escapeHtml(c.name)} 互动">
                  <div class="camp-companion__bubble">${escapeHtml(c.mood)}</div>
                  <div class="camp-companion__avatar">${renderBeastIcon(c.dex, c.name, c.isShiny)}</div>
                  <div class="camp-companion__tag">Lv.${c.lvl} ${escapeHtml(c.name)}${c.isShiny ? " ✨" : ""}</div>
                </button>`
              )
              .join("")
          : `<div class="camp-stage__emptyHint">🔥 篝火正暖 · 完成第 3 步抓获萌灵后，伙伴们会围坐在火堆旁陪伴你</div>`;

      elBonfireActions.innerHTML = `
        <div class="camp-stage" id="campStage">
          <div class="camp-stage__backdrop">
            ${renderCampStageSvg(fireInfo.tier)}
            <div class="camp-stage__companions">
              ${companionSlotsHtml}
            </div>
          </div>
          <div class="camp-stage__deck">
            <div class="camp-stage__header">
              <span class="camp-stage__badge">${renderUiIcon("tab_bonfire", 18)} ${escapeHtml(fireInfo.label)}</span>
              <span class="camp-stage__sub">点击营地伙伴或下方热点互动 · 灵果与建筑越丰盛，火光越明亮</span>
            </div>
            <div class="camp-stage__hotspots">
              <button type="button" class="camp-hotspot camp-hotspot--berry" data-stage-act="camp-node" data-res="catnip" title="点击采摘林间灵果">
                <span class="camp-hotspot__icon">${renderResSvg("catnip", 18)}</span>
                <span class="camp-hotspot__label">采摘灵果</span>
              </button>
              <button type="button" class="camp-hotspot camp-hotspot--fire" data-stage-act="bonfire-stoke" title="点击添柴旺火，凝聚全营地灵气">
                <span class="camp-hotspot__icon">${renderUiIcon("tab_bonfire", 18)}</span>
                <span class="camp-hotspot__label">添柴聚灵</span>
              </button>
              <button type="button" class="camp-hotspot camp-hotspot--wood" data-stage-act="camp-node" data-res="wood" title="点击拾取干枯灵木">
                <span class="camp-hotspot__icon">${renderResSvg("wood", 18)}</span>
                <span class="camp-hotspot__label">拾取灵木</span>
              </button>
              <button type="button" class="camp-hotspot camp-hotspot--mineral" data-stage-act="camp-node" data-res="minerals" title="点击勘探微光灵晶">
                <span class="camp-hotspot__icon">${renderResSvg("minerals", 18)}</span>
                <span class="camp-hotspot__label">勘探灵晶</span>
              </button>
            </div>
          </div>
        </div>

        <div class="row compass-card" data-compass-step="${escapeHtml(compass.id)}">
          <div class="row__left">
            <div class="compass-card__top">
              <span class="compass-card__badge">${escapeHtml(compass.badge)}</span>
              <div class="compass-card__dots" aria-label="主线阶段进度">${stepDotsHtml}</div>
            </div>
            <div class="row__title compass-card__title">${escapeHtml(compass.title)}</div>
            <div class="row__desc" data-compass-desc>${escapeHtml(compass.desc)}</div>
            <div class="compass-card__why">${escapeHtml(compass.whyText)}</div>
            <div class="compass-bar" aria-label="当前目标进度 ${compass.pct}%">
              <div class="compass-bar__fill" style="width:${compass.pct}%"></div>
              <span class="compass-bar__label">${compass.progressCur} / ${compass.progressMax}（${compass.pct}%）</span>
            </div>
          </div>
          <div class="row__right compass-card__actions">
            <button type="button" class="btn btn--primary compass-card__cta" data-compass-action="${escapeHtml(compass.ctaAction)}">${escapeHtml(compass.ctaLabel)} →</button>
          </div>
        </div>

        <div class="row bonfire-gather-row">
          <div class="row__left">
            <div class="row__title">营地采集</div>
            <div class="row__desc" data-bonfire-gather-line1>${escapeHtml(gatherLine1)}</div>
            <div class="row__desc" data-bonfire-gather-line2>${escapeHtml(gatherLine2)}</div>
          </div>
          <div class="row__right">
            <button type="button" class="btn btn--small" data-camp-quick-gather ${charges <= 0 ? "disabled" : ""}>采集一次</button>
            <button type="button" class="btn btn--primary btn--small" data-gather-daily-claim ${daily.canClaim ? "" : "disabled"}>${daily.claimed ? "今日已领" : "领取 +6"}</button>
          </div>
        </div>
      `;
    } else {
      elBonfireActions.innerHTML = "";
    }
    if (ui) ui.bonfireDirty = false;
  };
}

function spawnGatherFloatText(anchorEl, text, combo = 0) {
  if (typeof document === "undefined" || !anchorEl) return;
  try {
    const rect = anchorEl.getBoundingClientRect();
    if (!rect || (rect.width === 0 && rect.height === 0)) return;
    const floater = document.createElement("div");
    floater.className = `gather-float${combo >= 3 ? " gather-float--combo" : ""}`;
    floater.textContent = combo >= 2 ? `${text} · 连击x${combo}!` : text;
    const jitterX = (Math.random() - 0.5) * 26;
    floater.style.left = `${Math.round(rect.left + rect.width / 2 + jitterX)}px`;
    floater.style.top = `${Math.round(rect.top - 6)}px`;
    document.body.appendChild(floater);
    setTimeout(() => {
      try { floater.remove(); } catch {}
    }, 950);
  } catch {}
}

export function initBonfireTab({
  elBonfireActions,
  elBtnGather,
  ui,
  getPokeballMakeCost,
  canAfford,
  pay,
  addRes,
  addLog,
  render,
  doCatch,
  getState,
  onGather,
  onPokeballCraft,
  activateTab,
}) {
  const triggerTab = (tabName) => {
    if (typeof activateTab === "function") {
      activateTab(tabName);
      return;
    }
    try {
      document.querySelector(`.tab[data-tab="${tabName}"]`)?.click();
    } catch {}
  };

  if (elBtnGather) {
    let lastGatherAtMs = 0;
    elBtnGather.addEventListener("click", () => {
      const now = Date.now();
      if (now - lastGatherAtMs < 100) return;
      lastGatherAtMs = now;

      let currentCombo = 0;
      const state = typeof getState === "function" ? getState() : null;
      if (state && typeof state === "object") {
        const charges0 =
          typeof state.gatherCharges === "number" && Number.isFinite(state.gatherCharges) ? Math.max(0, Math.floor(state.gatherCharges)) : 0;
        const cd0 = typeof state.gatherCdSec === "number" && Number.isFinite(state.gatherCdSec) ? Math.max(0, state.gatherCdSec) : 0;
        const maxCharges = 1000;
        const rechargeSec = 10;
        if (charges0 <= 0) {
          return;
        }

        state.gatherCharges = charges0 - 1;
        if (state.gatherCharges < maxCharges && cd0 <= 0) state.gatherCdSec = rechargeSec;

        const prev = typeof state.gatherClicks === "number" && Number.isFinite(state.gatherClicks) ? state.gatherClicks : 0;
        state.gatherClicks = Math.max(0, Math.floor(prev)) + 1;
        bumpGatherDaily(state, localDateStr());
        if (!state.fun || typeof state.fun !== "object") state.fun = {};
        const comboInfo = bumpGatherCombo(state.fun, now, 1200);
        currentCombo = comboInfo.combo || 0;
        if (comboInfo.bonus) {
          addRes("catnip", 1);
          addLog(`采集连击 x${comboInfo.combo}：灵果 +1`, true);
        }
      }

      const clicks =
        state && typeof state === "object" && typeof state.gatherClicks === "number" && Number.isFinite(state.gatherClicks)
          ? Math.max(1, Math.floor(state.gatherClicks))
          : 1;

      const tierFast = Math.floor((clicks - 1) / 100);
      const tier = tierFast <= 9 ? tierFast : 9 + Math.floor((clicks - 1 - 9 * 100) / 1000);

      // Moderated click yield to keep early game smooth without explosive resource inflation
      const cat = Math.min(60, 2 + tier * 1.2);
      const wood = Math.min(50, 0.6 + tier * 0.5);
      const min = Math.min(40, 0.3 + tier * 0.25);

      const parts = [];
      const catBefore = state?.res?.catnip?.value ?? 0;
      addRes("catnip", cat);
      const catGained = Math.max(0, (state?.res?.catnip?.value ?? 0) - catBefore);
      parts.push(`灵果 +${cat}`);
      if (state?.unlocks?.wood) {
        addRes("wood", wood);
        parts.push(`灵木 +${wood}`);
      }
      if (state?.unlocks?.minerals) {
        addRes("minerals", min);
        parts.push(`灵晶碎片 +${min}`);
      }
      addLog(`采集：${parts.join("，")}`);
      spawnGatherFloatText(elBtnGather, `+${cat} 灵果`, currentCombo);
      // Pass intended yield so era berry_earned isn't softlocked by full catnip cap
      if (typeof onGather === "function") onGather(cat, catGained);
      if (ui) ui.bonfireDirty = true;
      render();
    });
  }

  if (!elBonfireActions) return;

  elBonfireActions.addEventListener("click", (ev) => {
    const quickGatherBtn = ev.target?.closest?.("button[data-camp-quick-gather]");
    if (quickGatherBtn && elBonfireActions.contains(quickGatherBtn)) {
      elBtnGather?.click();
      return;
    }

    const petBtn = ev.target?.closest?.("button[data-camp-pet]");
    if (petBtn && elBonfireActions.contains(petBtn)) {
      const petName = petBtn.getAttribute("data-camp-name") || "萌灵";
      addLog(`营地互动：你摸了摸 ${petName} 的脑袋，它在温暖的篝火旁开心地转了个圈 ♪`, true);
      spawnGatherFloatText(petBtn, `♥ ${petName} 心情愉悦`);
      return;
    }

    const compassBtn = ev.target?.closest?.("button[data-compass-action]");
    if (compassBtn && elBonfireActions.contains(compassBtn)) {
      const act = compassBtn.getAttribute("data-compass-action") || "";
      if (act === "gather") {
        elBtnGather?.click();
      } else if (act.startsWith("tab:")) {
        const targetTab = act.slice(4);
        triggerTab(targetTab);
      } else if (act === "scroll:buildings") {
        try {
          const bldEl = document.getElementById("buildings");
          bldEl?.scrollIntoView?.({ behavior: "smooth", block: "start" });
          const firstBuy = bldEl?.querySelector?.("button[data-buy]:not([disabled])");
          if (firstBuy) {
            firstBuy.classList.add("guideHighlight");
            setTimeout(() => firstBuy.classList.remove("guideHighlight"), 2400);
          }
        } catch {}
      }
      return;
    }

    const claimBtn = ev.target?.closest?.("button[data-gather-daily-claim]");
    if (claimBtn && elBonfireActions.contains(claimBtn)) {
      if (claimBtn.disabled) return;
      const state = typeof getState === "function" ? getState() : null;
      if (!state) return;
      if (!markGatherDailyClaimed(state, localDateStr())) {
        addLog("今日采集任务未完成或已领取");
        return;
      }
      addRes("futurecoin", 6);
      addLog("今日采集任务：未来币 +6", true);
      if (ui) ui.bonfireDirty = true;
      render();
      return;
    }

    const btn = ev.target?.closest?.("button[data-action]");
    if (!btn || !elBonfireActions.contains(btn)) return;
    if (btn.disabled) return;

    const act = btn.getAttribute("data-action");
    if (act === "makeBall") {
      const makeCost = getPokeballMakeCost(1, { consume: true });
      if (!canAfford(makeCost)) return;
      pay(makeCost);
      const state = typeof getState === "function" ? getState() : null;
      const before = state?.res?.pokeball?.value ?? 0;
      addRes("pokeball", 1);
      const after = state?.res?.pokeball?.value ?? before;
      const made = Math.max(0, after - before);
      const bonus = eraPokeballBonusCrafted(state, made);
      if (bonus > 0) addRes("pokeball", bonus);
      const afterBonus = state?.res?.pokeball?.value ?? after;
      const bonusMade = Math.max(0, afterBonus - after);
      if (state && typeof state === "object") {
        state.pokeballMade = Math.max(0, (state.pokeballMade ?? 0) + made + bonusMade);
      }
      if (typeof onPokeballCraft === "function") onPokeballCraft(made + bonusMade);
      addLog(`制作：灵球 +${made + bonusMade}${bonusMade > 0 ? `（时代加成 +${bonusMade}）` : ""}`);
      if (ui) ui.bonfireDirty = true;
      render();
      return;
    }

    if (act === "catch") {
      doCatch();
      if (ui) ui.bonfireDirty = true;
      render();
    }
  });
}
