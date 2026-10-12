// 全服 Buff 栏渲染（SECTION:RENDER_SERVER_BUFF_BAR 拆出）
// 维护者窗口：C

import { escapeHtml, fmtDuration } from "../utils.js";
import { SERVER_BUFF_KEYS, SERVER_BUFF_UI } from "../systems/server_buffs.js";

export function createRenderServerBuffBar({ elServerBuffBar, ui, serverBuffEffectText }) {
  return function renderServerBuffBar() {
    if (!elServerBuffBar) return;
    if (!ui.serverBuffsDirty) return;

    const items = Array.isArray(ui.serverBuffs?.items) ? ui.serverBuffs.items : [];
    const byKey = new Map(items.map((it) => [String(it?.key || ""), it]));

    const rows = [];
    for (let idx = 0; idx < SERVER_BUFF_KEYS.length; idx += 1) {
      const key = SERVER_BUFF_KEYS[idx];
      const it = byKey.get(key) || null;
      const lvl = typeof it?.level === "number" && Number.isFinite(it.level) ? Math.max(0, Math.floor(it.level)) : 0;
      const rem = typeof it?.remainingSec === "number" && Number.isFinite(it.remainingSec) ? Math.max(0, Math.floor(it.remainingSec)) : 0;
      const cfg = SERVER_BUFF_UI[key];
      const icon = cfg?.icon ?? key;
      const title = cfg?.name ?? key;
      const effectLine = serverBuffEffectText(key, lvl);

      const tipShift = idx * 52;

      const contrib = Array.isArray(it?.contributors) ? it.contributors : [];
      const contribLines = contrib.length
        ? contrib
            .slice(0, 10)
            .map((c, idx) => {
              const nm = escapeHtml(String(c?.name || c?.uid || "-") || "-");
              const sec = typeof c?.sec === "number" && Number.isFinite(c.sec) ? Math.max(0, Math.floor(c.sec)) : 0;
              return `<div class="serverBuffBar__tipLine muted">#${idx + 1} ${nm} · ${fmtDuration(sec)}</div>`;
            })
            .join("")
        : `<div class="serverBuffBar__tipLine muted">暂无贡献者</div>`;

      rows.push(`
        <div class="serverBuffBar__slot">
          <button class="serverBuffBar__btn ${lvl > 0 ? "" : "is-off"}" data-sbuff-key="${escapeHtml(key)}" type="button" aria-label="${escapeHtml(title)}">
            <span>${escapeHtml(icon)}</span>
            <span class="serverBuffBar__lvl">${lvl > 0 ? lvl : 0}</span>
          </button>
          <div class="serverBuffBar__tip" style="--sbuff-tip-shift:${tipShift}px">
            <div class="serverBuffBar__tipTitle">${escapeHtml(title)} Lv.${lvl}</div>
            <div class="serverBuffBar__tipLine">效果：${escapeHtml(effectLine)}</div>
            <div class="serverBuffBar__tipLine">剩余：${escapeHtml(fmtDuration(rem))}</div>
            <div class="serverBuffBar__tipLine muted" style="margin-top:6px">贡献者（按贡献时间）</div>
            ${contribLines}
            <div class="serverBuffBar__tipLine muted" style="margin-top:8px">点击图标可购买/续费（1未来币=1分钟）</div>
          </div>
        </div>
      `);
    }

    const elBody = document.getElementById("serverBuffBody") || elServerBuffBar;
    elBody.innerHTML = rows.join("");
    ui.serverBuffsDirty = false;
  };
}
