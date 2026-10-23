// sprites.js — 萌灵高精度程序化矢量立绘引擎（v3.0）
// 特性：
// 1. 零 404 直出 Data URI（仅当 globalThis.BEAST_HD_DEX 显式声明本地精修图时才请求 PNG）
// 2. 18 类专属物种家族造型（花苞植物、蘑菇侠、火焰幼龙、迷你仙蛟、锦鲤海龙、浪歌鲸、波壳水龟、卷腹蛙、巨钳蟹、
//    彩蝶虫茧、飞羽猛禽、夜翼蝙蝠、九尾与绒布布家族、雷电萌鼠、磁暴机械、海星宝石、甜筒冰晶、幽影南瓜、超能胡仙、
//    传说双尊 #150/#151、福蛋呼呼兽等），彻底告别同质化椭圆与千篇一律的额头皇冠
// 3. 3 阶进化形态自然演进 + 9 系立体渐变 + 闪光流光星芒

import { escapeHtml } from "./utils.js";

const TYPE_PALETTE = {
  wind:     { main: "#8fb4e8", light: "#dbeaff", dark: "#486aa3", belly: "#f0f6ff", accent: "#2d4673", glow: "#a8cbff", eye: "#24426e" },
  fire:     { main: "#f57b42", light: "#ffc894", dark: "#b53616", belly: "#ffebd1", accent: "#701906", glow: "#ff984f", eye: "#821f0b" },
  water:    { main: "#4da3e6", light: "#ade2ff", dark: "#1f5f99", belly: "#e3f5ff", accent: "#123e6b", glow: "#6bc5ff", eye: "#144575" },
  grass:    { main: "#6bc460", light: "#bdf5a2", dark: "#317d32", belly: "#eafade", accent: "#1d4f1f", glow: "#8be876", eye: "#1f5722" },
  electric: { main: "#f7ca31", light: "#fff4a3", dark: "#c28106", belly: "#fff9db", accent: "#704500", glow: "#ffe055", eye: "#6e4200" },
  stone:    { main: "#b89f80", light: "#e6d7c1", dark: "#735d42", belly: "#f5efe6", accent: "#453624", glow: "#d4be9e", eye: "#4d3b27" },
  light:    { main: "#f5c26b", light: "#fff2d1", dark: "#b87a28", belly: "#fff9ed", accent: "#78490e", glow: "#ffe299", eye: "#804e10" },
  dark:     { main: "#787299", light: "#bab4db", dark: "#3f3959", belly: "#e1dfef", accent: "#221d36", glow: "#9d94c7", eye: "#9e2b59" },
  mystic:   { main: "#9b7be8", light: "#e2d4ff", dark: "#5636a3", belly: "#f2ebff", accent: "#321a6e", glow: "#be9eff", eye: "#46238c" },
};

const SHINY_PALETTE = {
  wind:     { main: "#f29cb8", light: "#ffdbe8", dark: "#ad4e6f", belly: "#fff2f6", accent: "#732943", glow: "#ffb8d0", eye: "#852849" },
  fire:     { main: "#58b8f0", light: "#c2ecff", dark: "#206ba3", belly: "#ebf9ff", accent: "#114169", glow: "#80d4ff", eye: "#185282" },
  water:    { main: "#52d6b2", light: "#baffec", dark: "#1a876c", belly: "#e8fff9", accent: "#0d5240", glow: "#7affdc", eye: "#11634e" },
  grass:    { main: "#e8a848", light: "#ffe3ad", dark: "#9c5c11", belly: "#fff5e0", accent: "#613504", glow: "#ffc66b", eye: "#6e3c06" },
  electric: { main: "#ff8547", light: "#ffccb0", dark: "#b33f10", belly: "#fff1e8", accent: "#702103", glow: "#ffa370", eye: "#7d2604" },
  stone:    { main: "#74bfae", light: "#c7f5eb", dark: "#387a6b", belly: "#ebfcf8", accent: "#1e4d42", glow: "#96e6d4", eye: "#22574b" },
  light:    { main: "#98b8f5", light: "#e0ebff", dark: "#4c6bb0", belly: "#f5f8ff", accent: "#2a4075", glow: "#bad1ff", eye: "#314b87" },
  dark:     { main: "#d49a52", light: "#ffe3ba", dark: "#8a5519", belly: "#fff5e6", accent: "#522f08", glow: "#f2b972", eye: "#61380a" },
  mystic:   { main: "#f07898", light: "#ffc9d8", dark: "#a13655", belly: "#ffedf2", accent: "#63182e", glow: "#ff9eb8", eye: "#731d36" },
};

const pad3 = (n) => String(n).padStart(3, "0");

const getTypes = (dex) => {
  const t = globalThis.BEAST_TYPES?.[String(dex)];
  return Array.isArray(t) && t.length ? t : ["wind"];
};

const getTier = (dex) => {
  const v = globalThis.BEAST_TIER?.[`p${pad3(dex)}`];
  return typeof v === "string" ? v : "common";
};

let evoStageCache = null;
let evoRootCache = null;
function ensureEvoCaches() {
  const evo = globalThis.BEAST_EVO;
  if (!evo || typeof evo !== "object") {
    return { stageMap: new Map(), rootMap: new Map() };
  }
  if (evoStageCache && evoRootCache) {
    return { stageMap: evoStageCache, rootMap: evoRootCache };
  }
  const parentOf = new Map();
  for (const [fromPid, list] of Object.entries(evo)) {
    if (!Array.isArray(list)) continue;
    for (const toPid of list) {
      if (!parentOf.has(toPid)) parentOf.set(toPid, fromPid);
    }
  }
  const stageMap = new Map();
  const rootMap = new Map();
  const allPids = new Set([...Object.keys(evo), ...parentOf.keys()]);
  for (const pid of allPids) {
    let cur = pid;
    let depth = 0;
    const seen = new Set([cur]);
    while (parentOf.has(cur) && depth < 5) {
      const p = parentOf.get(cur);
      if (seen.has(p)) break;
      seen.add(p);
      cur = p;
      depth += 1;
    }
    stageMap.set(pid, depth);
    rootMap.set(pid, cur);
  }
  evoStageCache = stageMap;
  evoRootCache = rootMap;
  return { stageMap, rootMap };
}

function getStageAndRoot(dex) {
  const pid = `p${pad3(dex)}`;
  const { stageMap, rootMap } = ensureEvoCaches();
  const rootPid = rootMap.get(pid) || pid;
  const rootDex = Number(rootPid.slice(1)) || dex;
  let stage = stageMap.get(pid) ?? 0;
  if (rootDex === 133 && dex !== 133) stage = 2;
  const evo = globalThis.BEAST_EVO;
  const isStandalone = !stageMap.has(pid) && !(evo && evo[pid]);
  const tier = getTier(dex);
  if (isStandalone && (tier === "epic" || dex === 150 || dex === 151)) stage = 2;
  else if (isStandalone && (tier === "rare" || dex === 131 || dex === 143)) stage = 1;
  return { stage: Math.min(2, stage), rootDex, tier };
}

const h = (dex, salt) => ((dex * 2654435761 + salt * 40503) >>> 0) % 100;

