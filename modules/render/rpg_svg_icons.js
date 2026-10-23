// rpg_svg_icons.js — 商业级多图层渐变 SVG 游戏图标与灵球渲染库 (v0.6.0 Commercial Art Upgrade)
// 彻底告别系统默认 Emoji 的廉价文字感与 Windows 缺字豆腐块（□），
// 为全站灵球、建筑、科技、资源提供带高光、金属环与法阵光晕的定制矢量美术图标。

export function renderOrbSvg(ballId = "pokeball", size = 22) {
  const id = String(ballId || "pokeball").toLowerCase();
  const s = Number(size) || 22;

  const palettes = {
    pokeball: { top1: "#fb7185", top2: "#e11d48", band: "#facc15", core: "#fef08a", mark: "#fde047" },
    greatball: { top1: "#60a5fa", top2: "#2563eb", band: "#facc15", core: "#bae6fd", mark: "#f87171" },
    ultraball: { top1: "#38bdf8", top2: "#1d4ed8", band: "#facc15", core: "#fef08a", mark: "#fde047" },
    quickball: { top1: "#facc15", top2: "#0284c7", band: "#fef08a", core: "#ffffff", mark: "#fde047" },
    luxuryball: { top1: "#334155", top2: "#0f172a", band: "#f59e0b", core: "#fde047", mark: "#fb7185" },
    netball: { top1: "#2dd4bf", top2: "#0f766e", band: "#94a3b8", core: "#a7f3d0", mark: "#042f2e" },
    duskball: { top1: "#4c1d95", top2: "#14532d", band: "#4ade80", core: "#c084fc", mark: "#22c55e" },
    masterball: { top1: "#c084fc", top2: "#6b21a8", band: "#facc15", core: "#f472b6", mark: "#fef08a" },
  };
  const p = palettes[id] || palettes.pokeball;

  return `<svg class="rpg-svg-orb rpg-svg-orb--${id}" width="${s}" height="${s}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <radialGradient id="orbTop_${id}" cx="35%" cy="28%" r="68%">
        <stop offset="0%" stop-color="${p.top1}"/>
        <stop offset="100%" stop-color="${p.top2}"/>
      </radialGradient>
      <linearGradient id="orbBot_${id}" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#f8fafc"/>
        <stop offset="100%" stop-color="#cbd5e1"/>
      </linearGradient>
    </defs>
    <circle cx="16" cy="16" r="14" fill="url(#orbBot_${id})" stroke="#0f172a" stroke-width="2"/>
    <path d="M2 16 A14 14 0 0 1 30 16 Z" fill="url(#orbTop_${id})" stroke="#0f172a" stroke-width="1.5"/>
    <path d="M6 10 Q16 6 26 10" fill="none" stroke="${p.mark}" stroke-width="1.8" stroke-linecap="round" opacity="0.85"/>
    <rect x="2" y="14.2" width="28" height="3.6" rx="1.8" fill="${p.band}" stroke="#0f172a" stroke-width="1.2"/>
    <circle cx="16" cy="16" r="5.2" fill="#0f172a"/>
    <circle cx="16" cy="16" r="3.6" fill="${p.core}"/>
    <ellipse cx="11" cy="8.5" rx="3.8" ry="2" transform="rotate(-22 11 8.5)" fill="rgba(255,255,255,0.55)"/>
  </svg>`;
}

