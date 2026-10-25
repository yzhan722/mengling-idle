// 全局弹窗渲染 + 弹窗事件绑定（SECTION:RENDER_OVERLAYS + elOverlays 监听 拆出）
// 维护者窗口：C

import { escapeHtml, fmtDuration } from "../utils.js";
import { SERVER_BUFF_KEYS, SERVER_BUFF_UI, SERVER_BUFF_BUY_MAX_MINUTES } from "../systems/server_buffs.js";

export function createRenderOverlays({ elOverlays, ui, defs }) {
  return function renderOverlays() {
    if (!elOverlays) return;
    if (!ui.overlaysDirty) return;

    let prevSbuffFocused = false;
    let prevSbuffStart = null;
    let prevSbuffEnd = null;
    try {
      const ae = typeof document !== "undefined" ? document.activeElement : null;
      if (ae && ae instanceof HTMLElement && elOverlays.contains(ae) && ae.matches("input[data-sbuff-min-input]")) {
        prevSbuffFocused = true;
        prevSbuffStart = typeof ae.selectionStart === "number" ? ae.selectionStart : null;
        prevSbuffEnd = typeof ae.selectionEnd === "number" ? ae.selectionEnd : null;
      }
    } catch {
    }

    const rows = [];

    const expOpen = Boolean(ui.expeditionRewardModalOpen);
    const expData = ui.expeditionRewardModalData;
    if (expOpen && expData && typeof expData === "object") {
      const expPerMon = typeof expData.expPerMon === "number" && Number.isFinite(expData.expPerMon) ? Math.max(0, Math.floor(expData.expPerMon)) : 0;
      const monCount = typeof expData.monCount === "number" && Number.isFinite(expData.monCount) ? Math.max(0, Math.floor(expData.monCount)) : 0;
      const fc = typeof expData.futurecoin === "number" && Number.isFinite(expData.futurecoin) ? Math.max(0, Math.floor(expData.futurecoin)) : 0;
      const mb = typeof expData.masterball === "number" && Number.isFinite(expData.masterball) ? Math.max(0, Math.floor(expData.masterball)) : 0;
      const potMap0 = expData.potions && typeof expData.potions === "object" ? expData.potions : {};
      const potEntries = Object.entries(potMap0)
        .map(([rid, qty]) => ({ rid: String(rid || ""), qty: Math.max(0, Math.floor(Number(qty))) }))
        .filter((x) => x.rid && x.qty > 0);

      const potText =
        potEntries.length > 0
          ? potEntries
              .map((x) => `${escapeHtml(defs.resources?.[x.rid]?.name ?? x.rid)} x${x.qty}`)
              .join(" · ")
          : "无";

      rows.push(`
        <div class="modalOverlay" data-exp-reward-overlay="1">
          <div class="modal">
            <div class="modal__header">
              <div class="modal__title">远征归来 · 战利品结算</div>
              <div class="modal__right">
                <button class="btn btn--small" data-exp-reward-close="1">关闭</button>
              </div>
            </div>
            <div class="modal__desc">本次远征探索顺利结束，获得如下战利品奖励：</div>
            <div class="modal__body">
              <div class="row">
                <div class="row__left">
                  <div class="row__title row__titleLine">
                    <span>基础收益</span>
                    ${expPerMon > 0 && monCount > 0 ? `<span class="tag">经验 +${expPerMon}/只（共${monCount}只）</span>` : ""}
                    ${fc > 0 ? `<span class="tag">${escapeHtml(defs.resources?.futurecoin?.name ?? "未来币")} +${fc}</span>` : ""}
                    ${mb > 0 ? `<span class="tag">${escapeHtml(defs.resources?.masterball?.name ?? "究极灵球")} +${mb}</span>` : ""}
                  </div>
                  <div class="row__desc">属性药剂掉落：${potText}</div>
                </div>
              </div>
              ${expData.eventCard?.title ? `<div class="row"><div class="row__left"><div class="row__title row__titleLine"><span class="tag">秘境奇遇</span><span>${escapeHtml(expData.eventCard.title)}</span></div><div class="row__desc">${escapeHtml(expData.eventCard.blurb || "")}</div></div></div>` : ""}
              ${expData.seasonRelic?.name ? `<div class="row"><div class="row__left"><div class="row__title row__titleLine"><span class="tag">赛季印记</span><span>${escapeHtml(expData.seasonRelic.name)}（累计 ${Math.floor(expData.seasonRelic.count || 1)}）</span></div><div class="row__desc">转化奖励：${escapeHtml(defs.resources?.[expData.seasonRelic.item]?.name ?? expData.seasonRelic.item)}</div></div></div>` : ""}
            </div>
            <div class="actions">
              <button class="btn btn--primary" data-exp-reward-close="1">收下奖励</button>
            </div>
          </div>
        </div>
      `);
    }

    const b = ui.bossBully;
    const open = Boolean(ui.bossBullyRewardModalOpen);
    const killSeq = typeof b?.killSeq === "number" && Number.isFinite(b.killSeq) ? Math.floor(b.killSeq) : 0;
    const claimed = Boolean(b?.claimed);
    const rewardType = String(b?.rewardType || "");
    const rewardQty = typeof b?.rewardQty === "number" && Number.isFinite(b.rewardQty) ? Math.max(0, Math.floor(b.rewardQty)) : 0;
    const rewards = b && typeof b === "object" && b.rewards && typeof b.rewards === "object" ? b.rewards : null;
    const rewardEntries = rewards && typeof rewards === "object" ? Object.entries(rewards).filter(([k, v]) => k && typeof v === "number" && Number.isFinite(v) && v > 0) : [];

    if (open && killSeq > 0 && !claimed && (rewardEntries.length > 0 || (rewardType && rewardQty > 0))) {
      const rewardLines = rewardEntries.length
        ? rewardEntries
            .map(([k, v]) => `<div class="row__desc">${escapeHtml(defs.resources?.[k]?.name ?? k)} x${Math.floor(v)}</div>`)
            .join("")
        : `<div class="row__desc">${escapeHtml(rewardType)} x${rewardQty}</div>`;
      rows.push(`
        <div class="modalOverlay" data-boss-bully-overlay="1">
          <div class="modal">
            <div class="modal__header">
              <div class="modal__title">林佬奖励</div>
              <div class="modal__right">
                <button class="btn btn--small" data-boss-bully-close="1">关闭</button>
              </div>
            </div>
            <div class="modal__desc">林佬已被击败（第 ${killSeq} 次）。你有未领取奖励。</div>
            <div class="modal__body">
              <div class="row">
                <div class="row__left">
                  <div class="row__title">奖励</div>
                  ${rewardLines}
                </div>
                <div class="row__right">
                  <button class="btn btn--primary" data-boss-bully-claim="1">领取</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `);
    }

    const sbOpen = Boolean(ui.serverBuffBuyModalOpen);
    const sbKey = String(ui.serverBuffBuyKey || "");
    if (sbOpen && SERVER_BUFF_KEYS.includes(sbKey)) {
      const cfg = SERVER_BUFF_UI[sbKey];
      const title = cfg?.name ?? sbKey;
      const minutes = Number.isFinite(ui.serverBuffBuyMinutes) && ui.serverBuffBuyMinutes > 0 ? String(Math.floor(ui.serverBuffBuyMinutes)) : "";
      rows.push(`
        <div class="modalOverlay" data-sbuff-overlay="1">
          <div class="modal">
            <div class="modal__header">
              <div class="modal__title">购买全服增益</div>
              <div class="modal__right">
                <button class="btn btn--small" data-sbuff-close="1">关闭</button>
              </div>
            </div>
            <div class="modal__desc">${escapeHtml(title)}（1未来币=1分钟）</div>
            <div class="modal__body">
              <div class="row">
                <div class="row__left">
                  <div class="row__title">购买时长（分钟）</div>
                  <div class="row__desc">花费未来币 = 分钟数</div>
                </div>
                <div class="row__right">
                  <input class="input" type="number" inputmode="numeric" min="1" max="${SERVER_BUFF_BUY_MAX_MINUTES}" step="1" value="${minutes}" data-sbuff-min-input />
                  <button class="btn btn--primary" data-sbuff-buy="1">购买</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `);
    }

    elOverlays.innerHTML = rows.join("");

    if (prevSbuffFocused) {
      try {
        const inp = elOverlays.querySelector("input[data-sbuff-min-input]");
        if (inp && typeof inp.focus === "function") {
          inp.focus();
          if (typeof inp.setSelectionRange === "function" && typeof prevSbuffStart === "number" && typeof prevSbuffEnd === "number") {
            inp.setSelectionRange(prevSbuffStart, prevSbuffEnd);
          }
        }
      } catch {
      }
    }
    ui.overlaysDirty = false;
  };
}

