// 社交标签页
import { escapeHtml } from "../utils.js";
import { renderBeastIcon } from "../sprites.js";
import { renderResSvg, renderUiIcon } from "../render/rpg_svg_icons.js";
import { renderSocialStageHtml } from "../render/tab_stages.js";
import { summarizePvpBattle, bumpPvpSeasonStats, normalizePvpRecent } from "../systems/pvp_narrative.js";
import {
  listNpcTrainers,
  buildNpcTeam,
  getNpcTrainer,
  ensureNpcRecord,
  recordNpcFight,
  npcRecordLine,
  noteNpcWeeklyWin,
  npcWeeklyProgress,
  claimNpcWeeklyFc,
} from "../systems/npc_pvp.js";

export function createSocialTab({
  ui,
  addLog,
  socialSystem,
  renderSocial,
  friendsSystem,
  renderFriends,
  getState,
  createPvpBattle,
  getMonCurrentStats,
  getBeastDataByDex,
  pushTickerEvent,
}) {
  
  let selectedTeam = []; // 当前选中的队伍（已归一化为 PVP 战报字段）
  ui.pvpRecent = normalizePvpRecent(getState()?.meta?.pvpRecent);

  function monTypes(mon) {
    const api = typeof getBeastDataByDex === "function" ? getBeastDataByDex(mon.dex) : null;
    return Array.isArray(api?.types) ? api.types.slice() : [];
  }

  function toPvpFighter(mon) {
    if (!mon) return null;
    const stats = typeof getMonCurrentStats === "function" ? getMonCurrentStats(mon) : null;
    const hp = Math.max(1, Math.floor(stats?.hp ?? mon.baseStats?.hp ?? 100));
    const attack = Math.max(1, Math.floor(stats?.atk ?? mon.baseStats?.atk ?? 50));
    const defense = Math.max(1, Math.floor(stats?.def ?? mon.baseStats?.def ?? 50));
    const speed = Math.max(1, Math.floor(stats?.spe ?? mon.baseStats?.spe ?? 50));
    const level = Math.max(1, Math.floor(typeof mon.lvl === "number" && Number.isFinite(mon.lvl) ? mon.lvl : 1));
    return {
      id: mon.id,
      name: mon.name,
      dex: mon.dex,
      isShiny: Boolean(mon.isShiny),
      level,
      hp,
      attack,
      defense,
      speed,
      types: monTypes(mon),
      stats: { hp, atk: attack, def: defense, spe: speed },
    };
  }
  
  // 渲染 PVP 邀请列表
  async function renderPvpInvites() {
    return renderSocial.renderPvpInvites();
  }

  async function renderPvpRecent() {
    return renderSocial.renderPvpRecent();
  }

  function ensureDefaultTeam() {
    if (selectedTeam.length > 0) return;
    const list = (getState())?.mons?.list;
    if (!Array.isArray(list) || list.length === 0) return;
    const fighters = list
      .map((m) => toPvpFighter(m))
      .filter((m) => m && m.hp > 0)
      .sort((a, b) => (b.level || 1) - (a.level || 1));
    if (fighters.length > 0) {
      selectedTeam = fighters.slice(0, 3);
    }
  }

  // 渲染我的队伍
  function renderMyTeam() {
    const elMyTeam = document.getElementById("myTeamDisplay");
    if (!elMyTeam) return;
    ensureDefaultTeam();

    if (selectedTeam.length === 0) {
      elMyTeam.innerHTML = `<div class="row__desc">未选择队伍</div>`;
      return;
    }

    let html = "<div class='team-display'>";
    for (const mon of selectedTeam) {
      html += `
        <div class="team-mon">
          ${renderBeastIcon(mon.dex, mon.name, mon.isShiny)}
          <div class="team-mon__info">
            <div class="team-mon__name">${escapeHtml(mon.name)} <span class="tag">Lv.${mon.level}</span></div>
            <div class="team-mon__stats">HP ${mon.hp} · 攻 ${mon.attack} · 防 ${mon.defense}</div>
          </div>
        </div>
      `;
    }
    html += "</div>";

    elMyTeam.innerHTML = html;
  }
  
  function setupSocialTab() {
    const panelSocial = document.getElementById("panel-social");
    if (!panelSocial) return;

    // 初始化社交面板HTML
    const cloudTok = (() => {
      try {
        return localStorage.getItem("mengling_idle_cloud_token_v1") || "";
      } catch {
        return "";
      }
    })();
    const needCloud = !cloudTok;

    const socialStageHtml = ui.activeTab === "social" ? renderSocialStageHtml({
      state: typeof getState === "function" ? getState() : null,
      selectedTeam,
      renderBeastIcon,
      escapeHtml,
    }) : "";

    panelSocial.innerHTML = `
      <div class="social-container">
        ${socialStageHtml}
        <div class="social-section">
          <h3 class="row__titleLine">${renderUiIcon("tab_pve", 18)}<span>育灵师对战（离线演武）</span><span class="tag">每周悬赏 +20 币</span></h3>
          <div class="row pvp-team-selector">
            <div class="row__left">
              <div class="row__title row__titleLine">${renderUiIcon("tab_pve", 18)}<span>我的出战队伍</span><span class="tag">离线演武 · 无需登录</span></div>
              <div id="myTeamDisplay"><div class="row__desc">未选择队伍 · 先选队伍即可挑战下方 NPC 育灵师，战绩计入本机赛季</div></div>
            </div>
            <div class="row__right">
              <button class="btn btn--primary btn--small" id="btnSelectTeam" type="button">选择队伍</button>
            </div>
          </div>
          <div id="npcTrainers" class="list" style="margin-top: 8px;"></div>
        </div>
        ${
          needCloud
            ? `<div class="row social-cta">
          <div class="row__left">
            <div class="row__title row__titleLine">${renderResSvg("friendshipBracelet", 18)}<span>登录云账号解锁好友与约战</span><span class="tag">跨端同步 · 好友 PvP</span></div>
            <div class="row__desc">加好友、异步约战、好友动态与跨设备云存档需登录云账号；上方离线 NPC 演武可随时畅玩。</div>
          </div>
          <div class="row__right">
            <button type="button" class="btn btn--primary btn--small" data-social-goto-options>去设置注册</button>
          </div>
        </div>`
            : ""
        }
        <div class="social-section" ${needCloud ? "hidden" : ""}>
          <h3 class="row__titleLine">${renderResSvg("friendshipBracelet", 16)}<span>好友列表</span></h3>
          <div id="friends" ${needCloud ? "hidden" : ""}></div>
        </div>
        <div class="social-section" ${needCloud ? "hidden" : ""}>
          <h3 class="row__titleLine">${renderUiIcon("tab_pve", 16)}<span>PVP 约战记录</span></h3>
          <div id="pvpRecent" ${needCloud ? "hidden" : ""}></div>
          <div id="pvpInvites" ${needCloud ? "hidden" : ""}></div>
        </div>

        <div class="social-section" ${needCloud ? "hidden" : ""}>
          <h3 class="row__titleLine">${renderResSvg("shinyCharm", 16)}<span>好友动态</span></h3>
          <div id="friendFeed"></div>
        </div>

        <div class="social-section" ${needCloud ? "hidden" : ""}>
          <h3 class="row__titleLine">${renderUiIcon("tab_help", 16)}<span>好友传讯</span></h3>
          <div id="friendMessages" ${needCloud ? "hidden" : ""}></div>
          <div class="message-input-container" ${needCloud ? "hidden" : ""}>
            <select id="messageRecipient" class="input">
              <option value="">选择好友...</option>
            </select>
            <input type="text" id="messageInput" class="input" placeholder="输入消息..." maxlength="500" />
            <button class="btn btn--primary btn--small" data-social-action="send-message-input">发送</button>
          </div>
        </div>

        <div class="social-section" ${needCloud ? "hidden" : ""}>
          <h3 class="row__titleLine">${renderUiIcon("tab_dex", 16)}<span>好友名片</span></h3>
          <select id="friendProfileSelect" class="input" ${needCloud ? "hidden" : ""}>
            <option value="">选择好友查看资料...</option>
          </select>
          <div id="friendProfile"></div>
        </div>
      </div>
    `;

    panelSocial.querySelector("[data-social-goto-options]")?.addEventListener("click", () => {
      try {
        document.querySelector('.tab[data-tab="options"]')?.click();
      } catch {}
    });

    // 加载好友列表到下拉框
    loadFriendsList();

    // 渲染初始内容
    renderNpcTrainers();
    renderPvpRecent();
    renderPvpInvites();
    if (typeof renderFriends === "function") renderFriends();
    renderSocial.renderFriendFeed();
    renderSocial.renderMessages();
    ingestOutgoingPvpResults();

    // 设置事件监听
    setupSocialEvents();
  }

  const PVP_SEEN_KEY = "mengling_idle_pvp_seen_battles_v1";

  function readSeenBattleIds() {
    try {
      const raw = localStorage.getItem(PVP_SEEN_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(arr) ? arr.map(Number).filter((n) => Number.isFinite(n)) : []);
    } catch {
      return new Set();
    }
  }

  function writeSeenBattleIds(set) {
    try {
      localStorage.setItem(PVP_SEEN_KEY, JSON.stringify([...set].slice(-50)));
    } catch {
    }
  }

  async function ingestOutgoingPvpResults() {
    if (!socialSystem.hasAuth?.()) return;
    const results = await socialSystem.getPvpResults();
    if (!Array.isArray(results) || !results.length) return;
    const seen = readSeenBattleIds();
    let changed = false;
    for (const r of results) {
      const id = Number(r.id);
      if (!Number.isFinite(id) || seen.has(id)) continue;
      seen.add(id);
      changed = true;
      const myUid = (() => {
        try {
          return localStorage.getItem("mengling_idle_cloud_uid_v1") || "";
        } catch {
          return "";
        }
      })();
      const iWon = r.winner_uid && myUid && r.winner_uid === myUid;
      const winner = iWon ? 2 : r.winner_uid ? 1 : 0;
      const opp = r.opponent_name || "好友";
      const line = iWon ? `对战 ${opp}：胜利` : r.winner_uid ? `对战 ${opp}：落败` : `对战 ${opp}：平局`;
      if (!ui.pvpRecent) ui.pvpRecent = [];
      ui.pvpRecent.unshift({ line, winner, at: r.created_at || Date.now() });
      ui.pvpRecent = ui.pvpRecent.slice(0, 5);
      if (!(getState()).meta || typeof (getState()).meta !== "object") (getState()).meta = {};
      (getState()).meta.pvpRecent = ui.pvpRecent.slice();
      bumpPvpSeasonStats((getState()).meta, winner);
      addLog(`PvP（回传）：${line}`, iWon);
      if (typeof pushTickerEvent === "function") pushTickerEvent("pvp", line);
    }
    if (changed) {
      writeSeenBattleIds(seen);
      renderPvpRecent();
    }
  }

  async function refreshSocial() {
    const panelSocial = document.getElementById("panel-social");
    if (!panelSocial) return;
    ui.socialDirty = false;
    renderNpcTrainers();
    renderMyTeam();
    renderPvpRecent();
    await renderPvpInvites();
    if (typeof renderFriends === "function") await renderFriends();
    await loadFriendsList();
    await renderSocial.renderFriendFeed();
    await renderSocial.renderMessages();
    await ingestOutgoingPvpResults();
  }

  function renderNpcTrainers() {
    const el = document.getElementById("npcTrainers");
    if (!el) return;
    const trainers = listNpcTrainers();
    const record = ensureNpcRecord((getState()));
    const weekly = npcWeeklyProgress((getState()));
    const ladderRows = trainers
      .map((t) => {
        const line = npcRecordLine(record, t.id);
        const weekMark = weekly.beatenIds.includes(t.id) ? " ✓本周" : "";
        return `<div class="row__desc">${escapeHtml(t.name)}：${escapeHtml(line)}${weekMark}</div>`;
      })
      .join("");
    const weeklyLine = weekly.claimed
      ? "本周挑战奖励已领取"
      : weekly.canClaim
        ? "已击败全部 3 位育灵师 — 可领取 +20 未来币"
        : `本周挑战：击败全部育灵师（${weekly.beatenIds.length}/${weekly.total}）→ +20 未来币`;
    const npcLeadDex = { npc_youngster: 16, npc_lass: 43, npc_ace: 6 };
    el.innerHTML =
      trainers
        .map((t) => {
          const full = getNpcTrainer(t.id);
          const wl = npcRecordLine(record, t.id);
          const leadLvl = full?.team?.[0]?.level ?? 12;
          const dex = npcLeadDex[t.id] || 25;
          return `
        <div class="row func-mon-row">
          <div class="row__left">
            <div class="row__title row__titleLine">${renderBeastIcon(dex, t.name, false)}<span>${escapeHtml(t.name)}</span><span class="tag">Lv.${leadLvl} · ${t.size}只</span><span class="tag">${escapeHtml(wl)}</span></div>
            <div class="row__desc">${escapeHtml(full?.blurb || "")}</div>
          </div>
          <div class="row__right">
            <button type="button" class="btn btn--primary btn--small" data-npc-fight="${escapeHtml(t.id)}">挑战</button>
          </div>
        </div>`;
        })
        .join("") +
      `<div class="row">
        <div class="row__left">
          <div class="row__title row__titleLine">${renderResSvg("futurecoin", 18)}<span>本周挑战与战绩</span><span class="tag">${weekly.beatenIds.length}/${weekly.total} 已击败</span><span class="tag">+20 未来币</span></div>
          <div class="row__desc">${escapeHtml(weeklyLine)}</div>
          <div class="row__desc muted">${trainers.map((t) => `${escapeHtml(t.name)} ${escapeHtml(npcRecordLine(record, t.id))}`).join(" · ")}</div>
        </div>
        <div class="row__right">
          <button type="button" class="btn btn--primary btn--small" data-npc-weekly-claim ${weekly.canClaim ? "" : "disabled"}>领取 +20</button>
        </div>
      </div>`;
  }

  function recordLocalPvpResult(result, label) {
    if (!ui.pvpRecent) ui.pvpRecent = [];
    if (!(getState()).meta || typeof (getState()).meta !== "object") (getState()).meta = {};
    const recentWithCurrent = [{ winner: result.winner }, ...ui.pvpRecent];
    bumpPvpSeasonStats((getState()).meta, result.winner);
    const line = summarizePvpBattle(result, "你", {
      seasonId: ui.remoteConfig?.seasonId,
      recent: recentWithCurrent,
      stats: (getState()).meta?.pvpStats,
    });
    const prefix = label ? `${label} · ` : "";
    addLog(`PvP：${prefix}${line}`, result.winner === 2);
    ui.pvpRecent.unshift({ line: `${prefix}${line}`, winner: result.winner, at: Date.now() });
    ui.pvpRecent = ui.pvpRecent.slice(0, 5);
    (getState()).meta.pvpRecent = ui.pvpRecent.slice();
    renderPvpRecent();
  }

  async function loadFriendsList() {
    if (!friendsSystem.hasAuth?.()) return;

    const data = await friendsSystem.getFriendsList();
    if (!data || !data.friends) return;

    const messageRecipient = document.getElementById("messageRecipient");
    const friendProfileSelect = document.getElementById("friendProfileSelect");

    if (messageRecipient) {
      messageRecipient.innerHTML = '<option value="">选择好友...</option>';
      for (const friend of data.friends) {
        const option = document.createElement("option");
        option.value = friend.uid;
        option.textContent = friend.username;
        messageRecipient.appendChild(option);
      }
    }

    if (friendProfileSelect) {
      friendProfileSelect.innerHTML = '<option value="">选择好友查看资料...</option>';
      for (const friend of data.friends) {
        const option = document.createElement("option");
        option.value = friend.uid;
        option.textContent = friend.username;
        friendProfileSelect.appendChild(option);
      }
    }
  }

  function setupSocialEvents() {
    const panelSocial = document.getElementById("panel-social");
    if (!panelSocial) return;

    panelSocial.addEventListener("click", async (e) => {
      const claimBtn = e.target.closest("[data-npc-weekly-claim]");
      if (claimBtn && panelSocial.contains(claimBtn)) {
        if (claimBtn.disabled) return;
        const res = claimNpcWeeklyFc((getState()), 20);
        if (res.ok) {
          if (!(getState()).res || typeof (getState()).res !== "object") (getState()).res = {};
          if (!(getState()).res.futurecoin || typeof (getState()).res.futurecoin !== "object") {
            (getState()).res.futurecoin = { value: 0, cap: 0 };
          }
          (getState()).res.futurecoin.value = Math.max(0, Math.floor((getState()).res.futurecoin.value || 0)) + res.fc;
          addLog(`本周 NPC 挑战奖励：未来币 +${res.fc}`, true);
          renderNpcTrainers();
        } else {
          addLog("本周挑战奖励不可领取");
        }
        return;
      }

      const npcBtn = e.target.closest("[data-npc-fight]");
      if (!npcBtn) return;
      const trainerId = npcBtn.getAttribute("data-npc-fight");
      if (!trainerId) return;
      if (!selectedTeam.length) {
        addLog("请先在「我的队伍」选择萌灵，再挑战育灵师", true);
        try {
          if (typeof window.showToast === "function") {
            window.showToast("先选队伍，再挑战 NPC", "warn", 3200);
          }
          document.getElementById("btnSelectTeam")?.scrollIntoView?.({ behavior: "smooth", block: "center" });
          document.getElementById("btnSelectTeam")?.focus?.();
        } catch {}
        return;
      }
      const npcTeam = buildNpcTeam(trainerId);
      const trainer = getNpcTrainer(trainerId);
      if (!npcTeam.length || !trainer) return;
      npcBtn.disabled = true;
      const pvpBattle = createPvpBattle();
      // simulateBattle: team1=对手, team2=你 → winner 2 = 你赢（与好友应战一致）
      const result = pvpBattle.simulateBattle(npcTeam, selectedTeam, trainer.name, "你");
      recordLocalPvpResult(result, trainer.name);
      recordNpcFight((getState()), trainerId, result.winner === 2);
      if (result.winner === 2) noteNpcWeeklyWin((getState()), trainerId);
      renderNpcTrainers();
      showBattleResult(result);
      npcBtn.disabled = false;
    });

    // 选择队伍按钮
    const btnSelectTeam = document.getElementById("btnSelectTeam");
    if (btnSelectTeam) {
      btnSelectTeam.addEventListener("click", () => {
        openTeamSelector();
      });
    }

    // 接受 PVP 邀请
    panelSocial.addEventListener("click", async (e) => {
      const btn = e.target.closest('[data-pvp-action="accept"]');
      if (!btn) return;

      const inviteId = Number(btn.dataset.inviteId);
      if (!selectedTeam || selectedTeam.length === 0) {
        addLog("请先选择你的队伍", true);
        return;
      }

      btn.disabled = true;
      btn.textContent = "战斗中...";

      // 接受邀请并获取对战数据
      const battleData = await socialSystem.acceptPvpInvite(inviteId, selectedTeam);
      if (!battleData) {
        btn.disabled = false;
        btn.textContent = "应战";
        return;
      }

      // 进行战斗模拟
      const pvpBattle = createPvpBattle();
      const result = pvpBattle.simulateBattle(
        battleData.player1Team,
        battleData.player2Team,
        "对手",
        "你"
      );

      // 保存战斗结果
      const winnerUid = result.winner === 1 ? battleData.player1Uid : 
                        result.winner === 2 ? battleData.player2Uid : null;
      
      await socialSystem.savePvpResult(
        inviteId,
        battleData.player1Uid,
        battleData.player2Uid,
        winnerUid,
        result.battleLog
      );

      if (!ui.pvpRecent) ui.pvpRecent = [];
      const recentWithCurrent = [{ winner: result.winner }, ...ui.pvpRecent];
      bumpPvpSeasonStats((getState()).meta, result.winner);
      const line = summarizePvpBattle(result, "你", {
        seasonId: ui.remoteConfig?.seasonId,
        recent: recentWithCurrent,
        stats: (getState()).meta?.pvpStats,
      });
      addLog(`PvP：${line}`, result.winner === 2);
      if (typeof pushTickerEvent === "function") pushTickerEvent("pvp", line);
      ui.pvpRecent.unshift({ line, winner: result.winner, at: Date.now() });
      ui.pvpRecent = ui.pvpRecent.slice(0, 5);
      if (!(getState()).meta || typeof (getState()).meta !== "object") (getState()).meta = {};
      (getState()).meta.pvpRecent = ui.pvpRecent.slice();

      // 显示战斗结果
      showBattleResult(result);

      // 刷新邀请列表
      renderPvpRecent();
      renderPvpInvites();
    });

    // 好友系统：添加 / 接受 / 发起对战
    panelSocial.addEventListener("click", async (e) => {
      const gotoOpt = e.target.closest("[data-social-goto-options]");
      if (gotoOpt && panelSocial.contains(gotoOpt)) {
        try {
          document.querySelector('.tab[data-tab="options"]')?.click();
        } catch {
        }
        return;
      }

      const friendBtn = e.target.closest("[data-friend-action]");
      if (!friendBtn || !panelSocial.contains(friendBtn)) return;
      const act = friendBtn.getAttribute("data-friend-action");
      if (act === "send-request") {
        const input = document.getElementById("friendUsername");
        const name = String(input?.value || "").trim();
        if (!name) {
          addLog("请输入用户名", true);
          return;
        }
        friendBtn.disabled = true;
        const ok = await friendsSystem.sendFriendRequest(name);
        friendBtn.disabled = false;
        if (ok) {
          if (input) input.value = "";
          if (typeof pushTickerEvent === "function") pushTickerEvent("friend", `向 ${name} 发送好友请求`);
          if (typeof renderFriends === "function") await renderFriends();
        }
        return;
      }
      if (act === "accept") {
        const requestId = Number(friendBtn.getAttribute("data-request-id"));
        if (!Number.isFinite(requestId)) return;
        friendBtn.disabled = true;
        const ok = await friendsSystem.acceptFriendRequest(requestId);
        friendBtn.disabled = false;
        if (ok) {
          if (typeof pushTickerEvent === "function") pushTickerEvent("friend", "接受了好友请求");
          if (typeof renderFriends === "function") await renderFriends();
          await loadFriendsList();
        }
        return;
      }
      if (act === "challenge") {
        const friendUid = friendBtn.getAttribute("data-friend-uid");
        const friendName = friendBtn.getAttribute("data-friend-name") || "好友";
        if (!friendUid) return;
        if (!selectedTeam || selectedTeam.length === 0) {
          addLog("请先选择你的队伍，再发起对战", true);
          return;
        }
        friendBtn.disabled = true;
        const success = await socialSystem.sendPvpInvite(friendUid, selectedTeam);
        friendBtn.disabled = false;
        if (success) {
          if (typeof pushTickerEvent === "function") pushTickerEvent("pvp", `向 ${friendName} 发起对战`);
          await renderPvpInvites();
        }
      }
    });

    // 点赞成就
    panelSocial.addEventListener("click", async (e) => {
      const btn = e.target.closest('[data-social-action="like"]');
      if (!btn) return;

      const achievementId = Number(btn.dataset.achievementId);
      const success = await socialSystem.likeAchievement(achievementId);
      
      if (success) {
        // 更新点赞数显示
        const card = btn.closest(".achievement-card");
        if (card) {
          const likesSpan = card.querySelector(".achievement-likes");
          if (likesSpan) {
            likesSpan.textContent = Number(likesSpan.textContent) + 1;
          }
        }
        btn.disabled = true;
        btn.textContent = "已赞";
      }
    });

    // 标记消息已读
    panelSocial.addEventListener("click", async (e) => {
      const btn = e.target.closest('[data-social-action="mark-read"]');
      if (!btn) return;

      const messageId = Number(btn.dataset.messageId);
      const success = await socialSystem.markMessageRead(messageId);
      
      if (success) {
        const row = btn.closest(".row");
        if (row) {
          row.classList.remove("message-unread");
          btn.remove();
        }
      }
    });

    // 发送消息（从输入框）
    panelSocial.addEventListener("click", async (e) => {
      const btn = e.target.closest('[data-social-action="send-message-input"]');
      if (!btn) return;

      const recipientSelect = document.getElementById("messageRecipient");
      const messageInput = document.getElementById("messageInput");
      
      if (!recipientSelect || !messageInput) return;

      const toUid = recipientSelect.value;
      const message = messageInput.value.trim();

      if (!toUid) {
        addLog("请选择好友", true);
        return;
      }

      if (!message) {
        addLog("请输入消息内容", true);
        return;
      }

      const success = await socialSystem.sendMessage(toUid, message);
      if (success) {
        messageInput.value = "";
        renderSocial.renderMessages();
      }
    });

    // 查看好友资料
    const friendProfileSelect = document.getElementById("friendProfileSelect");
    if (friendProfileSelect) {
      friendProfileSelect.addEventListener("change", async (e) => {
        const friendUid = e.target.value;
        if (friendUid) {
          await renderSocial.renderFriendProfile(friendUid);
        } else {
          const elProfile = document.getElementById("friendProfile");
          if (elProfile) elProfile.innerHTML = "";
        }
      });
    }

    // PVP 对战邀请
    panelSocial.addEventListener("click", async (e) => {
      const btn = e.target.closest('[data-social-action="pvp-invite"]');
      if (!btn) return;

      const friendUid = btn.dataset.friendUid;
      if (!friendUid) return;

      if (!selectedTeam || selectedTeam.length === 0) {
        addLog("请先选择你的队伍", true);
        return;
      }

      btn.disabled = true;
      const success = await socialSystem.sendPvpInvite(friendUid, selectedTeam);
      btn.disabled = false;

      if (success) {
        addLog("对战邀请已发送", true);
      }
    });

    // 发送消息（从资料页）
    panelSocial.addEventListener("click", async (e) => {
      const btn = e.target.closest('[data-social-action="send-message"]');
      if (!btn) return;

      const friendUid = btn.dataset.friendUid;
      if (!friendUid) return;

      // 切换到消息输入区域并选中该好友
      const recipientSelect = document.getElementById("messageRecipient");
      if (recipientSelect) {
        recipientSelect.value = friendUid;
        const messageInput = document.getElementById("messageInput");
        if (messageInput) messageInput.focus();
      }
    });
  }

  // 打开队伍选择器
  function openTeamSelector() {
    const list = (getState())?.mons?.list;
    if (!Array.isArray(list) || list.length === 0) {
      addLog("没有可用的萌灵", true);
      return;
    }

    // 游戏内萌灵没有 mon.hp 字段；用当前能力值筛可用单位
    const mons = list
      .map((m) => toPvpFighter(m))
      .filter((m) => m && m.hp > 0);
    if (mons.length === 0) {
      addLog("没有可用的萌灵", true);
      return;
    }

    // 创建模态框
    const modal = document.createElement("div");
    modal.className = "modalOverlay";
    modal.innerHTML = `
      <div class="modal">
        <div class="modal__header">
          <div class="modal__title">${renderUiIcon("tab_pve", 20)}<span>选择出战队伍</span><span class="tag">最多 6 只</span></div>
          <div class="modal__right">
            <button type="button" class="btn btn--small" data-action="autofill">一键上阵</button>
            <button type="button" class="btn btn--small" data-action="cancel">关闭</button>
          </div>
        </div>
        <div class="modal__desc">勾选最多 6 只萌灵组成演武阵容，用于离线育灵师挑战与好友约战。</div>
        <div class="modal__body">
          <div id="monSelector" class="mon-selector"></div>
        </div>
        <div class="actions">
          <button type="button" class="btn btn--ghost" data-action="cancel">取消</button>
          <button type="button" class="btn btn--primary" data-action="confirm">确认出战</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // 渲染萌灵列表
    const monSelector = modal.querySelector("#monSelector");
    let html = "";
    for (const mon of mons.slice(0, 30)) {
      const isSelected = selectedTeam.some((m) => m.id === mon.id);
      html += `
        <div class="mon-selector-item ${isSelected ? "selected" : ""}" data-mon-id="${mon.id}">
          <input class="chk" type="checkbox" ${isSelected ? "checked" : ""} />
          ${renderBeastIcon(mon.dex, mon.name, mon.isShiny)}
          <div class="mon-selector-item__info">
            <div class="row__title row__titleLine"><span>${escapeHtml(mon.name)}</span><span class="tag">Lv.${mon.level}</span></div>
            <div class="row__desc">HP ${mon.hp} · 攻击 ${mon.attack} · 防御 ${mon.defense} · 速度 ${mon.speed}</div>
          </div>
        </div>
      `;
    }
    monSelector.innerHTML = html;

    // 事件处理
    monSelector.addEventListener("click", (e) => {
      const item = e.target.closest(".mon-selector-item");
      if (!item) return;

      const checkbox = item.querySelector("input[type=checkbox]");
      if (!checkbox) return;

      if (e.target === checkbox) {
        if (checkbox.checked) {
          const selectedCount = monSelector.querySelectorAll("input[type=checkbox]:checked").length;
          if (selectedCount > 6) {
            checkbox.checked = false;
            item.classList.remove("selected");
            addLog("最多只能选择6只萌灵", true);
            return;
          }
          item.classList.add("selected");
        } else {
          item.classList.remove("selected");
        }
        return;
      }

      // 切换选中状态
      if (checkbox.checked) {
        checkbox.checked = false;
        item.classList.remove("selected");
      } else {
        const selectedCount = monSelector.querySelectorAll("input[type=checkbox]:checked").length;
        if (selectedCount >= 6) {
          addLog("最多只能选择6只萌灵", true);
          return;
        }
        checkbox.checked = true;
        item.classList.add("selected");
      }
    });

    modal.querySelector('[data-action="autofill"]')?.addEventListener("click", () => {
      const allItems = Array.from(monSelector.querySelectorAll(".mon-selector-item"));
      allItems.forEach((item, idx) => {
        const cb = item.querySelector("input[type=checkbox]");
        if (!cb) return;
        const on = idx < 6;
        cb.checked = on;
        item.classList.toggle("selected", on);
      });
    });

    const close = () => {
      if (modal.parentNode) modal.parentNode.removeChild(modal);
    };

    modal.querySelectorAll('[data-action="cancel"]').forEach((btn) => {
      btn.addEventListener("click", close);
    });

    modal.querySelector('[data-action="confirm"]').addEventListener("click", () => {
      const selectedIds = Array.from(monSelector.querySelectorAll("input[type=checkbox]:checked")).map((cb) =>
        Number(cb.closest(".mon-selector-item").dataset.monId)
      );

      if (selectedIds.length === 0) {
        addLog("请至少选择一只萌灵", true);
        return;
      }

      selectedTeam = mons.filter((m) => selectedIds.includes(m.id));
      renderMyTeam();
      addLog(`已选择 ${selectedTeam.length} 只萌灵`, true);
      close();
    });
  }

  // 显示战斗结果
  function showBattleResult(result) {
    const modal = document.createElement("div");
    modal.className = "modalOverlay";
    
    const isWin = result.winner === 2;
    const winnerText = result.winner === 1 ? "对手获胜" : 
                       result.winner === 2 ? "演武胜利！" : "战成平局";
    const logLines = Array.isArray(result.battleLog) ? result.battleLog : [];
    const formattedLog = logLines
      .map((l) => {
        const s = String(l || "");
        const cls = s.startsWith("---")
          ? "battle-log__line battle-log__line--turn"
          : s.includes("倒下了") || s.includes("获胜")
            ? "battle-log__line battle-log__line--ko"
            : s.includes("效果绝佳")
              ? "battle-log__line battle-log__line--se"
              : "battle-log__line";
        return `<div class="${cls}">${escapeHtml(s)}</div>`;
      })
      .join("");
    
    modal.innerHTML = `
      <div class="modal">
        <div class="modal__header">
          <div class="modal__title">${renderUiIcon("tab_pve", 20)}<span>演武战报 · ${winnerText}</span></div>
          <div class="modal__right">
            <span class="tag">共 ${result.rounds || 1} 回合</span>
            <button type="button" class="btn btn--small" data-action="close">关闭</button>
          </div>
        </div>
        <div class="modal__body">
          <div class="pve-result-block ${isWin ? "pve-result-block--win" : "pve-result-block--lose"}">
            <div class="row__title row__titleLine">${renderResSvg(isWin ? "shinyCharm" : "searchFlare", 18)}<span>${winnerText}</span></div>
            <div class="row__desc">${isWin ? "你的出战阵容成功击败对手，战绩已记入本机赛季！" : "本次演武惜败，提升萌灵等级或调整属性克制后再战。"}</div>
          </div>
          <div class="battle-log">
            ${formattedLog}
          </div>
          <div class="actions" style="margin-top:8px;justify-content:flex-end">
            <button type="button" class="btn btn--primary" data-action="close">完成</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const close = () => {
      if (modal.parentNode) modal.parentNode.removeChild(modal);
    };

    modal.querySelectorAll('[data-action="close"]').forEach((btn) => {
      btn.addEventListener("click", close);
    });
  }

  // 自动分享成就
  async function autoShareAchievement(type, data) {
    if (!socialSystem.hasAuth?.()) return;
    
    // 只分享重要成就
    const shouldShare = 
      (type === "rare_catch" && data.tier <= 2) || // 稀有萌灵
      (type === "rare_catch" && data.isShiny) || // 闪光
      (type === "dex_milestone" && data.count % 50 === 0) || // 图鉴里程碑
      (type === "shiny_milestone" && data.count % 10 === 0); // 闪光里程碑

    if (shouldShare) {
      await socialSystem.shareAchievement(type, data);
    }
  }

  return {
    setupSocialTab,
    refreshSocial,
    autoShareAchievement,
  };
}
