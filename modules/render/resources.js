// ponytail: 产能摘要已由各资源筹码 .resrow__meta 承担，不再往顶栏插重复 #prodHint

// 将速率转为更直观的文本：速率很低时显示「约Xs/个」
function fmtRate(perSec) {
  if (perSec <= 0) return "0/秒";
  if (perSec < 0.5) {
    const secPer = Math.round(1 / perSec);
    return `约${secPer}s/个`;
  }
  if (perSec < 1) return `${perSec.toFixed(2)}/秒`;
  return `${Math.floor(perSec)}/秒`;
}

// 根据图鉴数量计算育灵师等级（适配 160 图鉴与 9 大生态区解锁节奏）
export function getTrainerLevel(dexUnique) {
  const n = Math.max(0, Math.floor(dexUnique || 0));
  if (n >= 150) return { level: 9, name: "幻梦大宗师", next: null, nextReq: 160 };
  if (n >= 120) return { level: 8, name: "秘境寻梦者", next: "全图鉴宗师", nextReq: 150 };
  if (n >= 100) return { level: 7, name: "幽谷驭龙师", next: "幻梦秘境", nextReq: 120 };
  if (n >= 80)  return { level: 6, name: "霜脊守望者", next: "龙眠幽谷", nextReq: 100 };
  if (n >= 60)  return { level: 5, name: "月庭聆风使", next: "霜晶山脊", nextReq: 80 };
  if (n >= 45)  return { level: 4, name: "星砂荒漠客", next: "月见花园", nextReq: 60 };
  if (n >= 30)  return { level: 3, name: "风铃高原行", next: "星砂荒漠", nextReq: 45 };
  if (n >= 15)  return { level: 2, name: "浅滩游猎手", next: "风铃高原", nextReq: 30 };
  if (n >= 5)   return { level: 2, name: "蜜林育灵员", next: "溪光浅滩", nextReq: 15 };
  return         { level: 1, name: "初阶育灵师", next: "蜜露林径", nextReq: 5 };
}