// elOverlays 的 input/click 委托：远征奖励 / 全服Buff购买 / 林佬奖励 三个弹层
export function bindOverlayEvents({
  elOverlays,
  ui,
  addLog,
  buyServerBuff,
  closeServerBuffBuyModal,
  closeExpeditionRewardModal,
  closeBossBullyRewardModal,
  claimBossBullyReward,
}) {
  if (!elOverlays) return;

  elOverlays.addEventListener("input", (ev) => {
    const input = ev.target?.closest?.("input[data-sbuff-min-input]");
    if (!input || !elOverlays.contains(input)) return;
    const raw = String(input.value || "").trim();
    const n = Math.floor(Number(raw));
    ui.serverBuffBuyMinutes = Number.isFinite(n) && n > 0 ? n : 0;
  });

  elOverlays.addEventListener("click", (ev) => {
    const expClose = ev.target?.closest?.("button[data-exp-reward-close]");
    if (expClose && elOverlays.contains(expClose)) {
      closeExpeditionRewardModal();
      return;
    }

    const expOverlay = ev.target?.closest?.("div[data-exp-reward-overlay]");
    if (expOverlay && elOverlays.contains(expOverlay) && ev.target === expOverlay) {
      closeExpeditionRewardModal();
      return;
    }

    const sbClose = ev.target?.closest?.("button[data-sbuff-close]");
    if (sbClose && elOverlays.contains(sbClose)) {
      closeServerBuffBuyModal();
      return;
    }

    const sbBuy = ev.target?.closest?.("button[data-sbuff-buy]");
    if (sbBuy && elOverlays.contains(sbBuy)) {
      const input = elOverlays.querySelector("input[data-sbuff-min-input]");
      const raw = input ? String(input.value || "").trim() : String(ui.serverBuffBuyMinutes || "");
      const m0 = Math.floor(Number(raw));
      if (!Number.isFinite(m0) || m0 < 1) {
        addLog("请输入正确分钟数。", true);
        return;
      }
      ui.serverBuffBuyMinutes = m0;
      buyServerBuff(ui.serverBuffBuyKey, m0);
      return;
    }

    const sbOverlay = ev.target?.closest?.("div[data-sbuff-overlay]");
    if (sbOverlay && elOverlays.contains(sbOverlay) && ev.target === sbOverlay) {
      closeServerBuffBuyModal();
      return;
    }

    const closeBtn = ev.target?.closest?.("button[data-boss-bully-close]");
    if (closeBtn && elOverlays.contains(closeBtn)) {
      closeBossBullyRewardModal({ snoozeMin: 10 });
      return;
    }

    const claimBtn = ev.target?.closest?.("button[data-boss-bully-claim]");
    if (claimBtn && elOverlays.contains(claimBtn)) {
      claimBossBullyReward();
      return;
    }

    const overlay = ev.target?.closest?.("div[data-boss-bully-overlay]");
    if (overlay && elOverlays.contains(overlay) && ev.target === overlay) {
      closeBossBullyRewardModal({ snoozeMin: 10 });
      return;
    }
  });
}
