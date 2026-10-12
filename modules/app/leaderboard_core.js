// 排行榜核心：玩家标识/头像 + 网络层 + 战力统计（SECTION:LEADERBOARD_IDENTITY + NETWORK 拆出）
// 维护者窗口：D
// getToken/refreshLeaderboards 为惰性 thunk，容忍 cloudSave/lbData 后初始化

import { escapeHtml } from "../utils.js";
import {
  LB_UID_KEY,
  LB_NAME_KEY,
  LB_AVATAR_KEY,
  readLocalStorage,
  writeLocalStorage,
} from "./storage.js";

function makeUid() {
  try {
    if (typeof crypto !== "undefined" && crypto && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
  }
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

// 读/初始化玩家标识（uid/昵称/头像 → ui.lb*，并落盘 uid）
export function initLeaderboardIdentity(ui) {
  try {
    const rawUid = readLocalStorage(LB_UID_KEY);
    const rawName = readLocalStorage(LB_NAME_KEY);
    const rawAvatar = readLocalStorage(LB_AVATAR_KEY);
    ui.lbUid = rawUid && typeof rawUid === "string" ? rawUid : makeUid();
    ui.lbName = rawName && typeof rawName === "string" ? rawName : "";
    ui.lbAvatar = rawAvatar && typeof rawAvatar === "string" ? rawAvatar : "";
    try {
      writeLocalStorage(LB_UID_KEY, ui.lbUid);
    } catch {
    }
  } catch {
    ui.lbUid = makeUid();
  }
}

export function lbBaseUrl() {
  try {
    const loc = window.location;
    const host = loc && typeof loc.hostname === "string" ? loc.hostname : "";
    const origin = loc && typeof loc.origin === "string" ? loc.origin : "";

    if (!host) return "http://127.0.0.1:8080";
    if (host === "localhost" || host === "127.0.0.1") return "http://127.0.0.1:8080";

    // 默认同源（适配 ngrok/反代：同一个域名同时提供页面与 /api）
    if (origin) return origin;
  } catch {
  }
  return "http://127.0.0.1:8080";
}

export function createLbFetchJson({ getToken }) {
  return async function lbFetchJson(url, opts = null) {
    const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    const id = window.setTimeout(() => {
      try {
        ctrl?.abort?.();
      } catch {
      }
    }, 8000);
    try {
      const baseOpts = opts && typeof opts === "object" ? { ...opts } : {};
      const headers = { ...(baseOpts.headers || {}) };
      // Harden write APIs require Bearer; attach when logged in (GET also OK with token)
      try {
        const token = getToken?.();
        if (token && !headers.Authorization && !headers.authorization) {
          headers.Authorization = `Bearer ${token}`;
        }
      } catch {
      }
      baseOpts.headers = headers;
      const res = await fetch(url, { ...baseOpts, signal: ctrl ? ctrl.signal : undefined });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } finally {
      window.clearTimeout(id);
    }
  };
}

// 头像/训练师图标缓存 + 头像文件处理
export function createAvatarTools({ ui, markLeaderboardDirty, render }) {
  let TRAINER_ICON_DATA_URL = null;
  let TRAINER_ICON_LOADING = false;
  function ensureTrainerIconDataUrl() {
    if (TRAINER_ICON_DATA_URL || TRAINER_ICON_LOADING) return;
    TRAINER_ICON_LOADING = true;
    try {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        try {
          const w = img.naturalWidth || 0;
          const h = img.naturalHeight || 0;
          if (!w || !h) throw new Error("bad img");
          const c = document.createElement("canvas");
          c.width = w;
          c.height = h;
          const ctx = c.getContext("2d", { willReadFrequently: true });
          if (!ctx) throw new Error("no ctx");
          ctx.drawImage(img, 0, 0);
          const data = ctx.getImageData(0, 0, w, h);
          const p = data.data;
          for (let i = 0; i < p.length; i += 4) {
            const r = p[i];
            const g = p[i + 1];
            const b = p[i + 2];
            if (r >= 248 && g >= 248 && b >= 248) {
              p[i + 3] = 0;
            }
          }
          ctx.putImageData(data, 0, 0);
          TRAINER_ICON_DATA_URL = c.toDataURL("image/png");
        } catch {
          TRAINER_ICON_DATA_URL = "";
        } finally {
          TRAINER_ICON_LOADING = false;
          markLeaderboardDirty();
          render();
        }
      };
      img.onerror = () => {
        TRAINER_ICON_LOADING = false;
        TRAINER_ICON_DATA_URL = "";
      };
      img.src = "./assets/trainer.png";
    } catch {
      TRAINER_ICON_LOADING = false;
      TRAINER_ICON_DATA_URL = "";
    }
  }

  function trainerIconSrc() {
    ensureTrainerIconDataUrl();
    return TRAINER_ICON_DATA_URL || "./assets/trainer_pixel.svg";
  }

  function renderOwnerIcon(avatarDataUrl) {
    const isAvatar = typeof avatarDataUrl === "string" && avatarDataUrl;
    const src = isAvatar ? avatarDataUrl : trainerIconSrc();
    const style = isAvatar
      ? "margin-left:6px;border-radius:6px;object-fit:cover"
      : "margin-left:6px;image-rendering:pixelated";
    return `<img src="${escapeHtml(src)}" width="18" height="18" alt="" loading="eager" decoding="async" style="${style}" />`;
  }

  function renderSelfAvatarPreview() {
    const isAvatar = typeof ui.lbAvatar === "string" && ui.lbAvatar;
    const src = isAvatar ? ui.lbAvatar : trainerIconSrc();
    const style = isAvatar ? "border-radius:8px;object-fit:cover" : "image-rendering:pixelated";
    return `<img src="${escapeHtml(src)}" width="22" height="22" alt="" loading="eager" decoding="async" style="${style}" />`;
  }

  async function avatarFileToDataUrl(file) {
    const raw = await new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result || ""));
      fr.onerror = () => reject(new Error("read error"));
      fr.readAsDataURL(file);
    });

    const img = await new Promise((resolve, reject) => {
      const im = new Image();
      im.decoding = "async";
      im.onload = () => resolve(im);
      im.onerror = () => reject(new Error("img error"));
      im.src = raw;
    });

    const w = img.naturalWidth || 0;
    const h = img.naturalHeight || 0;
    if (!w || !h) throw new Error("bad img");

    const size = 64;
    const side = Math.min(w, h);
    const sx = Math.floor((w - side) / 2);
    const sy = Math.floor((h - side) / 2);

    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("no ctx");
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
    return c.toDataURL("image/png");
  }

  return {
    ensureTrainerIconDataUrl,
    trainerIconSrc,
    renderOwnerIcon,
    renderSelfAvatarPreview,
    avatarFileToDataUrl,
  };
}