export function createRenderResources({ elResources, defs, fmt, getState }) {
  let lastSignature = "";
  let lastOrder = [];
  const rowMap = new Map();
  const fmtInt = (n) => {
    if (typeof n !== "number" || Number.isNaN(n)) return "0";
    return String(Math.floor(n));
  };

  const buildRows = (items) => {
    if (!elResources) return;
    elResources.innerHTML = "";
    rowMap.clear();
    const frag = document.createDocumentFragment();
    for (const it of items) {
      const row = document.createElement("div");
      row.className = "resrow";
      row.dataset.rid = it.id;

      const left = document.createElement("div");
      left.className = "resrow__left";
      const nameEl = document.createElement("div");
      nameEl.className = "resrow__k";
      nameEl.textContent = it.name;

      const metaEl = document.createElement("div");
      metaEl.className = "resrow__meta";
      metaEl.textContent = it.meta;

      left.append(nameEl, metaEl);

      const valueEl = document.createElement("div");
      valueEl.className = "resrow__v";
      const valueText = it.noCap ? fmtInt(it.value) : `${fmtInt(it.value)} / ${fmtInt(it.cap)}`;
      valueEl.textContent = valueText;

      const track = document.createElement("div");
      track.className = "resrow__track";
      const fill = document.createElement("div");
      fill.className = "resrow__fill";
      const capN = typeof it.cap === "number" && it.cap > 0 ? it.cap : 0;
      const pct = !it.noCap && capN > 0 ? Math.max(0, Math.min(100, Math.round((it.value / capN) * 100))) : 0;
      fill.style.width = `${pct}%`;
      track.append(fill);

      row.append(left, valueEl, track);
      frag.append(row);
      rowMap.set(it.id, {
        row,
        nameEl,
        metaEl,
        valueEl,
        fill,
        lastName: it.name,
        lastMeta: it.meta,
        lastValue: valueText,
        lastPct: pct,
      });
    }
    elResources.append(frag);
  };

  // 渲染育灵师等级（默认折叠；挂在 #trainerHost，与品牌同属身份区）
  function renderTrainerLevel(state) {
    const host = document.getElementById("trainerHost") || elResources?.parentNode;
    if (!host) return;
    const caught = state.dex?.caught ?? {};
    let unique = 0;
    for (const v of Object.values(caught)) {
      if (typeof v === "number" && v > 0) unique++;
    }
    const info = getTrainerLevel(unique);
    const containerId = "trainerLevelBar";
    let el = document.getElementById(containerId);
    if (!el) {
      el = document.createElement("details");
      el.id = containerId;
      el.className = "trainerLevel";
      host.appendChild(el);
    } else if (el.parentNode !== host) {
      host.appendChild(el);
    }
    const pct = info.next ? Math.min(100, Math.round((unique / info.nextReq) * 100)) : 100;
    const nextTip = info.next ? `→ 解锁「${info.next}」(${unique}/${info.nextReq})` : "全部地图已解锁";
    const wasOpen = el.open;
    el.innerHTML = `
      <summary class="trainerLevel__summary">Lv.${info.level} ${info.name}</summary>
      <div class="trainerLevel__row">
        <span class="trainerLevel__tip">${nextTip}</span>
      </div>
      <div class="trainerLevel__bar"><div class="trainerLevel__fill" style="width:${pct}%"></div></div>
    `;
    el.open = wasOpen;
  }

  return function renderResources(eff) {
    const state = getState();

    // 育灵师等级始终刷新（不受 signature 缓存影响）
    renderTrainerLevel(state);

    const items = [];

    items.push({
      id: "catnip",
      name: defs.resources.catnip.name,
      value: state.res.catnip.value,
      cap: state.res.catnip.cap,
      meta: fmtRate(eff.catnipPerSec),
    });

    if (state.unlocks.wood || state.res.wood.value > 0) {
      items.push({
        id: "wood",
        name: defs.resources.wood.name,
        value: state.res.wood.value,
        cap: state.res.wood.cap,
        meta: fmtRate(eff.woodPerSec),
      });
    }

    if (state.unlocks.minerals || state.res.minerals.value > 0) {
      items.push({
        id: "minerals",
        name: defs.resources.minerals.name,
        value: state.res.minerals.value,
        cap: state.res.minerals.cap,
        meta: fmtRate(eff.mineralsPerSec),
      });
    }

    const signature = items
      .map((it) => `${it.id}:${fmtInt(it.value)}:${fmtInt(it.cap)}:${it.meta}:${it.noCap ? 1 : 0}`)
      .join("|");
    if (signature === lastSignature) return;
    lastSignature = signature;

    const order = items.map((it) => it.id);
    const orderChanged = order.length !== lastOrder.length || order.some((id, idx) => lastOrder[idx] !== id);
    if (orderChanged || rowMap.size === 0) {
      lastOrder = order;
      buildRows(items);
      return;
    }

    for (const it of items) {
      const entry = rowMap.get(it.id);
      if (!entry) {
        buildRows(items);
        return;
      }
      if (entry.lastName !== it.name) {
        entry.nameEl.textContent = it.name;
        entry.lastName = it.name;
      }
      if (entry.lastMeta !== it.meta) {
        entry.metaEl.textContent = it.meta;
        entry.lastMeta = it.meta;
      }
      const valueText = it.noCap ? fmtInt(it.value) : `${fmtInt(it.value)} / ${fmtInt(it.cap)}`;
      if (entry.lastValue !== valueText) {
        entry.valueEl.textContent = valueText;
        entry.lastValue = valueText;
      }
      const capN = typeof it.cap === "number" && it.cap > 0 ? it.cap : 0;
      const pct = !it.noCap && capN > 0 ? Math.max(0, Math.min(100, Math.round((it.value / capN) * 100))) : 0;
      if (entry.fill && entry.lastPct !== pct) {
        entry.fill.style.width = `${pct}%`;
        entry.lastPct = pct;
      }
    }
  };
}
