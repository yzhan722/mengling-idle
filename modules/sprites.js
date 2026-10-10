// sprites.js — 萌灵立绘：assets/beasts/{dex}.png 精修图优先，缺失时用程序化 SVG 兜底。
// 程序化立绘按 dex + 主类型确定性生成，零网络依赖。
import { escapeHtml } from "./utils.js";

const TYPE_PALETTE = {
  normal:   { main: "#c9b8a6", belly: "#efe6da", accent: "#a08b76" },
  fire:     { main: "#f08a5a", belly: "#ffd9b3", accent: "#c75b39" },
  water:    { main: "#6ea8e0", belly: "#cfe6fb", accent: "#4a7fb5" },
  grass:    { main: "#8fc16e", belly: "#dff0c8", accent: "#5e8f4a" },
  electric: { main: "#f5cd4f", belly: "#fdf0c0", accent: "#c9a227" },
  ice:      { main: "#9fd8e8", belly: "#e8f7fb", accent: "#6aa8bd" },
  fighting: { main: "#d08a6e", belly: "#f2d5c4", accent: "#a05e44" },
  poison:   { main: "#b58ed6", belly: "#e9daf5", accent: "#8a5fb0" },
  ground:   { main: "#d9b877", belly: "#f3e5c4", accent: "#a8845a" },
  flying:   { main: "#a9bfe8", belly: "#e4ecfa", accent: "#7d95c4" },
  psychic:  { main: "#f08fb8", belly: "#fdd9ea", accent: "#c25f8c" },
  bug:      { main: "#b8c46a", belly: "#ecf0c8", accent: "#8a9648" },
  rock:     { main: "#bfae92", belly: "#ece2d0", accent: "#8f7f63" },
  ghost:    { main: "#a08cc8", belly: "#ddd4f0", accent: "#7362a0" },
  dragon:   { main: "#8a7de0", belly: "#d8d3f8", accent: "#6156b0" },
  dark:     { main: "#8a8aa0", belly: "#c9c9d8", accent: "#5a5a72" },
  steel:    { main: "#a8b4bc", belly: "#dde4e8", accent: "#7a8a94" },
  fairy:    { main: "#f2a8c8", belly: "#fce0ee", accent: "#c878a0" },
};

// 闪光配色 = 主色对换冷色域（确定性，无需 HSL 转换）
const SHINY_PALETTE = {
  normal:   { main: "#9fd8e8", belly: "#e8f7fb", accent: "#6aa8bd" },
  fire:     { main: "#f0a85a", belly: "#ffe8b3", accent: "#c77b39" },
  water:    { main: "#6ee0c8", belly: "#cffbee", accent: "#4ab598" },
  grass:    { main: "#c1a86e", belly: "#f0e4c8", accent: "#8f7a4a" },
  electric: { main: "#f5984f", belly: "#fddfc0", accent: "#c96f27" },
  ice:      { main: "#c8a8e8", belly: "#f0e8fb", accent: "#9678bd" },
  fighting: { main: "#6ea0d0", belly: "#c4dcf2", accent: "#446ea0" },
  poison:   { main: "#8ed6b5", belly: "#daf5e9", accent: "#5fb08a" },
  ground:   { main: "#a8d977", belly: "#e4f3c4", accent: "#7aa85a" },
  flying:   { main: "#e8b4a9", belly: "#fae4e0", accent: "#c4897d" },
  psychic:  { main: "#8fb8f0", belly: "#d9e6fd", accent: "#5f88c2" },
  bug:      { main: "#c46ab8", belly: "#f0c8ec", accent: "#96488a" },
  rock:     { main: "#92bfae", belly: "#d0ece2", accent: "#638f7f" },
  ghost:    { main: "#8cc8b8", belly: "#d4f0ea", accent: "#62a08f" },
  dragon:   { main: "#e08a7d", belly: "#f8d8d3", accent: "#b05e56" },
  dark:     { main: "#c8a86a", belly: "#e8dcc0", accent: "#967a4a" },
  steel:    { main: "#bca8a8", belly: "#e8dede", accent: "#8a7272" },
  fairy:    { main: "#a8c8f2", belly: "#e0eafc", accent: "#7896c8" },
};

const primaryTypeOf = (dex) => {
  const t = globalThis.BEAST_TYPES?.[String(dex)];
  return Array.isArray(t) && t.length ? t[0] : "normal";
};

// 确定性 hash → 形态参数
const h = (dex, salt) => ((dex * 2654435761 + salt * 40503) >>> 0) % 100;

