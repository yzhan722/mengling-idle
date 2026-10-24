// rpg_svg_icons.js — 纯 AI 手绘 RPG 游戏图标渲染器 (v0.7.0 AI Hand-Painted Icon Suite)
// 彻底摒弃任何数学公式/函数拼凑的几何 SVG，全量加载 64 枚 AI 独立手绘、去背精裁的商业级 RPG 图标素材 (./assets/ui_icons/*.webp)。

const VALID_ORBS = new Set([
  "pokeball",
  "greatball",
  "ultraball",
  "quickball",
  "luxuryball",
  "netball",
  "duskball",
  "masterball",
]);

const RES_ICON_MAP = {
  pokeball: "pokeball",
  greatball: "greatball",
  ultraball: "ultraball",
  quickball: "quickball",
  luxuryball: "luxuryball",
  netball: "netball",
  duskball: "duskball",
  masterball: "masterball",
  catnip: "catnip",
  wood: "wood",
  minerals: "minerals",
  science: "science",
  futurecoin: "futurecoin",
  evolutionstone: "evolutionStone",
  megastone: "megaStone",
  linkrope: "linkRope",
  rarecandy: "rareCandy",
  expcandys: "expCandyS",
  expcandy: "expCandy",
  expcandyl: "expCandyL",
  expcandyxl: "expCandyXL",
  affectiontreat: "affectionTreat",
  friendshipbracelet: "friendshipBracelet",
  soothebell: "sootheBell",
  luckyegg: "luckyEgg",
  bottlecap: "bottleCap",
  goldbottlecap: "goldBottleCap",
  bigberry: "bigBerry",
  hugeberry: "hugeBerry",
  energydrink: "energyDrink",
  searchflare: "searchFlare",
  shinycharm: "shinyCharm",
  advsearchcell: "advSearchCell",
  hppotion: "hpPotion",
  atkpotion: "atkPotion",
  defpotion: "defPotion",
  spapotion: "spaPotion",
  spdpotion: "spdPotion",
  spepotion: "spePotion",
  stardust: "evolutionStone",
  pokedexshard: "megaStone",
  badgetoken: "goldBottleCap",
  rebirthessence: "megaStone",
};

const BUILDING_ICON_MAP = {
  field: "field",
  granary: "granary",
  berryPress: "berryPress",
  hut: "hut",
  storehouse: "storehouse",
  lumberYard: "lumberYard",
  workshop: "workshop",
  quarry: "quarry",
  mineralSilo: "mineralSilo",
  rangerPost: "rangerPost",
  researchLab: "researchLab",
  ballBench: "ballBench",
  ballFactory: "ballFactory",
  trainingGround: "trainingGround",
  breedingHouse: "breedingHouse",
  expeditionPost: "expeditionPost",
  library: "library",
  commandCenter: "commandCenter",
};

const TECH_ICON_MAP = {
  ball: "ballBench",
  berry: "field",
  wood: "lumberYard",
  mineral: "workshop",
  shiny: "shinyCharm",
  science: "science",
};

function renderIconImg(iconFileKey, size = 24, extraClass = "") {
  const s = Number(size) || 24;
  const cls = ["rpg-ai-icon", extraClass].filter(Boolean).join(" ");
  return `<img class="${cls}" src="./assets/ui_icons/${iconFileKey}.webp" width="${s}" height="${s}" style="width:${s}px;height:${s}px" alt="" decoding="async" />`;
}

export function renderOrbSvg(ballId = "pokeball", size = 24) {
  const raw = String(ballId || "pokeball").toLowerCase();
  const key = VALID_ORBS.has(raw) ? raw : "pokeball";
  return renderIconImg(key, size, `rpg-svg-orb rpg-svg-orb--${key}`);
}

export function renderResSvg(rid = "catnip", size = 20) {
  const raw = String(rid || "catnip");
  const lower = raw.toLowerCase();
  const key = RES_ICON_MAP[lower] || BUILDING_ICON_MAP[raw] || "futurecoin";
  return renderIconImg(key, size, "rpg-svg-res");
}

export function renderBuildingSvg(bid = "field", size = 34) {
  const raw = String(bid || "field");
  const key = BUILDING_ICON_MAP[raw] || RES_ICON_MAP[raw.toLowerCase()] || "field";
  return renderIconImg(key, size, "rpg-svg-bldg");
}

export function renderTechSvg(kind = "science", size = 34) {
  const k = String(kind || "science");
  const key = TECH_ICON_MAP[k] || BUILDING_ICON_MAP[k] || RES_ICON_MAP[k.toLowerCase()] || "science";
  return renderIconImg(key, size, "rpg-svg-bldg");
}

export function renderUiIcon(iconKey = "tab_bonfire", size = 20) {
  return renderIconImg(String(iconKey || "tab_bonfire"), size, "rpg-svg-res");
}
