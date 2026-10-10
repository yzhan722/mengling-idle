/** Type skills — single source of truth for names, UI, and activation gates.
 *  9 系技能（每系一个主动技），从原 18 系精简合并而来。
 */

export const TYPE_SKILLS = {
  fire: "温暖",
  water: "浇水",
  grass: "种植",
  electric: "充电",
  wind: "飞翔",
  stone: "打磨",
  light: "祝福",
  dark: "霸凌",
  mystic: "梦魇",
};

/** Short effect blurbs for UI. */
export const TYPE_SKILL_DESC = {
  fire: "生蛋剩余时间 -15 分钟",
  water: "种植中的果树 -10 分钟",
  grass: "消耗 1万灵果，种植 8 小时后得大灵果",
  electric: "研究剩余时间 -10 分钟",
  wind: "远征剩余时间 -30 分钟",
  stone: "建筑成本 -20%（60分钟）",
  light: "亲密度获取 ×2（60分钟）",
  dark: "PvE 伤害 +50%（10分钟）",
  mystic: "攻击全服林佬 Boss",
};

export const IMPLEMENTED_SKILL_TYPES = Object.freeze(Object.keys(TYPE_SKILLS));

/**
 * Global buff / charge skills: batch button only fires once（用第一只就绪萌灵），
 * 避免 50 只同系叠出夸张层数。
 */
export const BATCH_ONCE_SKILL_TYPES = Object.freeze([
  "stone",
  "light",
  "dark",
  "mystic",
]);

export function isSkillImplemented(typeId) {
  return Boolean(typeId && TYPE_SKILLS[typeId]);
}

export function skillCdSec(typeId) {
  return typeId === "grass" ? 8 * 3600 : 3600;
}

/** Active global buff lines for Mons UI. */
export function listActiveSkillBuffs(skills) {
  const s = skills && typeof skills === "object" ? skills : {};
  const lines = [];
  const fmt = (sec) => {
    const n = Math.max(0, Math.ceil(Number(sec) || 0));
    const mm = Math.floor(n / 60);
    const ss = n % 60;
    return `${mm}:${String(ss).padStart(2, "0")}`;
  };
  if ((s.fairyAffGainRemainingSec ?? 0) > 0) lines.push(`祝福 ${fmt(s.fairyAffGainRemainingSec)}`);
  if ((s.rockBuildBoostRemainingSec ?? 0) > 0) lines.push(`打磨 ${fmt(s.rockBuildBoostRemainingSec)}`);
  if ((s.darkPveDamageBoostRemainingSec ?? 0) > 0) lines.push(`霸凌 ${fmt(s.darkPveDamageBoostRemainingSec)}`);
  return lines;
}

globalThis.TYPE_SKILLS = TYPE_SKILLS;
