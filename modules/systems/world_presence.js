/**
 * World presence helpers — real players only.
 * Trainer handles stay ASCII so CDN/encoding never turns them into mojibake.
 */

export function localDateStr(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** True if name looks empty, uid-like garbage, or encoding junk. */
export function looksBrokenName(name) {
  const n = String(name || "").trim();
  if (!n) return true;
  if (n.includes("�")) return true;
  // classic mojibake markers from UTF-8 read as latin1
  if (/[ÃÂåæçðñòóô]/.test(n) && /[¤¥¦§¨©ª«]/.test(n)) return true;
  if (/^[\x00-\x1f\x7f-\x9f]+$/.test(n)) return true;
  // bare uid / hash dumps / auto-generated score stubs
  if (/^[0-9a-f]{12,}$/i.test(n)) return true;
  if (/^(uid|user|guest|tmp|qa|all|fb)[_-]?[0-9a-f]{6,}$/i.test(n)) return true;
  if (/^[a-z]{1,4}[0-9a-f]{8,}$/i.test(n)) return true;
  return false;
}

/** Prefer a readable trainer handle for UI. */
export function displayTrainerId(name, uid = "") {
  const n = String(name || "").trim();
  if (!looksBrokenName(n)) return n.slice(0, 32);
  const raw = String(uid || n || "anon");
  const compact = raw.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10) || "anon";
  return `T_${compact}`;
}

/** Normalize real leaderboard rows: repair broken names, sort, re-rank. */
export function cleanLeaderboard(items) {
  const real = Array.isArray(items) ? items.slice() : [];
  const cleaned = real.map((it) => {
    const rawName =
      typeof it?.attrs?.ownerName === "string"
        ? it.attrs.ownerName
        : typeof it?.name === "string"
          ? it.name
          : "";
    const uid = typeof it?.uid === "string" ? it.uid : typeof it?.attrs?.uid === "string" ? it.attrs.uid : "";
    const ownerName = displayTrainerId(rawName, uid);
    return {
      ...it,
      name: ownerName,
      attrs: {
        ...(it.attrs && typeof it.attrs === "object" ? it.attrs : {}),
        ownerName,
        uid: uid || undefined,
      },
    };
  });
  cleaned.sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0));
  return cleaned.slice(0, 100).map((it, idx) => ({
    ...it,
    rank: idx + 1,
    attrs: {
      ...(it.attrs && typeof it.attrs === "object" ? it.attrs : {}),
      ownerName:
        typeof it?.attrs?.ownerName === "string"
          ? it.attrs.ownerName
          : typeof it?.name === "string"
            ? it.name
            : "Trainer_Anon",
    },
  }));
}

/** One-line HUD for林佬 boss. */
export function bossHudLine(boss) {
  if (!boss || typeof boss !== "object") return "Boss: connecting…";
  const maxHp = typeof boss.maxHp === "number" && Number.isFinite(boss.maxHp) ? Math.max(1, Math.floor(boss.maxHp)) : 0;
  const hp = typeof boss.hp === "number" && Number.isFinite(boss.hp) ? Math.max(0, Math.floor(boss.hp)) : 0;
  if (!maxHp) return "Boss: no data";
  const pct = Math.min(100, Math.round((hp / maxHp) * 100));
  if (hp <= 0) return `Boss: down · round ${Math.max(0, Math.floor(boss.killSeq || 0))}`;
  return `Boss HP ${hp}/${maxHp} (${pct}%)`;
}
