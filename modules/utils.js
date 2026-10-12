export const nowMs = () => Date.now();

export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export const pad3 = (n) => String(n).padStart(3, "0");

export const randFloat = () => {
  try {
    const c = globalThis.crypto;
    if (c && typeof c.getRandomValues === "function") {
      const buf = new Uint32Array(1);
      c.getRandomValues(buf);
      return buf[0] / 4294967296;
    }
  } catch {
  }
  return Math.random();
};

export const fmt = (n) => {
  if (typeof n !== "number" || Number.isNaN(n)) return "0";
  if (Math.abs(n) < 1000) return n.toFixed(2).replace(/\.00$/, "");
  const units = ["K", "M", "B", "T"];
  let x = n;
  let i = -1;
  while (Math.abs(x) >= 1000 && i < units.length - 1) {
    x /= 1000;
    i += 1;
  }
  return `${x.toFixed(2)}${units[i]}`;
};

export function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function formatLocalYmd(t = nowMs()) {
  const d = new Date(t);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fmtDuration(sec) {
  const s = Math.max(0, Math.ceil(sec));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad2 = (x) => String(x).padStart(2, "0");
  if (hh > 0) return `${hh}:${pad2(mm)}:${pad2(ss)}`;
  return `${mm}:${pad2(ss)}`;
}

export function getGameVersion() {
  try {
    const t = typeof document !== "undefined" ? String(document.title || "") : "";
    const m = t.match(/\bv(\d+\.\d+\.\d+)\b/);
    return m ? m[1] : "";
  } catch {
    return "";
  }
}
