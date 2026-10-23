// stage_interactions.js — 全场景可交互热点与粒子反馈引擎（v0.4.0）
// 让玩家不再只是点死板的文字行，而是可以直接在每一页的实景舞台上：
// 添柴旺火、采摘灵果丛、拨开异动草丛搜寻灵兽、投喂野生灵兽、抚摸首席伙伴、
// 转动星轨罗盘加速科研、敲击战鼓激励受训灵兽、抚摸温养灵蛋加速孵化、催动炼金鼎兑币。

export function spawnStageFloat(anchorEl, text, tone = "gold") {
  if (typeof document === "undefined" || !anchorEl) return;
  const rect = anchorEl.getBoundingClientRect?.();
  if (!rect || (rect.width === 0 && rect.height === 0)) return;

  const el = document.createElement("div");
  el.className = `stage-float stage-float--${tone}`;
  el.textContent = text;
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + Math.min(28, rect.height / 3);
  el.style.left = `${Math.round(cx)}px`;
  el.style.top = `${Math.round(cy)}px`;
  document.body.appendChild(el);
  window.setTimeout(() => {
    try { el.remove(); } catch {}
  }, 1050);
}

export function spawnStageParticles(anchorEl, emojis = ["✨", "⭐", "💫"]) {
  if (typeof document === "undefined" || !anchorEl) return;
  const rect = anchorEl.getBoundingClientRect?.();
  if (!rect || (rect.width === 0 && rect.height === 0)) return;
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  for (let i = 0; i < 6; i++) {
    const p = document.createElement("div");
    p.className = "stage-particle";
    p.textContent = emojis[i % emojis.length];
    const angle = (Math.PI * 2 * i) / 6 + (Math.random() - 0.5) * 0.4;
    const dist = 28 + Math.random() * 34;
    const dx = Math.round(Math.cos(angle) * dist);
    const dy = Math.round(Math.sin(angle) * dist - 18);
    p.style.left = `${Math.round(cx)}px`;
    p.style.top = `${Math.round(cy)}px`;
    p.style.setProperty("--dx", `${dx}px`);
    p.style.setProperty("--dy", `${dy}px`);
    document.body.appendChild(p);
    window.setTimeout(() => {
      try { p.remove(); } catch {}
    }, 820);
  }
}

