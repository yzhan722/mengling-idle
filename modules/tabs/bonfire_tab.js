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
import { escapeHtml } from "../utils.js";

function renderCampStageSvg(fireTier) {
  const flameScale = 0.88 + (fireTier - 1) * 0.14;
  return `
    <svg class="camp-stage__svg" viewBox="0 0 680 184" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <radialGradient id="campGlow" cx="50%" cy="78%" r="54%">
          <stop offset="0%" stop-color="#fbbf24" stop-opacity="${0.48 + fireTier * 0.06}"/>
          <stop offset="42%" stop-color="#f97316" stop-opacity="0.22"/>
          <stop offset="78%" stop-color="#7c2d12" stop-opacity="0.08"/>
          <stop offset="100%" stop-color="#0b0f17" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="lanternGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#fde047" stop-opacity="0.65"/>
          <stop offset="55%" stop-color="#f59e0b" stop-opacity="0.22"/>
          <stop offset="100%" stop-color="#f59e0b" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="campSky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#060a14"/>
          <stop offset="55%" stop-color="#0f172a"/>
          <stop offset="100%" stop-color="#1e1b2e"/>
        </linearGradient>
        <linearGradient id="tentFabric" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#334155"/>
          <stop offset="100%" stop-color="#1e293b"/>
        </linearGradient>
        <linearGradient id="tentInner" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stop-color="#fef08a"/>
          <stop offset="55%" stop-color="#f59e0b"/>
          <stop offset="100%" stop-color="#b45309"/>
        </linearGradient>
        <linearGradient id="flameOuter" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stop-color="#fde047"/>
          <stop offset="48%" stop-color="#f97316"/>
          <stop offset="100%" stop-color="#dc2626"/>
        </linearGradient>
        <linearGradient id="flameMid" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stop-color="#fef9c3"/>
          <stop offset="55%" stop-color="#fb923c"/>
          <stop offset="100%" stop-color="#ea580c"/>
        </linearGradient>
        <linearGradient id="flameInner" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="65%" stop-color="#fef08a"/>
          <stop offset="100%" stop-color="#f59e0b"/>
        </linearGradient>
      </defs>
      <rect width="680" height="184" rx="12" fill="url(#campSky)"/>
      <!-- 银河柔光带与星空弦月 -->
      <ellipse cx="340" cy="36" rx="290" ry="22" transform="rotate(-4 340 36)" fill="#38bdf8" opacity="0.045"/>
      <circle cx="72" cy="32" r="1.4" fill="#fef08a" opacity="0.85"/>
      <circle cx="138" cy="20" r="1.7" fill="#ffffff" opacity="0.75"/>
      <path d="M210 20 L212 25 L217 27 L212 29 L210 34 L208 29 L203 27 L208 25 Z" fill="#fef08a" opacity="0.75"/>
      <circle cx="282" cy="28" r="1.3" fill="#bae6fd" opacity="0.8"/>
      <circle cx="412" cy="18" r="1.6" fill="#fef08a" opacity="0.8"/>
      <path d="M486 24 L487.5 28 L491.5 29.5 L487.5 31 L486 35 L484.5 31 L480.5 29.5 L484.5 28 Z" fill="#bae6fd" opacity="0.7"/>
      <circle cx="542" cy="36" r="1.3" fill="#ffffff" opacity="0.65"/>
      <circle cx="628" cy="28" r="1.5" fill="#bae6fd" opacity="0.8"/>
      <circle cx="590" cy="29" r="20" fill="#fef08a" opacity="0.08"/>
      <path d="M582 18 A14 14 0 1 0 600 36 A11 11 0 1 1 582 18 Z" fill="#fef08a" opacity="0.92"/>
      <!-- 远山层峦 -->
      <path d="M0 138 L68 92 L144 126 L236 80 L328 124 L424 84 L524 126 L608 90 L680 128 L680 184 L0 184 Z" fill="#0b1324" opacity="0.92"/>
      <!-- 左右松林剪影（多层次针叶林） -->
      <g fill="#080f1d" opacity="0.95">
        <path d="M18 68 L4 96 L12 96 L0 122 L10 122 L-2 148 L38 148 L26 122 L36 122 L24 96 L32 96 Z"/>
        <path d="M48 80 L35 104 L42 104 L30 128 L38 128 L28 150 L68 150 L58 128 L66 128 L54 104 L61 104 Z"/>
        <path d="M628 76 L614 102 L622 102 L610 126 L618 126 L608 150 L648 150 L638 126 L646 126 L634 102 L642 102 Z"/>
        <path d="M658 64 L644 92 L652 92 L638 118 L648 118 L636 148 L680 148 L668 118 L678 118 L664 92 L672 92 Z"/>
      </g>
      <!-- 中景缓坡与营地草甸 -->
      <path d="M0 148 Q120 128 240 144 T460 142 T680 146 L680 184 L0 184 Z" fill="#11192c"/>
      <ellipse cx="340" cy="158" rx="310" ry="34" fill="#171523"/>
      <ellipse cx="340" cy="138" rx="220" ry="78" fill="url(#campGlow)"/>
      <!-- 左侧：探险家暖光帐篷与挂灯木桩 -->
      <g class="camp-stage__tent">
        <!-- 帐篷拉绳 -->
        <line x1="48" y1="146" x2="66" y2="122" stroke="#475569" stroke-width="1.2" opacity="0.7"/>
        <line x1="154" y1="146" x2="136" y2="120" stroke="#475569" stroke-width="1.2" opacity="0.7"/>
        <!-- 帐篷侧面与主顶棚 -->
        <path d="M56 146 L94 98 L146 142 L112 148 Z" fill="#1e293b" stroke="#475569" stroke-width="1.6" stroke-linejoin="round"/>
        <path d="M94 98 L132 94 L154 138 L122 146 Z" fill="url(#tentFabric)" stroke="#64748b" stroke-width="1.5" stroke-linejoin="round"/>
        <!-- 帐篷暖光门帘 -->
        <path d="M74 146 L94 106 L114 146 Z" fill="url(#tentInner)" opacity="0.88"/>
        <path d="M74 146 Q86 126 94 106 L64 146 Z" fill="#334155" stroke="#64748b" stroke-width="1.2"/>
        <path d="M114 146 Q102 126 94 106 L122 146 Z" fill="#475569" stroke="#64748b" stroke-width="1.2"/>
        <!-- 帐篷地面暖光投射 -->
        <ellipse cx="94" cy="150" rx="26" ry="5" fill="#f59e0b" opacity="0.28"/>
        <!-- 营地挂灯木桩 -->
        <path d="M164 148 L164 108 L178 104" fill="none" stroke="#78350f" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="177" y1="104" x2="177" y2="112" stroke="#94a3b8" stroke-width="1.4"/>
        <circle cx="177" cy="117" r="16" fill="url(#lanternGlow)"/>
        <rect x="173" y="112" width="8" height="10" rx="3" fill="#fef08a" stroke="#b45309" stroke-width="1.4"/>
      </g>
      <!-- 右侧：原木坐凳与萤火灵晶丛 -->
      <g class="camp-stage__props">
        <ellipse cx="556" cy="148" rx="34" ry="6" fill="#090c14" opacity="0.55"/>
        <rect x="526" y="136" width="56" height="11" rx="5.5" transform="rotate(4 554 141)" fill="#78350f" stroke="#451a03" stroke-width="1.6"/>
        <circle cx="528" cy="140" r="5.5" fill="#d97706" stroke="#451a03" stroke-width="1.4"/>
        <!-- 灵果灌木与微光晶石 -->
        <path d="M590 144 Q584 128 598 126 Q606 116 618 126 Q628 130 622 144 Z" fill="#14532d" stroke="#166534" stroke-width="1.5"/>
        <circle cx="598" cy="133" r="2.6" fill="#fb7185"/>
        <circle cx="610" cy="129" r="2.8" fill="#fbbf24"/>
        <circle cx="615" cy="137" r="2.4" fill="#38bdf8"/>
      </g>
      <!-- 中央篝火底座、河卵石圈与劈柴 -->
      <ellipse cx="340" cy="156" rx="54" ry="13" fill="#080b12" opacity="0.72"/>
      <ellipse cx="340" cy="151" rx="38" ry="9" fill="#ea580c" opacity="${0.28 + fireTier * 0.05}"/>
      <!-- 交错木柴 -->
      <rect x="302" y="140" width="76" height="11" rx="5.5" transform="rotate(-15 340 145)" fill="#78350f" stroke="#451a03" stroke-width="1.8"/>
      <rect x="302" y="140" width="76" height="11" rx="5.5" transform="rotate(15 340 145)" fill="#92400e" stroke="#451a03" stroke-width="1.8"/>
      <rect x="314" y="143" width="52" height="9" rx="4.5" transform="rotate(-4 340 147)" fill="#b45309" stroke="#451a03" stroke-width="1.5"/>
      <!-- 河卵石围圈（带火光高光边） -->
      <ellipse cx="294" cy="152" rx="8" ry="5.5" fill="#475569" stroke="#1e293b" stroke-width="1.4"/>
      <ellipse cx="308" cy="158" rx="9" ry="6" fill="#64748b" stroke="#1e293b" stroke-width="1.4"/>
      <ellipse cx="328" cy="161" rx="9.5" ry="6.2" fill="#475569" stroke="#1e293b" stroke-width="1.4"/>
      <ellipse cx="352" cy="161" rx="9.5" ry="6.2" fill="#64748b" stroke="#1e293b" stroke-width="1.4"/>
      <ellipse cx="372" cy="158" rx="9" ry="6" fill="#475569" stroke="#1e293b" stroke-width="1.4"/>
      <ellipse cx="386" cy="152" rx="8" ry="5.5" fill="#64748b" stroke="#1e293b" stroke-width="1.4"/>
      <!-- 多层灵动火焰 -->
      <g class="camp-stage__flame" transform="translate(340 148) scale(${flameScale}) translate(-340 -148)">
        <!-- 外层主火舌与左右卷曲火苗 -->
        <path d="M340 64 C324 84, 304 106, 314 134 C304 122, 298 108, 302 96 C292 114, 296 138, 314 147 C328 154, 352 154, 366 147 C384 138, 388 112, 376 94 C380 108, 374 122, 366 132 C374 106, 354 86, 340 64 Z" fill="url(#flameOuter)"/>
        <!-- 中层暖橙火舌 -->
        <path d="M338 78 C326 96, 314 116, 322 140 C316 130, 314 118, 318 108 C312 122, 316 140, 326 147 C336 152, 346 152, 356 146 C366 138, 368 118, 360 104 C362 116, 358 128, 352 136 C358 114, 348 94, 338 78 Z" fill="url(#flameMid)" opacity="0.92"/>
        <!-- 内层亮黄白炽火芯 -->
        <path d="M340 94 C330 108, 324 126, 331 144 C336 149, 344 149, 349 144 C356 126, 350 108, 340 94 Z" fill="url(#flameInner)"/>
        <ellipse cx="340" cy="142" rx="10" ry="6" fill="#ffffff" opacity="0.75"/>
      </g>
      <!-- 升腾火星与森林萤火虫 -->
      <circle class="camp-spark camp-spark--1" cx="330" cy="82" r="2.4" fill="#fde047"/>
      <circle class="camp-spark camp-spark--2" cx="352" cy="72" r="2" fill="#fb923c"/>
      <circle class="camp-spark camp-spark--3" cx="338" cy="58" r="1.8" fill="#fef08a"/>
      <circle class="camp-spark camp-spark--4" cx="238" cy="112" r="2.2" fill="#86efac" opacity="0.82"/>
      <circle class="camp-spark camp-spark--5" cx="454" cy="104" r="2.2" fill="#86efac" opacity="0.82"/>
    </svg>
  `;
}

