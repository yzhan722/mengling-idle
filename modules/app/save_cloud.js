// 存档子系统：本地 save/load + 云同步 + 导入导出/槽位（SECTION:SAVE_CLOUD 拆出）
// 维护者窗口：A
// state 走 getState/setState 访问器——导入/云覆盖会整体替换 state 对象

import { serializeState, loadFromRaw } from "../state.js";
import { encodeSaveText, decodeSaveText } from "../save_codec.js";
import { createCloudSave } from "../cloud_save.js";
import { formatLocalYmd } from "../utils.js";
import { STORAGE_KEY, STORAGE_BACKUP_KEY, SAVE_SLOT_KEY, readLocalStorage } from "./storage.js";

export function createSaveCloud({ getState, setState, getAutosaveEnabled, ui, render, hint, addLog, elCloudStatus }) {
  function setCloudStatus(text) {
    if (!elCloudStatus) return;
    elCloudStatus.textContent = typeof text === "string" ? text : String(text ?? "");
  }

  function getAutosaveRawJson() {
    try {
      const enc = localStorage.getItem(STORAGE_KEY);
      if (!enc) return null;
      const raw = decodeSaveText(enc);
      return raw ? String(raw) : null;
    } catch {
      return null;
    }
  }

  function applyAutosaveRaw(rawJson) {
    const s = loadFromRaw(rawJson);
    if (!s) return false;
    setState(s);
    ui.dexDirty = true;
    render();
    return true;
  }

  const cloudSave = createCloudSave({
    encodeSaveText,
    decodeSaveText,
    autosaveKey: STORAGE_KEY,
    slotKeys: [SAVE_SLOT_KEY],
    applyAutosaveRaw,
  });
  cloudSave.installCloudPanelUI({ setStatus: (t) => setCloudStatus(t), refreshGame: () => render() });

  function refreshCloudUI() {
    const token = cloudSave.getToken();
    const username = cloudSave.getUsername();
    if (token) setCloudStatus(`已登录：${username || "-"}`);
    else setCloudStatus("未登录");
  }

  async function doCloudSyncNow() {
    try {
      refreshCloudUI();
      if (!cloudSave.getToken()) {
        setCloudStatus("未登录");
        return;
      }
      setCloudStatus("同步中...");
      await cloudSave.syncAll();
      cloudSave.startAutoSync();
      const st = cloudSave.getSyncStatus();
      if (st.status === "error") {
        setCloudStatus(`同步失败：${st.error || "未知错误"}`);
      } else if (st.status === "partial") {
        setCloudStatus(`已登录：${cloudSave.getUsername() || "-"}（部分同步：${st.error || "有冲突"}）`);
      } else if (!cloudSave.getToken()) {
        setCloudStatus("登录已过期，请重新登录");
      } else {
        setCloudStatus(`已登录：${cloudSave.getUsername() || "-"}（已同步）`);
      }
    } catch (e) {
      const msg = typeof e?.message === "string" ? e.message : "同步失败";
      if (!cloudSave.getToken()) setCloudStatus("登录已过期，请重新登录");
      else setCloudStatus(`同步失败：${msg}`);
    }
  }

  function exportSaveJson() {
    try {
      save();
      const raw = getAutosaveRawJson();
      if (!raw) {
        setCloudStatus("无存档可导出");
        return;
      }
      const blob = new Blob([raw], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kittens-save-${formatLocalYmd()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setCloudStatus("已导出存档文件");
    } catch (e) {
      setCloudStatus(`导出失败：${e?.message || "unknown"}`);
    }
  }

  function importSaveJsonFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || "");
        const s = loadFromRaw(text);
        if (!s) {
          setCloudStatus("导入失败：存档损坏或不兼容");
          return;
        }
        setState(s);
        ui.dexDirty = true;
        save();
        render();
        setCloudStatus("已导入本地存档");
        if (cloudSave.getToken()) doCloudSyncNow();
      } catch (e) {
        setCloudStatus(`导入失败：${e?.message || "unknown"}`);
      }
    };
    reader.onerror = () => setCloudStatus("导入失败：无法读取文件");
    reader.readAsText(file);
  }

  function save() {
    if (!getAutosaveEnabled()) return;
    try {
      const payload = serializeState(getState());
      const next = encodeSaveText(JSON.stringify(payload));
      try {
        const prev = readLocalStorage(STORAGE_KEY);
        if (prev && prev !== next) localStorage.setItem(STORAGE_BACKUP_KEY, prev);
      } catch {
        // ignore
      }
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }

  function load() {
    try {
      const raw0 = localStorage.getItem(STORAGE_KEY);
      if (!raw0) return null;
      const raw = decodeSaveText(raw0);
      return loadFromRaw(raw);
    } catch {
      return null;
    }
  }

  function saveToKey(key) {
    const payload = serializeState(getState());
    const raw = JSON.stringify(payload);
    localStorage.setItem(key, encodeSaveText(raw));

    refreshCloudUI();
    if (cloudSave.getToken()) {
      doCloudSyncNow();
    }
  }

  function loadFromKey(key) {
    const raw0 = localStorage.getItem(key);
    if (!raw0) {
      hint("该槽位为空。", 1600);
      return false;
    }
    const raw = decodeSaveText(raw0);
    const s = loadFromRaw(raw);
    if (!s) {
      hint("该槽位存档损坏或不兼容。", 2000);
      return false;
    }
    setState(s);
    ui.dexDirty = true;
    render();
    hint("已读取存档。", 1200);
    return true;
  }

  // ui.fetch：带鉴权的 API 封装（未登录退化为 uid query）
  ui.fetch = async (path, { method = "GET", body = null } = {}) => {
    const headers = { "Content-Type": "application/json" };
    const token = cloudSave.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    const qs = !token && ui.lbUid ? `${path.includes("?") ? "&" : "?"}uid=${encodeURIComponent(ui.lbUid)}` : "";
    const res = await fetch(`${path}${qs}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });
    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    if (!res.ok) {
      const err = data && typeof data.error === "string" ? data.error : `http ${res.status}`;
      throw new Error(err);
    }
    return data;
  };

  // 设置页云面板 + 存/取档按钮事件（由 boot 调用；refreshSocial 为惰性 thunk）
  function bindSavePanelEvents(els, { refreshSocial } = {}) {
    if (els.elBtnCloudLogin) {
      els.elBtnCloudLogin.addEventListener("click", async () => {
        try {
          const u = els.elCloudUsername ? String(els.elCloudUsername.value || "").trim() : "";
          const p = els.elCloudPassword ? String(els.elCloudPassword.value || "").trim() : "";
          if (!u || !p) {
            setCloudStatus("请输入用户名和密码");
            return;
          }
          setCloudStatus("登录中...");
          await cloudSave.login(u, p);
          await doCloudSyncNow();
          try {
            refreshSocial?.();
          } catch {
          }
        } catch (e) {
          const msg = typeof e?.message === "string" ? e.message : "登录失败";
          setCloudStatus(`登录失败：${msg}`);
        }
      });
    }

    if (els.elBtnCloudRegister) {
      els.elBtnCloudRegister.addEventListener("click", async () => {
        try {
          const u = els.elCloudUsername ? String(els.elCloudUsername.value || "").trim() : "";
          const p = els.elCloudPassword ? String(els.elCloudPassword.value || "").trim() : "";
          if (!u || !p) {
            setCloudStatus("请输入用户名和密码");
            return;
          }
          setCloudStatus("注册中...");
          await cloudSave.register(u, p);
          await doCloudSyncNow();
          try {
            refreshSocial?.();
          } catch {
          }
        } catch (e) {
          const msg = typeof e?.message === "string" ? e.message : "注册失败";
          setCloudStatus(`注册失败：${msg}`);
        }
      });
    }

    if (els.elBtnCloudLogout) {
      els.elBtnCloudLogout.addEventListener("click", async () => {
        setCloudStatus("退出中...");
        await cloudSave.logout();
        refreshCloudUI();
      });
    }

    if (els.elBtnCloudSyncNow) {
      els.elBtnCloudSyncNow.addEventListener("click", async () => {
        await doCloudSyncNow();
      });
    }

    if (els.elBtnSaveExport) {
      els.elBtnSaveExport.addEventListener("click", () => exportSaveJson());
    }
    if (els.elBtnSaveImport && els.elSaveImportFile) {
      els.elBtnSaveImport.addEventListener("click", () => els.elSaveImportFile.click());
      els.elSaveImportFile.addEventListener("change", () => {
        const f = els.elSaveImportFile.files && els.elSaveImportFile.files[0];
        els.elSaveImportFile.value = "";
        importSaveJsonFile(f);
      });
    }
    document.getElementById("btnSaveSlot1")?.addEventListener("click", () => {
      try {
        saveToKey(SAVE_SLOT_KEY);
        hint("已写入手动存档槽 1", 1600);
        if (typeof addLog === "function") addLog("手动存档：已写入槽 1", true);
      } catch (e) {
        hint(`写入失败：${e?.message || "unknown"}`, 2000);
      }
    });
    document.getElementById("btnLoadSlot1")?.addEventListener("click", () => {
      loadFromKey(SAVE_SLOT_KEY);
    });
  }

  return {
    cloudSave,
    setCloudStatus,
    getAutosaveRawJson,
    applyAutosaveRaw,
    refreshCloudUI,
    doCloudSyncNow,
    exportSaveJson,
    importSaveJsonFile,
    save,
    load,
    saveToKey,
    loadFromKey,
    bindSavePanelEvents,
  };
}
