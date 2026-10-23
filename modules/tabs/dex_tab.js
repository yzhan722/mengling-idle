import { canClaimDexRegion, markDexRegionClaimed } from "../systems/gameplay_fun.js";
import { buildShinyShareText, shinyGalleryEntries, shinyShareCardPayload, shinyUniqueCount } from "../systems/collection_fun.js";
import { downloadDataUrl, drawShinyShareCard } from "../render/shiny_share.js";
import { renderBeastIcon } from "../sprites.js";
import { escapeHtml, pad3 } from "../utils.js";

function openShinyShowcaseModal(state, focusDex = null) {
  if (typeof document === "undefined") return;
  const existing = document.getElementById("shinyShowcaseOverlay");
  if (existing) existing.remove();

  const entries = shinyGalleryEntries(state, 48);
  if (!entries.length) return;
  const unique = shinyUniqueCount(state);
  const picked =
    focusDex && focusDex !== "all"
      ? entries.find((e) => String(e.dex) === String(focusDex)) || entries[0]
      : entries[0];

  const overlay = document.createElement("div");
  overlay.id = "shinyShowcaseOverlay";
  overlay.className = "modalOverlay shiny-showcase-overlay";

  const renderContent = (spotlight) => {
    const cardsHtml = entries
      .map((e) => {
        const active = e.dex === spotlight.dex;
        return `
          <button type="button" class="shiny-showcase__pedestal ${active ? "is-active" : ""}" data-showcase-pick="${escapeHtml(String(e.dex))}">
            <div class="shiny-showcase__pedestalArt">${renderBeastIcon(e.dex, e.name, true)}</div>
            <div class="shiny-showcase__pedestalName">#${pad3(e.dex)} ${escapeHtml(e.name)}</div>
          </button>
        `;
      })
      .join("");

    overlay.innerHTML = `
      <div class="modal shiny-showcase" role="dialog" aria-modal="true" aria-label="闪光馆全屏陈列台">
        <div class="shiny-showcase__header">
          <div>
            <div class="shiny-showcase__eyebrow">✨ SHINY GALLERY · 闪光星芒殿堂</div>
            <div class="shiny-showcase__title">已点亮 ${unique} 种闪光萌灵</div>
          </div>
          <button type="button" class="btn btn--small btn--ghost" data-showcase-close>关闭 ✕</button>
        </div>
        <div class="shiny-showcase__stage">
          <div class="shiny-showcase__rays" aria-hidden="true"></div>
          <div class="shiny-showcase__heroArt">${renderBeastIcon(spotlight.dex, spotlight.name, true)}</div>
          <div class="shiny-showcase__heroMeta">
            <span class="badge badge--ok">★ 闪光珍藏 #${pad3(spotlight.dex)}</span>
            <div class="shiny-showcase__heroName">${escapeHtml(spotlight.name)}</div>
            <div class="shiny-showcase__heroSub">概率 1/512 的星芒异色个体 · 永久铭刻于图鉴殿堂</div>
          </div>
        </div>
        <div class="shiny-showcase__grid">
          ${cardsHtml}
        </div>
      </div>
    `;
  };

  renderContent(picked);
  document.body.appendChild(overlay);

  overlay.addEventListener("click", (ev) => {
    if (ev.target === overlay || ev.target?.closest?.("[data-showcase-close]")) {
      overlay.remove();
      return;
    }
    const pickBtn = ev.target?.closest?.("[data-showcase-pick]");
    if (pickBtn && overlay.contains(pickBtn)) {
      const d = Number(pickBtn.getAttribute("data-showcase-pick"));
      const found = entries.find((e) => e.dex === d);
      if (found) renderContent(found);
    }
  });
}

