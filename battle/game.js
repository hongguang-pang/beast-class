/* ============================================================
 * 《知识大陆 · 宠物远征》v4 —— 大图谱 × 编队 × 克制 × 地图 × 掉落 × BGM
 * 状态：select → map(按知识单元动态生成的远征路线) → battle → levelClear → map/… → result/defeat
 * 零外部依赖：Canvas 粒子 + DOM 界面 + Web Audio 合成音效与背景音乐
 * ============================================================ */
'use strict';
/* ---------- 老内核兜底：Android 微信 X5 / 旧 WebView 缺这两个方法 ---------- */
if (!Array.prototype.includes) {
  Array.prototype.includes = function (x) { return this.indexOf(x) !== -1; };
}
if (!String.prototype.padStart) {
  String.prototype.padStart = function (n, c) {
    var s = String(this); c = c === undefined ? ' ' : String(c);
    while (s.length < n) s = c + s;
    return s;
  };
}
/* NodeList 转数组（旧 WebView 的 NodeList 没有迭代器） */
const toArr = n => Array.prototype.slice.call(n);

const $ = id => document.getElementById(id);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const rand = n => Math.floor(Math.random() * n);
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=rand(i+1); const t=a[i]; a[i]=a[j]; a[j]=t; } return a; }

const GRADES = window.GRADES, PETS = window.BATTLE_PETS;
const ELEMENTS = window.ELEMENTS, ELEM_ADV = window.ELEM_ADV;
const ELEM_ADV_MULT = window.ELEM_ADV_MULT, ELEM_WEAK_MULT = window.ELEM_WEAK_MULT;
const RAR_BONUS = window.RAR_BONUS, RAR_COLOR = window.RAR_COLOR;
const KG_BANK = window.KG_BANK, KG_NAMES = window.KG_NAMES;
/* 学习引擎 LEARN 由 engine.js 以 const 声明，全局可直接引用 */

/* 学科元数据来自 knowledge.js（10 科全量），旧版仅有本地 5 科表，这里做兼容兜底 */
const SUBJ_META = window.SUBJ_META || {
  math: { name:'数学', icon:'🧮' }, cn: { name:'语文', icon:'📖' },
  en: { name:'英语', icon:'🔤' }, sci: { name:'科学', icon:'🔬' }, eth: { name:'道德与法治', icon:'⚖️' }
};

/* ---------- 关卡皮肤：敌人属性与队伍属性形成策略约束 ----------
 * 皮肤只有 8 套，但关卡本身按「知识图谱单元」动态生成（buildLevels）。
 * 例：三年级 59 个单元 = 59 关，每个单元名就是关卡名，真正按大图谱推进。 */
const LEVEL_SKINS = [
  { enemy:'苔球怪',   emoji:'🪴', elem:'wood',  hp:82,  lv:0 },
  { enemy:'潮汐蟹',   emoji:'🦀', elem:'water', hp:90,  lv:0 },
  { enemy:'焰尾鸦',   emoji:'🦅', elem:'fire',  hp:98,  lv:1 },
  { enemy:'萤火灵',   emoji:'✨', elem:'light', hp:106, lv:1 },
  { enemy:'暗影蝠',   emoji:'🦇', elem:'dark',  hp:114, lv:2 },
  { enemy:'巨口花',   emoji:'🌺', elem:'wood',  hp:122, lv:2 },
  { enemy:'水晶兽',   emoji:'💎', elem:'water', hp:130, lv:3 },
  { enemy:'星界龙',   emoji:'🐉', elem:'light', hp:138, lv:3 }
];
const BOSS_SKIN = { enemy:'知识魔王', emoji:'📚', elem:'dark', hp:170, lv:4, boss:true };

/* 按知识图谱单元生成关卡：一个单元一关，名字用真实单元名 */
let LEVELS = [];
function buildLevels(grade){
  const stages = LEARN && LEARN.stages ? LEARN.stages(grade) : [];
  const n = Math.max(stages.length, 8);
  const out = [];
  for (let i = 0; i < n; i++) {
    const st = stages[i];
    const skin = LEVEL_SKINS[i % LEVEL_SKINS.length];
    const round = Math.floor(i / LEVEL_SKINS.length);         // 第几轮循环（越往后越难）
    const isBoss = i === n - 1;
    const base = isBoss ? BOSS_SKIN : skin;
    /* 单元名：去掉"三年级上册 第X单元 "前缀，保留可读的单元主题 */
    const unitFull = st ? st.unit : '';
    const unitShort = unitFull.replace(/^[一二三四五六七八九十\d]+年级[上下]册\s*/, '').replace(/^第?\d+单元\s*/, '') || (st ? st.name : '');
    out.push({
      name: isBoss ? '知识魔王·终章' : (unitShort || LEVEL_SKINS[i % LEVEL_SKINS.length].enemy),
      enemy: base.enemy, emoji: base.emoji, elem: base.elem,
      hp: Math.round(base.hp * (1 + round * 0.12)),
      lv: clamp(base.lv + Math.floor(round / 2), 0, 4),
      boss: isBoss, unit: unitFull, stageIdx: i
    });
  }
  return out;
}

/* ---------- 全局状态 ---------- */
const G = {
  state:'select',
  grade: (typeof window.__kgBootGrade === 'string' && window.KG_SHARDS && window.KG_SHARDS[window.__kgBootGrade]) ? window.__kgBootGrade : 'g3',
  team:[],            // [{ pet, hp, maxHp }]
  active:0,
  level:0, bossPhase:1,
  enemyHp:110, enemyMax:110,
  combo:0, maxCombo:0, correctCount:0, wrongCount:0, questionNo:0,
  notes:2, usedThisQ:[],
  currentQ:null, currentOpts:[], currentAnswer:0,
  bags:{}, usedQ:new Set(), wrongPool:[], knHit:{}, startTime:0, lock:false,
  chosenLevel:0, lvCorrect:0, lvWrong:0, lvSubj:{}, bag:{}, runDrops:[], sessionDrops:[],
  /* v5 学习引擎状态 */
  mode:'story',            // story=单元闯关 | endless=无限远征
  stages:[],               // 当前年级的单元关卡列表 LEARN.stages(grade)
  stageIdx:0,              // 当前单元关卡下标
  kidQueue:[],             // 本关待学的知识点id队列（按单元顺序）
  kidPtr:0,                // 队列游标
  usedTexts:{},            // 本局已出题干（避免重复）
  answered:false,          // 当前题是否已作答（填空/简答防重复提交）
  inputKind:null,          // 当前题型渲染态
  reviewStreak:0,          // 连续出题计数，用于穿插复习
  /* v6 诊断：答错追根 */
  diagNext:null,           // 下一题的定向指令 {kid, kind:'confirm'|'root', ...}
  diagRootInfo:null,       // 当前正在追踪的根因展示信息 {root,path}
  diagEnabled:true         // 诊断开关（默认开）
};

/* ---------- 安全存储：无痕模式 / file:// / 微信受限环境下 localStorage 会抛错 ---------- */
const LS = {
  mem: {},
  get(k){
    try { const v = window.localStorage.getItem(k); return v === null ? (k in this.mem ? this.mem[k] : null) : v; }
    catch(e){ return k in this.mem ? this.mem[k] : null; }
  },
  set(k, v){
    this.mem[k] = v;
    try { window.localStorage.setItem(k, v); } catch(e){ /* 忽略：退化为内存 */ }
  }
};

/* ============================================================
 * 1. 音效（Web Audio 合成，无外部文件）
 * ============================================================ */
const SND = {
  ctx:null, master:null,
  muted: LS.get('battle.muted') === '1',
  ensure(){
    if (this.muted) return null;
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  },
  tone(freq, dur, opt){
    opt = opt || {};
    const c = this.ensure(); if (!c) return;
    const t0 = c.currentTime + (opt.delay || 0);
    const o = c.createOscillator(), g = c.createGain();
    o.type = opt.type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (opt.to) o.frequency.exponentialRampToValueAtTime(Math.max(40, opt.to), t0 + dur);
    const v = opt.vol == null ? 0.11 : opt.vol;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(v, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(this.master);
    o.start(t0); o.stop(t0 + dur + 0.03);
  },
  noise(dur, vol, freq){
    const c = this.ensure(); if (!c) return;
    const len = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.2);
    const s = c.createBufferSource(); s.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq || 1000;
    const g = c.createGain(); g.gain.value = vol == null ? 0.16 : vol;
    s.connect(f); f.connect(g); g.connect(this.master); s.start();
  },
  tap(){ this.tone(620, 0.07, { type:'triangle', vol:.06 }); },
  correct(combo){
    const base = 520 + Math.min(combo, 6) * 34;
    [0, 70, 140].forEach((d, i) => this.tone(base * (1 + i * 0.22), 0.1, { type:'triangle', vol:.085, delay:d/1000 }));
  },
  crit(){
    [0, 60, 120, 190].forEach((d, i) => this.tone(760 * (1 + i * 0.25), 0.12, { type:'sine', vol:.08, delay:d/1000 }));
  },
  hit(){ this.noise(0.16, 0.2, 1400); this.tone(180, 0.14, { type:'square', vol:.05, to:90 }); },
  hurt(){ this.tone(220, 0.22, { type:'sine', vol:.09, to:120 }); this.noise(0.12, 0.1, 600); },
  wrong(){ this.tone(300, 0.16, { type:'sine', vol:.075, to:200 }); this.tone(240, 0.2, { type:'sine', vol:.06, to:170, delay:.1 }); },
  swap(){ this.tone(480, 0.08, { type:'triangle', vol:.07, to:640 }); },
  faint(){ this.tone(300, 0.4, { type:'sine', vol:.09, to:120 }); this.noise(0.3, 0.1, 700); },
  clear(){
    [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.22, { type:'triangle', vol:.09, delay:i * 0.11 }));
  },
  boss(){
    this.noise(0.5, 0.16, 320);
    this.tone(110, 0.55, { type:'sawtooth', vol:.07, to:70 });
  },
  victory(){
    [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.3, { type:'triangle', vol:.085, delay:i * 0.13 }));
  },
  defeat(){
    [392, 330, 262].forEach((f, i) => this.tone(f, 0.36, { type:'sine', vol:.08, delay:i * 0.16 }));
  },
  toggle(){
    this.muted = !this.muted;
    LS.set('battle.muted', this.muted ? '1' : '0');
    $('soundBtn').textContent = this.muted ? '🔇' : '🔊';
    $('soundBtn').classList.toggle('off', this.muted);
    if (!this.muted) this.tap();
    BGM.toggleMute();
  }
};
/* ============================================================
 * 1a. 震动反馈（移动端手感）——借鉴《打个螺丝》"打磨操作手感"的经验。
 * 分级：tap 轻、right 答对、combo 连击渐强、crit 克制双击、wrong 钝震、clear 过关节奏。
 * 跟随静音开关：静音＝安静模式，不震动。桌面端 navigator.vibrate 不存在时自动无感。
 * ============================================================ */
