// 设置页「今日指挥部」区块渲染（app.js renderOptionsGoals 拆出）
// 维护者窗口：C

import { escapeHtml } from "../utils.js";
import { renderResSvg, renderUiIcon } from "../render/rpg_svg_icons.js";
import {
  dailyGoalsChecklist,
  sessionHighlightsLine,
  canClaimDailyGoalsBundle,
  markDailyGoalsBundleClaimed,
  bumpLoginStreak,
  loginStreakLine,
  localDateStr,
} from "../systems/gameplay_fun.js";

export function createOptionsGoals({ ui, getState, addRes, addLog, activateTab }) {
  return function renderOptionsGoals() {
    const el = document.getElementById("dailyGoalsList");
    if (!el) return;
    const state = getState();
    if (!state.meta || typeof state.meta !== "object") state.meta = {};
    const streak = bumpLoginStreak(state.meta, localDateStr());
    const streakLine = loginStreakLine(state.meta) || `连续登录 ${streak} 天`;
    const items = dailyGoalsChecklist(state);
    const highlights = sessionHighlightsLine(state);
    const canBundle = canClaimDailyGoalsBundle(state, localDateStr());
    const bundleClaimed = state.meta.dailyGoalsClaimDate === localDateStr();
    el.innerHTML = `
      <div class="row">
        <div class="row__left">
          <div class="row__title row__titleLine">${renderResSvg("futurecoin", 18)}<span>今日指挥部</span><span class="tag">${escapeHtml(streakLine)}</span><span class="tag">悬赏 +12 未来币</span></div>
          <div class="row__desc daily-goal-chips">${items
            .map((g) => `<span class="goal-chip ${g.done ? "is-done" : ""}"><span class="goal-chip__mark">${g.done ? "✓" : "○"}</span><span>${escapeHtml(g.label)}</span></span>`)
            .join("")}</div>
          ${highlights ? `<div class="row__desc muted">${escapeHtml(highlights)}</div>` : ""}
        </div>
        <div class="row__right">
          <button type="button" class="btn btn--primary btn--small" data-opt-goals-claim ${canBundle ? "" : "disabled"}>${bundleClaimed ? "日目标已领" : "完成三目标 +12"}</button>
        </div>
      </div>
      <div class="row">
        <div class="row__left">
          <div class="row__title row__titleLine">${renderUiIcon("tab_capture", 18)}<span>一键出发</span><span class="tag">快捷传送</span></div>
          <div class="row__desc">点按钮直达核心循环，不用在菜单里找。</div>
        </div>
        <div class="row__right">
          <button type="button" class="btn btn--primary btn--small" data-opt-goto="capture">去捕捉</button>
          <button type="button" class="btn btn--small" data-opt-goto="pve">去挑战</button>
          <button type="button" class="btn btn--small" data-opt-goto="functions">去功能</button>
          <button type="button" class="btn btn--small" data-opt-goto="future">去商店</button>
        </div>
      </div>
    `;
    el.querySelectorAll("[data-opt-goto]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const name = btn.getAttribute("data-opt-goto");
        if (name) activateTab(name);
      });
    });
    const claimBtn = el.querySelector("[data-opt-goals-claim]");
    if (claimBtn) {
      claimBtn.addEventListener("click", () => {
        if (!markDailyGoalsBundleClaimed(state, localDateStr())) {
          if (typeof addLog === "function") addLog("日目标未完成或已领取");
          return;
        }
        if (typeof addRes === "function") addRes("futurecoin", 12);
        else {
          if (!state.res.futurecoin) state.res.futurecoin = { value: 0 };
          state.res.futurecoin.value = Math.max(0, Math.floor(state.res.futurecoin.value || 0)) + 12;
        }
        if (typeof addLog === "function") addLog("日目标全清：未来币 +12", true);
        renderOptionsGoals();
      });
    }
    ui.optionsDirty = false;
  };
}