export function initDexTab({
  ui,
  elDexArea,
  elDexSearch,
  elDexOnlyCaught,
  elDexOnlyMissing,
  elDexOnlyShiny,
  elDexPrev,
  elDexNext,
  elDexList,
  elDexSummary,
  markDexDirty,
  setActiveTab,
  getState,
  addRes,
  addLog,
  render,
}) {
  if (typeof setActiveTab === "function") {
    for (const host of [elDexList, elDexSummary]) {
      if (!host) continue;
      host.addEventListener("click", (e) => {
        const btn = e.target?.closest?.("[data-dex-goto-capture]");
        if (!btn || !host.contains(btn)) return;
        setActiveTab("capture");
      });
    }
  }

  if (elDexSummary) {
    elDexSummary.addEventListener("click", async (e) => {
      const showcaseBtn = e.target?.closest?.("[data-dex-shiny-showcase]");
      if (showcaseBtn && elDexSummary.contains(showcaseBtn)) {
        const state = typeof getState === "function" ? getState() : null;
        const focusDex = showcaseBtn.getAttribute("data-dex-shiny-showcase");
        openShinyShowcaseModal(state, focusDex);
        return;
      }

      const cardBtn = e.target?.closest?.("[data-dex-shiny-card]");
      if (cardBtn && elDexSummary.contains(cardBtn)) {
        const state = typeof getState === "function" ? getState() : null;
        const payload = shinyShareCardPayload(state);
        const dataUrl = drawShinyShareCard(payload);
        if (dataUrl && downloadDataUrl(dataUrl)) {
          if (typeof addLog === "function") addLog("已保存闪光馆分享卡", true);
        } else {
          const text = buildShinyShareText(state);
          try {
            if (text && navigator?.clipboard?.writeText) await navigator.clipboard.writeText(text);
            if (typeof addLog === "function") addLog(text ? "画布不可用，已复制分享文案" : "闪光馆还是空的");
          } catch {
            if (typeof addLog === "function") addLog("分享卡生成失败");
          }
        }
        return;
      }
      const btn = e.target?.closest?.("[data-dex-shiny-share]");
      if (!btn || !elDexSummary.contains(btn)) return;
      const text = btn.getAttribute("data-share") || "";
      if (!text) return;
      try {
        if (navigator?.clipboard?.writeText) await navigator.clipboard.writeText(text);
        else {
          const ta = document.createElement("textarea");
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
        }
        if (typeof addLog === "function") addLog("已复制闪光馆分享文案", true);
      } catch {
        if (typeof addLog === "function") addLog("复制失败，请手动选中分享");
      }
    });
  }

  const claimHost = elDexSummary || elDexList;
  if (claimHost) {
    claimHost.addEventListener("click", (e) => {
      const btn = e.target?.closest?.("button[data-dex-claim-region]");
      if (!btn || !claimHost.contains(btn)) return;
      if (btn.disabled) return;
      const areaId = btn.getAttribute("data-dex-claim-region");
      if (!areaId) return;
      const state = typeof getState === "function" ? getState() : null;
      if (!state || typeof state !== "object") return;
      if (!state.meta || typeof state.meta !== "object") state.meta = {};
      if (!canClaimDexRegion(state.meta, areaId)) {
        if (typeof addLog === "function") addLog("该区域奖励已领取");
        return;
      }
      if (!markDexRegionClaimed(state.meta, areaId)) return;
      if (typeof addRes === "function") addRes("futurecoin", 10);
      if (typeof addLog === "function") addLog(`图鉴区域完成奖励：未来币 +10`, true);
      markDexDirty(false);
      if (typeof render === "function") render();
    });
  }

  if (elDexSearch) {
    elDexSearch.value = ui.dexQuery;
    elDexSearch.addEventListener("input", () => {
      ui.dexQuery = elDexSearch.value ?? "";
      markDexDirty(true);
    });
  }

  if (elDexArea) {
    elDexArea.addEventListener("change", () => {
      ui.dexAreaId = elDexArea.value || "all";
      markDexDirty(true);
    });
  }

  if (elDexOnlyCaught) {
    elDexOnlyCaught.checked = ui.dexOnlyCaught;
    elDexOnlyCaught.addEventListener("change", () => {
      ui.dexOnlyCaught = Boolean(elDexOnlyCaught.checked);
      if (ui.dexOnlyCaught) {
        ui.dexOnlyMissing = false;
        ui.dexOnlyShiny = false;
        if (elDexOnlyMissing) elDexOnlyMissing.checked = false;
        if (elDexOnlyShiny) elDexOnlyShiny.checked = false;
      }
      markDexDirty(true);
    });
  }

  if (elDexOnlyMissing) {
    elDexOnlyMissing.checked = ui.dexOnlyMissing;
    elDexOnlyMissing.addEventListener("change", () => {
      ui.dexOnlyMissing = Boolean(elDexOnlyMissing.checked);
      if (ui.dexOnlyMissing) {
        ui.dexOnlyCaught = false;
        ui.dexOnlyShiny = false;
        if (elDexOnlyCaught) elDexOnlyCaught.checked = false;
        if (elDexOnlyShiny) elDexOnlyShiny.checked = false;
      }
      markDexDirty(true);
    });
  }

  if (elDexOnlyShiny) {
    elDexOnlyShiny.checked = ui.dexOnlyShiny;
    elDexOnlyShiny.addEventListener("change", () => {
      ui.dexOnlyShiny = Boolean(elDexOnlyShiny.checked);
      if (ui.dexOnlyShiny) {
        ui.dexOnlyCaught = false;
        ui.dexOnlyMissing = false;
        if (elDexOnlyCaught) elDexOnlyCaught.checked = false;
        if (elDexOnlyMissing) elDexOnlyMissing.checked = false;
      }
      markDexDirty(true);
    });
  }

  if (elDexPrev) {
    elDexPrev.addEventListener("click", () => {
      ui.dexPage -= 1;
      markDexDirty(false);
    });
  }

  if (elDexNext) {
    elDexNext.addEventListener("click", () => {
      ui.dexPage += 1;
      markDexDirty(false);
    });
  }
}