// 战力统计（依赖注入的 monPower）
export function createPowerCalcs({ getState, monPower }) {
  function calcTopMons(limit = 6) {
    return (getState().mons?.list ?? [])
      .filter((m) => m && typeof m.dex === "number" && Number.isFinite(m.dex))
      .map((m) => ({
        dex: Math.max(1, Math.floor(m.dex)),
        name: typeof m.name === "string" ? m.name : "",
        power: Math.max(0, Math.floor(monPower(m))),
        isShiny: Boolean(m.isShiny),
      }))
      .sort((a, b) => (b.power ?? 0) - (a.power ?? 0))
      .slice(0, Math.max(0, Math.floor(limit)));
  }

  function calcTeamPower(topMons) {
    if (!Array.isArray(topMons)) return 0;
    let sum = 0;
    for (const m of topMons) {
      const p = typeof m?.power === "number" && Number.isFinite(m.power) ? Math.max(0, Math.floor(m.power)) : 0;
      sum += p;
    }
    return sum;
  }

  function calcTotalPower() {
    const mons = Array.isArray(getState().mons?.list) ? getState().mons.list : [];
    if (mons.length === 0) return 0;
    let sum = 0;
    for (const m of mons) {
      const p = monPower(m);
      sum += typeof p === "number" && Number.isFinite(p) ? Math.max(0, Math.floor(p)) : 0;
    }
    return sum;
  }

  return { calcTopMons, calcTeamPower, calcTotalPower };
}

// 排行榜 60s 自动刷新（仅当页签激活且空闲）
export function createLeaderboardAutoRefresh({ ui, refreshLeaderboards }) {
  let timerId = null;
  return function ensureLeaderboardAutoRefresh() {
    if (timerId) return;
    timerId = window.setInterval(() => {
      if (ui.activeTab !== "leaderboard") return;
      if (ui.lbBusy) return;
      refreshLeaderboards();
    }, 60000);
  };
}