export function createRenderBonfireActions({ elBonfireActions, elBtnGather, ui, getState }) {
  let lastBonfireSig = "";
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
      const narrow = typeof window !== "undefined" && window.innerWidth < 520;
      const text = narrow
        ? charges <= 0
          ? `采集 0${cd > 0 ? ` · ${fmtRemain(cd)}` : ""}`
          : `采集 ${charges}${combo >= 2 ? ` x${combo}` : ""}`
        : charges >= 1000
          ? `采集 ${charges}/1000${combo >= 2 ? ` · 连击 x${combo}` : ""}`
          : cd > 0
            ? `采集 ${charges}/1000（+1 ${fmtRemain(cd)}）${combo >= 2 ? ` · 连击 x${combo}` : ""}`
            : `采集 ${charges}/1000${combo >= 2 ? ` · 连击 x${combo}` : ""}`;
      elBtnGather.textContent = text;
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
        fireInfo.tier,
        companions.map((c) => `${c.id}:${c.lvl}:${c.isShiny ? 1 : 0}:${c.mood}`).join(","),
      ].join("|");

      if (!ui?.bonfireDirty && sig === lastBonfireSig && elBonfireActions.childElementCount > 0) {
        return;
      }
      lastBonfireSig = sig;

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

      const stepDotsHtml = Array.from({ length: compass.totalSteps }, (_, i) => {
        const sNum = i + 1;
        const cls = sNum < compass.stepIndex ? "is-done" : sNum === compass.stepIndex ? "is-active" : "";
        return `<span class="compass-dot ${cls}" title="阶段 ${sNum}"></span>`;
      }).join("");

      elBonfireActions.innerHTML = `
        <div class="camp-stage">
          <div class="camp-stage__backdrop">
            ${renderCampStageSvg(fireInfo.tier)}
            <div class="camp-stage__header">
              <span class="camp-stage__badge">🔥 ${escapeHtml(fireInfo.label)}</span>
              <span class="camp-stage__sub">点击伙伴可互动 · 灵果与建筑越丰盛，营地火光越明亮</span>
            </div>
            <div class="camp-stage__companions">
              ${companionSlotsHtml}
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
            <div class="row__desc">${escapeHtml(compass.desc)}</div>
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

        <div class="row">
          <div class="row__left">
            <div class="row__title">营地采集</div>
            <div class="row__desc">顶栏【采集】消耗次数换灵果。当前 ${charges}/1000 · ${cdText}${clicks > 0 ? ` · 累计 ${clicks} 次` : ""}</div>
            <div class="row__desc">${mileText} · ${dailyText}</div>
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

      // Early clicks are fatter so the first research isn't a click marathon
      const cat = Math.min(100, 3 + tier * 2);
      const wood = Math.min(100, 1 + tier * 0.75);
      const min = Math.min(100, 0.5 + tier * 0.35);

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