const VIB = {
  on(){ return typeof SND !== 'undefined' && !SND.muted && typeof navigator !== 'undefined' && navigator.vibrate; },
  fire(p){ if (this.on()) { try { navigator.vibrate(p); } catch (e) {} } },
  tap(){ this.fire(12); },
  right(){ this.fire(24); },
  combo(n){ this.fire([18, 22, Math.min(60, 28 + n * 6)]); },
  crit(){ this.fire([30, 40, 30, 40, 70]); },
  wrong(){ this.fire([45, 60, 45]); },
  clear(){ this.fire([30, 50, 30, 50, 90]); },
  boss(){ this.fire([60, 50, 60, 50, 120]); }
};
/* ============================================================
 * 1b. 背景音乐（Web Audio 合成，8 小节循环，与音效共用上下文）
 * ============================================================ */
const BGM = {
  playing:false, theme:'map', timer:null, nextTime:0, step:0, gain:null, wasPlaying:false,
  themes:{
    map:{ bpm:92, notes:[
      [261.63,1],[329.63,1],[392,1],[523.25,1], [440,1],[392,1],[329.63,1],null,
      [293.66,1],[349.23,1],[440,1],[587.33,1], [523.25,1],[440,1],[392,1],null
    ]},
    battle:{ bpm:136, notes:[
      [220,.5],[261.63,.5],[329.63,.5],[392,.5], [440,.5],[392,.5],[329.63,.5],[261.63,.5],
      [220,.5],[261.63,.5],[329.63,.5],[440,.5], [392,.5],[329.63,.5],[261.63,.5],[196,.5]
    ]}
  },
  init(){
    const c = SND.ensure(); if (!c) return false;
    if (!this.gain){ this.gain = c.createGain(); this.gain.gain.value = 0.16; this.gain.connect(SND.master); }
    return true;
  },
  note(freq, t0, dur){
    const c = SND.ctx; if (!c || !this.gain) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.7, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(this.gain); o.start(t0); o.stop(t0 + dur + 0.02);
  },
  sched(){
    const c = SND.ctx; if (!c || !this.playing) return;
    const th = this.themes[this.theme] || this.themes.map;
    const beat = 60 / th.bpm;
    let guard = 0;
    while (this.nextTime < c.currentTime + 0.35 && guard++ < 40){
      const n = th.notes[this.step % th.notes.length];
      if (n) this.note(n[0], this.nextTime, Math.max(0.08, n[1] * beat * 0.92));
      this.step++; this.nextTime += (n ? n[1] : 0.5) * beat;
    }
  },
  start(theme){
    if (theme) this.theme = theme;
    if (SND.muted) return;
    if (!this.init()) return;
    if (this.playing) return;
    this.playing = true; this.step = 0; this.nextTime = SND.ctx.currentTime + 0.06;
    this.timer = setInterval(() => this.sched(), 60); this.sched();
  },
  stop(){ this.playing = false; if (this.timer){ clearInterval(this.timer); this.timer = null; } },
  setTheme(t){ if (this.theme === t) return; const was = this.playing; this.stop(); this.theme = t; if (was && !SND.muted) this.start(t); },
  toggleMute(){ if (SND.muted) this.stop(); else this.start(this.theme); }
};
document.addEventListener('visibilitychange', () => {
  if (document.hidden){ BGM.wasPlaying = BGM.playing; BGM.stop(); }
  else if (BGM.wasPlaying && !SND.muted) BGM.start(BGM.theme);
});

/* ============================================================
 * 1c. 掉落物与地图进度（localStorage 安全封装）
 * ============================================================ */
const DROP_ITEMS = {
  shard_math:{ name:'数学碎片', emoji:'🧮', type:'shard' },
  shard_cn:{ name:'语文碎片', emoji:'📖', type:'shard' },
  shard_en:{ name:'英语碎片', emoji:'🔤', type:'shard' },
  shard_sci:{ name:'科学碎片', emoji:'🔬', type:'shard' },
  shard_eth:{ name:'道法碎片', emoji:'⚖️', type:'shard' },
  cry_fire:{ name:'火之晶石', emoji:'🔥', type:'crystal' },
  cry_water:{ name:'水之晶石', emoji:'💧', type:'crystal' },
  cry_wood:{ name:'木之晶石', emoji:'🌿', type:'crystal' },
  cry_light:{ name:'光之晶石', emoji:'✨', type:'crystal' },
  cry_dark:{ name:'暗之晶石', emoji:'🌑', type:'crystal' },
  crown:{ name:'知识王冠', emoji:'👑', type:'badge' }
};
for (let i = 1; i <= 8; i++) DROP_ITEMS['badge'+i] = { name:'第'+i+'关徽章', emoji: i === 8 ? '🏆' : ['🥉','🥈','🏅','🎖️','🏵️','🎗️','💠'][i-1], type:'badge' };
function dropMeta(k){ return DROP_ITEMS[k] || { name:'神秘宝物', emoji:'🎁', type:'badge' }; }
function loadBag(){ try { return JSON.parse(LS.get('battle.bag') || '{}') || {}; } catch(e){ return {}; } }
function saveBag(){ LS.set('battle.bag', JSON.stringify(G.bag)); }
function addDrop(k){ G.bag[k] = (G.bag[k] || 0) + 1; G.runDrops.push(k); G.sessionDrops.push(k); saveBag(); }
function loadProgress(){ try { return JSON.parse(LS.get('battle.map.progress') || '{}') || {}; } catch(e){ return {}; } }
function loadStars(){ try { return JSON.parse(LS.get('battle.map.stars') || '{}') || {}; } catch(e){ return {}; } }
function nodeState(i){ const n = loadProgress()[G.grade] || 0; return i < n ? 'cleared' : i === n ? 'current' : 'locked'; }
function markCleared(i){
  const p = loadProgress(), st = loadStars();
  if ((p[G.grade] || 0) < i + 1){ p[G.grade] = i + 1; LS.set('battle.map.progress', JSON.stringify(p)); }
  const acc = (G.lvCorrect + G.lvWrong) ? G.lvCorrect / (G.lvCorrect + G.lvWrong) : 1;
  const star = G.lvWrong === 0 ? 3 : acc >= 0.7 ? 2 : 1;
  if (!st[G.grade]) st[G.grade] = {};
  if ((st[G.grade][i] || 0) < star){ st[G.grade][i] = star; LS.set('battle.map.stars', JSON.stringify(st)); }
}
function rollDrops(idx){
  const cfg = LEVELS[idx];
  const subs = Object.keys(G.lvSubj);
  let top = 'math';
  if (subs.length) top = subs.reduce((a,b) => G.lvSubj[a] >= G.lvSubj[b] ? a : b);
  addDrop('shard_' + top);
  if (Math.random() < 0.34 + Math.min(G.maxCombo, 6) * 0.08) addDrop('cry_' + cfg.elem);
  if ((loadProgress()[G.grade] || 0) <= idx) addDrop(cfg.boss ? 'crown' : 'badge' + (idx + 1));
  return G.runDrops.slice();
}

/* 手机浏览器要求首次触摸后才能出声 */
window.addEventListener('pointerdown', () => { SND.ensure(); if (!SND.muted) BGM.start(BGM.theme); }, { once:true });

/* ============================================================
 * 2. Canvas 演出
 * ============================================================ */