// 渲染五官（无机械感重复额头皇冠，眼神与嘴型随性情与阶段自然变化）
function renderFace(dex, stage, pal, cx = 60, cy = 62, spread = 13, opts = {}) {
  const lx = cx - spread;
  const rx = cx + spread;
  const r = opts.eyeRadius ?? (stage === 0 ? 5.5 : stage === 1 ? 5.1 : 4.8);
  const fierce = opts.fierce ?? stage >= 2;
  const sleepy = opts.sleepy ?? (dex === 63 || dex === 143 || dex === 446 || dex === 79);

  let eyes = "";
  if (sleepy) {
    eyes = `
      <path d="M${lx - 5.5} ${cy} Q${lx} ${cy - 4.5} ${lx + 5.5} ${cy}" stroke="#231f2e" stroke-width="2.8" fill="none" stroke-linecap="round"/>
      <path d="M${rx - 5.5} ${cy} Q${rx} ${cy - 4.5} ${rx + 5.5} ${cy}" stroke="#231f2e" stroke-width="2.8" fill="none" stroke-linecap="round"/>
    `;
  } else {
    const brow = fierce
      ? `<path d="M${lx - 5.5} ${cy - r - 1.8} L${lx + 4.5} ${cy - r + 1.2}" stroke="${pal.accent}" stroke-width="2.3" stroke-linecap="round"/>
         <path d="M${rx + 5.5} ${cy - r - 1.8} L${rx - 4.5} ${cy - r + 1.2}" stroke="${pal.accent}" stroke-width="2.3" stroke-linecap="round"/>`
      : "";
    eyes = `
      ${brow}
      <ellipse cx="${lx}" cy="${cy}" rx="${r}" ry="${r * 1.08}" fill="#1b1826"/>
      <ellipse cx="${rx}" cy="${cy}" rx="${r}" ry="${r * 1.08}" fill="#1b1826"/>
      <ellipse cx="${lx}" cy="${cy + 0.8}" rx="${r * 0.72}" ry="${r * 0.74}" fill="${pal.eye}"/>
      <ellipse cx="${rx}" cy="${cy + 0.8}" rx="${r * 0.72}" ry="${r * 0.74}" fill="${pal.eye}"/>
      <circle cx="${lx - r * 0.28}" cy="${cy - r * 0.32}" r="${r * 0.36}" fill="#ffffff"/>
      <circle cx="${rx - r * 0.28}" cy="${cy - r * 0.32}" r="${r * 0.36}" fill="#ffffff"/>
      <circle cx="${lx + r * 0.28}" cy="${cy + r * 0.28}" r="${r * 0.18}" fill="#ffffff" opacity="0.88"/>
      <circle cx="${rx + r * 0.28}" cy="${cy + r * 0.28}" r="${r * 0.18}" fill="#ffffff" opacity="0.88"/>
    `;
  }

  const isElectric = globalThis.BEAST_TYPES?.[String(dex)]?.includes?.("electric");
  const cheeks = opts.noCheeks
    ? ""
    : isElectric
      ? `<circle cx="${lx - 5.5}" cy="${cy + 5.8}" r="4.8" fill="#ff5247" opacity="0.88"/>
         <circle cx="${rx + 5.5}" cy="${cy + 5.8}" r="4.8" fill="#ff5247" opacity="0.88"/>`
      : `<ellipse cx="${lx - 5}" cy="${cy + 5.5}" rx="4.6" ry="2.6" fill="#ff7a9e" opacity="0.46"/>
         <ellipse cx="${rx + 5}" cy="${cy + 5.5}" rx="4.6" ry="2.6" fill="#ff7a9e" opacity="0.46"/>`;

  const my = cy + (opts.mouthOffsetY ?? 6.2);
  const mouthType = opts.mouth ?? ((dex + stage) % 4);
  let mouth = "";
  if (mouthType === "grin") {
    mouth = `<path d="M${cx - 15} ${my - 2} Q${cx} ${my + 13} ${cx + 15} ${my - 2} Q${cx} ${my + 3} ${cx - 15} ${my - 2} Z" fill="#ffffff" stroke="#1b1826" stroke-width="2.2" stroke-linejoin="round"/>
             <line x1="${cx - 8}" y1="${my + 1}" x2="${cx - 7}" y2="${my + 6}" stroke="#1b1826" stroke-width="1.6"/>
             <line x1="${cx}" y1="${my + 2}" x2="${cx}" y2="${my + 7.5}" stroke="#1b1826" stroke-width="1.6"/>
             <line x1="${cx + 8}" y1="${my + 1}" x2="${cx + 7}" y2="${my + 6}" stroke="#1b1826" stroke-width="1.6"/>`;
  } else if (mouthType === "beak") {
    mouth = `<polygon points="${cx},${my - 4} ${cx - 5.5},${my + 1} ${cx},${my + 5.5} ${cx + 5.5},${my + 1}" fill="#ffb830" stroke="${pal.accent}" stroke-width="1.8" stroke-linejoin="round"/>`;
  } else if (mouthType === "none") {
    mouth = "";
  } else if (mouthType === 0) {
    mouth = `<path d="M${cx - 4.8} ${my} Q${cx - 2.4} ${my + 3.2} ${cx} ${my + 0.5} Q${cx + 2.4} ${my + 3.2} ${cx + 4.8} ${my}" stroke="#231f2e" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  } else if (mouthType === 1) {
    mouth = `<path d="M${cx - 4.5} ${my - 0.5} Q${cx} ${my + 5.8} ${cx + 4.5} ${my - 0.5} Z" fill="#d94b68" stroke="#231f2e" stroke-width="1.8" stroke-linejoin="round"/>
             <ellipse cx="${cx}" cy="${my + 2.3}" rx="2.5" ry="1.5" fill="#ff8fa6"/>`;
  } else if (mouthType === 2) {
    mouth = `<path d="M${cx - 5.5} ${my} Q${cx} ${my + 4} ${cx + 5.5} ${my}" stroke="#231f2e" stroke-width="2" fill="none" stroke-linecap="round"/>
             <path d="M${cx + 1.8} ${my + 1.2} L${cx + 3.3} ${my + 4.2} L${cx + 4.6} ${my + 0.8} Z" fill="#ffffff" stroke="#231f2e" stroke-width="1"/>`;
  } else {
    mouth = `<path d="M${cx - 4.2} ${my + 0.5} Q${cx} ${my + 3.6} ${cx + 4.2} ${my + 0.5}" stroke="#231f2e" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  }

  return `${cheeks}${eyes}${mouth}`;
}

function renderElementalDecor(dex, primaryType, stage, tier, isShiny, pal, secPal) {
  const isEpic = tier === "epic" || dex === 150 || dex === 151;
  let aura = "";
  if (stage >= 2 || isEpic || isShiny) {
    const ringColor = isShiny ? "#ffe066" : isEpic ? "#e0b3ff" : pal.glow;
    aura += `
      <circle cx="60" cy="62" r="47" fill="none" stroke="${ringColor}" stroke-width="${isEpic || isShiny ? 2.2 : 1.4}" stroke-dasharray="${isEpic ? "7 4" : "3 6"}" opacity="0.52"/>
      <circle cx="60" cy="62" r="52" fill="none" stroke="${secPal.light}" stroke-width="0.9" opacity="0.28"/>
    `;
  }

  const motes = {
    fire: `<path d="M19 42 Q22 31 27 39 Q23 46 19 42 Z" fill="#ff9d42" opacity="0.88"/><path d="M97 35 Q101 23 105 33 Q101 41 97 35 Z" fill="#ff622e" opacity="0.88"/>`,
    water: `<circle cx="21" cy="40" r="3.5" fill="#8ce0ff" opacity="0.78"/><circle cx="25" cy="30" r="2" fill="#ffffff" opacity="0.88"/><circle cx="97" cy="44" r="4" fill="#8ce0ff" opacity="0.72"/>`,
    grass: `<path d="M17 38 Q23 32 27 38 Q21 44 17 38 Z" fill="#98f576" opacity="0.88"/><path d="M93 34 Q99 28 103 35 Q97 40 93 34 Z" fill="#b8ff9e" opacity="0.88"/>`,
    electric: `<path d="M20 31 L15 40 L21 40 L17 48 L26 38 L20 38 Z" fill="#ffe63b"/><path d="M98 27 L93 36 L99 36 L95 44 L104 34 L98 34 Z" fill="#ffe63b"/>`,
    wind: `<path d="M15 44 Q24 38 30 43" stroke="#d9ecff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity="0.78"/><path d="M90 34 Q99 28 105 33" stroke="#d9ecff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity="0.78"/>`,
    stone: `<polygon points="19,36 24,41 19,46 14,41" fill="#e6d4b8" stroke="${pal.accent}" stroke-width="1.2"/><polygon points="99,32 103,37 99,42 95,37" fill="#e6d4b8" stroke="${pal.accent}" stroke-width="1.2"/>`,
    light: `<path d="M22 30 L24 36 L30 38 L24 40 L22 46 L20 40 L14 38 L20 36 Z" fill="#fff099"/><path d="M96 26 L98 31 L103 33 L98 35 L96 40 L94 35 L89 33 L94 31 Z" fill="#fff099"/>`,
    dark: `<path d="M24 29 A7 7 0 1 0 30 40 A5.5 5.5 0 1 1 24 29 Z" fill="#c9b8ff" opacity="0.88"/><circle cx="97" cy="36" r="3" fill="#9a7dff" opacity="0.78"/>`,
    mystic: `<polygon points="22,30 25,36 31,37 26,41 27,47 22,44 17,47 18,41 13,37 19,36" fill="#f2bfff" opacity="0.88"/><circle cx="97" cy="34" r="3.5" fill="#a8f0ff" opacity="0.88"/>`,
  };

  const shinyStars = isShiny
    ? `<g fill="#fff7b2" stroke="#f59e0b" stroke-width="0.9">
        <path d="M93 15 L95.5 22 L102.5 24.5 L95.5 27 L93 34 L90.5 27 L83.5 24.5 L90.5 22 Z"/>
        <path d="M23 19 L24.8 24 L29.8 25.8 L24.8 27.6 L23 32.6 L21.2 27.6 L16.2 25.8 L21.2 24 Z"/>
        <circle cx="87" cy="39" r="2.2" fill="#ffffff" stroke="none"/>
        <circle cx="29" cy="15" r="1.8" fill="#ffffff" stroke="none"/>
      </g>`
    : "";

  return `${aura}${stage >= 1 || isEpic ? motes[primaryType] || "" : ""}${shinyStars}`;
}