function beastSpriteSvg(dex, isShiny) {
  const pal = (isShiny ? SHINY_PALETTE : TYPE_PALETTE)[primaryTypeOf(dex)] ?? TYPE_PALETTE.normal;
  const earStyle = h(dex, 1) % 4;      // 0 尖耳 1 圆耳 2 垂耳 3 无耳小角
  const bodySquash = 0.9 + (h(dex, 2) % 20) / 100; // 0.9~1.09 宽高比
  const eyeStyle = h(dex, 3) % 3;      // 0 圆眼 1 眯眯眼 2 豆豆眼
  const hasTail = h(dex, 4) % 10 < 6;  // 60% 有尾巴
  const hasWings = h(dex, 5) % 10 < 3; // 30% 小翅膀
  const sparkle = isShiny ? `<circle cx="78" cy="30" r="3" fill="#fff" opacity=".9"/><circle cx="86" cy="42" r="2" fill="#fff" opacity=".7"/>` : "";

  const ears = [
    `<path d="M28 38 L20 12 L44 26 Z" fill="${pal.main}" stroke="${pal.accent}" stroke-width="2.5" stroke-linejoin="round"/><path d="M72 38 L80 12 L56 26 Z" fill="${pal.main}" stroke="${pal.accent}" stroke-width="2.5" stroke-linejoin="round"/>`,
    `<circle cx="30" cy="26" r="11" fill="${pal.main}" stroke="${pal.accent}" stroke-width="2.5"/><circle cx="70" cy="26" r="11" fill="${pal.main}" stroke="${pal.accent}" stroke-width="2.5"/><circle cx="30" cy="26" r="5" fill="${pal.belly}"/><circle cx="70" cy="26" r="5" fill="${pal.belly}"/>`,
    `<ellipse cx="24" cy="34" rx="8" ry="16" fill="${pal.main}" stroke="${pal.accent}" stroke-width="2.5" transform="rotate(-24 24 34)"/><ellipse cx="76" cy="34" rx="8" ry="16" fill="${pal.main}" stroke="${pal.accent}" stroke-width="2.5" transform="rotate(24 76 34)"/>`,
    `<path d="M34 30 L32 14 L42 26 Z" fill="${pal.accent}"/><path d="M66 30 L68 14 L58 26 Z" fill="${pal.accent}"/>`,
  ][earStyle];

  const eyes = [
    `<circle cx="38" cy="56" r="4.5" fill="#3a3a3a"/><circle cx="62" cy="56" r="4.5" fill="#3a3a3a"/><circle cx="39.6" cy="54.4" r="1.6" fill="#fff"/><circle cx="63.6" cy="54.4" r="1.6" fill="#fff"/>`,
    `<path d="M33 57 Q38 52 43 57" stroke="#3a3a3a" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M57 57 Q62 52 67 57" stroke="#3a3a3a" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
    `<circle cx="38" cy="56" r="3" fill="#3a3a3a"/><circle cx="62" cy="56" r="3" fill="#3a3a3a"/>`,
  ][eyeStyle];

  const tail = hasTail ? `<path d="M78 78 Q92 74 90 60" stroke="${pal.accent}" stroke-width="5" fill="none" stroke-linecap="round"/>` : "";
  const wings = hasWings ? `<ellipse cx="16" cy="60" rx="9" ry="15" fill="${pal.belly}" stroke="${pal.accent}" stroke-width="2" opacity=".85" transform="rotate(-30 16 60)"/><ellipse cx="84" cy="60" rx="9" ry="15" fill="${pal.belly}" stroke="${pal.accent}" stroke-width="2" opacity=".85" transform="rotate(30 84 60)"/>` : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${wings}${tail}${ears}<ellipse cx="50" cy="58" rx="${Math.round(32 * bodySquash)}" ry="32" fill="${pal.main}" stroke="${pal.accent}" stroke-width="3"/><ellipse cx="50" cy="70" rx="17" ry="13" fill="${pal.belly}" opacity=".9"/><circle cx="30" cy="65" r="5" fill="${pal.accent}" opacity=".35"/><circle cx="70" cy="65" r="5" fill="${pal.accent}" opacity=".35"/>${eyes}<path d="M46 66 Q50 69.5 54 66" stroke="#3a3a3a" stroke-width="2.2" fill="none" stroke-linecap="round"/>${sparkle}</svg>`;
}

const spriteUriCache = new Map();
export function beastSpriteDataUri(dex, isShiny = false) {
  const key = `${dex}|${isShiny ? 1 : 0}`;
  let uri = spriteUriCache.get(key);
  if (!uri) {
    uri = `data:image/svg+xml;utf8,${encodeURIComponent(beastSpriteSvg(dex, isShiny))}`;
    spriteUriCache.set(key, uri);
  }
  return uri;
}

const localArtUrl = (dex, isShiny) =>
  isShiny ? `../assets/beasts_shiny/${dex}.png` : `../assets/beasts/${dex}.png`;

export function installSpriteHandlers() {
  if (typeof globalThis.__beastSpriteOnError !== "function") {
    globalThis.__beastSpriteOnError = (img) => {
      try {
        const dex = Number(img?.getAttribute?.("data-dex"));
        if (!dex) return;
        const shiny = img?.getAttribute?.("data-shiny") === "1";
        img.onerror = null;
        img.src = beastSpriteDataUri(dex, shiny);
      } catch {
        try { img?.remove?.(); } catch { /* ignore */ }
      }
    };
  }
}

export const renderBeastIcon = (dex, alt, isShiny = false) => {
  const a = escapeHtml(alt ?? "");
  return `<img class="pk-icon" src="${localArtUrl(dex, isShiny)}" data-dex="${escapeHtml(
    String(dex),
  )}" data-shiny="${isShiny ? 1 : 0}" alt="${a}" loading="eager" decoding="async" onerror="globalThis.__beastSpriteOnError && globalThis.__beastSpriteOnError(this)" />`;
};
