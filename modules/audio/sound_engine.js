// modules/audio/sound_engine.js — 星野灵兽录 · 舒缓环境音乐与全操作声效反馈引擎 (Web Audio API)
// 设计原则：
// 1. 整体背景音乐（BGM）采用 F大调9和弦 / C大调五声吕底亚调式（Fmaj9 - Em7 - Dm9 - Cmaj9），
//    融合温暖竖琴拨弦（Harp）、星辉钢片琴（Celesta）、柔和暖垫弦乐（Warm Pad）与篝火微风环境底噪，
//    营造《星露谷》《动森》般舒缓、治愈、久听不累的休闲氛围。
// 2. 全操作反馈：覆盖采集、砍树、采矿、添柴、建造、研究、切换页签、草丛奇袭、缩圈投球、
//    捕获成功/失败、闪光降临、喂食、抚摸、温养灵蛋、进化/升星、炼金、转盘、试炼对战等 25+ 种细腻声效。
// 3. 零外部音频 404 风险，支持三档切换：「音乐+音效」/「仅音效」/「静音」，状态持久化至 localStorage。

const AUDIO_STORAGE_KEY = "mengling_idle_audio_mode_v1"; // "all" | "sfx" | "mute"

// F Lydian / C Major Pentatonic 治愈音高表 (Hz)
const NOTE = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, Fs4: 369.99, G4: 392.00, Gs4: 415.30, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, Fs5: 739.99, G5: 783.99, Gs5: 830.61, A5: 880.00, B5: 987.77,
  C6: 1046.50, D6: 1174.66, E6: 1318.51, F6: 1396.91, G6: 1567.98, A6: 1760.00, B6: 1975.53,
};

// 四组舒缓和弦进行（每小节 6 秒，慢速呼吸感）
const CHORD_PROGRESSION = [
  { name: "Fmaj9", pad: [NOTE.F3, NOTE.C4, NOTE.E4, NOTE.A4], pool: [NOTE.F4, NOTE.G4, NOTE.A4, NOTE.C5, NOTE.E5, NOTE.G5, NOTE.A5] },
  { name: "Em7",   pad: [NOTE.E3, NOTE.B3, NOTE.D4, NOTE.G4], pool: [NOTE.E4, NOTE.G4, NOTE.A4, NOTE.B4, NOTE.D5, NOTE.E5, NOTE.G5] },
  { name: "Dm9",   pad: [NOTE.D3, NOTE.A3, NOTE.C4, NOTE.F4], pool: [NOTE.D4, NOTE.F4, NOTE.A4, NOTE.C5, NOTE.D5, NOTE.E5, NOTE.A5] },
  { name: "Cmaj9", pad: [NOTE.C3, NOTE.G3, NOTE.B3, NOTE.E4], pool: [NOTE.C4, NOTE.E4, NOTE.G4, NOTE.B4, NOTE.C5, NOTE.D5, NOTE.G5] },
];

// 各场景（Tab）音色与律动偏置
const SCENE_MOODS = {
  bonfire:     { brightness: 1650, arpDensity: 0.72, octaveShift: 1.0,  emberCrackle: true  },
  science:     { brightness: 2300, arpDensity: 0.65, octaveShift: 1.25, emberCrackle: false },
  capture:     { brightness: 1900, arpDensity: 0.78, octaveShift: 1.0,  emberCrackle: false },
  mons:        { brightness: 1800, arpDensity: 0.75, octaveShift: 1.0,  emberCrackle: false },
  functions:   { brightness: 1750, arpDensity: 0.70, octaveShift: 1.0,  emberCrackle: false },
  future:      { brightness: 2000, arpDensity: 0.76, octaveShift: 1.0,  emberCrackle: false },
  dex:         { brightness: 2200, arpDensity: 0.62, octaveShift: 1.25, emberCrackle: false },
  pve:         { brightness: 1950, arpDensity: 0.85, octaveShift: 1.0,  emberCrackle: false },
  items:       { brightness: 1850, arpDensity: 0.68, octaveShift: 1.0,  emberCrackle: false },
  social:      { brightness: 1900, arpDensity: 0.75, octaveShift: 1.0,  emberCrackle: false },
  leaderboard: { brightness: 2100, arpDensity: 0.72, octaveShift: 1.0,  emberCrackle: false },
  help:        { brightness: 1600, arpDensity: 0.55, octaveShift: 1.0,  emberCrackle: false },
  options:     { brightness: 1550, arpDensity: 0.50, octaveShift: 1.0,  emberCrackle: false },
};