export function initStageInteractions({
  ui,
  getState,
  defs,
  addRes,
  addLog,
  hint,
  render,
}) {
  if (typeof document === "undefined") return;

  // 在篝火舞台注入可点击的实景交互热点（篝火添柴 + 三大资源采集点）
  const campBackdrop = document.querySelector("#campStage .camp-stage__backdrop");
  if (campBackdrop && !campBackdrop.querySelector(".camp-stage__hotspots")) {
    const hotspotWrap = document.createElement("div");
    hotspotWrap.className = "camp-stage__hotspots";
    hotspotWrap.innerHTML = `
      <button type="button" class="camp-hotspot camp-hotspot--berry" data-stage-act="camp-node" data-res="catnip" title="点击采摘林间灵果">
        <span class="camp-hotspot__icon">🍓</span>
        <span class="camp-hotspot__label">灵果丛</span>
      </button>
      <button type="button" class="camp-hotspot camp-hotspot--fire" data-stage-act="bonfire-stoke" title="点击添柴旺火，凝聚全营地灵气">
        <span class="camp-hotspot__icon">🔥</span>
        <span class="camp-hotspot__label">添柴聚灵</span>
      </button>
      <button type="button" class="camp-hotspot camp-hotspot--wood" data-stage-act="camp-node" data-res="wood" title="点击拾取干枯灵木">
        <span class="camp-hotspot__icon">🌲</span>
        <span class="camp-hotspot__label">灵木林</span>
      </button>
      <button type="button" class="camp-hotspot camp-hotspot--mineral" data-stage-act="camp-node" data-res="minerals" title="点击勘探微光灵晶">
        <span class="camp-hotspot__icon">💎</span>
        <span class="camp-hotspot__label">灵晶脉</span>
      </button>
    `;
    const companionsEl = campBackdrop.querySelector(".camp-stage__companions");
    if (companionsEl) {
      campBackdrop.insertBefore(hotspotWrap, companionsEl);
    } else {
      campBackdrop.appendChild(hotspotWrap);
    }
  }

  document.addEventListener("click", (ev) => {
    const btn = ev.target?.closest?.("[data-stage-act]");
    if (!btn) return;
    const act = btn.getAttribute("data-stage-act");
    const state = typeof getState === "function" ? getState() : null;
    if (!state) return;

    // 1. 篝火添柴聚灵
    if (act === "bonfire-stoke") {
      ev.preventDefault();
      const gatherBtn = document.getElementById("btnGather");
      if (gatherBtn && !gatherBtn.disabled) {
        gatherBtn.click();
      } else {
        addRes("catnip", 2);
      }
      const stageEl = document.getElementById("campStage");
      if (stageEl) {
        stageEl.classList.remove("is-stoked");
        void stageEl.offsetWidth;
        stageEl.classList.add("is-stoked");
      }
      spawnStageFloat(btn, "🔥 篝火旺盛！灵果涌流", "gold");
      spawnStageParticles(btn, ["🔥", "✨", "🍓", "⭐"]);
      render();
      return;
    }

    // 2. 营地实景资源热点采集
    if (act === "camp-node") {
      ev.preventDefault();
      const rid = btn.getAttribute("data-res") || "catnip";
      if (rid === "wood" && !state.unlocks?.wood) {
        spawnStageFloat(btn, "🔒 需先建造农田解锁灵木", "cyan");
        return;
      }
      if (rid === "minerals" && !state.unlocks?.minerals) {
        spawnStageFloat(btn, "🔒 需先研究采矿解锁灵晶", "cyan");
        return;
      }
      const gain = rid === "catnip" ? 3 : 1;
      addRes(rid, gain);
      const icon = rid === "catnip" ? "🍓" : rid === "wood" ? "🌲" : "💎";
      const name = defs?.resources?.[rid]?.name || rid;
      spawnStageFloat(btn, `${icon} ${name} +${gain}`, "emerald");
      spawnStageParticles(btn, [icon, "✨", "🍃"]);
      render();
      return;
    }

    // 3. 星轨天象台：点击星盘凝星推演
    if (act === "astrolabe-pulse") {
      ev.preventDefault();
      btn.classList.remove("is-pulsing");
      void btn.offsetWidth;
      btn.classList.add("is-pulsing");
      if (state.research?.active && (state.research?.remainingSec ?? 0) > 1) {
        state.research.remainingSec = Math.max(0.5, state.research.remainingSec - 2);
        spawnStageFloat(btn, "🔭 星轨共鸣！推演耗时 -2秒", "cyan");
        spawnStageParticles(btn, ["🔭", "✨", "🌌", "⚡"]);
      } else {
        addRes("catnip", 2);
        spawnStageFloat(btn, "✨ 凝星感悟！灵果 +2", "cyan");
        spawnStageParticles(btn, ["✨", "🌟", "🔮"]);
      }
      render();
      return;
    }

    // 4. 研究页：点击星轨阶段胶囊过滤/定位
    if (act === "tech-filter") {
      ev.preventDefault();
      const stageKey = btn.getAttribute("data-tech-stage") || "early";
      const sec = document.querySelector(`#techList [data-tech-stage-group="${stageKey}"]`);
      if (sec && typeof sec.scrollIntoView === "function") {
        sec.scrollIntoView({ behavior: "smooth", block: "center" });
        sec.classList.add("guideHighlight");
        window.setTimeout(() => sec.classList.remove("guideHighlight"), 1500);
      }
      spawnStageFloat(btn, "🔭 已定位至该星轨科技象限", "cyan");
      spawnStageParticles(btn, ["🔭", "✨", "⭐"]);
      return;
    }

    // 5. 捕捉页：点击生态秘境胶带一键切换猎场
    if (act === "biome-switch") {
      ev.preventDefault();
      const areaId = btn.getAttribute("data-area-id");
      if (!areaId) return;
      const sel = document.getElementById("captureArea");
      if (sel) {
        sel.value = areaId;
        sel.dispatchEvent(new Event("change", { bubbles: true }));
      } else {
        ui.captureAreaId = areaId;
        ui.captureDirty = true;
        render();
      }
      spawnStageFloat(btn, "🧭 已切换生态猎场", "emerald");
      spawnStageParticles(btn, ["🌿", "🧭", "✨"]);
      return;
    }

    // 6. 捕捉页：点击摇曳草丛/漫游灵兽直接扑击搜寻
    if (act === "bush-rustle") {
      ev.preventDefault();
      btn.classList.remove("is-rustling");
      void btn.offsetWidth;
      btn.classList.add("is-rustling");
      spawnStageParticles(btn, ["🌿", "🍃", "✨", "❗"]);
      const encBtn = document.querySelector("#panel-capture [data-capture-action='encounter']");
      if (encBtn && !encBtn.disabled) {
        spawnStageFloat(btn, "🌿 拨开草丛！发现野生灵兽踪迹", "emerald");
        encBtn.click();
      } else {
        spawnStageFloat(btn, "🌿 草丛沙沙作响…遭遇充能恢复中", "gold");
      }
      return;
    }

    // 7. 捕捉页遭遇战：投喂灵果安抚野生灵兽
    if (act === "encounter-bait") {
      ev.preventDefault();
      const curCatnip = state.res?.catnip?.value ?? 0;
      if (curCatnip < 15) {
        spawnStageFloat(btn, "🍓 灵果不足 15，无法投喂安抚", "cyan");
        return;
      }
      addRes("catnip", -15);
      ui.captureBaitBonus = Math.min(0.15, (ui.captureBaitBonus || 0) + 0.05);
      state.pity = Math.min(0.5, (state.pity || 0) + 0.04);
      ui.captureDirty = true;
      spawnStageFloat(btn, "🍓 投喂成功！野生灵兽警惕降低（捕获率提升）", "emerald");
      spawnStageParticles(btn, ["🍓", "💖", "✨", "🎵"]);
      render();
      return;
    }

    // 8. 萌灵页首席星阵：直接抚摸互动
    if (act === "mon-pet") {
      ev.preventDefault();
      ev.stopPropagation();
      const monId = Number(btn.getAttribute("data-mon-id"));
      const m = (state.mons?.list || []).find((x) => x && x.id === monId);
      if (!m) return;
      m.affection = Math.min(100, Math.floor((m.affection || 0) + 2));
      m.satiety = Math.min(100, Math.ceil((m.satiety ?? 80) + 1));
      ui.monsDirty = true;
      const lines = [
        `${m.name}开心地蹭了蹭你的手心！`,
        `${m.name}发出轻快的鸣叫，星辉微微闪烁！`,
        `${m.name}绕着你转了一圈，干劲十足！`,
      ];
      const msg = lines[Math.floor(Math.random() * lines.length)];
      spawnStageFloat(btn, `💖 亲密度 +2 · ${msg}`, "gold");
      spawnStageParticles(btn, ["💖", "✨", "🎵", "⭐"]);
      render();
      return;
    }

    // 9. 萌灵页首席星阵：直接投喂灵果
    if (act === "mon-feed") {
      ev.preventDefault();
      ev.stopPropagation();
      const monId = Number(btn.getAttribute("data-mon-id"));
      const m = (state.mons?.list || []).find((x) => x && x.id === monId);
      if (!m) return;
      if ((state.res?.catnip?.value ?? 0) < 10) {
        spawnStageFloat(btn, "🍓 灵果不足 10", "cyan");
        return;
      }
      addRes("catnip", -10);
      m.satiety = Math.min(100, Math.ceil((m.satiety ?? 80) + 18));
      m.affection = Math.min(100, Math.floor((m.affection || 0) + 1));
      ui.monsDirty = true;
      spawnStageFloat(btn, `🍓 ${m.name} 饱腹 +18 · 亲密 +1`, "emerald");
      spawnStageParticles(btn, ["🍓", "💖", "✨"]);
      render();
      return;
    }

    // 10. 功能页训练场：擂鼓助威
    if (act === "train-cheer") {
      ev.preventDefault();
      const list = state.mons?.list || [];
      const activeIds = Array.isArray(state.training?.activeIds) ? state.training.activeIds : [];
      const activeMons = activeIds.map((id) => list.find((m) => m && m.id === id)).filter(Boolean);
      if (activeMons.length === 0) {
        const openBtn = document.querySelector("#panel-functions [data-train-open]");
        if (openBtn && !openBtn.disabled) {
          openBtn.click();
          return;
        }
        spawnStageFloat(btn, "🥁 请先建造训练场并派遣受训灵兽", "cyan");
        return;
      }
      for (const m of activeMons) {
        m.exp = Math.max(0, (m.exp || 0) + 12);
      }
      ui.functionsDirty = true;
      ui.monsDirty = true;
      spawnStageFloat(btn, `🥁 战鼓助威！${activeMons.length} 只受训灵兽经验 +12`, "gold");
      spawnStageParticles(btn, ["🥁", "⚔️", "🔥", "✨"]);
      render();
      return;
    }

    // 11. 功能页育灵屋：点击灵蛋温养加速孵化
    if (act === "egg-warm") {
      ev.preventDefault();
      btn.classList.remove("is-wiggling");
      void btn.offsetWidth;
      btn.classList.add("is-wiggling");
      if (state.breeding?.on && (state.breeding?.eggRemainingSec ?? 0) > 1) {
        state.breeding.eggRemainingSec = Math.max(1, state.breeding.eggRemainingSec - 5);
        ui.functionsDirty = true;
        spawnStageFloat(btn, "🥚 注入灵温！灵蛋孵化剩余 -5秒", "gold");
        spawnStageParticles(btn, ["🥚", "💖", "✨", "🌟"]);
        render();
      } else {
        const breedOpen = document.querySelector("#panel-functions [data-breed-select-p1], #panel-functions [data-breed-start]");
        if (breedOpen && !breedOpen.disabled) {
          breedOpen.click();
        } else {
          spawnStageFloat(btn, "🥚 育灵巢温暖舒适，在下方选择双亲即可繁育灵蛋", "gold");
          spawnStageParticles(btn, ["🥚", "✨", "🌿"]);
        }
      }
      return;
    }

    // 12. 功能页次元远征门：顺风共鸣加速
    if (act === "exp-boost") {
      ev.preventDefault();
      if (state.expedition?.on && (state.expedition?.remainingSec ?? 0) > 1) {
        state.expedition.remainingSec = Math.max(1, state.expedition.remainingSec - 5);
        ui.functionsDirty = true;
        spawnStageFloat(btn, "🧭 星门顺风共鸣！远征归来 -5秒", "cyan");
        spawnStageParticles(btn, ["🧭", "🌪️", "✨", "⚡"]);
        render();
      } else {
        const expOpen = document.querySelector("#panel-functions [data-exp-team-open], #panel-functions [data-exp-start]");
        if (expOpen && !expOpen.disabled) {
          expOpen.click();
        } else {
          spawnStageFloat(btn, "🗺️ 次元星门待命，在下方组建远征队即可出发", "cyan");
          spawnStageParticles(btn, ["🗺️", "✨", "🌌"]);
        }
      }
      return;
    }

    // 13. 商店与合成页：炼金鼎一键凝练未来币
    if (act === "cauldron-transmute") {
      ev.preventDefault();
      const resKey = btn.getAttribute("data-res") || "catnip";
      const exBtn = document.querySelector(`#panel-future [data-fc-exchange="${resKey}"]`);
      if (exBtn && !exBtn.disabled) {
        exBtn.click();
        spawnStageFloat(btn, "⚗️ 炼金鼎轰鸣！成功凝练 +1 未来币", "gold");
        spawnStageParticles(btn, ["⚗️", "🪙", "✨", "🔮"]);
      } else {
        const need = resKey === "catnip" ? "1000 灵果" : "500 灵木";
        spawnStageFloat(btn, `⚗️ 需满 ${need} 方可投入炼金鼎凝练`, "cyan");
        spawnStageParticles(btn, ["⚗️", "💫"]);
      }
      return;
    }

    // 14. 挑战页 PvE：点击中央 VS 战徽立即开战
    if (act === "pve-quick-fight") {
      ev.preventDefault();
      const startBtn = document.querySelector("#pveList [data-pve-start]");
      if (startBtn && !startBtn.disabled) {
        spawnStageFloat(btn, "⚔️ 星穹试炼开战！", "gold");
        spawnStageParticles(btn, ["⚔️", "🔥", "⚡", "💥"]);
        startBtn.click();
      } else {
        spawnStageFloat(btn, "⚔️ 请在下方勾选出战灵兽编队后开战", "cyan");
      }
      return;
    }
  });
}