export function beastSpriteSvg(dex, isShiny = false) {
  const d = Number(dex) || 1;
  const types = getTypes(d);
  const primaryType = types[0] || "wind";
  const secondaryType = types[1] || primaryType;
  const palTable = isShiny ? SHINY_PALETTE : TYPE_PALETTE;
  const pal = palTable[primaryType] ?? TYPE_PALETTE.wind;
  const secPal = palTable[secondaryType] ?? pal;
  const { stage, rootDex, tier } = getStageAndRoot(d);

  const uid = `b${d}_${isShiny ? 1 : 0}`;
  const scale = stage === 0 ? 0.88 : stage === 1 ? 0.97 : 1.05;

  const defs = `
    <defs>
      <radialGradient id="${uid}_bg" cx="50%" cy="48%" r="50%">
        <stop offset="0%" stop-color="${pal.glow}" stop-opacity="${isShiny ? 0.50 : 0.30}"/>
        <stop offset="65%" stop-color="${secPal.main}" stop-opacity="0.10"/>
        <stop offset="100%" stop-color="${pal.dark}" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="${uid}_body" x1="25%" y1="10%" x2="80%" y2="92%">
        <stop offset="0%" stop-color="${pal.light}"/>
        <stop offset="48%" stop-color="${pal.main}"/>
        <stop offset="100%" stop-color="${pal.dark}"/>
      </linearGradient>
      <linearGradient id="${uid}_sec" x1="20%" y1="10%" x2="85%" y2="88%">
        <stop offset="0%" stop-color="${secPal.light}"/>
        <stop offset="55%" stop-color="${secPal.main}"/>
        <stop offset="100%" stop-color="${secPal.dark}"/>
      </linearGradient>
      <linearGradient id="${uid}_belly" x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="100%" stop-color="${pal.belly}"/>
      </linearGradient>
    </defs>
  `;

  let figure = "";

  // ── 专项传说萌灵/高辨识度专属造型 ──────────────────────────────────────────
  if (d === 150) {
    // #150 梦蚀尊：超能霸主，双平顶精神角 + 脑后能量神经管 + 紫晶胸甲 + 双手超能法球 + 修长灵尾
    figure = `
      <path d="M64 82 Q106 86 102 48 Q98 36 90 44 Q94 72 68 74 Z" fill="url(#${uid}_sec)" stroke="${pal.accent}" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M68 28 C82 26, 84 48, 70 56" fill="none" stroke="${pal.dark}" stroke-width="4.8" stroke-linecap="round"/>
      <circle cx="20" cy="62" r="8" fill="${pal.glow}" opacity="0.88"/><circle cx="20" cy="62" r="4" fill="#ffffff"/>
      <circle cx="100" cy="62" r="8" fill="${pal.glow}" opacity="0.88"/><circle cx="100" cy="62" r="4" fill="#ffffff"/>
      <ellipse cx="45" cy="91" rx="8" ry="6" fill="url(#${uid}_sec)" stroke="${pal.accent}" stroke-width="2.4"/>
      <ellipse cx="75" cy="91" rx="8" ry="6" fill="url(#${uid}_sec)" stroke="${pal.accent}" stroke-width="2.4"/>
      <ellipse cx="44" cy="76" rx="9" ry="11" fill="url(#${uid}_body)" stroke="${pal.accent}" stroke-width="2.4"/>
      <ellipse cx="76" cy="76" rx="9" ry="11" fill="url(#${uid}_body)" stroke="${pal.accent}" stroke-width="2.4"/>
      <ellipse cx="60" cy="72" rx="16" ry="14" fill="url(#${uid}_sec)" stroke="${pal.accent}" stroke-width="2.5"/>
      <path d="M38 56 L22 60 M82 56 L98 60" stroke="${pal.light}" stroke-width="5.5" stroke-linecap="round"/>
      <path d="M38 52 Q60 48 82 52 L76 66 Q60 70 44 66 Z" fill="url(#${uid}_belly)" stroke="${pal.accent}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M40 34 L34 14 L48 20 L52 30 Z M80 34 L86 14 L72 20 L68 30 Z" fill="url(#${uid}_body)" stroke="${pal.accent}" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M38 38 C38 24, 82 24, 82 38 C84 50, 74 56, 60 56 C46 56, 36 50, 38 38 Z" fill="url(#${uid}_body)" stroke="${pal.accent}" stroke-width="2.7"/>
      <polygon points="43,40 56,44 45,48" fill="#1e1b29"/><polygon points="77,40 64,44 75,48" fill="#1e1b29"/>
      <polygon points="45,41.2 54,44 46,46.8" fill="#c084fc"/><polygon points="75,41.2 66,44 74,46.8" fill="#c084fc"/>
      <circle cx="49" cy="43.5" r="1.8" fill="#ffffff"/><circle cx="71" cy="43.5" r="1.8" fill="#ffffff"/>
      <path d="M55 51 L60 52.5 L65 51" stroke="${pal.accent}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    `;
  } else if (d === 151) {
    // #151 梦团团：梦幻浮空幼猫，修长飘带尾(椭圆尾尖) + 澄澈蓝瞳 + 梦幻气泡环绕
    const bodyFill = isShiny ? "#7ad6ff" : "#ffb5d8";
    const bodyDark = isShiny ? "#3888c4" : "#d46a9e";
    figure = `
      <circle cx="60" cy="60" r="44" fill="${bodyFill}" opacity="0.14" stroke="#ffffff" stroke-width="1.5" stroke-dasharray="10 6"/>
      <path d="M74 78 Q108 68 100 34 Q96 22 86 26" fill="none" stroke="${bodyFill}" stroke-width="4" stroke-linecap="round"/>
      <ellipse cx="85" cy="25" rx="7" ry="4.5" transform="rotate(-25 85 25)" fill="${bodyFill}" stroke="${bodyDark}" stroke-width="2"/>
      <path d="M40 38 L32 20 L50 30 Z M80 38 L88 20 L70 30 Z" fill="${bodyFill}" stroke="${bodyDark}" stroke-width="2.3" stroke-linejoin="round"/>
      <ellipse cx="46" cy="86" rx="6" ry="9" transform="rotate(15 46 86)" fill="${bodyFill}" stroke="${bodyDark}" stroke-width="2.2"/>
      <ellipse cx="74" cy="86" rx="6" ry="9" transform="rotate(-15 74 86)" fill="${bodyFill}" stroke="${bodyDark}" stroke-width="2.2"/>
      <ellipse cx="60" cy="58" rx="23" ry="22" fill="${bodyFill}" stroke="${bodyDark}" stroke-width="2.6"/>
      <ellipse cx="60" cy="66" rx="14" ry="11" fill="#fff5fa" opacity="0.85"/>
      <ellipse cx="42" cy="60" rx="4.5" ry="3.5" fill="${bodyFill}" stroke="${bodyDark}" stroke-width="1.8"/>
      <ellipse cx="78" cy="60" rx="4.5" ry="3.5" fill="${bodyFill}" stroke="${bodyDark}" stroke-width="1.8"/>
      ${renderFace(d, 0, { ...pal, eye: "#2986eb", accent: bodyDark }, 60, 54, 11.5, { eyeRadius: 5.8, mouth: 0 })}
    `;
  } else if (d === 582 || d === 583 || d === 584) {
    // #582-584 甜筒冰 / 双球冰 / 三球冰：冰晶脆筒 + 奶油雪球漩涡
    const cone = `<polygon points="44,68 76,68 60,96" fill="#7dc8f7" stroke="#2c699a" stroke-width="2.5" stroke-linejoin="round"/>
                  <path d="M48 74 L72 74 M52 82 L68 82" stroke="#b8e4ff" stroke-width="1.8"/>`;
    if (d === 584) {
      figure = `
        ${cone}
        <circle cx="44" cy="52" r="19" fill="#ffffff" stroke="#4885b8" stroke-width="2.5"/>
        <circle cx="76" cy="52" r="19" fill="#ffffff" stroke="#4885b8" stroke-width="2.5"/>
        <path d="M36 35 Q44 24 52 35 M68 35 Q76 24 84 35" fill="#dff4ff" stroke="#4885b8" stroke-width="2.2"/>
        ${renderFace(d, 1, pal, 44, 52, 7.5, { eyeRadius: 3.6, mouth: 1 })}
        ${renderFace(d, 1, pal, 76, 52, 7.5, { eyeRadius: 3.6, mouth: 0 })}
      `;
    } else {
      figure = `
        ${cone}
        <circle cx="60" cy="52" r="${d === 583 ? 23 : 20}" fill="#ffffff" stroke="#4885b8" stroke-width="2.6"/>
        <path d="M46 36 Q60 20 74 36" fill="#dff4ff" stroke="#4885b8" stroke-width="2.4" stroke-linecap="round"/>
        ${renderFace(d, stage, pal, 60, 54, 11)}
      `;
    }
  } else if (d === 81 || d === 82 || d === 462) {
    // #81-82, #462 磁豆豆 / 磁三连 / 磁暴王：金属磁能核心 + 红蓝马蹄磁铁 + 机械独眼
    const magnetL = `<path d="M32 52 L14 44 L14 68 L32 60" fill="none" stroke="#aab6c8" stroke-width="7" stroke-linecap="butt"/>
                     <rect x="11" y="40" width="8" height="10" fill="#ef4444"/><rect x="11" y="62" width="8" height="10" fill="#3b82f6"/>`;
    const magnetR = `<path d="M88 52 L106 44 L106 68 L88 60" fill="none" stroke="#aab6c8" stroke-width="7" stroke-linecap="butt"/>
                     <rect x="101" y="40" width="8" height="10" fill="#ef4444"/><rect x="101" y="62" width="8" height="10" fill="#3b82f6"/>`;
    const subUnits =
      d === 82
        ? `<circle cx="38" cy="78" r="13" fill="#cbd5e1" stroke="#334155" stroke-width="2.4"/><circle cx="38" cy="78" r="5" fill="#1e293b"/><circle cx="36" cy="76" r="2" fill="#fff"/>
           <circle cx="82" cy="78" r="13" fill="#cbd5e1" stroke="#334155" stroke-width="2.4"/><circle cx="82" cy="78" r="5" fill="#1e293b"/><circle cx="80" cy="76" r="2" fill="#fff"/>`
        : "";
    const ufoRim =
      d === 462
        ? `<ellipse cx="60" cy="64" rx="38" ry="14" fill="url(#${uid}_body)" stroke="#334155" stroke-width="2.6"/>
           <path d="M60 22 L60 36" stroke="#facc15" stroke-width="4" stroke-linecap="round"/>`
        : `<rect x="55" y="24" width="10" height="10" rx="2" fill="#94a3b8" stroke="#334155" stroke-width="2"/>`;
    figure = `
      ${magnetL}${magnetR}
      ${ufoRim}
      <circle cx="60" cy="56" r="${d === 462 ? 24 : 22}" fill="#dce4f0" stroke="#334155" stroke-width="2.8"/>
      <ellipse cx="52" cy="44" rx="9" ry="4.5" transform="rotate(-18 52 44)" fill="#ffffff" opacity="0.65"/>
      <circle cx="60" cy="56" r="10" fill="#ffffff" stroke="#1e293b" stroke-width="2.4"/>
      <circle cx="60" cy="56" r="4.5" fill="${d === 462 ? "#ef4444" : "#1e293b"}"/>
      <circle cx="58" cy="54" r="2" fill="#ffffff"/>
      ${subUnits}
    `;
  } else if (d === 120 || d === 121) {
    // #120-121 星闪闪 / 宝星辉：五角/十角宝石海星 + 红宝石金环核心
    const backStar =
      d === 121
        ? `<polygon points="60,18 69,42 95,42 74,58 82,84 60,68 38,84 46,58 25,42 51,42" transform="rotate(36 60 56)" fill="url(#${uid}_sec)" stroke="${pal.accent}" stroke-width="2.4" stroke-linejoin="round"/>`
        : "";
    figure = `
      ${backStar}
      <polygon points="60,18 69,42 95,42 74,58 82,84 60,68 38,84 46,58 25,42 51,42" fill="url(#${uid}_body)" stroke="${pal.accent}" stroke-width="2.6" stroke-linejoin="round"/>
      <circle cx="60" cy="56" r="14" fill="#facc15" stroke="#92400e" stroke-width="2.4"/>
      <polygon points="60,45 69,52 66,64 54,64 51,52" fill="#ef4444" stroke="#7f1d1d" stroke-width="1.8"/>
      <circle cx="57" cy="52" r="2.8" fill="#ffffff" opacity="0.85"/>
    `;
  } else if (d === 92 || d === 93 || d === 94) {
    // #92-94 雾团子 / 影爪爪 / 耿胖胖：紫雾幽灵 → 浮空鬼爪 → 邪魅大笑耿胖胖
    if (d === 92) {
      figure = `
        <circle cx="60" cy="58" r="34" fill="${pal.glow}" opacity="0.28"/>
        <circle cx="34" cy="44" r="10" fill="${pal.main}" opacity="0.45"/>
        <circle cx="86" cy="68" r="12" fill="${pal.main}" opacity="0.45"/>
        <circle cx="60" cy="58" r="24" fill="url(#${uid}_body)" stroke="${pal.accent}" stroke-width="2.6"/>
        <path d="M40 50 L54 56 L42 60 Z M80 50 L66 56 L78 60 Z" fill="#ffffff" stroke="#1b1826" stroke-width="1.8"/>
        <circle cx="49" cy="56" r="2.2" fill="#ef4444"/><circle cx="71" cy="56" r="2.2" fill="#ef4444"/>
        <path d="M48 67 Q60 74 72 67" stroke="#ff6b8b" stroke-width="2.6" fill="none" stroke-linecap="round"/>
        <polygon points="51,68 54,73 57,68" fill="#ffffff"/><polygon points="63,68 66,73 69,68" fill="#ffffff"/>
      `;
    } else {
      figure = `
        <path d="M36 38 L22 14 L46 28 L52 18 L60 28 L68 18 L74 28 L98 14 L84 38 Z" fill="url(#${uid}_body)" stroke="${pal.accent}" stroke-width="2.5" stroke-linejoin="round"/>
        <ellipse cx="42" cy="92" rx="8" ry="6" fill="${pal.dark}" stroke="${pal.accent}" stroke-width="2.3"/>
        <ellipse cx="78" cy="92" rx="8" ry="6" fill="${pal.dark}" stroke="${pal.accent}" stroke-width="2.3"/>
        <ellipse cx="24" cy="64" rx="9" ry="6" transform="rotate(-25 24 64)" fill="url(#${uid}_body)" stroke="${pal.accent}" stroke-width="2.3"/>
        <ellipse cx="96" cy="64" rx="9" ry="6" transform="rotate(25 96 64)" fill="url(#${uid}_body)" stroke="${pal.accent}" stroke-width="2.3"/>
        <ellipse cx="60" cy="62" rx="31" ry="29" fill="url(#${uid}_body)" stroke="${pal.accent}" stroke-width="2.8"/>
        <path d="M40 50 L55 56 L42 60 Z M80 50 L65 56 L78 60 Z" fill="#ef4444" stroke="#1b1826" stroke-width="1.8"/>
        <circle cx="49" cy="55" r="2" fill="#ffffff"/><circle cx="71" cy="55" r="2" fill="#ffffff"/>
        ${renderFace(d, stage, pal, 60, 56, 13, { eyeRadius: 0.1, noCheeks: true, mouth: "grin", mouthOffsetY: 11 })}
      `;
    }
  } else if (rootDex === 10 || rootDex === 13 || d === 123 || d === 212) {
    // 虫蝶系：#10/#13 毛毛虫 → #11/#14 晶茧 → #12 彩蝶翩翩 / #15 蜂刺刺 / #123 镰快快 / #212 钢钳侠
    if (stage === 0 && (d === 10 || d === 13)) {
      figure = `
        <circle cx="76" cy="82" r="11" fill="url(#${uid}_body)" stroke="${pal.accent}" stroke-width="2.4"/>
        <circle cx="62" cy="76" r="13" fill="url(#${uid}_body)" stroke="${pal.accent}" stroke-width="2.4"/>
        <circle cx="48" cy="64" r="16" fill="url(#${uid}_body)" stroke="${pal.accent}" stroke-width="2.6"/>
        <path d="M42 48 L36 34 M54 48 L60 34" stroke="#f43f5e" stroke-width="3" stroke-linecap="round"/>
        ${renderFace(d, 0, pal, 48, 64, 8.5)}
      `;
    } else if (stage === 1 && (d === 11 || d === 14)) {
      figure = `
        <path d="M46 26 C32 42, 34 78, 56 92 C78 82, 82 48, 64 26 Z" fill="url(#${uid}_body)" stroke="${pal.accent}" stroke-width="2.8" stroke-linejoin="round"/>
        <path d="M40 54 L74 48 M42 68 L74 62" stroke="${pal.dark}" stroke-width="2" opacity="0.55"/>
        ${renderFace(d, 1, pal, 56, 54, 9, { mouth: "none", noCheeks: true })}
      `;
    } else if (d === 12) {
      // #012 蝶翩翩：巨大华丽四瓣彩蝶翼 + 卷曲触角（绝无鸟喙！）
      figure = `
        <ellipse cx="32" cy="46" rx="24" ry="20" transform="rotate(-18 32 46)" fill="#f8fafc" stroke="#1e1b29" stroke-width="2.6"/>
        <ellipse cx="88" cy="46" rx="24" ry="20" transform="rotate(18 88 46)" fill="#f8fafc" stroke="#1e1b29" stroke-width="2.6"/>
        <ellipse cx="36" cy="74" rx="18" ry="14" transform="rotate(15 36 74)" fill="#e2e8f0" stroke="#1e1b29" stroke-width="2.4"/>
        <ellipse cx="84" cy="74" rx="18" ry="14" transform="rotate(-15 84 74)" fill="#e2e8f0" stroke="#1e1b29" stroke-width="2.4"/>
        <circle cx="26" cy="42" r="7" fill="${pal.light}"/><circle cx="94" cy="42" r="7" fill="${pal.light}"/>
        <path d="M54 34 Q46 18 38 22 M66 34 Q74 18 82 22" stroke="#1e1b29" stroke-width="2.2" fill="none" stroke-linecap="round"/>
        <ellipse cx="60" cy="62" rx="14" ry="24" fill="url(#${uid}_sec)" stroke="${pal.accent}" stroke-width="2.6"/>
        ${renderFace(d, 2, { ...pal, eye: "#e11d48" }, 60, 52, 7.5, { eyeRadius: 4.5, mouth: 3 })}
      `;
    } else {
      // #015 蜂刺刺 / #123 镰快快 / #212 钢钳侠：晶透翼 + 锋利双镰/双枪
      figure = `
        <ellipse cx="30" cy="48" rx="20" ry="10" transform="rotate(-28 30 48)" fill="#e0f2fe" opacity="0.78" stroke="${pal.accent}" stroke-width="2"/>
        <ellipse cx="90" cy="48" rx="20" ry="10" transform="rotate(28 90 48)" fill="#e0f2fe" opacity="0.78" stroke="${pal.accent}" stroke-width="2"/>
        <path d="M36 58 L12 44 L24 70 Z M84 58 L108 44 L96 70 Z" fill="#f8fafc" stroke="${pal.accent}" stroke-width="2.4" stroke-linejoin="round"/>
        <path d="M52 32 L42 16 M68 32 L78 16" stroke="${pal.accent}" stroke-width="2.4" stroke-linecap="round"/>
        <ellipse cx="60" cy="62" rx="21" ry="25" fill="url(#${uid}_body)" stroke="${pal.accent}" stroke-width="2.7"/>
        ${renderFace(d, 2, pal, 60, 52, 10, { fierce: true })}
      `;
    }
  } else if (rootDex === 41) {
    // #41-42, #169 嗡蝠蝠 / 呲牙蝠 / 十字蝠：锯齿蝠翼（#169 四翼）+ 声呐大耳 + 小尖牙
    const lowerWings =
      d === 169
        ? `<path d="M40 72 L12 88 L26 78 L38 82 Z M80 72 L108 88 L94 78 L82 82 Z" fill="url(#${uid}_sec)" stroke="${pal.accent}" stroke-width="2.2"/>`
        : "";
    figure = `
      <path d="M36 56 L8 34 L14 62 L24 56 L32 68 Z M84 56 L112 34 L106 62 L96 56 L88 68 Z" fill="url(#${uid}_sec)" stroke="${pal.accent}" stroke-width="2.5" stroke-linejoin="round"/>
      ${lowerWings}
      <path d="M42 36 L30 14 L52 30 Z M78 36 L90 14 L68 30 Z" fill="url(#${uid}_body)" stroke="${pal.accent}" stroke-width="2.4"/>
      <ellipse cx="60" cy="60" rx="22" ry="23" fill="url(#${uid}_body)" stroke="${pal.accent}" stroke-width="2.7"/>
      ${renderFace(d, stage, pal, 60, 56, 10, { mouth: 2, fierce: stage >= 1 })}
    `;
  } else if (rootDex === 16) {
    // #16-18 啾啾 / 咕啾 / 翔啾：飞羽禽鸟 + 飘逸头冠羽翎 + 橘黄鸟喙
    const wingSpan = stage === 0 ? 16 : stage === 1 ? 24 : 32;
    const crestPlume =
      stage === 0
        ? `<path d="M56 32 L60 20 L64 32 Z" fill="url(#${uid}_sec)" stroke="${pal.accent}" stroke-width="2"/>`
        : `<path d="M52 34 Q46 12 32 18 Q46 28 54 34 Z M60 32 Q60 10 74 12 Q68 26 64 34 Z M66 34 Q78 16 90 22 Q76 32 66 36 Z" fill="#f43f5e" stroke="${pal.accent}" stroke-width="2"/>`;
    figure = `
      <path d="M34 62 Q${30 - wingSpan} 36 ${24 - wingSpan * 0.5} 66 Q${28 - wingSpan * 0.3} 78 38 72 Z" fill="url(#${uid}_sec)" stroke="${pal.accent}" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M86 62 Q${90 + wingSpan} 36 ${96 + wingSpan * 0.5} 66 Q${92 + wingSpan * 0.3} 78 82 72 Z" fill="url(#${uid}_sec)" stroke="${pal.accent}" stroke-width="2.5" stroke-linejoin="round"/>
      ${crestPlume}
      <path d="M52 90 L46 98 M52 90 L52 99 M68 90 L68 99 M68 90 L74 98" stroke="#f59e0b" stroke-width="2.6" stroke-linecap="round"/>
      <ellipse cx="60" cy="62" rx="24" ry="26" fill="url(#${uid}_body)" stroke="${pal.accent}" stroke-width="2.8"/>
      <ellipse cx="60" cy="70" rx="16" ry="15" fill="url(#${uid}_belly)"/>
      ${renderFace(d, stage, pal, 60, 55, 11, { mouth: "beak" })}
    `;
  } else if (d === 129 || d === 130 || d === 131 || d === 116 || d === 117 || d === 230 || d === 147 || d === 148) {
    // 锦鲤 / 怒涛海龙 / 浪歌鲸 / 仙蛟系
    if (d === 129) {
      // #129 扑通鲤：王冠背鳍 + 龙须鲤鱼
      figure = `
        <path d="M84 62 L106 44 L102 62 L106 80 Z" fill="#fef08a" stroke="${pal.accent}" stroke-width="2.3" stroke-linejoin="round"/>
        <path d="M48 34 L52 20 L60 28 L68 20 L72 34 Z" fill="#facc15" stroke="${pal.accent}" stroke-width="2.2"/>
        <ellipse cx="58" cy="62" rx="28" ry="22" fill="#f97316" stroke="${pal.accent}" stroke-width="2.8"/>
        <path d="M36 66 Q24 72 22 82" stroke="#facc15" stroke-width="3" fill="none" stroke-linecap="round"/>
        ${renderFace(d, 0, pal, 48, 58, 10, { mouth: 1 })}
      `;
    } else if (d === 131) {
      // #131 浪歌鲸：优雅修长海龙颈 + 背部灰岩螺壳 + 前后浪花鳍肢 + 额前呆萌小角与卷耳
      figure = `
        <ellipse cx="68" cy="74" rx="24" ry="17" fill="#94a3b8" stroke="#334155" stroke-width="2.6"/>
        <circle cx="62" cy="66" r="4" fill="#64748b"/><circle cx="76" cy="70" r="4.5" fill="#64748b"/><circle cx="68" cy="78" r="3.5" fill="#64748b"/>
        <path d="M32 84 Q14 88 20 95 Q38 94 46 84 Z M76 84 Q96 88 92 95 Q76 94 68 86 Z" fill="url(#${uid}_body)" stroke="${pal.accent}" stroke-width="2.4"/>
        <path d="M38 82 C36 68, 42 54, 42 42 C34 38, 34 24, 48 24 C62 24, 64 36, 58 46 C56 58, 62 70, 68 82 C58 88, 44 88, 38 82 Z" fill="url(#${uid}_body)" stroke="${pal.accent}" stroke-width="2.7" stroke-linejoin="round"/>
        <path d="M40 82 C42 70, 46 58, 46 46 L54 48 C54 60, 56 72, 60 84 Z" fill="url(#${uid}_belly)"/>
        <polygon points="48,24 44,13 53,22" fill="#f8fafc" stroke="${pal.accent}" stroke-width="2" stroke-linejoin="round"/>
        <circle cx="58" cy="34" r="4.5" fill="url(#${uid}_sec)" stroke="${pal.accent}" stroke-width="1.8"/>
        ${renderFace(d, 1, pal, 46, 35, 7.5, { eyeRadius: 3.8, mouth: 3 })}
      `;
    } else {
      // #130 怒涛龙 / #147-148 丝带龙 / #116-117, #230 海龙王：盘绕流线龙躯 + 羽状耳鳍/龙冠 + 颈部宝珠
      const isGyarados = d === 130;
      const headCrest = isGyarados
        ? `<path d="M48 26 L42 12 L56 20 L60 10 L64 20 L78 12 L72 26 Z" fill="#38bdf8" stroke="${pal.accent}" stroke-width="2.2" stroke-linejoin="round"/>`
        : `<path d="M38 34 Q20 18 24 36 Q32 42 40 38 Z M82 34 Q100 18 96 36 Q88 42 80 38 Z" fill="#ffffff" stroke="${pal.accent}" stroke-width="2.2"/>`;
      figure = `
        <path d="M36 86 C20 82, 22 58, 42 56 C62 54, 72 68, 92 64 C102 62, 104 48, 94 42 C98 56, 90 78, 72 82 C54 86, 48 70, 38 72 C30 74, 30 82, 36 86 Z" fill="url(#${uid}_body)" stroke="${pal.accent}" stroke-width="2.6" stroke-linejoin="round"/>
        <path d="M44 74 C44 52, 46 34, 60 32 C74 34, 76 52, 74 76 C66 84, 52 84, 44 74 Z" fill="url(#${uid}_body)" stroke="${pal.accent}" stroke-width="2.8"/>
        <ellipse cx="60" cy="64" rx="11" ry="16" fill="url(#${uid}_belly)"/>
        <path d="M51 58 Q60 61 69 58 M50 66 Q60 69 70 66 M52 74 Q60 76 68 74" stroke="${pal.accent}" stroke-width="1.5" opacity="0.45" fill="none"/>
        ${headCrest}
        <circle cx="60" cy="54" r="5" fill="${isGyarados ? "#facc15" : "#38bdf8"}" stroke="#ffffff" stroke-width="1.8"/>
        ${renderFace(d, stage, pal, 60, 42, 10, { fierce: isGyarados || d === 230 })}
      `;
    }
  } else if (rootDex === 4 || d === 149) {
    // #004-006 火苗崽→焰鳞儿→焚天龙 / #149 胖胖龙：双足火龙/快龙 + 火焰尾 + 龙角与巨翼
    const wings =
      stage >= 2
        ? `<path d="M36 56 L8 26 L14 56 L26 60 L16 72 L36 66 Z" fill="#2dd4bf" stroke="${pal.accent}" stroke-width="2.5" stroke-linejoin="round"/>
           <path d="M84 56 L112 26 L106 56 L94 60 L104 72 L84 66 Z" fill="#2dd4bf" stroke="${pal.accent}" stroke-width="2.5" stroke-linejoin="round"/>`
        : "";
    const horns =
      d === 149
        ? `<path d="M48 30 Q40 12 32 18 M72 30 Q80 12 88 18" stroke="#fef08a" stroke-width="3.2" fill="none" stroke-linecap="round"/>`
        : stage === 1
          ? `<path d="M60 28 L66 14 L54 28 Z" fill="url(#${uid}_body)" stroke="${pal.accent}" stroke-width="2.2"/>`
          : stage >= 2
            ? `<path d="M44 32 L34 14 L50 28 Z M76 32 L86 14 L70 28 Z" fill="url(#${uid}_body)" stroke="${pal.accent}" stroke-width="2.3"/>`
            : "";
    const tailFlame =
      d === 149
        ? ""
        : `<path d="M104 44 Q112 56 104 64 Q96 56 104 44 Z" fill="#facc15" stroke="#ea580c" stroke-width="2"/>`;
    figure = `
      ${wings}
      <path d="M78 82 Q104 82 104 58" stroke="url(#${uid}_body)" stroke-width="9" fill="none" stroke-linecap="round"/>
      ${tailFlame}
      ${horns}
      <ellipse cx="43" cy="92" rx="8" ry="6" fill="${pal.dark}" stroke="${pal.accent}" stroke-width="2.4"/>
      <ellipse cx="77" cy="92" rx="8" ry="6" fill="${pal.dark}" stroke="${pal.accent}" stroke-width="2.4"/>
      <path d="M32 64 C32 38, 44 28, 60 28 C76 28, 88 38, 88 64 C88 84, 76 94, 60 94 C44 94, 32 84, 32 64 Z" fill="url(#${uid}_body)" stroke="${pal.accent}" stroke-width="2.8"/>
      <ellipse cx="60" cy="72" rx="18" ry="18" fill="url(#${uid}_belly)"/>
      <path d="M46 68 Q60 71 74 68 M45 76 Q60 79 75 76" stroke="${pal.accent}" stroke-width="1.5" opacity="0.4" fill="none"/>
      ${renderFace(d, stage, pal, 60, 52, 12, { fierce: stage >= 2 && d !== 149 })}
    `;
  } else if (rootDex === 7) {
    // #007-009 水咕噜 → 波壳龟 → 浪甲王：龟壳背甲 + 浪花耳(1阶) + 双肩高压水炮(2阶)
    const cannons =
      stage >= 2
        ? `<rect x="24" y="22" width="12" height="22" rx="4" transform="rotate(-24 30 33)" fill="#cbd5e1" stroke="#334155" stroke-width="2.4"/>
           <rect x="84" y="22" width="12" height="22" rx="4" transform="rotate(24 90 33)" fill="#cbd5e1" stroke="#334155" stroke-width="2.4"/>`
        : stage === 1
          ? `<path d="M36 38 Q20 20 26 42 Z M84 38 Q100 20 94 42 Z" fill="#e0f2fe" stroke="${pal.accent}" stroke-width="2.2"/>`
          : "";
    figure = `
      <ellipse cx="60" cy="64" rx="34" ry="31" fill="#92400e" stroke="#451a03" stroke-width="2.6"/>
      <ellipse cx="60" cy="64" rx="31" ry="28" fill="none" stroke="#fef3c7" stroke-width="2.4"/>
      ${cannons}
      <path d="M80 82 Q106 76 100 56 Q90 52 88 64" fill="url(#${uid}_sec)" stroke="${pal.accent}" stroke-width="2.4"/>
      <ellipse cx="43" cy="92" rx="8.5" ry="5.5" fill="${pal.dark}" stroke="${pal.accent}" stroke-width="2.3"/>
      <ellipse cx="77" cy="92" rx="8.5" ry="5.5" fill="${pal.dark}" stroke="${pal.accent}" stroke-width="2.3"/>
      <ellipse cx="60" cy="63" rx="28" ry="27" fill="url(#${uid}_body)" stroke="${pal.accent}" stroke-width="2.8"/>
      <ellipse cx="60" cy="73" rx="19" ry="15" fill="#fef3c7" stroke="#92400e" stroke-width="1.8"/>
      <line x1="44" y1="73" x2="76" y2="73" stroke="#92400e" stroke-width="1.4" opacity="0.5"/>
      <line x1="60" y1="59" x2="60" y2="87" stroke="#92400e" stroke-width="1.4" opacity="0.5"/>
      ${renderFace(d, stage, pal, 60, 54, 12.5)}
    `;
  } else if (rootDex === 1 || rootDex === 43 || rootDex === 69 || rootDex === 285 || rootDex === 546) {
    // 1. 植物草木家族（#1-3 芽苞/叶团/花蓬；#285-286 蘑菇帽；#546-547 棉絮云；#43-45/#69-71 花朵喇叭）
    if (rootDex === 285) {
      figure = `
        <ellipse cx="44" cy="92" rx="8" ry="5.5" fill="${pal.dark}" stroke="${pal.accent}" stroke-width="2.3"/>
        <ellipse cx="76" cy="92" rx="8" ry="5.5" fill="${pal.dark}" stroke="${pal.accent}" stroke-width="2.3"/>
        <ellipse cx="60" cy="70" rx="24" ry="22" fill="url(#${uid}_belly)" stroke="${pal.accent}" stroke-width="2.6"/>
        <path d="M24 54 C24 24, 96 24, 96 54 Z" fill="url(#${uid}_body)" stroke="${pal.accent}" stroke-width="2.8" stroke-linejoin="round"/>
        <circle cx="44" cy="40" r="6" fill="#fef08a"/><circle cx="74" cy="42" r="5" fill="#fef08a"/><circle cx="60" cy="32" r="4.5" fill="#fef08a"/>
        ${renderFace(d, stage, pal, 60, 72, 11)}
      `;
    } else {
      const crown =
        stage === 0
          ? `<path d="M60 32 Q52 14 40 22 Q48 34 60 32 Z" fill="url(#${uid}_sec)" stroke="${pal.accent}" stroke-width="2.4"/>
             <path d="M60 32 Q68 12 80 20 Q72 34 60 32 Z" fill="url(#${uid}_sec)" stroke="${pal.accent}" stroke-width="2.4"/>`
          : stage === 1
            ? `<path d="M60 34 Q42 16 32 28 Q45 38 60 34 Z M60 34 Q78 16 88 28 Q75 38 60 34 Z" fill="#52b848" stroke="${pal.accent}" stroke-width="2.4"/>
               <ellipse cx="60" cy="24" rx="12" ry="11" fill="#ff7398" stroke="${pal.accent}" stroke-width="2.4"/>`
            : `<path d="M26 52 Q14 40 24 28 Q38 34 40 48 Z M94 52 Q106 40 96 28 Q82 34 80 48 Z" fill="#46a83c" stroke="${pal.accent}" stroke-width="2.4"/>
               <ellipse cx="42" cy="26" rx="14" ry="9" transform="rotate(-22 42 26)" fill="#ff6388" stroke="${pal.accent}" stroke-width="2.3"/>
               <ellipse cx="78" cy="26" rx="14" ry="9" transform="rotate(22 78 26)" fill="#ff6388" stroke="${pal.accent}" stroke-width="2.3"/>
               <ellipse cx="60" cy="22" rx="16" ry="10" fill="#ff85a3" stroke="${pal.accent}" stroke-width="2.4"/>
               <circle cx="60" cy="23" r="6" fill="#ffe066" stroke="${pal.accent}" stroke-width="1.8"/>`;
      figure = `
        ${crown}
        <ellipse cx="42" cy="92" rx="8.5" ry="6" fill="${pal.dark}" stroke="${pal.accent}" stroke-width="2.4"/>
        <ellipse cx="78" cy="92" rx="8.5" ry="6" fill="${pal.dark}" stroke="${pal.accent}" stroke-width="2.4"/>
        <path d="M27 66 C25 42, 42 32, 60 32 C78 32, 95 42, 93 66 C92 86, 78 94, 60 94 C42 94, 28 86, 27 66 Z" fill="url(#${uid}_body)" stroke="${pal.accent}" stroke-width="2.8"/>
        <ellipse cx="60" cy="76" rx="20" ry="13" fill="url(#${uid}_belly)" opacity="0.92"/>
        <circle cx="35" cy="56" r="4" fill="${pal.dark}" opacity="0.35"/><circle cx="84" cy="54" r="4.5" fill="${pal.dark}" opacity="0.35"/>
        ${renderFace(d, stage, pal, 60, 65, 13)}
      `;
    }
  } else if (rootDex === 37 || rootDex === 133 || rootDex === 52 || rootDex === 58 || rootDex === 77 || rootDex === 228 || rootDex === 300 || rootDex === 570) {
    // 2. 九尾狐 / 绒布布家族 / 灵猫灵犬：针对 #37-38 扇形多尾，针对 #133 家族配专属属性耳饰/额前宝石/缎带
    const isNinetales = d === 37 || d === 38;
    const tails = isNinetales
      ? d === 38
        ? `<path d="M74 80 Q114 40 98 22 Q82 32 76 62 Z M78 82 Q118 58 108 38 Q90 46 80 70 Z M80 86 Q116 78 110 58 Q94 64 82 78 Z" fill="url(#${uid}_sec)" stroke="${pal.accent}" stroke-width="2.3"/>`
        : `<path d="M76 80 Q110 52 98 32 Q84 40 78 68 Z M80 84 Q114 70 106 50 Q90 56 82 76 Z" fill="url(#${uid}_sec)" stroke="${pal.accent}" stroke-width="2.3"/>`
      : `<path d="M78 80 Q108 64 102 40 Q86 46 80 70 Z" fill="url(#${uid}_sec)" stroke="${pal.accent}" stroke-width="2.5"/>`;
    const headDecor =
      d === 52 || d === 53
        ? `<ellipse cx="60" cy="40" rx="5" ry="7" fill="#facc15" stroke="#92400e" stroke-width="1.8"/>`
        : d === 196
          ? `<circle cx="60" cy="43" r="3.8" fill="#ef4444" stroke="#ffffff" stroke-width="1.2"/>`
          : d === 197
            ? `<circle cx="60" cy="42" r="5" fill="none" stroke="#facc15" stroke-width="2.4"/>`
            : d === 700
              ? `<path d="M48 36 L38 30 L38 42 Z M72 36 L82 30 L82 42 Z" fill="#f472b6" stroke="${pal.accent}" stroke-width="1.8"/><circle cx="60" cy="36" r="4" fill="#f472b6"/>`
              : isNinetales
                ? `<path d="M52 34 Q60 16 70 26 Q64 34 56 36 Z" fill="url(#${uid}_sec)" stroke="${pal.accent}" stroke-width="2.2"/>`
                : "";
    figure = `
      ${tails}
      <path d="M36 44 L20 12 L50 32 Z M84 44 L100 12 L70 32 Z" fill="url(#${uid}_body)" stroke="${pal.accent}" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M36 40 L26 18 L46 33 Z M84 40 L94 18 L74 33 Z" fill="${pal.belly}" opacity="0.88"/>
      <ellipse cx="44" cy="92" rx="7.5" ry="5.5" fill="${pal.dark}" stroke="${pal.accent}" stroke-width="2.3"/>
      <ellipse cx="76" cy="92" rx="7.5" ry="5.5" fill="${pal.dark}" stroke="${pal.accent}" stroke-width="2.3"/>
      <ellipse cx="60" cy="64" rx="27" ry="26" fill="url(#${uid}_body)" stroke="${pal.accent}" stroke-width="2.8"/>
      <path d="M36 68 Q48 78 60 84 Q72 78 84 68 Q76 58 60 60 Q44 58 36 68 Z" fill="url(#${uid}_belly)" stroke="${pal.accent}" stroke-width="2" stroke-linejoin="round"/>
      ${headDecor}
      ${renderFace(d, stage, pal, 60, 58, 12.5)}
    `;
  } else if (rootDex === 172 || d === 311 || d === 312 || d === 417 || d === 702) {
    // 雷电萌鼠家族（#172 毛电球 → #025 电毛球 → #026 雷鼓将）：黑尖长耳 + 红电颊 + 锯齿闪电尾
    const earTip = d === 26 ? "#fef08a" : "#1e1b29";
    figure = `
      <path d="M80 78 L98 66 L90 60 L108 42 L86 52 L92 58 L76 72 Z" fill="#facc15" stroke="${pal.accent}" stroke-width="2.3" stroke-linejoin="round"/>
      <path d="M40 38 L24 10 L48 30 Z M80 38 L96 10 L72 30 Z" fill="url(#${uid}_body)" stroke="${pal.accent}" stroke-width="2.5" stroke-linejoin="round"/>
      <polygon points="24,10 31,22 36,19" fill="${earTip}"/><polygon points="96,10 89,22 84,19" fill="${earTip}"/>
      <ellipse cx="43" cy="92" rx="8" ry="5.5" fill="${pal.dark}" stroke="${pal.accent}" stroke-width="2.3"/>
      <ellipse cx="77" cy="92" rx="8" ry="5.5" fill="${pal.dark}" stroke="${pal.accent}" stroke-width="2.3"/>
      <ellipse cx="60" cy="64" rx="28" ry="27" fill="url(#${uid}_body)" stroke="${pal.accent}" stroke-width="2.8"/>
      <ellipse cx="60" cy="74" rx="18" ry="14" fill="url(#${uid}_belly)"/>
      ${renderFace(d, stage, pal, 60, 58, 12.5)}
    `;
  } else if (rootDex === 74 || rootDex === 95 || rootDex === 104 || rootDex === 111) {
    // 岩石巨人 / 钻角狂犀 / 钢鳞大蛇：多面岩石重甲 + 犀角/巨拳
    const horn =
      rootDex === 111 || rootDex === 95
        ? `<polygon points="60,12 52,32 68,32" fill="#f8fafc" stroke="${pal.accent}" stroke-width="2.4" stroke-linejoin="round"/>`
        : "";
    figure = `
      ${horn}
      <circle cx="22" cy="62" r="10" fill="url(#${uid}_sec)" stroke="${pal.accent}" stroke-width="2.5"/>
      <circle cx="98" cy="62" r="10" fill="url(#${uid}_sec)" stroke="${pal.accent}" stroke-width="2.5"/>
      <polygon points="36,92 48,92 46,82 34,82" fill="${pal.dark}" stroke="${pal.accent}" stroke-width="2.2"/>
      <polygon points="84,92 72,92 74,82 86,82" fill="${pal.dark}" stroke="${pal.accent}" stroke-width="2.2"/>
      <polygon points="60,26 88,38 92,68 78,90 42,90 28,68 32,38" fill="url(#${uid}_body)" stroke="${pal.accent}" stroke-width="2.8" stroke-linejoin="round"/>
      <path d="M40 42 L60 50 L80 42 M42 74 L60 66 L78 74" stroke="${pal.dark}" stroke-width="2" fill="none" opacity="0.55"/>
      ${renderFace(d, stage, pal, 60, 56, 13, { fierce: true, noCheeks: true })}
    `;
  } else {
    // 圆团/水蛙/福蛋/呼呼兽通用萌团（按物种特征附加肚皮漩涡/怀中福蛋/胡须等）
    const swirl =
      rootDex === 60
        ? `<path d="M60 74 m-9 0 a9 9 0 1 0 18 0 a6 6 0 1 0 -12 0 a3 3 0 1 0 6 0" fill="none" stroke="#1e3a8a" stroke-width="2.2" stroke-linecap="round"/>`
        : rootDex === 440
          ? `<ellipse cx="60" cy="77" rx="10" ry="12" fill="#ffffff" stroke="${pal.accent}" stroke-width="2"/>`
          : "";
    figure = `
      <circle cx="36" cy="30" r="10.5" fill="url(#${uid}_body)" stroke="${pal.accent}" stroke-width="2.5"/>
      <circle cx="84" cy="30" r="10.5" fill="url(#${uid}_body)" stroke="${pal.accent}" stroke-width="2.5"/>
      <circle cx="36" cy="30" r="5" fill="${pal.belly}"/><circle cx="84" cy="30" r="5" fill="${pal.belly}"/>
      <ellipse cx="43" cy="92" rx="8.5" ry="5.5" fill="${pal.dark}" stroke="${pal.accent}" stroke-width="2.4"/>
      <ellipse cx="77" cy="92" rx="8.5" ry="5.5" fill="${pal.dark}" stroke="${pal.accent}" stroke-width="2.4"/>
      <ellipse cx="27" cy="64" rx="7" ry="5" transform="rotate(-25 27 64)" fill="url(#${uid}_body)" stroke="${pal.accent}" stroke-width="2.3"/>
      <ellipse cx="93" cy="64" rx="7" ry="5" transform="rotate(25 93 64)" fill="url(#${uid}_body)" stroke="${pal.accent}" stroke-width="2.3"/>
      <ellipse cx="60" cy="63" rx="30" ry="28" fill="url(#${uid}_body)" stroke="${pal.accent}" stroke-width="2.8"/>
      <ellipse cx="60" cy="73" rx="19" ry="14" fill="url(#${uid}_belly)"/>
      ${swirl}
      <ellipse cx="48" cy="43" rx="11" ry="5" transform="rotate(-16 48 43)" fill="#ffffff" opacity="0.38"/>
      ${renderFace(d, stage, pal, 60, 56, 13)}
    `;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">${defs}<circle cx="60" cy="60" r="54" fill="url(#${uid}_bg)"/>${renderElementalDecor(d, primaryType, stage, tier, isShiny, pal, secPal)}<ellipse cx="60" cy="97" rx="${Math.round(28 * scale)}" ry="6.5" fill="#05070c" opacity="0.38"/><g transform="translate(60 64) scale(${scale}) translate(-60 -64)">${figure}</g></svg>`;
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

let rosterSetCache = null;
const hasLocalHdArt = (dex, isShiny) => {
  if (globalThis.BEAST_FORCE_SVG === true) return false;
  const set = isShiny ? globalThis.BEAST_HD_SHINY_DEX : globalThis.BEAST_HD_DEX;
  if (set && typeof set.has === "function") return set.has(Number(dex));
  if (!rosterSetCache && Array.isArray(globalThis.BEAST_ROSTER)) {
    rosterSetCache = new Set(globalThis.BEAST_ROSTER.map(Number));
  }
  return rosterSetCache ? rosterSetCache.has(Number(dex)) : true;
};

const localArtUrl = (dex, isShiny) =>
  isShiny ? `./assets/beasts_shiny/${pad3(dex)}.png` : `./assets/beasts/${pad3(dex)}.png`;

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
  const d = Number(dex) || 1;
  const src = hasLocalHdArt(d, isShiny) ? localArtUrl(d, isShiny) : beastSpriteDataUri(d, isShiny);
  const { stage, tier } = getStageAndRoot(d);
  const extraCls = `${isShiny ? " mon-icon--shiny" : ""}${tier === "epic" ? " mon-icon--epic" : stage >= 2 ? " mon-icon--stage3" : ""}`;
  return `<img class="mon-icon${extraCls}" src="${src}" data-dex="${escapeHtml(
    String(d),
  )}" data-shiny="${isShiny ? 1 : 0}" alt="${a}" loading="eager" decoding="async" onerror="globalThis.__beastSpriteOnError && globalThis.__beastSpriteOnError(this)" />`;
};