let ctx = null;
let masterGain = null;
let bgmBus = null;
let sfxBus = null;
let reverbSend = null;
let ambientSource = null;
let ambientGain = null;

let audioMode = "all"; // "all" | "sfx" | "mute"
let currentScene = "bonfire";
let userGestureUnlocked = false;
let bgmStarted = false;
let chordIdx = 0;
let arpStep = 0;
let chordTimer = null;
let arpTimer = null;
let lastSfxAt = 0;

function loadSavedMode() {
  try {
    const raw = localStorage.getItem(AUDIO_STORAGE_KEY);
    if (raw === "all" || raw === "sfx" || raw === "mute") {
      audioMode = raw;
    }
  } catch {
    /* ignore */
  }
}

function saveMode() {
  try {
    localStorage.setItem(AUDIO_STORAGE_KEY, audioMode);
  } catch {
    /* ignore */
  }
}

function ensureContext() {
  if (typeof window === "undefined" || !userGestureUnlocked) return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;

  if (!ctx) {
    ctx = new AudioCtx();

    // 1. 主动态柔和压缩器（防止多音叠加爆音）
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.knee.value = 24;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.01;
    compressor.release.value = 0.25;
    compressor.connect(ctx.destination);

    masterGain = ctx.createGain();
    masterGain.gain.value = audioMode === "mute" ? 0 : 0.85;
    masterGain.connect(compressor);

    // 2. BGM 与 SFX 独立母线
    bgmBus = ctx.createGain();
    bgmBus.gain.value = audioMode === "all" ? 0.36 : 0;
    bgmBus.connect(masterGain);

    sfxBus = ctx.createGain();
    sfxBus.gain.value = audioMode === "mute" ? 0 : 0.58;
    sfxBus.connect(masterGain);

    // 3. 温暖空间混响（双延迟低通反馈环，营造空灵治愈泛音）
    reverbSend = ctx.createGain();
    reverbSend.gain.value = 0.28;

    const delayL = ctx.createDelay(1.0);
    const delayR = ctx.createDelay(1.0);
    delayL.delayTime.value = 0.21;
    delayR.delayTime.value = 0.34;

    const fbFilter = ctx.createBiquadFilter();
    fbFilter.type = "lowpass";
    fbFilter.frequency.value = 1450;

    const fbGain = ctx.createGain();
    fbGain.gain.value = 0.36;

    reverbSend.connect(delayL);
    delayL.connect(delayR);
    delayR.connect(fbFilter);
    fbFilter.connect(fbGain);
    fbGain.connect(delayL);

    delayL.connect(masterGain);
    delayR.connect(masterGain);
  }

  if (ctx.state === "suspended" && audioMode !== "mute") {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

function syncBusGains() {
  if (!ctx || !masterGain || !bgmBus || !sfxBus) return;
  const now = ctx.currentTime;
  masterGain.gain.setTargetAtTime(audioMode === "mute" ? 0.0001 : 0.85, now, 0.08);
  bgmBus.gain.setTargetAtTime(audioMode === "all" && !document.hidden ? 0.36 : 0.0001, now, 0.25);
  sfxBus.gain.setTargetAtTime(audioMode === "mute" ? 0.0001 : 0.58, now, 0.05);
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. 舒缓环境底噪（篝火暖风与静谧夜色）+ 治愈竖琴/钢片琴 BGM 作曲器
// ═══════════════════════════════════════════════════════════════════════════

function startAmbientBed() {
  if (!ctx || ambientSource) return;
  try {
    // 生成 4 秒无缝粉红/暖棕噪声缓冲（模拟柔风与远方篝火暖意）
    const sr = ctx.sampleRate;
    const len = sr * 4;
    const buf = ctx.createBuffer(1, len, sr);
    const data = buf.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 0.45;
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 260;

    ambientGain = ctx.createGain();
    ambientGain.gain.value = 0.045;

    src.connect(lp);
    lp.connect(ambientGain);
    ambientGain.connect(bgmBus);
    src.start();
    ambientSource = src;
  } catch {
    /* ignore */
  }
}

/** 播放温暖弦乐/电钢铺底和弦（慢起慢落，绝无生硬感） */
function playWarmPadChord(freqs, durationSec = 5.8) {
  if (!ctx || audioMode !== "all" || document.hidden) return;
  const now = ctx.currentTime;
  const mood = SCENE_MOODS[currentScene] || SCENE_MOODS.bonfire;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(580, now);
  filter.frequency.exponentialRampToValueAtTime(Math.min(950, mood.brightness * 0.48), now + durationSec * 0.45);
  filter.frequency.exponentialRampToValueAtTime(420, now + durationSec);

  const chordGain = ctx.createGain();
  chordGain.gain.setValueAtTime(0.0001, now);
  chordGain.gain.linearRampToValueAtTime(0.048, now + 1.8);
  chordGain.gain.setTargetAtTime(0.0001, now + durationSec - 1.6, 0.75);

  filter.connect(chordGain);
  chordGain.connect(bgmBus);
  chordGain.connect(reverbSend);

  freqs.forEach((f, idx) => {
    const osc = ctx.createOscillator();
    osc.type = idx % 2 === 0 ? "sine" : "triangle";
    osc.frequency.setValueAtTime(f, now);
    osc.detune.setValueAtTime((idx - 1.5) * 3.5, now);
    osc.connect(filter);
    osc.start(now);
    osc.stop(now + durationSec + 0.5);
  });
}

/** 播放治愈竖琴 / 钢片琴 / 卡林巴琴单音拨弦 */
function playHarpPluck(freq, { volume = 0.11, decay = 1.65, brightness = 1800, toBgm = true } = {}) {
  if (!ctx) return;
  if (toBgm && (audioMode !== "all" || document.hidden)) return;
  if (!toBgm && audioMode === "mute") return;

  const now = ctx.currentTime;
  const targetBus = toBgm ? bgmBus : sfxBus;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(brightness, now);
  filter.frequency.exponentialRampToValueAtTime(Math.max(320, brightness * 0.28), now + decay);

  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, now);
  env.gain.linearRampToValueAtTime(volume, now + 0.016);
  env.gain.exponentialRampToValueAtTime(0.0001, now + decay);

  // 基音 sine + 泛音 triangle
  const osc1 = ctx.createOscillator();
  osc1.type = "sine";
  osc1.frequency.setValueAtTime(freq, now);

  const osc2 = ctx.createOscillator();
  osc2.type = "triangle";
  osc2.frequency.setValueAtTime(freq * 2, now);
  const g2 = ctx.createGain();
  g2.gain.setValueAtTime(0.18, now);
  g2.gain.exponentialRampToValueAtTime(0.001, now + Math.min(0.28, decay * 0.4));

  osc1.connect(filter);
  osc2.connect(g2);
  g2.connect(filter);
  filter.connect(env);
  env.connect(targetBus);
  env.connect(reverbSend);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + decay + 0.05);
  osc2.stop(now + decay + 0.05);
}

/** 篝火细微火星噼啪声（仅在篝火营地轻柔触发） */
function playGentleEmberCrackle() {
  if (!ctx || audioMode !== "all" || document.hidden) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = "triangle";
  const baseF = 900 + Math.random() * 1100;
  osc.frequency.setValueAtTime(baseF, now);
  osc.frequency.exponentialRampToValueAtTime(240, now + 0.028);

  env.gain.setValueAtTime(0.0001, now);
  env.gain.linearRampToValueAtTime(0.022, now + 0.003);
  env.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

  osc.connect(env);
  env.connect(bgmBus);
  osc.start(now);
  osc.stop(now + 0.035);
}

function startBgmScheduler() {
  if (bgmStarted) return;
  bgmStarted = true;

  const triggerChord = () => {
    if (audioMode === "all" && ctx && !document.hidden) {
      const chord = CHORD_PROGRESSION[chordIdx % CHORD_PROGRESSION.length];
      playWarmPadChord(chord.pad, 6.2);
      chordIdx = (chordIdx + 1) % CHORD_PROGRESSION.length;
    }
  };

  const triggerArpStep = () => {
    if (audioMode === "all" && ctx && !document.hidden) {
      const mood = SCENE_MOODS[currentScene] || SCENE_MOODS.bonfire;
      const chord = CHORD_PROGRESSION[(chordIdx + CHORD_PROGRESSION.length - 1) % CHORD_PROGRESSION.length];
      if (Math.random() < mood.arpDensity) {
        // 以柔和五声琶音漫步选择音高，留白呼吸
        const pool = chord.pool;
        const patternIdx = (arpStep * 2 + (arpStep % 3)) % pool.length;
        const rawFreq = pool[patternIdx];
        const freq = mood.octaveShift > 1 && arpStep % 4 === 0 ? rawFreq * 2 : rawFreq;
        const vol = 0.075 + (arpStep % 4 === 0 ? 0.025 : 0);
        playHarpPluck(freq, { volume: vol, decay: 1.9, brightness: mood.brightness, toBgm: true });
      }
      if (mood.emberCrackle && Math.random() < 0.28) {
        playGentleEmberCrackle();
      }
      arpStep = (arpStep + 1) % 16;
    }
  };

  triggerChord();
  chordTimer = window.setInterval(triggerChord, 6000);
  arpTimer = window.setInterval(triggerArpStep, 750);
}

export function ensureAudioStarted() {
  const c = ensureContext();
  if (!c) return;
  startAmbientBed();
  startBgmScheduler();
  syncBusGains();
}

export function setSceneMood(tabName) {
  if (tabName && SCENE_MOODS[tabName]) {
    currentScene = tabName;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. 全操作声效反馈合成器（25+ 种定制游戏声效）
// ═══════════════════════════════════════════════════════════════════════════

function playPitchGlide({ fStart, fEnd, duration = 0.12, type = "sine", volume = 0.14, delay = 0 }) {
  if (!ctx || audioMode === "mute") return;
  const now = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(2200, now);

  osc.type = type;
  osc.frequency.setValueAtTime(fStart, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(40, fEnd), now + duration);

  env.gain.setValueAtTime(0.0001, now);
  env.gain.linearRampToValueAtTime(volume, now + Math.min(0.015, duration * 0.25));
  env.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(lp);
  lp.connect(env);
  env.connect(sfxBus);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

function playSequence(notes, { interval = 0.075, volume = 0.13, decay = 0.45, brightness = 2100 } = {}) {
  if (!ctx || audioMode === "mute") return;
  notes.forEach((freq, i) => {
    window.setTimeout(() => {
      playHarpPluck(freq, { volume, decay, brightness, toBgm: false });
    }, Math.round(i * interval * 1000));
  });
}

export function playSfx(kind = "ui_click") {
  ensureAudioStarted();
  if (!ctx || audioMode === "mute") return;

  const nowMs = performance.now();
  // 防抖：同一毫秒内高频重复触发时保护听感
  if (kind === "ui_click" && nowMs - lastSfxAt < 35) return;
  lastSfxAt = nowMs;

  switch (kind) {
    // 1. 通用轻柔水滴/木琴点击
    case "ui_click":
      playPitchGlide({ fStart: 540, fEnd: 720, duration: 0.048, type: "sine", volume: 0.09 });
      break;

    // 2. 切换导航页签（柔和翻页木琴双音）
    case "tab_switch":
      playPitchGlide({ fStart: 392, fEnd: 523.25, duration: 0.065, type: "sine", volume: 0.10 });
      break;

    // 3. 采集灵果（清脆饱满的星露谷式采摘跳跃音）
    case "gather":
      playPitchGlide({ fStart: 360, fEnd: 680, duration: 0.075, type: "sine", volume: 0.15 });
      playSequence([NOTE.C5, NOTE.G5], { interval: 0.055, volume: 0.12, decay: 0.32, brightness: 2200 });
      break;

    // 4. 伐取灵木（温润木槌敲击声）
    case "chop_wood":
      playPitchGlide({ fStart: 210, fEnd: 115, duration: 0.09, type: "triangle", volume: 0.18 });
      playPitchGlide({ fStart: 320, fEnd: 165, duration: 0.08, type: "sine", volume: 0.14, delay: 0.07 });
      break;

    // 5. 勘探灵晶（清越水晶泛音）
    case "mine_crystal":
      playSequence([NOTE.E5, NOTE.B5, NOTE.E6], { interval: 0.055, volume: 0.13, decay: 0.55, brightness: 2800 });
      break;

    // 6. 添柴鼓风（温暖火苗升腾和弦）
    case "stoke_fire":
      playPitchGlide({ fStart: 160, fEnd: 420, duration: 0.22, type: "triangle", volume: 0.12 });
      playSequence([NOTE.F4, NOTE.A4, NOTE.C5, NOTE.F5], { interval: 0.06, volume: 0.12, decay: 0.6, brightness: 1800 });
      break;

    // 7. 建造 / 升级建筑（笃实木工敲击 + 大调上行三和弦）
    case "build":
      playPitchGlide({ fStart: 195, fEnd: 130, duration: 0.07, type: "triangle", volume: 0.16 });
      playSequence([NOTE.C4, NOTE.E4, NOTE.G4, NOTE.C5], { interval: 0.065, volume: 0.14, decay: 0.5, brightness: 2000 });
      break;

    // 8. 立项研究 / 星象推演（空灵星盘琶音）
    case "research":
      playSequence([NOTE.D5, NOTE.Fs5, NOTE.A5, NOTE.D6], { interval: 0.07, volume: 0.13, decay: 0.65, brightness: 2500 });
      break;

    // 9. 野外寻踪 / 草丛奇袭遭遇灵兽（灵动发现竖琴滑音）
    case "encounter":
      playSequence([NOTE.C5, NOTE.E5, NOTE.G5, NOTE.B5, NOTE.C6], { interval: 0.055, volume: 0.14, decay: 0.55, brightness: 2400 });
      break;

    // 10. 切换灵球腰带
    case "ball_select":
      playSequence([NOTE.A5, NOTE.E6], { interval: 0.045, volume: 0.11, decay: 0.28, brightness: 2400 });
      break;

    // 11. 投掷灵球 / 缩圈命中（抛物线轻啸 + 落点轻叩）
    case "throw_ball":
      playPitchGlide({ fStart: 380, fEnd: 880, duration: 0.14, type: "sine", volume: 0.14 });
      playPitchGlide({ fStart: 620, fEnd: 440, duration: 0.06, type: "triangle", volume: 0.12, delay: 0.15 });
      break;

    // 12. 捕获成功（欢快治愈的四音庆典和弦）
    case "catch_success":
      playSequence([NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6], { interval: 0.085, volume: 0.16, decay: 0.85, brightness: 2600 });
      break;

    // 13. 闪光灵兽降临 / 闪光馆陈列（璀璨星芒流光琶音）
    case "shiny":
      playSequence([NOTE.G5, NOTE.B5, NOTE.D6, NOTE.G6, NOTE.B6], { interval: 0.065, volume: 0.15, decay: 0.95, brightness: 3200 });
      break;

    // 14. 灵兽挣脱 / 撤离（轻柔下行叹息音，不刺耳）
    case "catch_fail":
      playSequence([NOTE.E5, NOTE.C5, NOTE.A4], { interval: 0.08, volume: 0.11, decay: 0.45, brightness: 1500 });
      break;

    // 15. 投喂灵果 / 喂食萌灵（甜美欢快三连音）
    case "feed":
      playSequence([NOTE.F5, NOTE.A5, NOTE.C6], { interval: 0.06, volume: 0.13, decay: 0.42, brightness: 2200 });
      break;

    // 16. 抚摸萌灵 / 亲密互动（温柔八音盒和弦）
    case "pet":
      playSequence([NOTE.E5, NOTE.Gs5, NOTE.B5, NOTE.E6], { interval: 0.07, volume: 0.13, decay: 0.7, brightness: 2300 });
      break;

    // 17. 温养灵蛋
    case "egg_warm":
      playSequence([NOTE.D5, NOTE.A5, NOTE.D6], { interval: 0.075, volume: 0.12, decay: 0.6, brightness: 2000 });
      break;

    // 18. 灵兽进化 / 升星成功 / 灵蛋孵化（宏大温暖的七音庆典华彩）
    case "evolve":
      playSequence([NOTE.C4, NOTE.G4, NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6, NOTE.E6], {
        interval: 0.075,
        volume: 0.16,
        decay: 1.0,
        brightness: 2800,
      });
      break;

    // 19. 炼金合成 / 商店购买 / 领取奖励（金币清脆叮当）
    case "coin":
      playSequence([NOTE.A5, NOTE.E6, NOTE.A6], { interval: 0.055, volume: 0.14, decay: 0.55, brightness: 2900 });
      break;

    // 20. 幸运星盘转动（八音盒齿轮轻转 + 落定和弦）
    case "wheel_spin":
      playSequence([NOTE.C5, NOTE.D5, NOTE.E5, NOTE.G5, NOTE.A5, NOTE.C6, NOTE.E6], {
        interval: 0.05,
        volume: 0.13,
        decay: 0.6,
        brightness: 2600,
      });
      break;

    // 21. 试炼开战 / 擂鼓助威 / 远征启程
    case "battle":
      playPitchGlide({ fStart: 150, fEnd: 95, duration: 0.11, type: "triangle", volume: 0.18 });
      playSequence([NOTE.D4, NOTE.A4, NOTE.D5, NOTE.F5], { interval: 0.06, volume: 0.14, decay: 0.55, brightness: 2100 });
      break;

    // 22. 温柔提示 / 资源不足
    case "warn":
      playSequence([NOTE.D4, NOTE.A3], { interval: 0.07, volume: 0.10, decay: 0.3, brightness: 1200 });
      break;

    default:
      playPitchGlide({ fStart: 520, fEnd: 680, duration: 0.045, type: "sine", volume: 0.09 });
      break;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. 顶栏音乐/音效控制徽章与全局零侵入事件挂接
// ═══════════════════════════════════════════════════════════════════════════

const MODE_LABELS = {
  all:  "舒缓音乐: 开",
  sfx:  "仅留音效",
  mute: "已静音",
};

function updateAudioToggleButton(btn) {
  if (!btn) return;
  const labelEl = btn.querySelector(".audio-pill__label");
  if (labelEl) labelEl.textContent = MODE_LABELS[audioMode] || MODE_LABELS.all;
  btn.setAttribute("data-audio-mode", audioMode);
  btn.setAttribute("aria-label", `切换音乐与音效模式（当前：${MODE_LABELS[audioMode]}）`);
}

function updateOptionsAudioButtons() {
  if (typeof document === "undefined") return;
  document.querySelectorAll("[data-set-audio-mode]").forEach((b) => {
    const m = b.getAttribute("data-set-audio-mode");
    b.classList.toggle("btn--primary", m === audioMode);
  });
}

export function setAudioMode(mode) {
  if (mode !== "all" && mode !== "sfx" && mode !== "mute") return audioMode;
  audioMode = mode;
  saveMode();
  ensureAudioStarted();
  syncBusGains();

  const btn = document.getElementById("btnAudioToggle");
  updateAudioToggleButton(btn);
  updateOptionsAudioButtons();
  if (audioMode !== "mute") {
    playSfx("ball_select");
  }
  return audioMode;
}

export function cycleAudioMode() {
  const next = audioMode === "all" ? "sfx" : audioMode === "sfx" ? "mute" : "all";
  return setAudioMode(next);
}

function classifyElementSfx(el) {
  if (!el) return null;
  if (el.id === "btnAudioToggle") return null; // 由 cycleAudioMode 自行处理
  if (el.disabled || el.classList?.contains("is-locked")) return "warn";

  // 顶栏与篝火营地交互
  if (el.id === "btnGather" || el.hasAttribute("data-camp-quick-gather")) return "gather";
  if (el.hasAttribute("data-camp-pet")) return "pet";
  if (el.hasAttribute("data-gather-daily-claim")) return "coin";

  const stageAct = el.getAttribute("data-stage-act");
  if (stageAct) {
    if (stageAct === "camp-node") {
      const res = el.getAttribute("data-res");
      if (res === "wood") return "chop_wood";
      if (res === "minerals") return "mine_crystal";
      return "gather";
    }
    if (stageAct === "bonfire-stoke" || stageAct === "stoke-fire") return "stoke_fire";
    if (stageAct === "gather-nip") return "gather";
    if (stageAct === "gather-wood") return "chop_wood";
    if (stageAct === "gather-min") return "mine_crystal";
    if (stageAct === "astrolabe-pulse" || stageAct === "focus-research") return "research";
    if (stageAct.startsWith("field-hunt") || stageAct === "bush-ambush" || stageAct === "toggle-lure") return "encounter";
    if (stageAct === "mon-pet") return "pet";
    if (stageAct === "mon-feed") return "feed";
    if (stageAct === "egg-warm") return "egg_warm";
    if (stageAct === "train-cheer" || stageAct === "exp-boost" || stageAct === "pve-quick-fight") return "battle";
    if (stageAct === "cauldron-transmute") return "coin";
  }

  const rawAct = el.getAttribute("data-action");
  if (rawAct === "gatherCatnip") return "gather";
  if (rawAct === "refineCatnip") return "chop_wood";

  // 导航页签切换
  if (el.classList?.contains("tab") || el.hasAttribute("data-more-tab")) {
    const tabName = el.getAttribute("data-tab") || el.getAttribute("data-more-tab");
    if (tabName) setSceneMood(tabName);
    return "tab_switch";
  }

  // 建筑、炼金工坊与研究
  if (el.hasAttribute("data-buy") || el.hasAttribute("data-build") || el.hasAttribute("data-craft")) return "build";
  if (el.hasAttribute("data-research")) return "research";

  // 捕捉页操作
  if (el.hasAttribute("data-select-ball")) return "ball_select";
  if (el.hasAttribute("data-select-biome")) return "tab_switch";
  if (el.hasAttribute("data-era-advance") || el.hasAttribute("data-era-prestige") || el.hasAttribute("data-legacy-perk")) return "evolve";
  if (el.hasAttribute("data-capture-session-claim")) return "coin";
  const capAct = el.getAttribute("data-capture-action");
  if (capAct) {
    if (capAct === "encounter" || capAct === "advancedEncounter") return "encounter";
    if (capAct === "throw") return "throw_ball";
    if (capAct === "berry") return "feed";
    if (capAct === "mud") return "chop_wood";
    if (capAct === "run") return "catch_fail";
  }

  // 萌灵页、培育室与道具护理操作
  if (
    el.hasAttribute("data-mon-feed") ||
    el.hasAttribute("data-mon-feed-all") ||
    el.hasAttribute("data-mons-feed-hungry") ||
    el.hasAttribute("data-mon-exp") ||
    el.hasAttribute("data-mon-batch-candy") ||
    el.hasAttribute("data-mon-potion") ||
    el.hasAttribute("data-train-feed") ||
    el.hasAttribute("data-item-use") ||
    el.hasAttribute("data-item-confirm") ||
    el.hasAttribute("data-item-feed-hungry") ||
    el.hasAttribute("data-item-team-hppotion") ||
    el.hasAttribute("data-item-sortie-kit")
  ) {
    return "feed";
  }
  if (el.hasAttribute("data-breed-modal-confirm")) return "egg_warm";
  if (el.hasAttribute("data-mon-evo") || el.hasAttribute("data-mon-starup-confirm") || el.hasAttribute("data-mons-focus-evo")) return "evolve";
  if (el.hasAttribute("data-mon-release") || el.hasAttribute("data-mon-batch-release")) return "catch_fail";
  if (
    el.hasAttribute("data-mon-skill") ||
    el.hasAttribute("data-mon-batch-skill") ||
    el.hasAttribute("data-train-modal-confirm") ||
    el.hasAttribute("data-exp-start") ||
    el.hasAttribute("data-pve-fight") ||
    el.hasAttribute("data-pve-tower-fight") ||
    el.hasAttribute("data-tower-fight") ||
    el.hasAttribute("data-npc-fight") ||
    el.hasAttribute("data-boss-attack") ||
    el.getAttribute("data-social-action") === "pvp-invite"
  ) {
    return "battle";
  }
  if (el.hasAttribute("data-dex-shiny-showcase") || el.hasAttribute("data-showcase-pick") || el.hasAttribute("data-dex-shiny-card")) return "shiny";

  // 商店、道具与日常福利领取
  if (el.hasAttribute("data-fc-daily-spin")) return "wheel_spin";
  if (
    el.hasAttribute("data-fc-buy") ||
    el.hasAttribute("data-fc-boost") ||
    el.hasAttribute("data-fc-perm") ||
    el.hasAttribute("data-fc") ||
    el.hasAttribute("data-fc-autoex-up") ||
    el.hasAttribute("data-fc-daily-free") ||
    el.hasAttribute("data-func-exp-daily-claim") ||
    el.hasAttribute("data-dex-claim-region") ||
    el.hasAttribute("data-item-care-claim") ||
    el.hasAttribute("data-help-goals-claim") ||
    el.hasAttribute("data-daily-goal-claim") ||
    el.hasAttribute("data-claim-daily-goal") ||
    el.hasAttribute("data-claim-compass") ||
    el.hasAttribute("data-era-claim") ||
    el.id === "btnSaveSlot1" ||
    el.id === "btnCloudSyncNow" ||
    el.id === "btnSaveExport"
  ) {
    return "coin";
  }

  return "ui_click";
}

/** 根据日志或 Toast 文本自动补充结果反馈音（如捕获成功、闪光、进化、战斗胜利） */
export function playOutcomeSfxFromText(text = "", type = "") {
  const s = String(text || "");
  if (!s) return;
  if (/闪光|★/.test(s) && /捕获|获得|降临|孵化/.test(s)) {
    playSfx("shiny");
  } else if (/成功捕获|捕获了|收入图鉴|孵化成功/.test(s)) {
    playSfx("catch_success");
  } else if (/进化为|升星成功|突破至/.test(s)) {
    playSfx("evolve");
  } else if (/挣脱|逃跑了|未能捕获/.test(s)) {
    playSfx("catch_fail");
  } else if (/获得.*未来币|领取成功|兑换成功/.test(s)) {
    playSfx("coin");
  } else if (/挑战成功|击败了|获胜/.test(s)) {
    playSfx("catch_success");
  } else if (type === "shiny") {
    playSfx("shiny");
  } else if (type === "danger" || type === "warn") {
    playSfx("warn");
  }
}

let wiringInstalled = false;
export function installGlobalAudioWiring() {
  if (wiringInstalled || typeof document === "undefined") return;
  wiringInstalled = true;

  loadSavedMode();

  // 挂载顶栏音乐控制胶囊按钮
  const mountAudioButton = () => {
    updateOptionsAudioButtons();
    const identity = document.querySelector(".topbar__identity");
    if (!identity || document.getElementById("btnAudioToggle")) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = "btnAudioToggle";
    btn.className = "audio-pill";
    btn.innerHTML = `<img class="rpg-ai-icon" src="./assets/ui_icons/sootheBell.webp" width="15" height="15" alt="" aria-hidden="true" /><span class="audio-pill__label">${MODE_LABELS[audioMode]}</span>`;
    updateAudioToggleButton(btn);
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (e.isTrusted) userGestureUnlocked = true;
      cycleAudioMode();
    });
    identity.appendChild(btn);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountAudioButton, { once: true });
  } else {
    mountAudioButton();
  }

  // 在首次真实用户指针/键盘手势时解锁 Web Audio API，避免浏览器自动播放策略告警
  const unlockOnTrustedGesture = (e) => {
    if (e.isTrusted) {
      userGestureUnlocked = true;
      ensureAudioStarted();
    }
  };
  document.addEventListener("pointerdown", unlockOnTrustedGesture, true);
  document.addEventListener("keydown", unlockOnTrustedGesture, true);

  // 全局点击/交互声效代理（任何按钮、页签、热点、下拉框、复选框均有即时反馈）
  document.addEventListener(
    "click",
    (e) => {
      if (e.isTrusted) userGestureUnlocked = true;
      ensureAudioStarted();
      const modeBtn = e.target?.closest?.("[data-set-audio-mode]");
      if (modeBtn) {
        setAudioMode(modeBtn.getAttribute("data-set-audio-mode"));
        return;
      }
      const target = e.target?.closest?.(
        "button, .tab, [data-more-tab], [data-stage-act], [data-select-ball], [data-select-biome], summary, input[type='checkbox']"
      );
      if (!target) return;
      const sfxKind = classifyElementSfx(target);
      if (sfxKind) playSfx(sfxKind);
    },
    true
  );

  document.addEventListener(
    "change",
    (e) => {
      if (e.isTrusted) userGestureUnlocked = true;
      if (e.target?.matches?.("select")) {
        playSfx("ui_click");
      }
    },
    true
  );

  // 页面切后台自动静音，回到前台平滑恢复
  document.addEventListener("visibilitychange", () => {
    syncBusGains();
  });

  // 暴露到全局供 Toast 与日志系统调用
  window.GameAudio = {
    playSfx,
    playOutcomeSfxFromText,
    setSceneMood,
    cycleAudioMode,
    ensureAudioStarted,
  };
}