export function renderResSvg(rid = "catnip", size = 16) {
  const s = Number(size) || 16;
  const id = String(rid || "").toLowerCase();
  if (id.includes("ball")) return renderOrbSvg(id, s);

  if (id === "catnip") {
    return `<svg class="rpg-svg-res" width="${s}" height="${s}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M12 4 C8 4 5 8 6 13 C7 18 10 21 12 21 C14 21 17 18 18 13 C19 8 16 4 12 4 Z" fill="#f43f5e" stroke="#881337" stroke-width="1.5"/>
      <path d="M8 5 Q12 1 16 5 Q12 7 8 5 Z" fill="#4ade80" stroke="#14532d" stroke-width="1.2"/>
      <circle cx="9.5" cy="10" r="1" fill="#fef08a"/>
      <circle cx="14" cy="11" r="1" fill="#fef08a"/>
      <circle cx="11.5" cy="15" r="1" fill="#fef08a"/>
      <ellipse cx="9.5" cy="8.5" rx="1.5" ry="2.6" transform="rotate(-20 9.5 8.5)" fill="rgba(255,255,255,0.45)"/>
    </svg>`;
  }
  if (id === "wood") {
    return `<svg class="rpg-svg-res" width="${s}" height="${s}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M12 2 L4 12 H8 L5 18 H19 L16 12 H20 Z" fill="#22c55e" stroke="#14532d" stroke-width="1.5" stroke-linejoin="round"/>
      <rect x="10" y="18" width="4" height="4" rx="1" fill="#b45309" stroke="#451a03" stroke-width="1.2"/>
      <path d="M12 4 L8 11 H12 Z" fill="#86efac" opacity="0.55"/>
    </svg>`;
  }
  if (id === "minerals") {
    return `<svg class="rpg-svg-res" width="${s}" height="${s}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <polygon points="12,2 20,9 16,21 8,21 4,9" fill="#38bdf8" stroke="#0c4a6e" stroke-width="1.5" stroke-linejoin="round"/>
      <polygon points="12,2 16,21 8,21" fill="#7dd3fc" opacity="0.65"/>
      <polygon points="12,2 20,9 12,12" fill="#e0f2fe" opacity="0.75"/>
    </svg>`;
  }
  if (id === "science") {
    return `<svg class="rpg-svg-res" width="${s}" height="${s}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="#c084fc" stroke-width="1.8"/>
      <ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(30 12 12)" fill="none" stroke="#38bdf8" stroke-width="1.5"/>
      <circle cx="12" cy="12" r="3" fill="#fde047"/>
    </svg>`;
  }
  if (id === "futurecoin") {
    return `<svg class="rpg-svg-res" width="${s}" height="${s}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" fill="#facc15" stroke="#92400e" stroke-width="1.6"/>
      <circle cx="12" cy="12" r="7" fill="#eab308" stroke="#fef08a" stroke-width="1"/>
      <polygon points="12,6.5 13.8,10.2 17.5,12 13.8,13.8 12,17.5 10.2,13.8 6.5,12 10.2,10.2" fill="#fef08a"/>
    </svg>`;
  }
  if (id.includes("potion")) {
    const potColor = id.startsWith("hp") ? "#22c55e" : id.startsWith("atk") ? "#ef4444" : id.startsWith("def") ? "#f59e0b" : id.startsWith("spa") ? "#38bdf8" : id.startsWith("spd") ? "#a855f7" : "#facc15";
    return `<svg class="rpg-svg-res" width="${s}" height="${s}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="9" y="3" width="6" height="3" rx="1" fill="#fde047" stroke="#78350f" stroke-width="1.2"/>
      <path d="M10 6 V9 L5 16 A3 3 0 0 0 7.5 21 H16.5 A3 3 0 0 0 19 16 L14 9 V6 Z" fill="rgba(15,23,42,0.85)" stroke="#cbd5e1" stroke-width="1.5"/>
      <path d="M6.3 15 L17.7 15 L18.5 16.5 A2 2 0 0 1 16.5 20 H7.5 A2 2 0 0 1 5.5 16.5 Z" fill="${potColor}"/>
      <circle cx="10" cy="17.5" r="1.2" fill="#ffffff" opacity="0.7"/>
    </svg>`;
  }
  if (id.includes("candy") || id === "rarecandy") {
    const cColor = id === "rarecandy" ? "#38bdf8" : "#f472b6";
    return `<svg class="rpg-svg-res" width="${s}" height="${s}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <polygon points="3,8 8,12 3,16" fill="${cColor}" stroke="#0f172a" stroke-width="1.2"/>
      <polygon points="21,8 16,12 21,16" fill="${cColor}" stroke="#0f172a" stroke-width="1.2"/>
      <circle cx="12" cy="12" r="5.5" fill="${cColor}" stroke="#fef08a" stroke-width="1.5"/>
      <circle cx="10.5" cy="10.5" r="1.6" fill="#ffffff" opacity="0.75"/>
    </svg>`;
  }
  if (id.includes("berry")) {
    return `<svg class="rpg-svg-res" width="${s}" height="${s}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="12" cy="13" r="7.5" fill="#f59e0b" stroke="#78350f" stroke-width="1.5"/>
      <path d="M8 6 Q12 2 16 6 Q12 8 8 6 Z" fill="#4ade80" stroke="#14532d" stroke-width="1.2"/>
      <circle cx="9.5" cy="11" r="1.6" fill="#fef08a"/>
    </svg>`;
  }
  if (id.includes("stone") || id === "shinycharm") {
    return `<svg class="rpg-svg-res" width="${s}" height="${s}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <polygon points="12,2 20,9 16,21 8,21 4,9" fill="#c084fc" stroke="#fef08a" stroke-width="1.5"/>
      <polygon points="12,5 16,11 12,18 8,11" fill="#38bdf8"/>
    </svg>`;
  }
  if (id.includes("cap")) {
    const capCol = id.includes("gold") ? "#facc15" : "#cbd5e1";
    return `<svg class="rpg-svg-res" width="${s}" height="${s}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M4 17 L6 8 L12 12 L18 8 L20 17 Z" fill="${capCol}" stroke="#0f172a" stroke-width="1.5"/>
      <circle cx="12" cy="14" r="1.8" fill="#ef4444"/>
    </svg>`;
  }
  return `<svg class="rpg-svg-res" width="${s}" height="${s}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <polygon points="12,2 15,9 22,12 15,15 12,22 9,15 2,12 9,9" fill="#fde047" stroke="#ca8a04" stroke-width="1.4"/>
  </svg>`;
}