const fx = $('fx'), ctx = fx.getContext('2d');
let FW = 390, FH = 844;
function resize(){
  FW = $('stage').clientWidth; FH = $('stage').clientHeight;
  const DPR = Math.min(2, window.devicePixelRatio || 1);
  fx.width = FW * DPR; fx.height = FH * DPR;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
window.addEventListener('resize', resize);
let particles = [], flashes = [];
function burst(x, y, color, n){
  n = n || 18;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = 2 + Math.random() * 5;
    particles.push({ x, y, vx:Math.cos(a)*s, vy:Math.sin(a)*s - 1, life:1, color, r:2 + Math.random()*4 });
  }
}
function pages(x, y, n){
  n = n || 14;
  for (let i = 0; i < n; i++) {
    particles.push({ x, y, vx:(Math.random()-.5)*6, vy:-2-Math.random()*4, life:1.4,
      color:i%2?'#fff3cf':'#ffe08a', r:3+Math.random()*5, page:true, rot:Math.random()*6, vr:(Math.random()-.5)*.3 });
  }
}
function flash(color){ flashes.push({ a:1, color:color || 'rgba(255,220,140,.5)' }); }
function drawFx(dt){
  ctx.clearRect(0, 0, FW, FH);
  for (const f of flashes) {
    f.a -= dt * 2.4;
    if (f.a > 0) { ctx.fillStyle = f.color; ctx.globalAlpha = f.a; ctx.fillRect(0, 0, FW, FH); }
    ctx.globalAlpha = 1;
  }
  flashes = flashes.filter(f => f.a > 0);
  for (const p of particles) {
    p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.life -= dt * 1.1;
    if (p.life <= 0) continue;
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    if (p.page) {
      ctx.save(); ctx.translate(p.x, p.y); p.rot += p.vr; ctx.rotate(p.rot);
      ctx.fillRect(-p.r, -p.r * .7, p.r * 2, p.r * 1.4); ctx.restore();
    } else {
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  particles = particles.filter(p => p.life > 0);
}
let lastT = performance.now();
function loop(t){
  const dt = Math.min(.05, (t - lastT) / 1000); lastT = t;
  drawFx(dt);
  requestAnimationFrame(loop);
}

/* ============================================================
 * 3. 出题：年级知识图谱
 * ============================================================ */
/* 数学题按年级现场生成（无限题量），并标注真实知识点名 */
function genMath(g, lv){
  const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  let q, r, step = 1, tag = '四则运算';
  if (g === 'g1') {
    if (lv <= 0) { const a = R(1,9), b = R(1,10-a); q = a+' + '+b+' = ?'; r = a+b; tag = '10以内加法'; }
    else if (lv === 1) { const a = R(2,15), b = R(1,Math.min(9,20-a)); q = a+' + '+b+' = ?'; r = a+b; tag = '20以内加法'; }
    else if (lv === 2) { const a = R(5,20), b = R(1,a-1); q = a+' − '+b+' = ?'; r = a-b; tag = '20以内减法'; }
    else if (lv === 3) { const a = R(2,12), b = R(1,8), c = R(1,Math.min(5,a+b-1)); q = a+' + '+b+' − '+c+' = ?'; r = a+b-c; tag = '加减混合'; }
    else { const a = R(1,8)*10, b = R(1,8)*10; q = a+' + '+b+' = ?'; r = a+b; tag = '整十数加法'; }
  } else if (g === 'g2') {
    if (lv <= 0) { const a = R(10,80), b = R(1,99-a); q = a+' + '+b+' = ?'; r = a+b; tag = '两位数加法'; }
    else if (lv === 1) { const a = R(1,5), b = R(1,9); q = a+' × '+b+' = ?'; r = a*b; tag = '乘法口诀'; }
    else if (lv === 2) { const a = R(2,9), b = R(2,9); q = a+' × '+b+' = ?'; r = a*b; tag = '乘法口诀'; }
    else if (lv === 3) { const b = R(2,9), qq = R(2,9); q = (b*qq)+' ÷ '+b+' = ?'; r = qq; tag = '表内除法'; }
    else { const a = R(2,9), b = R(2,9), c = R(1,20); q = a+' × '+b+' + '+c+' = ?'; r = a*b+c; tag = '乘加混合'; }
  } else if (g === 'g3') {
    if (lv <= 0) { const a = R(100,800), b = R(10,99); q = a+' + '+b+' = ?'; r = a+b; tag = '三位数加法'; }
    else if (lv === 1) { const a = R(12,49), b = R(2,9); q = a+' × '+b+' = ?'; r = a*b; tag = '两位数乘一位数'; }
    else if (lv === 2) { const b = R(2,9), qq = R(12,49); q = (b*qq)+' ÷ '+b+' = ?'; r = qq; tag = '除法竖式'; }
    else if (lv === 3) { const a = R(2,9), b = R(2,9), c = R(2,9); q = '('+a+' + '+b+') × '+c+' = ?'; r = (a+b)*c; tag = '混合运算'; }
    else { const a = R(1,8), b = R(1,10-a); q = a+'/10 + '+b+'/10 = ?（填分子，分母仍是 10）'; r = a+b; tag = '分数初步'; }
  } else if (g === 'g4') {
    if (lv <= 0) { const a = R(1000,5000), b = R(100,999); q = a+' + '+b+' = ?'; r = a+b; tag = '大数加法'; }
    else if (lv === 1) { const a = R(12,29), b = R(11,19); q = a+' × '+b+' = ?'; r = a*b; tag = '两位数乘两位数'; }
    else if (lv === 2) { const b = R(11,29), qq = R(5,20); q = (b*qq)+' ÷ '+b+' = ?'; r = qq; tag = '除数是两位数的除法'; }
    else if (lv === 3) { const a = R(2,9), b = R(2,9), c = R(2,9), d = R(2,9); q = a+' × '+b+' + '+c+' × '+d+' = ?'; r = a*b+c*d; tag = '四则混合运算'; }
    else { const a = R(2,9); q = a+' × 25 × 4 = ?（用简便算法）'; r = a*100; tag = '运算定律'; }
  } else if (g === 'g5') {
    if (lv <= 0) { const a = R(1,20)+R(1,9)/10, b = R(1,20)+R(1,9)/10; q = fmt(a)+' + '+fmt(b)+' = ?'; r = Math.round((a+b)*10)/10; step = 0.1; tag = '小数加法'; }
    else if (lv === 1) { const a = R(5,30)/10, b = R(2,5); q = fmt(a)+' × '+b+' = ?'; r = Math.round(a*b*10)/10; step = 0.1; tag = '小数乘法'; }
    else if (lv === 2) { const a = R(3,9)/10, b = R(2,9); q = fmt(a*b)+' ÷ '+fmt(a)+' = ?'; r = b; tag = '小数除法'; }
    else if (lv === 3) { const b = R(2,9), x = R(2,20); q = 'x + '+b+' = '+(x+b)+'，x = ?'; r = x; tag = '简易方程'; }
    else { const a = R(2,9), b = R(3,9); q = a+'/'+b+' ≈ ?（保留两位小数）'; r = Math.round(a/b*100)/100; step = 0.01; tag = '分数化小数'; }
  } else {
    if (lv <= 0) { const a = R(2,9), b = R(2,9); q = a+'/'+b+' 化成百分数约是？'; r = Math.round(a/b*1000)/10; step = 0.1; tag = '分数与百分数'; }
    else if (lv === 1) { const a = R(1,9)*10, b = R(2,9)*10; q = b+' 的 '+a+'% = ?'; r = b*a/100; tag = '百分数应用'; }
    else if (lv === 2) { const a = R(2,6), b = R(2,6), c = a*R(2,5); q = a+' : '+b+' = '+c+' : ?'; r = b*c/a; tag = '比例'; }
    else if (lv === 3) { const p = R(2,9)*50; q = '原价 '+p+' 元的商品打八折，现价多少元？'; r = p*0.8; step = 5; tag = '折扣问题'; }
    else { const r0 = R(2,9), h = R(2,9); q = '底面半径 '+r0+'、高 '+h+' 的圆柱体积是 π 的多少倍？'; r = r0*r0*h; tag = '圆柱体积'; }
  }
  const ws = wrongs(r, step);
  const opts = shuffle([fmt(r), fmt(ws[0]), fmt(ws[1])]);
  return { q, options:opts, a:opts.indexOf(fmt(r)), kn:mathKn(g, tag, r), subj:'math', lv };
}
function fmt(x){ return String(Math.round(x * 100) / 100); }
function wrongs(r, step){
  step = step || 1;
  const seen = [Math.round(r*1000)/1000], out = [];
  const cands = [r+step, r-step, r+step*2, r-step*2, r+step*5, r-step*5, r+step*10];
  for (const v of cands) {
    if (v < 0) continue;
    const k = Math.round(v*1000)/1000;
    if (seen.indexOf(k) >= 0) continue;
    seen.push(k); out.push(k);
    if (out.length >= 2) break;
  }
  while (out.length < 2) { const k = Math.round((r + step*(3+out.length))*1000)/1000; seen.push(k); out.push(k); }
  return out;
}
/* 把生成题的操作类型对到该年级真实知识点名：
 * 只在「节点名完整包含题目标签」时才采用图谱节点，避免张冠李戴；
 * 否则直接显示题目自身的准确描述（如「20以内加法」） */
function mathKn(g, tag){
  const names = (KG_NAMES[g] || {}).math || [];
  const exact = names.find(n => n === tag);
  if (exact) return exact;
  const contains = names.find(n => n.indexOf(tag) >= 0);
  if (contains) return contains;
  const inside = names.find(n => n.length >= 5 && tag.indexOf(n) >= 0);
  return inside || tag;
}

/* ============ v5 智能出题：单元顺序 + 掌握度复习穿插 + 多题型 ============ */
/* 知识点 -> 学科（从 KG_POINTS 反查，供题卡显示） */
const KID_SUBJ = (function(){
  const m = {}, u = {};
  for (const g in window.KG_POINTS) for (const s in window.KG_POINTS[g])
    window.KG_POINTS[g][s].forEach(p => { m[g + '|' + p.id] = s; u[g + '|' + p.id] = p.unit || ''; });
  KID_UNIT = u;
  return m;
})();
var KID_UNIT;
function kidSubj(kid){ return KID_SUBJ[G.grade + '|' + kid] || 'math'; }
function shortUnit(full){
  return String(full || '').replace(/^[一二三四五六七八九十\d]+年级[上下]册\s*/, '').replace(/^第?\d+单元\s*/, '');
}
/* 统一的学习进度文案：已学(见过题) / 已掌握(答对2次+)，并给出本年级知识点总量 */
function learnProgressText(){
  if (!LEARN) return '';
  const learned = LEARN.learnedCount(G.grade);
  const mastered = LEARN.masteredCount(G.grade);
  const pts = window.KG_POINTS[G.grade] || {};
  const total = Object.keys(pts).reduce((s, k) => s + pts[k].length, 0);
  return `已学 ${learned} / 已掌握 ${mastered} 个知识点（共 ${total}）`;
}

/* 取本关下一个知识点：主线队列优先；队列空则按单元顺序补充 */
function nextTeachKid(){
  while (G.kidPtr < G.kidQueue.length) {
    const kid = G.kidQueue[G.kidPtr++];
    if (LEARN.questionsFor(G.grade, kid).length) return kid;
  }
  return null;
}
/* 单元顺序的下一个知识点（跨单元推进，用于无限模式主线） */
let _seqCache = null;
function sequentialKid(skip){
  if (!_seqCache || _seqCache.grade !== G.grade) {
    const kids = [];
    (G.stages || []).forEach(st => st.kids.forEach(k => kids.push(k)));
    _seqCache = { grade:G.grade, kids:kids, i:0 };
  }
  const kk = _seqCache.kids;
  for (let n = 0; n < kk.length; n++) {
    _seqCache.i = (_seqCache.i + 1) % kk.length;
    const kid = kk[_seqCache.i];
    if (kid !== skip && LEARN.questionsFor(G.grade, kid).length) return kid;
  }
  return null;
}

function pickQuestion(){
  const lv = LEVELS[G.level] || LEVELS[0];
  let q = null, kid = null, isReview = false;

  /* v6 诊断：优先出「定向题」——答错后的确认题 / 回溯的根知识题 */
  if (G.diagNext && window.DIAG) {
    const d = G.diagNext; G.diagNext = null;
    const dkid = d.kid;
    if (dkid) {
      /* 跨年级先修：若目标知识点在别的年级分片，先确保加载后再出题 */
      const dp = window.DIAG.pointOf(dkid);
      const needLoad = dp && dp.grade && dp.grade !== G.grade && !window.KG_LOADED[dp.grade];
      const doPick = () => {
        let dq = null;
        if (d.kind === 'confirm') dq = window.DIAG.softerQuestion(dkid);
        if (!dq) dq = LEARN.pickFromKid(dp && dp.grade ? dp.grade : G.grade, dkid, {}, 0);
        if (!dq) dq = LEARN.pickFromKid(G.grade, dkid, {}, 0);
        if (dq) {
          q = LEARN.cloneQ ? LEARN.cloneQ(dq) : dq;
          if (q.tp === 'choice' && q.o && q.o.length) q.a = q.a || 0;
          q.isDiag = true; q.diagKind = d.kind; q.kid = dkid;
          q.kn = (dp && dp.n) || q.kn;
        }
        finishPick(q, dkid, true, dp && dp.subj);
      };
      if (needLoad) {
        $('battleLog').textContent = '🔍 正在调取前置知识点题目…';
        window.DIAG.ensureGradeLoaded(dp.grade, doPick);
        return;
      }
      doPick();
      return;
    }
  }

  if (G.mode === 'endless') {
    /* 无限模式：每 4 题穿插 1 道复习（错得多/掌握低/到期的优先） */
    G.reviewStreak++;
    const wantReview = (G.reviewStreak % 4 === 0);
    if (wantReview) {
      kid = LEARN.reviewPick(G.grade, G.currentQ ? G.currentQ.kid : null);
      if (kid) isReview = true;
    }
    if (!kid) kid = nextTeachKid() || sequentialKid(G.currentQ ? G.currentQ.kid : null);
    if (kid) q = LEARN.pickFromKid(G.grade, kid, G.usedTexts, lv.lv);
  } else {
    /* 单元闯关：严格按本单元知识点顺序 */
    kid = nextTeachKid();
    if (kid) q = LEARN.pickFromKid(G.grade, kid, G.usedTexts, lv.lv);
    if (!q) q = fallbackQuestion(lv);   // 单元学完/无题兜底
  }

  finishPick(q, kid, isReview);
}

/* 统一收尾：把选好的题装进 G 并渲染（诊断题与正常题共用） */
function finishPick(q, kid, isReview, subjOverride){
  const lv = LEVELS[G.level] || LEVELS[0];
  if (!q) q = fallbackQuestion(lv);
  const subj = subjOverride || (q.kid ? kidSubj(q.kid) : 'math');
  q.subj = subj;
  q.isReview = isReview;
  G.currentQ = q;
  /* 统一转换为引擎题型字段：choice 用 o/a；fill/short 用 ans */
  G.currentOpts = (q.tp === 'choice') ? q.o : [];
  G.currentAnswer = q.a;
  G.usedThisQ = [];
  G.answered = false;
  G.questionNo++;
  G.usedTexts[q.q] = 1;
  G.pickedLog = G.pickedLog || [];
  G.pickedLog.push((q.isDiag ? '诊断|' : isReview ? '复习|' : '新学|') + subj + '|' + (q.kn || q.kid || '生成') + '|' + q.q);
  renderQuestion();
  /* 知识点推进后刷新顶部单元名 / 关卡进度点（currentUnitName 会据当前 kid 更新 stageIdx） */
  if ($('battleView') && !$('battleView').classList.contains('hidden')) updateHUD();
}

/* 兜底：题目用尽时现场生成数学题（保证永不卡住） */
function fallbackQuestion(lv){
  const mlv = clamp((lv ? lv.lv : 1) + rand(2) - 1, 0, 4);
  for (let t = 0; t < 8; t++) {
    const q = genMath(G.grade, mlv);
    if (!G.usedTexts[q.q]) {
      q.tp = 'choice'; q.kid = ''; q.o = q.options; q.ans = q.options[q.a];
      return q;
    }
  }
  const q = genMath(G.grade, 0);
  q.tp = 'choice'; q.kid = ''; q.o = q.options; q.ans = q.options[q.a];
  return q;
}

/* ============================================================
 * 4. 选年级 / 组队
 * ============================================================ */
function renderGrades(){
  const row = $('gradeRow'); row.innerHTML = '';
  GRADES.forEach(g => {
    const b = document.createElement('button');
    b.className = 'grade-pill' + (G.grade === g.id ? ' on' : '');
    b.textContent = g.name;
    b.dataset.g = g.id;
    b.addEventListener('click', () => {
      SND.tap();
      const apply = () => {
        G.grade = g.id;
        try { localStorage.setItem('beast.battle.grade', g.id); } catch(e){}
        toArr(row.children).forEach(c => c.classList.toggle('on', c.dataset.g === g.id));
        renderGradeInfo();
      };
      /* 分片版：script 标签按需加载该年级题库，加载完再渲染 */
      if (window.KG_API && window.KG_API.loaded(g.id)) { apply(); return; }
      $('gradeInfo').innerHTML = '<b style="color:#ffd777">正在加载 ' + g.name + ' 题库…</b>';
      window.KG_API.load(g.id, (ok) => {
        if (ok) apply();
        else $('gradeInfo').innerHTML = '<b style="color:#ff9db1">题库加载失败，请检查网络后重试</b>';
      });
    });
    row.appendChild(b);
  });
  renderGradeInfo();
}
function renderGradeInfo(){
  const g = GRADES.find(x => x.id === G.grade) || GRADES[0];
  const pts = window.KG_POINTS[G.grade] || {};
  const subjNames = Object.keys(pts).map(k => (SUBJ_META[k] || {}).name || k);
  const total = Object.keys(pts).reduce((s, k) => s + pts[k].length, 0);
  const bank = KG_BANK[G.grade] || {};
  const qn = Object.keys(bank).reduce((s, k) => s + bank[k].length, 0);
  const stages = LEARN ? LEARN.stages(G.grade).length : 0;
  const dataVer = (window.KG_META && window.KG_META.updated) ? ' · 题库 ' + window.KG_META.updated : '';
  $('gradeInfo').innerHTML = `${g.name}（${g.stage}）· 图谱 <b>${total}</b> 知识点 · <b>${qn}</b> 道题 · <b>${stages}</b> 个单元关卡<br><span class="gi-subj">${subjNames.join(' / ')}${dataVer}</span>`;
  /* 切年级后重建关卡缓存 + 关卡表（一个单元一关） */
  G.stages = LEARN ? LEARN.stages(G.grade) : [];
  LEVELS = buildLevels(G.grade);
  _seqCache = null;
}
function renderPets(){
  const grid = $('petGrid'); grid.innerHTML = '';
  PETS.forEach(p => {
    const idx = G.team.findIndex(t => t.pet.id === p.id);
    const card = document.createElement('div');
    card.className = 'pet-card' + (idx >= 0 ? ' sel' : '');
    card.dataset.id = p.id;
    const el = ELEMENTS[p.elem];
    card.innerHTML =
      (idx >= 0 ? `<div class="order-tag">${idx + 1}</div>` : '') +
      `<div class="pemoji">${p.emoji}</div>
       <div class="pname">${p.name}</div>
       <div class="prar" style="background:${RAR_COLOR[p.rar]}22;color:${RAR_COLOR[p.rar]};border:1px solid ${RAR_COLOR[p.rar]}">${p.rar}</div>
       <div class="elem-mini" style="color:${el.color}">${el.icon} ${el.name}</div>
       <div class="pskill">${p.skill}</div>`;
    card.addEventListener('click', () => togglePet(p));
    grid.appendChild(card);
  });
}
function togglePet(p){
  const i = G.team.findIndex(t => t.pet.id === p.id);
  if (i >= 0) G.team.splice(i, 1);
  else if (G.team.length < 3) G.team.push({ pet:p, hp:100, maxHp:100 });
  else { SND.tap(); $('startBtn').textContent = '最多 3 只 · 点已选的可以取消'; return; }
  SND.tap();
  renderPets(); renderTeamPreview();
  syncStartBtns();
}
function syncStartBtns(){
  const ready = G.team.length === 3;
  const btn = $('startBtn');
  if (btn) {
    btn.disabled = !ready;
    btn.textContent = ready ? `带 ${G.team.map(t => t.pet.emoji).join('')} 出发！` : `再选 ${3 - G.team.length} 只宠物出发`;
  }
  const eb = $('endlessBtn2'); if (eb) eb.disabled = !ready;
}
function renderTeamPreview(){
  const bar = $('teamBar'); bar.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    const t = G.team[i];
    const d = document.createElement('div');
    if (t) {
      const el = ELEMENTS[t.pet.elem];
      d.className = 'team-slot filled';
      d.innerHTML = `<span class="semoji">${t.pet.emoji}</span><span>${t.pet.name}<br><span class="elem-mini" style="color:${el.color}">${el.icon}${el.name}</span></span>`;
    } else {
      d.className = 'team-slot';
      d.textContent = `空位 ${i + 1}`;
    }
    bar.appendChild(d);
  }
  // 四关敌人属性 + 队伍是否带克制
  const els = G.team.map(t => t.pet.elem);
  const parts = LEVELS.map(L => {
    const el = ELEMENTS[L.elem];
    const ok = els.some(e => ELEM_ADV[e] === L.elem);
    return `<span class="${ok ? 'ok' : 'no'}">${el.icon}${el.name}${ok ? '✓' : '×'}</span>`;
  });
  const left = 3 - G.team.length;
  const tip = left > 0
    ? `<b style="color:#ffd98a">还差 ${left} 只</b> · 点上面的宠物卡片加入队伍`
    : '队伍已满 · 点已选的可以取消';
  $('rosterHint').innerHTML = `远征路线：${parts.join(' → ')}<br>${tip} · <span style="opacity:.7">✓ = 队里有克制它的宠物</span>`;
}

/* ============================================================
 * 5. 战斗界面
 * ============================================================ */
function activeT(){ return G.team[G.active]; }
function elemMult(atk, def){
  if (ELEM_ADV[atk] === def) return ELEM_ADV_MULT;
  if (ELEM_ADV[def] === atk) return ELEM_WEAK_MULT;
  return 1;
}
function advTag(petElem, enemyElem){
  if (ELEM_ADV[petElem] === enemyElem) return '▲';
  if (ELEM_ADV[enemyElem] === petElem) return '▼';
  return '';
}
function renderQuestion(){
  const q = G.currentQ, cfg = LEVELS[G.level] || LEVELS[0];
  const meta = SUBJ_META[q.subj] || SUBJ_META.math;
  const tpName = q.tp === 'fill' ? '填空' : q.tp === 'short' ? '简答' : '选择';
  $('qSubj').textContent = `${meta.icon} ${meta.name}`;
  let knTxt = q.isReview ? '🔁 复习旧知识' : (q.kn ? '知识点 · ' + q.kn : '知识点');
  $('qKn').textContent = knTxt + ' · ' + tpName + '题';
  const master = q.kid ? LEARN.get(G.grade, q.kid) : null;
  $('qProgress').textContent = (G.mode === 'endless' ? '∞ 第 ' + G.questionNo + ' 题' : ('第 ' + G.questionNo + ' 题')) +
    (master && master.seen ? ' · 见过' + master.seen + '次' : '');
  $('qText').textContent = q.q;
  const box = $('qOptions'); box.innerHTML = '';
  G.answered = false;

  if (q.tp === 'choice') {
    /* 选择题：选项按钮（2-4 个自适应） */
    box.className = 'q-opts';
    G.currentOpts.forEach((txt, i) => {
      const b = document.createElement('button');
      b.className = 'opt';
      b.textContent = txt;
      b.dataset.i = i;
      b.addEventListener('click', () => submitChoice(i, b));
      box.appendChild(b);
    });
  } else {
    /* 填空 / 简答：输入框 + 提交 */
    box.className = 'q-input-wrap';
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.id = 'qInput';
    inp.className = 'q-input';
    inp.autocomplete = 'off';
    inp.placeholder = q.tp === 'fill' ? '输入答案（数字或文字）' : '写下你的想法';
    const hint = document.createElement('div');
    hint.className = 'q-hint';
    hint.textContent = q.tp === 'fill' ? '小提示：数字填空可以用小数或分数形式' : '简答写完点提交，再对照参考答案自评';
    const sub = document.createElement('button');
    sub.className = 'q-submit';
    sub.id = 'qSubmit';
    sub.textContent = '提交答案';
    sub.addEventListener('click', submitText);
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') submitText(); });
    box.appendChild(inp); box.appendChild(hint); box.appendChild(sub);
    setTimeout(() => { try { inp.focus(); } catch(e){} }, 60);
  }
  updateNoteBtn();
}
/* 选择题提交 */
function submitChoice(i, btn){ if (G.answered) return; answerQuestion(i === G.currentAnswer, btn); }
/* 填空/简答提交：引擎判定，简答未精确匹配则进入自评 */
function submitText(){
  if (G.answered) return;
  const inp = $('qInput'); if (!inp) return;
  const val = inp.value || '';
  if (!LEARN.normalize(val)) { inp.classList.add('shake'); setTimeout(()=>inp.classList.remove('shake'), 400); return; }
  const q = G.currentQ;
  const verdict = LEARN.judge(q, val);
  G.answered = true;
  toArr($('qOptions').children).forEach(el => { if (el.classList) el.style.pointerEvents = 'none'; });
  inp.disabled = true;
  const sub = $('qSubmit'); if (sub) sub.disabled = true;
  if (verdict === null) {
    /* 简答：显示参考答案，让孩子自评 */
    showSelfGrade(val);
  } else {
    answerQuestion(verdict ? 1 : 0, null, val);
  }
}
/* 简答题自评弹层 */
function showSelfGrade(val){
  const q = G.currentQ;
  const box = $('qOptions');
  box.insertAdjacentHTML('beforeend',
    '<div class="self-grade"><p>参考答案：<b>' + escHtml(q.ans) + '</b></p>' +
    (q.exp ? '<p class="self-exp">' + escHtml(q.exp) + '</p>' : '') +
    '<p>你觉得自己答对了吗？</p>' +
    '<button class="self-btn yes" id="selfYes">✓ 我答对了</button>' +
    '<button class="self-btn no" id="selfNo">✗ 还差点</button></div>');
  $('selfYes').addEventListener('click', () => { const b=$('selfYes'); if(b)b.remove(); const n=$('selfNo'); if(n)n.remove(); answerQuestion(1, null, val); });
  $('selfNo').addEventListener('click', () => { const b=$('selfNo'); if(b)b.remove(); const y=$('selfYes'); if(y)y.remove(); answerQuestion(0, null, val); });
}
function escHtml(s){ return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function updateNoteBtn(){
  const b = $('noteBtn');
  b.textContent = `📓 米娅的笔记 ×${G.notes}`;
  b.disabled = G.notes <= 0;
}
function updateHUD(){
  const cfg = LEVELS[G.level] || LEVELS[0], t = activeT();
  const gname = (GRADES.find(x => x.id === G.grade) || {}).name || '';
  const modeTag = G.mode === 'endless' ? '♾️无限' : ('第' + (G.level + 1) + '关');
  const unit = currentUnitName();
  $('chapter').textContent = `${gname} · ${modeTag}${unit ? ' · ' + unit : ''}`;
  $('enemyName').textContent = cfg.enemy;
  $('enemyEmoji').textContent = cfg.emoji;
  const ee = ELEMENTS[cfg.elem];
  $('enemyElem').innerHTML = `<span class="elem-chip" style="color:${ee.color}">${ee.icon} ${ee.name}</span>`;
  $('enemyElem').style.color = ee.color;
  const ep = clamp(G.enemyHp / G.enemyMax * 100, 0, 100);
  $('enemyHpFill').style.width = ep + '%';
  $('enemyHpTxt').textContent = `${Math.max(0, Math.ceil(G.enemyHp))}/${G.enemyMax}`;
  if (t) {
    const pp = clamp(t.hp / t.maxHp * 100, 0, 100);
    $('playerHpFill').style.width = pp + '%';
    $('playerHpTxt').textContent = `${Math.max(0, Math.ceil(t.hp))}/${t.maxHp}`;
    const pe = ELEMENTS[t.pet.elem];
    const at = advTag(t.pet.elem, cfg.elem);
    $('playerName').innerHTML = `${t.pet.name}` +
      `<small style="background:${RAR_COLOR[t.pet.rar]}22;color:${RAR_COLOR[t.pet.rar]}">${t.pet.rar}</small>` +
      `<span class="elem-mini" style="color:${pe.color};margin-left:4px">${pe.icon}${pe.name}${at ? ' ' + at : ''}</span>`;
    $('playerEmoji').textContent = t.pet.emoji;
  }
  const cb = $('combo');
  if (G.combo >= 2) {
    cb.classList.remove('hidden');
    $('comboNum').textContent = G.combo;
    cb.style.color = G.combo >= 5 ? '#ff7a4d' : G.combo >= 3 ? '#f5b301' : '#fff';
  } else cb.classList.add('hidden');
  const bp = $('bossPhase');
  if (cfg.boss) { bp.classList.remove('hidden'); bp.textContent = `第 ${G.bossPhase} / 3 阶段`; }
  else bp.classList.add('hidden');
  syncTeamRow();
  renderArena(cfg, t);
}
/* 战场中部：关卡进度点（关卡多时只显示当前附近一段）+ 当前属性关系（克制/被克/平） */
function renderArena(cfg, t){
  const dots = $('lvDots');
  dots.innerHTML = '';
  const total = LEVELS.length;
  const MAXDOTS = 9;
  let s = 0, e = total;
  if (total > MAXDOTS) {
    s = clamp(G.level - 4, 0, total - MAXDOTS);
    e = s + MAXDOTS;
  }
  for (let i = s; i < e; i++) {
    const d = document.createElement('div');
    d.className = 'lv-dot' + (i < G.level ? ' done' : i === G.level ? ' now' : '');
    dots.appendChild(d);
  }
  /* 关卡多时标注进度，让孩子知道走到第几站 */
  let lbl = $('lvDotsLabel');
  if (!lbl) { lbl = document.createElement('span'); lbl.id = 'lvDotsLabel'; lbl.className = 'lv-dots-label'; dots.parentNode.insertBefore(lbl, dots.nextSibling); }
  lbl.textContent = G.mode === 'endless' ? '♾️ 无限远征' : ('第 ' + (G.level + 1) + ' / ' + total + ' 关');
  if (!t) { $('elemHint').textContent = ''; return; }
  const pe = ELEMENTS[t.pet.elem], ee = ELEMENTS[cfg.elem];
  const m = elemMult(t.pet.elem, cfg.elem);
  let txt, cls;
  if (m > 1.2) { txt = `属性克制 · 伤害 ×${ELEM_ADV_MULT}`; cls = 'adv'; }
  else if (m < 0.9) { txt = `被克制 · 伤害只有 ×${ELEM_WEAK_MULT}，换只宠物试试`; cls = 'weak'; }
  else { txt = '平属性 · 正常伤害'; cls = 'even'; }
  $('elemHint').innerHTML =
    `<span style="color:${pe.color}">${pe.icon}${pe.name}</span> 打 ` +
    `<span style="color:${ee.color}">${ee.icon}${ee.name}</span> → <b class="${cls}">${txt}</b>`;
}
function buildTeamRow(){
  const row = $('teamRow'); row.innerHTML = '';
  G.team.forEach((t, i) => {
    const b = document.createElement('button');
    b.className = 'tm-btn';
    b.dataset.i = i;
    b.innerHTML = `<span class="temoji">${t.pet.emoji}</span>
      <span class="tmeta"><span class="tname">${t.pet.name}</span><span class="thp"><i></i></span></span>
      <span class="tadv"></span>`;
    b.addEventListener('click', () => switchPet(i));
    row.appendChild(b);
  });
  syncTeamRow();
}
function syncTeamRow(){
  const cfg = LEVELS[G.level];
  toArr($('teamRow').children).forEach((b, i) => {
    const t = G.team[i]; if (!t) return;
    b.classList.toggle('active', i === G.active);
    b.classList.toggle('down', t.hp <= 0);
    b.querySelector('.thp i').style.width = clamp(t.hp / t.maxHp * 100, 0, 100) + '%';
    const adv = advTag(t.pet.elem, cfg.elem);
    b.querySelector('.tadv').textContent = t.hp > 0 ? adv : '';
  });
}

/* ============================================================
 * 6. 裁决
 * ============================================================ */
function floatDmg(text, kind, nearEnemy){
  const d = document.createElement('div');
  d.className = 'dmg ' + kind;
  d.textContent = text;
  const r = (nearEnemy ? $('enemyEmoji') : $('playerEmoji')).getBoundingClientRect();
  const s = $('stage').getBoundingClientRect();
  d.style.left = (r.left - s.left + r.width / 2 - 22) + 'px';
  d.style.top = (r.top - s.top + 8) + 'px';
  $('stage').appendChild(d);
  setTimeout(() => d.remove(), 1000);
}
function bigVerdict(text, cls){
  const d = document.createElement('div');
  d.className = 'verdict ' + cls;
  d.textContent = text;
  d.style.top = (FH * 0.545) + 'px';   // 落在换宠条与题卡之间，不压住血条、日志和头像条
  $('stage').appendChild(d);
  setTimeout(() => d.remove(), 1100);
}
/* v6 诊断提示浮层：显示根因 + 学习路径 */
function showDiagBanner(html, kind){
  const old = document.getElementById('diagBanner'); if (old) old.remove();
  const d = document.createElement('div');
  d.id = 'diagBanner';
  d.className = 'diag-banner ' + (kind || '');
  d.innerHTML = html;
  const stage = $('stage');
  if (stage) stage.appendChild(d);
  setTimeout(() => { if (d.parentNode) { d.style.opacity = '0'; setTimeout(() => d.remove(), 400); } }, 3600);
}
function answerQuestion(correct, btn, userText){
  if (G.lock || G.state !== 'battle') return;
  G.lock = true;
  G.answered = true;
  const q = G.currentQ;
  const cfg = LEVELS[G.level] || LEVELS[0];
  /* 选择题：标记正确项；填空/简答：显示正确答案 */
  if (q && q.tp === 'choice') {
    const opts = toArr($('qOptions').children);
    opts.forEach((b, idx) => {
      b.style.pointerEvents = 'none';
      if (idx === G.currentAnswer) b.classList.add('right');
    });
  }
  /* v5：记录掌握度（答对降频、答错升频、间隔复习） */
  let master = null;
  if (q && q.kid && LEARN) {
    LEARN.record(G.grade, q.kid, correct);
    master = LEARN.get(G.grade, q.kid);
  }
  /* v6 诊断：答错追根——决定下一题出确认题还是回溯根知识题 */
  if (q && q.kid && G.diagEnabled && window.DIAG) {
    const dec = window.DIAG.onAnswer(q.kid, correct, {
      confirm: !!q.isDiag && q.diagKind === 'confirm',
      isRoot:  !!q.isDiag && q.diagKind === 'root'
    });
    if (dec.action === 'confirm') {
      /* 首错：下一题出更简单的确认题 */
      G.diagNext = { kid: dec.confirmKid || q.kid, kind: 'confirm' };
      G.diagRootInfo = null;
      showDiagBanner('<b>🔍 别急，先做一道更简单的确认题</b><br><span>看看这个知识点是不是真的会了</span>', 'confirm');
    } else if (dec.action === 'weak' && dec.root) {
      /* 确认题也错：判薄弱，回溯到根知识出题 */
      G.diagNext = { kid: dec.root, kind: 'root' };
      G.diagRootInfo = { root: dec.root, path: dec.path || [], kid: q.kid };
      /* 根知识若在其他年级，预加载分片 */
      const rp = window.DIAG.pointOf(dec.root);
      if (rp && rp.grade && rp.grade !== G.grade) window.DIAG.ensureGradeLoaded(rp.grade);
      const rootName = rp ? rp.n : '前置知识';
      const gname = rp ? ((window.GRADES.find(x => x.id === rp.grade) || {}).name) : '';
      showDiagBanner('<b>🎯 找到根因了：可能卡在「' + escHtml(rootName) + '」' + (gname ? '（' + gname + '）' : '') + '</b><br><span>接下来定向检测这个前置知识，先把它补牢</span>', 'weak');
    } else if (dec.action === 'weak' && dec.noMore) {
      /* 已经追到最根层还错：不再回溯，提示回归课本 */
      G.diagNext = null;
      G.diagRootInfo = { root: q.kid, path: [], kid: q.kid, noMore: true };
      showDiagBanner('<b>📘 基础环节需要回到课本巩固</b><br><span>这已是前置链条最起点，建议请老师或家长讲一讲</span>', 'weak');
    } else if (dec.action === 'master') {
      G.diagNext = null;
      G.diagRootInfo = null;
      showDiagBanner('<b>🎉 连续答对，这个知识点掌握牢固了！</b><br><span>已跳过它的前置知识</span>', 'master');
    } else if (dec.action === 'unstable') {
      if (!G.diagRootInfo) G.diagNext = null;
      showDiagBanner('<b>👍 确认题答对了，但还不算牢固</b><br><span>再多练几次就稳了</span>', 'unstable');
    } else if (dec.action === 'continue') {
      if (!G.diagRootInfo) G.diagNext = null;
    }
  }
  if (correct) {
    const t = activeT();
    G.combo++;
    G.maxCombo = Math.max(G.maxCombo, G.combo);
    G.correctCount++;
    G.lvCorrect++;
    G.lvSubj[q ? q.subj : 'math'] = (G.lvSubj[q ? q.subj : 'math'] || 0) + 1;
    const meta = SUBJ_META[q ? q.subj : 'math'] || SUBJ_META.math;
    if (q && q.kn) G.knHit[`${meta.name} · ${q.kn}`] = 1;
    const em = elemMult(t.pet.elem, cfg.elem);
    const comboMult = 1 + 0.25 * Math.min(G.combo - 1, 4);
    const base = 20 + (RAR_BONUS[t.pet.rar] || 0);
    const dmg = Math.max(6, Math.round(base * em * comboMult));
    const isCrit = em > 1.2;
    if (isCrit) { bigVerdict('克制！', 'v-crit'); SND.crit(); VIB.crit(); }
    else if (G.combo >= 3) { bigVerdict(`连击 ×${G.combo}！`, 'v-good'); SND.correct(G.combo); VIB.combo(G.combo); }
    else { bigVerdict('命中！', 'v-good'); SND.correct(G.combo); VIB.right(); }
    /* 静音也能看懂：题卡绿闪 + 轻微弹跳 */
    const qc = $('questionCard');
    if (qc) { qc.classList.remove('qb-right', 'qb-wrong'); void qc.offsetWidth; qc.classList.add('qb-right'); }
    let tip = `${t.pet.skill}！${isCrit ? '属性克制，' : ''}造成 ${dmg} 点伤害${G.combo >= 2 ? `（连击 ×${G.combo}）` : ''}`;
    if (q && q.kid && master) tip += `　掌握度 ${master.s}/6`;
    $('battleLog').textContent = tip;
    enemyCast(dmg, isCrit);
  } else {
    if (btn && btn.classList) btn.classList.add('wrong');
    G.combo = 0;
    G.wrongCount++;
    G.lvWrong++;
    const t = activeT();
    const dmg = cfg.boss ? 20 : 16;
    t.hp = clamp(t.hp - dmg, 0, t.maxHp);
    const rightAns = q ? (q.tp === 'choice' ? (q.o ? q.o[q.a] : G.currentOpts[G.currentAnswer]) : q.ans) : '';
    if (q) G.wrongPool.push({ q:q.q, a:rightAns });
    bigVerdict('再想想～', 'v-bad');
    SND.wrong();
    VIB.wrong();
    /* 静音也能看懂：题卡红抖 */
    const qc = $('questionCard');
    if (qc) { qc.classList.remove('qb-right', 'qb-wrong'); void qc.offsetWidth; qc.classList.add('qb-wrong'); }
    /* 填空/简答立即显示正确答案，帮助学习 */
    let tip = '答错了，' + t.pet.name + '被反击，掉了 ' + dmg + ' 点体力。';
    if (q && q.tp !== 'choice') tip += ' 正确答案：' + escHtml(rightAns);
    if (q && q.kid && master) tip += '　这题会多安排几次复习。';
    $('battleLog').innerHTML = tip;
    enemyAttack(dmg);
  }
  updateHUD();
}
function enemyCast(dmg, crit){
  const pe = $('playerEmoji');
  pe.classList.remove('cast'); void pe.offsetWidth; pe.classList.add('cast');
  setTimeout(() => {
    G.enemyHp = clamp(G.enemyHp - dmg, 0, G.enemyMax);
    const ee = $('enemyEmoji');
    ee.classList.remove('hit'); void ee.offsetWidth; ee.classList.add('hit');
    const r = ee.getBoundingClientRect(), s = $('stage').getBoundingClientRect();
    burst(r.left - s.left + r.width/2, r.top - s.top + r.height/2, crit ? '#7ae0ff' : '#ffd23f', crit ? 28 : 20);
    floatDmg('-' + dmg, crit ? 'crit' : 'good', true);
    flash(crit ? 'rgba(140,220,255,.35)' : 'rgba(255,220,140,.32)');
    SND.hit();
    updateHUD();
    afterHit();
  }, 300);
}
function enemyAttack(dmg){
  setTimeout(() => {
    const ee = $('enemyEmoji');
    ee.classList.remove('grow'); void ee.offsetWidth; ee.classList.add('grow');
    const pe = $('playerEmoji');
    pe.classList.remove('hurt'); void pe.offsetWidth; pe.classList.add('hurt');
    const r = pe.getBoundingClientRect(), s = $('stage').getBoundingClientRect();
    burst(r.left - s.left + r.width/2, r.top - s.top + r.height/2, '#ff8fa8', 14);
    floatDmg('-' + dmg, 'bad', false);
    SND.hurt();
    updateHUD();
    afterHit();
  }, 260);
}
function afterHit(){
  const cfg = LEVELS[G.level];
  /* 敌人倒下 */
  if (G.enemyHp <= 0) {
    if (cfg.boss && G.bossPhase < 3) {
      G.bossPhase++;
      /* 三阶段等量，节奏均匀不拖 */
      G.enemyMax = cfg.hp;
      G.enemyHp = cfg.hp;
      pages(FW/2, FH*0.32, 16);
      flash('rgba(255,230,160,.6)');
      SND.boss(); VIB.boss();
      $('battleLog').textContent = ['', '', '它散成书页，又重新聚起来了——还有两下！', '最后一段了，别放松！'][G.bossPhase] || '它又变了！';
      updateHUD(); G.lock = false; setTimeout(nextQ, 900); return;
    }
    pages(FW/2, FH*0.32, 22);
    flash('rgba(255,230,160,.7)');
    /* 无限模式：敌人打散不弹过关层，自动循环到下一站继续出题 */
    if (G.mode === 'endless') {
      SND.clear(); VIB.clear();
      rollDrops(G.level);
      G.level = (G.level + 1) % LEVELS.length;
      const nc = LEVELS[G.level];
      G.team.forEach(t => { if (t.hp > 0) t.hp = clamp(t.hp + 24, 0, t.maxHp); });
      G.enemyMax = nc.hp; G.enemyHp = nc.hp;
      G.bossPhase = 1; G.combo = 0; G.lvCorrect = 0; G.lvWrong = 0; G.lvSubj = {}; G.runDrops = [];
      G.notes = Math.min(5, G.notes + 1);
      G.state = 'battle'; G.lock = false;
      updateHUD();
      $('battleLog').textContent = `打散一个敌人！♾️ 继续 · ${learnProgressText()}`;
      setTimeout(nextQ, 700);
      return;
    }
    G.state = 'levelClear';
    SND.clear(); VIB.clear();
    rollDrops(G.level);
    const uniq = []; G.runDrops.forEach(d => { if (uniq.indexOf(d) < 0) uniq.push(d); });
    $('clearDrops').innerHTML = uniq.length
      ? '<div class="drop-line">本关战利品：' + uniq.map(k => { const m = dropMeta(k); return '<span class="drop-item">' + m.emoji + ' ' + m.name + '</span>'; }).join('') + '</div>'
      : '';
    $('clearTitle').textContent = cfg.boss ? '知识魔王散成书页了！' : '过关！';
    $('clearSub').textContent = cfg.boss ? '“你们真的学会了。”' : '敌人碎成了书页';
    setTimeout(() => { if (G.state === 'levelClear') $('levelClear').classList.remove('hidden'); }, 420);
    return;
  }
  /* 我方倒下 */
  if (activeT().hp <= 0) {
    SND.faint();
    const down = G.team.map((t, i) => t.hp <= 0 ? i : -1).filter(i => i >= 0);
    if (down.length >= G.team.length) {
      G.state = 'defeat';
      SND.defeat();
      setTimeout(() => { if (G.state === 'defeat') $('defeat').classList.remove('hidden'); }, 400);
      return;
    }
    /* 优先接给「下一只还站着的」宠物，保持队伍轮转 */
    let next = -1;
    for (let k = 1; k <= G.team.length; k++) {
      const j = (G.active + k) % G.team.length;
      if (G.team[j].hp > 0) { next = j; break; }
    }
    G.active = next;
    $('battleLog').textContent = `${G.team[next].pet.name} 接棒上场！继续答题。`;
    updateHUD();
    G.lock = false;
    setTimeout(nextQ, 760);
    return;
  }
  G.lock = false;
  setTimeout(nextQ, 480);
}
function nextQ(){
  if (G.state !== 'battle' || G.lock) return;
  pickQuestion();
}
function switchPet(i){
  if (G.state !== 'battle') return;
  const t = G.team[i];
  if (!t || t.hp <= 0 || i === G.active) return;
  G.active = i;
  SND.swap();
  const el = ELEMENTS[t.pet.elem], ee = ELEMENTS[LEVELS[G.level].elem];
  const at = advTag(t.pet.elem, LEVELS[G.level].elem);
  $('battleLog').textContent = `${t.pet.name} 上场！` +
    (at === '▲' ? `属性克制 ${ee.name}，伤害 ×${ELEM_ADV_MULT}` : at === '▼' ? `被 ${ee.name} 克制，伤害只有 ×${ELEM_WEAK_MULT}` : '平属性，正常伤害');
  updateHUD();
}

/* ============================================================
 * 7. 流程
 * ============================================================ */
/* 把当前单元起始、后续单元的知识点按单元顺序铺入出题队列 */
function buildKidQueue(fromStage){
  const stages = G.stages || (G.stages = LEARN.stages(G.grade));
  if (!stages.length) return;
  G.stageIdx = clamp(fromStage | 0, 0, stages.length - 1);
  const q = [];
  for (let i = G.stageIdx; i < stages.length; i++) stages[i].kids.forEach(k => q.push(k));
  G.kidQueue = q; G.kidPtr = 0;
  _seqCache = null;
}
/* 当前所处单元名（题卡/战斗页展示，让孩子知道学到哪一课）
 * 优先按「当前题目所属知识点」实时定位单元，保证知识点推进时单元名跟着变。 */
function currentUnitName(){
  const stages = G.stages || [];
  if (!stages.length) return '';
  let idx = clamp(G.stageIdx | 0, 0, stages.length - 1);
  const kid = G.currentQ && G.currentQ.kid;
  if (kid) {
    for (let i = 0; i < stages.length; i++) {
      if (stages[i].kids.indexOf(kid) >= 0) { idx = i; G.stageIdx = i; break; }
    }
  }
  const st = stages[idx];
  if (!st) return '';
  const subjName = (SUBJ_META[st.subj] || {}).name || st.subj;
  const unit = shortUnit(st.unit) || st.unit;
  return subjName + ' · ' + unit;
}
function startGame(mode){
  if (G.team.length !== 3) return;
  G.mode = mode || 'story';
  G.team.forEach(t => { t.hp = t.maxHp; });
  G.state = 'battle';
  G.level = G.mode === 'story' ? clamp(G.chosenLevel | 0, 0, LEVELS.length - 1) : 0;
  G.bossPhase = 1;
  G.combo = 0; G.maxCombo = 0; G.correctCount = 0; G.wrongCount = 0;
  G.lvCorrect = 0; G.lvWrong = 0; G.lvSubj = {}; G.runDrops = [];
  if (G.chosenLevel === 0 || G.mode === 'endless') G.sessionDrops = [];
  G.questionNo = 0; G.notes = G.mode === 'endless' ? 3 : 2;
  G.bags = {}; G.usedQ = new Set(); G.pickedLog = []; G.wrongPool = []; G.knHit = {};
  G.usedTexts = {}; G.reviewStreak = 0; G.answered = false;
  G.active = 0; G.lock = false; G.startTime = performance.now();
  particles = []; flashes = [];
  /* story：从当前关卡对应的单元开始学；endless：从第一单元开始顺序推进 */
  const startStage = G.mode === 'story' ? (LEVELS[G.level] && LEVELS[G.level].stageIdx) || 0 : 0;
  buildKidQueue(startStage);
  const cfg = LEVELS[G.level];
  G.enemyMax = cfg.hp; G.enemyHp = cfg.hp;
  $('selectView').classList.add('hidden');
  $('mapView').classList.add('hidden');
  $('resultView').classList.add('hidden');
  $('defeat').classList.add('hidden');
  $('levelClear').classList.add('hidden');
  $('battleView').classList.remove('hidden');
  buildTeamRow();
  updateHUD();
  const gname = (GRADES.find(x => x.id === G.grade) || {}).name || '';
  const intro = G.mode === 'endless'
    ? '♾️ 无限远征：知识源源不断，答对就出招，错了会多安排复习！'
    : `${cfg.enemy}（${ELEMENTS[cfg.elem].name}）挡在前面，答对题目让宠物出招！`;
  $('battleLog').textContent = intro;
  nextQ();
  SND.tap();
  BGM.setTheme('battle');
}
function goNextLevel(){
  $('levelClear').classList.add('hidden');
  markCleared(G.level);
  G.chosenLevel = G.level + 1;
  G.level++;
  if (G.mode === 'endless') {
    /* 无限模式：8 个据点循环，永不结算 */
    G.level = G.level % LEVELS.length;
    const c = LEVELS[G.level];
    G.team.forEach(t => { if (t.hp > 0) t.hp = clamp(t.hp + 22, 0, t.maxHp); });
    G.enemyMax = c.hp; G.enemyHp = c.hp;
    G.bossPhase = 1; G.combo = 0; G.lvCorrect = 0; G.lvWrong = 0; G.lvSubj = {}; G.runDrops = [];
    G.notes = Math.min(5, G.notes + 1);
    G.state = 'battle'; G.lock = false;
    updateHUD();
    $('battleLog').textContent = `♾️ 第 ${G.questionNo + 1} 题继续！${learnProgressText()}`;
    SND.tap(); nextQ(); return;
  }
  if (G.level >= LEVELS.length) { showResult(); return; }
  const cfg = LEVELS[G.level];
  G.team.forEach(t => { if (t.hp > 0) t.hp = clamp(t.hp + 18, 0, t.maxHp); });
  G.enemyMax = cfg.hp; G.enemyHp = cfg.hp;
  G.bossPhase = 1; G.combo = 0; G.lvCorrect = 0; G.lvWrong = 0; G.lvSubj = {}; G.runDrops = [];
  G.notes = Math.min(3, G.notes + 1);
  G.state = 'battle'; G.lock = false;
  updateHUD();
  const hasCounter = G.team.some(t => t.hp > 0 && ELEM_ADV[t.pet.elem] === cfg.elem);
  $('battleLog').textContent = cfg.boss
    ? '最终关：知识魔王（暗）！答对削它，答错它反击。'
    : `${cfg.enemy} 是 ${ELEMENTS[cfg.elem].name} 属性` + (hasCounter ? '，换克制的宠物上场伤害更高！' : '，队伍里没有克制它的属性，靠连击硬打！');
  if (cfg.boss) { SND.boss(); VIB.boss(); }
  nextQ();
}
function enterMap(){
  G.state = 'map';
  $('selectView').classList.add('hidden');
  $('battleView').classList.add('hidden');
  $('resultView').classList.add('hidden');
  $('levelClear').classList.add('hidden');
  $('mapView').classList.remove('hidden');
  $('chapter').textContent = '远征地图 · ' + ((GRADES.find(g => g.id === G.grade) || {}).name || '');
  renderMap();
  BGM.setTheme('map');
  SND.tap();
}
function renderMap(){
  const wrap = $('mapPath'); wrap.innerHTML = '';
  const prog = loadProgress()[G.grade] || 0;
  const stars = loadStars()[G.grade] || {};
  LEVELS.forEach((L, i) => {
    const st = nodeState(i);
    const b = document.createElement('button');
    b.className = 'map-node ' + st + (i % 2 ? ' right' : ' left') + (L.boss ? ' boss' : '');
    const el = ELEMENTS[L.elem];
    b.innerHTML =
      '<span class="mn-seq">' + (i + 1) + '</span>' +
      '<span class="mn-face">' + (st === 'locked' ? '🔒' : L.emoji) + '</span>' +
      '<span class="mn-info"><b>' + L.name + '</b>' +
      '<span class="mn-element" style="color:' + el.color + '">' + el.icon + el.name + '</span>' +
      '<span class="mn-stars">' + (st === 'cleared' ? '★'.repeat(stars[i] || 1) + '☆'.repeat(3 - (stars[i] || 1)) : st === 'current' ? '▶ 可挑战' : '未解锁') + '</span></span>';
    b.addEventListener('click', () => {
      SND.tap();
      if (st === 'locked'){ $('mapTip').textContent = '先通过前面的关卡，才能解锁这里。'; return; }
      beginLevel(i);
    });
    wrap.appendChild(b);
  });
  const unitCnt = (G.stages || []).length;
  $('mapSub').textContent = '按单元顺序学 · 已通关 ' + Math.min(prog, LEVELS.length) + ' / ' + LEVELS.length + ' 关' + (unitCnt ? '（' + unitCnt + ' 个知识单元）' : '');
  $('mapTip').textContent = prog >= LEVELS.length ? '🏆 全部单元通关！点「无限远征」继续复习全部知识点。' : '点亮金色据点开始挑战';
  $('bagCount').textContent = Object.keys(G.bag).reduce((a, k) => a + G.bag[k], 0);
  /* 学习进度条 */
  const st = LEARN.stats(G.grade);
  const totalPts = window.KG_META ? window.KG_META.points : 0;
  if ($('learnStats')) {
    const ptsG = window.KG_POINTS[G.grade] || {};
    const totalPts = Object.keys(ptsG).reduce((a,k)=>a+ptsG[k].length,0);
    const cover = totalPts ? Math.min(100, Math.round(st.learned / totalPts * 100)) : 0;
    $('learnStats').innerHTML =
      `<div class="ls-title">📊 ${((GRADES.find(g=>g.id===G.grade)||{}).name||'')} 学习进度</div>` +
      `<div class="ls-row"><span>本年级知识点</span><b>${totalPts}</b></div>` +
      `<div class="ls-row"><span>已学过（覆盖率）</span><b>${st.learned} <small style="color:#ffe0a0">${cover}%</small></b></div>` +
      `<div class="ls-row"><span>已掌握 / 牢固掌握</span><b>${st.mastered} / ${st.solid}</b></div>` +
      `<div class="ls-row"><span>累计答对 / 答错</span><b class="ok">${st.ok}</b> / <b class="no">${st.no}</b></div>` +
      `<div class="ls-bar"><i style="width:${cover}%"></i></div>` +
      `<p class="ls-hint">覆盖率＝见过的知识点占比；答对越多掌握度越高、出现越少，错得多的会更频繁地回来找你。</p>`;
  }
}
function beginLevel(i){ G.chosenLevel = clamp(i, 0, LEVELS.length - 1); startGame('story'); }
function startEndless(){ G.chosenLevel = 0; startGame('endless'); }
function afterClearToMap(){
  $('levelClear').classList.add('hidden');
  markCleared(G.level);
  G.chosenLevel = G.level + 1;
  if (G.level >= LEVELS.length - 1){ showResult(); return; }
  enterMap();
}
function showBag(){
  const list = $('bagList'); list.innerHTML = '';
  const groups = { shard:'📚 学科碎片', crystal:'💎 属性晶石', badge:'🏅 荣誉徽章' };
  let any = false;
  Object.keys(groups).forEach(tp => {
    const items = Object.keys(G.bag).filter(k => dropMeta(k).type === tp && G.bag[k] > 0);
    if (!items.length) return;
    any = true;
    const sec = document.createElement('div'); sec.className = 'bag-group';
    sec.innerHTML = '<h4>' + groups[tp] + '</h4>' + items.map(k => {
      const m = dropMeta(k);
      return '<span class="bag-item">' + m.emoji + ' ' + m.name + ' <b>×' + G.bag[k] + '</b></span>';
    }).join('');
    list.appendChild(sec);
  });
  if (!any) list.innerHTML = '<p class="bag-empty">背包还是空的，去闯关收集战利品吧！</p>';
  $('bagView').classList.remove('hidden');
  SND.tap();
}
function showResult(){
  G.state = 'result';
  $('chapter').textContent = '远征完成';
  $('battleView').classList.add('hidden');
  $('mapView').classList.add('hidden');
  $('resultView').classList.remove('hidden');
  markCleared(G.level);
  const sec = Math.max(0, Math.round((performance.now() - G.startTime) / 1000));
  const total = G.correctCount + G.wrongCount;
  const acc = total ? Math.round(G.correctCount / total * 100) : 0;
  $('resStats').innerHTML =
    `用时 <b>${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}</b><br>` +
    `答对 <b>${G.correctCount}</b> 题 · 答错 ${G.wrongCount} 题<br>` +
    `正确率 <b>${acc}%</b> · 最高连击 <b>${G.maxCombo}</b><br>` +
    `年级 <b>${(GRADES.find(g => g.id === G.grade) || {}).name || ''}</b> · 队伍 ${G.team.map(t => t.pet.emoji).join('')}`;
  const dcount = {};
  (G.sessionDrops || []).forEach(k => { dcount[k] = (dcount[k] || 0) + 1; });
  const dkeys = Object.keys(dcount);
  $('resDrops').innerHTML = dkeys.length
    ? '<h3>🎁 本局战利品</h3>' + dkeys.map(k => { const m = dropMeta(k); return '<span class="drop-chip">' + m.emoji + ' ' + m.name + ' ×' + dcount[k] + '</span>'; }).join('')
    : '';
  BGM.setTheme('map');
  const kns = Object.keys(G.knHit);
  $('resKn').innerHTML = kns.length
    ? '<h3>本局点亮的知识点（答对即掌握）</h3>' + kns.slice(0, 14).map(k => `<span class="kn-chip">${k}</span>`).join('')
    : '';
  const uniq = [];
  const seenQ = {};
  G.wrongPool.forEach(x => { if (!seenQ[x.q]) { seenQ[x.q] = 1; uniq.push(x); } });
  $('resWrong').innerHTML = uniq.length
    ? '<h3>这几题值得再看一眼（附正确答案）</h3>' +
      uniq.slice(0, 6).map(x => `· ${x.q}<br><span style="color:#8fe3a8">　 正确答案：${x.a}</span>`).join('<br>')
    : '';
  SND.victory();
}
function retry(){
  $('defeat').classList.add('hidden');
  startGame();
}
function again(){
  $('resultView').classList.add('hidden');
  $('mapView').classList.add('hidden');
  G.team = [];
  G.state = 'select';
  $('selectView').classList.remove('hidden');
  renderPets(); renderTeamPreview(); syncStartBtns();
  SND.tap();
}
function useNote(){
  if (G.state !== 'battle' || G.lock || G.notes <= 0) return;
  if (!G.currentQ || G.currentQ.tp !== 'choice') {
    $('battleLog').textContent = '这题是填空/简答，米娅的笔记帮不上忙，仔细想想再提交～';
    SND.tap(); return;
  }
  const cands = [];
  G.currentOpts.forEach((_, i) => {
    if (i !== G.currentAnswer && !G.usedThisQ.includes(i)) cands.push(i);
  });
  if (!cands.length) return;
  const pick = cands[rand(cands.length)];
  G.usedThisQ.push(pick);
  G.notes--;
  const b = $('qOptions').children[pick];
  if (b) b.classList.add('removed');
  $('battleLog').textContent = '米娅帮你划掉了一个错误答案！';
  SND.tap();
  updateNoteBtn(); updateHUD();
}

/* ============================================================
 * 8. 怎么玩
 * ============================================================ */
function showHowto(force){
  if (!force && LS.get('battle.howto.seen') === '1') return;
  $('howto').classList.remove('hidden');
}
function hideHowto(){
  LS.set('battle.howto.seen', '1');
  $('howto').classList.add('hidden');
}

/* ============================================================
 * 9. 事件绑定
 * ============================================================ */
$('startBtn').addEventListener('click', () => { $('selectView').classList.remove('first-visit'); LS.set('battle.howto.seen', '1'); enterMap(); });
if ($('endlessBtn')) $('endlessBtn').addEventListener('click', () => { SND.tap(); startEndless(); });
if ($('endlessBtn2')) $('endlessBtn2').addEventListener('click', () => { SND.tap(); $('selectView').classList.remove('first-visit'); LS.set('battle.howto.seen', '1'); startEndless(); });
$('nextBtn').addEventListener('click', afterClearToMap);
$('mapBackBtn').addEventListener('click', () => { SND.tap(); G.state = 'select'; $('mapView').classList.add('hidden'); $('selectView').classList.remove('hidden'); BGM.setTheme('map'); });
$('bagBtn').addEventListener('click', showBag);
$('bagClose').addEventListener('click', () => { SND.tap(); $('bagView').classList.add('hidden'); });
$('retryBtn').addEventListener('click', retry);
$('againBtn').addEventListener('click', again);
$('noteBtn').addEventListener('click', useNote);
$('soundBtn').addEventListener('click', () => SND.toggle());
$('helpBtn').addEventListener('click', () => { SND.tap(); showHowto(true); });
$('howtoGo').addEventListener('click', () => { SND.tap(); hideHowto(); });

/* ============================================================
 * 10. 调试接口（QA 用）
 * ============================================================ */
window.__battle = {
  get state(){ return G.state; },
  get grade(){ return G.grade; },
  get team(){ return G.team.map(t => ({ id:t.pet.id, name:t.pet.name, elem:t.pet.elem, hp:t.hp })); },
  get active(){ return G.active; },
  get hp(){ return activeT() ? activeT().hp : 0; },
  get enemyHp(){ return G.enemyHp; },
  get enemyElem(){ return LEVELS[G.level].elem; },
  get combo(){ return G.combo; },
  get level(){ return G.level; },
  get notes(){ return G.notes; },
  get mode(){ return G.mode; },
  get question(){ return G.currentQ ? { q:G.currentQ.q, kn:G.currentQ.kn, subj:G.currentQ.subj, tp:G.currentQ.tp, opts:G.currentOpts, answer:G.currentQ.ans, kid:G.currentQ.kid, isReview:G.currentQ.isReview } : null; },
  get picked(){ return (G.pickedLog || []).slice(); },
  get answer(){ return G.currentAnswer; },
  get mastery(){ return LEARN ? LEARN.stats(G.grade) : null; },
  get stageInfo(){ return { idx:G.stageIdx, name:currentUnitName(), total:(G.stages||[]).length, queued:G.kidQueue.length, ptr:G.kidPtr }; },
  setGrade(g){ const apply=()=>{ G.grade = g; _seqCache = null; renderGrades(); renderGradeInfo(); };
    if (window.KG_API && window.KG_API.loaded(g)) apply();
    else if (window.KG_API) window.KG_API.load(g, apply);
    else apply(); },
  setTeam(ids){ G.team = ids.map(id => { const p = PETS.find(x => x.id === id); return p ? { pet:p, hp:100, maxHp:100 } : null; }).filter(Boolean); renderPets(); renderTeamPreview(); syncStartBtns(); },
  start(){ startGame('story'); },
  startEndless(){ startGame('endless'); },
  correct(){ const q=G.currentQ; if(q&&q.tp==='choice') answerQuestion(true, $('qOptions').children[G.currentAnswer]); else answerQuestion(true, null); },
  wrong(){ const q=G.currentQ; if(q&&q.tp==='choice'){ const i=toArr(Array(G.currentOpts.length).keys()).find(x=>x!==G.currentAnswer); answerQuestion(false, $('qOptions').children[i]); } else answerQuestion(false, null); },
  next(){ goNextLevel(); },
  swap(i){ switchPet(i); },
  restart(){ startGame(); },
  setMute(m){ SND.muted = !!m; LS.set('battle.muted', m ? '1' : '0'); BGM.toggleMute(); },
  get bgm(){ return { theme:BGM.theme, playing:BGM.playing, muted:SND.muted }; },
  get bag(){ return Object.assign({}, G.bag); },
  get diag(){ return { next: G.diagNext, rootInfo: G.diagRootInfo, state: window.DIAG ? window.DIAG.stats() : null }; },
  get drops(){ return (G.runDrops || []).slice(); },
  get sessionDrops(){ return (G.sessionDrops || []).slice(); },
  get map(){ return { progress:loadProgress()[G.grade] || 0, stars:loadStars()[G.grade] || {}, nodes:LEVELS.map((L,i) => nodeState(i)) }; },
  enterMap(){ enterMap(); },
  beginLevel(i){ beginLevel(i); },
  afterClear(){ afterClearToMap(); }
};

/* ============================================================
 * 11. 启动
 * ============================================================ */
function boot(){
  // 数据缺失时给出明确提示，而不是白屏
  if (!Array.isArray(window.BATTLE_PETS) || !window.KG_BANK) {
    throw new Error('知识图谱数据未加载（data/knowledge.js）');
  }
  resize();
  $('soundBtn').textContent = SND.muted ? '🔇' : '🔊';
  $('soundBtn').classList.toggle('off', SND.muted);
  G.bag = loadBag();
  renderGrades();
  renderPets();
  renderTeamPreview();
  requestAnimationFrame(loop);
  /* 首屏不弹全屏教程：直接可组队开玩，让新玩家尽早完成第一次有效操作。
     首次仅让「开始」按钮轻微脉冲提示，完整玩法随时点右上 ? 查看。 */
  if (LS.get('battle.howto.seen') !== '1') {
    $('selectView').classList.add('first-visit');
    setTimeout(() => $('selectView') && $('selectView').classList.remove('first-visit'), 12000);
  }
}
function safeBoot(){
  try {
    boot(); window.__bootOk = true;
    /* 慢网下加载守护定时器可能先于 boot 误报红条，启动成功后清掉 */
    var bar = document.getElementById('__errbar'); if (bar && bar.parentNode) bar.parentNode.removeChild(bar);
    /* v6 诊断：后台预加载全部分片，建立跨年级知识点/题库索引，供答错回溯根知识使用。
       串行加载避免阻塞首屏；失败静默（不影响正常闯关）。 */
    try {
      if (window.KG_API && window.KG_SHARDS && window.DIAG) {
        var gs = Object.keys(window.KG_SHARDS).filter(g => !window.KG_API.loaded(g));
        var i = 0;
        var loadNext = () => {
          if (i >= gs.length) { try { window.DIAG.buildIndex(); } catch (e) {} return; }
          var g = gs[i++];
          window.KG_API.load(g, () => setTimeout(loadNext, 0));
        };
        setTimeout(loadNext, 1500);
      }
    } catch (e) {}
  }
  catch (e) {
    console.error('[启动失败]', e);
    if (window.__errPanel) window.__errPanel(e && e.message ? e.message : String(e));
    else {
      const d = document.createElement('div');
      d.style.cssText = 'position:fixed;left:0;right:0;top:0;z-index:99999;background:#7a1f1f;color:#fff;font:13px/1.5 sans-serif;padding:10px 14px';
      d.textContent = '页面没跑起来：' + (e && e.message ? e.message : e) + '（请换个浏览器打开或刷新）';
      document.body.appendChild(d);
    }
  }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', safeBoot);
else safeBoot();