export function renderBuildingSvg(bid = "field", size = 28) {
  const s = Number(size) || 28;
  const id = String(bid || "field");

  const svgBody = {
    field: `
      <circle cx="16" cy="13" r="8" fill="#22c55e" stroke="#14532d" stroke-width="1.5"/>
      <circle cx="12" cy="11" r="2" fill="#f43f5e"/>
      <circle cx="19" cy="12" r="2" fill="#f43f5e"/>
      <circle cx="15" cy="16" r="2" fill="#fb7185"/>
      <rect x="14" y="20" width="4" height="6" rx="1" fill="#b45309"/>
      <path d="M6 26 Q16 23 26 26" fill="none" stroke="#4ade80" stroke-width="2" stroke-linecap="round"/>
    `,
    granary: `
      <path d="M7 14 L16 6 L25 14 V26 H7 Z" fill="#d97706" stroke="#78350f" stroke-width="1.6"/>
      <path d="M5 14 L16 5 L27 14" fill="none" stroke="#fde047" stroke-width="2.2" stroke-linecap="round"/>
      <rect x="12" y="17" width="8" height="9" rx="2" fill="#451a03" stroke="#facc15" stroke-width="1.2"/>
      <circle cx="16" cy="12" r="2.2" fill="#f43f5e"/>
    `,
    berryPress: `
      <rect x="8" y="11" width="16" height="15" rx="3" fill="#be123c" stroke="#fda4af" stroke-width="1.5"/>
      <rect x="11" y="6" width="10" height="5" rx="1.5" fill="#facc15" stroke="#78350f" stroke-width="1.2"/>
      <path d="M11 18 Q16 21 21 18" fill="none" stroke="#fef08a" stroke-width="1.8"/>
      <circle cx="16" cy="15" r="2.2" fill="#fde047"/>
    `,
    hut: `
      <polygon points="16,5 5,15 27,15" fill="#b45309" stroke="#fde047" stroke-width="1.5" stroke-linejoin="round"/>
      <rect x="8" y="15" width="16" height="11" rx="1.5" fill="#78350f" stroke="#d97706" stroke-width="1.4"/>
      <rect x="13" y="19" width="6" height="7" rx="1" fill="#fde047"/>
    `,
    storehouse: `
      <polygon points="16,6 4,14 28,14" fill="#047857" stroke="#6ee7b7" stroke-width="1.5"/>
      <rect x="6" y="14" width="20" height="12" rx="1.5" fill="#1e293b" stroke="#94a3b8" stroke-width="1.4"/>
      <circle cx="11" cy="21" r="2.8" fill="#d97706" stroke="#fde047" stroke-width="1"/>
      <circle cx="16" cy="21" r="2.8" fill="#d97706" stroke="#fde047" stroke-width="1"/>
      <circle cx="21" cy="21" r="2.8" fill="#d97706" stroke="#fde047" stroke-width="1"/>
    `,
    lumberYard: `
      <circle cx="16" cy="16" r="9" fill="#94a3b8" stroke="#e2e8f0" stroke-width="1.8" stroke-dasharray="3 2"/>
      <circle cx="16" cy="16" r="3.5" fill="#facc15" stroke="#78350f" stroke-width="1.5"/>
      <rect x="5" y="23" width="22" height="4" rx="2" fill="#b45309"/>
    `,
    workshop: `
      <polygon points="16,4 23,12 19,25 13,25 9,12" fill="#38bdf8" stroke="#bae6fd" stroke-width="1.5"/>
      <polygon points="8,14 13,18 11,26 6,24" fill="#a855f7" stroke="#e9d5ff" stroke-width="1.2"/>
      <polygon points="24,14 19,18 21,26 26,24" fill="#a855f7" stroke="#e9d5ff" stroke-width="1.2"/>
    `,
    quarry: `
      <path d="M5 25 L12 11 L19 18 L23 12 L28 25 Z" fill="#334155" stroke="#94a3b8" stroke-width="1.5"/>
      <polygon points="15,13 19,7 22,14 17,17" fill="#38bdf8" stroke="#e0f2fe" stroke-width="1.2"/>
      <polygon points="9,18 12,13 15,19" fill="#facc15"/>
    `,
    mineralSilo: `
      <rect x="8" y="7" width="16" height="19" rx="3" fill="#0369a1" stroke="#7dd3fc" stroke-width="1.6"/>
      <polygon points="16,10 20,16 16,22 12,16" fill="#fef08a" stroke="#f59e0b" stroke-width="1.2"/>
    `,
    rangerPost: `
      <polygon points="16,4 10,12 22,12" fill="#059669" stroke="#6ee7b7" stroke-width="1.5"/>
      <rect x="12" y="12" width="8" height="14" fill="#475569" stroke="#cbd5e1" stroke-width="1.4"/>
      <circle cx="16" cy="16" r="2.2" fill="#fde047"/>
    `,
    researchLab: `
      <path d="M8 25 V16 A8 8 0 0 1 24 16 V25 Z" fill="#312e81" stroke="#a5b4fc" stroke-width="1.6"/>
      <line x1="16" y1="12" x2="25" y2="5" stroke="#fde047" stroke-width="2.6" stroke-linecap="round"/>
      <circle cx="25" cy="5" r="2.2" fill="#38bdf8"/>
      <circle cx="16" cy="17" r="3" fill="#c084fc"/>
    `,
    ballBench: `
      <rect x="5" y="20" width="22" height="5" rx="1.5" fill="#92400e" stroke="#facc15" stroke-width="1.3"/>
      <circle cx="16" cy="13" r="6" fill="#e11d48" stroke="#fef08a" stroke-width="1.5"/>
      <circle cx="16" cy="13" r="2" fill="#ffffff"/>
    `,
    ballFactory: `
      <rect x="6" y="12" width="20" height="14" rx="2" fill="#1e293b" stroke="#f43f5e" stroke-width="1.6"/>
      <circle cx="12" cy="19" r="3.5" fill="#e11d48" stroke="#fde047" stroke-width="1.2"/>
      <circle cx="20" cy="19" r="3.5" fill="#38bdf8" stroke="#fde047" stroke-width="1.2"/>
      <path d="M9 12 V7 H13 V12 M19 12 V7 H23 V12" fill="#64748b" stroke="#cbd5e1" stroke-width="1.2"/>
    `,
    trainingGround: `
      <circle cx="16" cy="16" r="10" fill="rgba(245, 158, 11, 0.25)" stroke="#facc15" stroke-width="1.8"/>
      <path d="M10 22 L22 10 M10 10 L22 22" stroke="#fef08a" stroke-width="2.4" stroke-linecap="round"/>
      <circle cx="16" cy="16" r="3" fill="#ef4444" stroke="#fef08a" stroke-width="1.2"/>
    `,
    breedingHouse: `
      <path d="M6 21 Q16 27 26 21" fill="none" stroke="#d97706" stroke-width="3" stroke-linecap="round"/>
      <ellipse cx="16" cy="15" rx="6.5" ry="8.5" fill="#facc15" stroke="#fef08a" stroke-width="1.6"/>
      <circle cx="14" cy="12" r="1.6" fill="#ffffff" opacity="0.8"/>
    `,
    expeditionPost: `
      <circle cx="16" cy="16" r="10" fill="none" stroke="#38bdf8" stroke-width="2.2" stroke-dasharray="5 2"/>
      <circle cx="16" cy="16" r="6.5" fill="#4f46e5" opacity="0.75"/>
      <polygon points="16,8 18,14 24,16 18,18 16,24 14,18 8,16 14,14" fill="#fef08a"/>
    `,
  }[id] || `
    <polygon points="16,4 26,12 23,26 9,26 6,12" fill="#4f46e5" stroke="#fde047" stroke-width="1.6"/>
    <circle cx="16" cy="16" r="4" fill="#fef08a"/>
  `;

  return `<svg class="rpg-svg-bldg" width="${s}" height="${s}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${svgBody}</svg>`;
}

export function renderTechSvg(kind = "science", size = 28) {
  const s = Number(size) || 28;
  const k = String(kind || "science");
  if (k === "ball") return renderOrbSvg("ultraball", s);
  if (k === "berry") return renderBuildingSvg("field", s);
  if (k === "wood") return renderBuildingSvg("lumberYard", s);
  if (k === "mineral") return renderBuildingSvg("workshop", s);
  if (k === "shiny") return renderBuildingSvg("expeditionPost", s);
  return renderBuildingSvg("researchLab", s);
}
