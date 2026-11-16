/* ============================================================
 * 《知识大陆 · 宠物远征》v4 —— 大图谱 × 编队 × 克制 × 地图 × 掉落 × BGM
 * 状态：select → map(8 关远征路线) → battle → levelClear → map/… → result/defeat
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

const SUBJ_META = {
  math: { name:'数学', icon:'🧮' },
  cn:   { name:'语文', icon:'📖' },
  en:   { name:'英语', icon:'🔤' },
  sci:  { name:'科学', icon:'🔬' },
  eth:  { name:'道德与法治', icon:'⚖️' }
};

/* ---------- 关卡：敌人属性与队伍属性形成策略约束 ---------- */
const LEVELS = [
  { name:'石板路',   enemy:'苔球怪',   emoji:'🪴', elem:'wood',  hp:90,  lv:1, boss:false },
  { name:'雾林',     enemy:'潮汐蟹',   emoji:'🦀', elem:'water', hp:105, lv:1, boss:false },
  { name:'问答桥',   enemy:'焰尾鸦',   emoji:'🦅', elem:'fire',  hp:120, lv:2, boss:false },
  { name:'微光坡',   enemy:'萤火灵',   emoji:'✨', elem:'light', hp:130, lv:2, boss:false },
  { name:'回声谷',   enemy:'暗影蝠',   emoji:'🦇', elem:'dark',  hp:140, lv:3, boss:false },
  { name:'藤蔓迷宫', enemy:'巨口花',   emoji:'🌺', elem:'wood',  hp:150, lv:3, boss:false },
  { name:'结晶洞',   enemy:'水晶兽',   emoji:'💎', elem:'water', hp:160, lv:3, boss:false },
  { name:'书山王座', enemy:'知识魔王', emoji:'📚', elem:'dark',  hp:100, lv:4, boss:true  }
];

/* ---------- 全局状态 ---------- */
const G = {
  state:'select',
  grade:'g3',
  team:[],            // [{ pet, hp, maxHp }]
  active:0,
  level:0, bossPhase:1,
  enemyHp:110, enemyMax:110,
  combo:0, maxCombo:0, correctCount:0, wrongCount:0, questionNo:0,
  notes:2, usedThisQ:[],
  currentQ:null, currentOpts:[], currentAnswer:0,
  bags:{}, usedQ:new Set(), wrongPool:[], knHit:{}, startTime:0, lock:false,
  chosenLevel:0, lvCorrect:0, lvWrong:0, lvSubj:{}, bag:{}, runDrops:[], sessionDrops:[]
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

/* 题库抽题：年级内各科循环取，不连续重复 */
function pickBankQ(kind, maxLv){
  const bank = (KG_BANK[G.grade] || {})[kind] || [];
  if (!bank.length) return null;
  if (!G.bags[kind] || !G.bags[kind].length) G.bags[kind] = shuffle(bank.map((_, i) => i));
  let guard = 0;
  /* 同一局内不重复出题；本科题目用完则返回 null，由调用方换科 */
  while (G.bags[kind].length && guard++ < 80) {
    const idx = G.bags[kind].pop();
    const q = bank[idx];
    if (q.lv > maxLv) continue;
    if (G.usedQ.has(q.q)) continue;
    G.usedQ.add(q.q);
    return q;
  }
  return null;
}
function pickQuestion(){
  const cfg = LEVELS[G.level];
  const roll = Math.random();
  let q = null, subj = 'math';
  if (roll < 0.26) {
    subj = 'en'; q = pickBankQ('en', cfg.lv);
  } else if (roll < 0.44) {
    subj = 'cn'; q = pickBankQ('cn', cfg.lv);
  } else if (roll < 0.58) {
    subj = 'sci'; q = pickBankQ('sci', cfg.lv);
  } else if (roll < 0.66) {
    subj = 'eth'; q = pickBankQ('eth', cfg.lv);
  } else {
    subj = 'math';
    /* 优先用大图谱题库（题目自带真实知识点名），取尽再程序生成兜底 */
    q = pickBankQ('math', cfg.lv);
    if (!q) {
      const mlv = clamp(cfg.lv + rand(2) - 1, 0, 4);
      for (let t = 0; t < 8; t++) {
        q = genMath(G.grade, mlv);
        if (!G.usedQ.has(q.q)) break;
      }
      G.usedQ.add(q.q);
    }
  }
  /* 该科题用完（尤其道德与法治每年级只有 2 题）→ 退回数学题，保证不重复 */
  if (!q) {
    subj = 'math';
    for (let t = 0; t < 8; t++) {
      q = genMath(G.grade, cfg.lv);
      if (!G.usedQ.has(q.q)) break;
    }
    G.usedQ.add(q.q);
  }
  q.subj = subj;
  G.currentQ = q;
  G.currentOpts = q.options;
  G.currentAnswer = q.a;
  G.usedThisQ = [];
  G.questionNo++;
  G.pickedLog = G.pickedLog || [];
  G.pickedLog.push(subj + '|' + q.q);
  renderQuestion();
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
      G.grade = g.id;
      SND.tap();
      toArr(row.children).forEach(c => c.classList.toggle('on', c.dataset.g === g.id));
      renderGradeInfo();
    });
    row.appendChild(b);
  });
  renderGradeInfo();
}
function renderGradeInfo(){
  const g = GRADES.find(x => x.id === G.grade);
  const kn = KG_NAMES[G.grade] || {};
  const total = ['math','cn','en','sci','eth'].reduce((s, k) => s + (kn[k] || []).length, 0);
  const bank = KG_BANK[G.grade] || {};
  const qn = Object.keys(bank).reduce((s, k) => s + bank[k].length, 0);
  $('gradeInfo').innerHTML = `${g.name} · 图谱 <b>${total}</b> 个知识点 · <b>${qn}</b> 道题 · 语文/数学/英语/科学/道德与法治`;
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
  const btn = $('startBtn');
  if (G.team.length === 3) {
    btn.disabled = false;
    btn.textContent = `带 ${G.team.map(t => t.pet.emoji).join('')} 出发！`;
  } else {
    btn.disabled = true;
    btn.textContent = `再选 ${3 - G.team.length} 只宠物出发`;
  }
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
  const q = G.currentQ, cfg = LEVELS[G.level];
  const meta = SUBJ_META[q.subj] || SUBJ_META.math;
  $('qSubj').textContent = `${meta.icon} ${meta.name}`;
  $('qKn').textContent = q.kn ? `知识点 · ${q.kn}` : '';
  $('qProgress').textContent = `第 ${G.questionNo} 题 · ${cfg.name}`;
  $('qText').textContent = q.q;
  const box = $('qOptions'); box.innerHTML = '';
  G.currentOpts.forEach((txt, i) => {
    const b = document.createElement('button');
    b.className = 'opt';
    b.textContent = txt;
    b.dataset.i = i;
    b.addEventListener('click', () => answerQuestion(i, b));
    box.appendChild(b);
  });
  updateNoteBtn();
}
function updateNoteBtn(){
  const b = $('noteBtn');
  b.textContent = `📓 米娅的笔记 ×${G.notes}`;
  b.disabled = G.notes <= 0;
}
function updateHUD(){
  const cfg = LEVELS[G.level], t = activeT();
  const gname = (GRADES.find(x => x.id === G.grade) || {}).name || '';
  $('chapter').textContent = `${gname} · 第 ${G.level + 1} 关 ${cfg.name}`;
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
/* 战场中部：4 关进度点 + 当前属性关系（克制/被克/平） */
function renderArena(cfg, t){
  const dots = $('lvDots');
  dots.innerHTML = '';
  for (let i = 0; i < LEVELS.length; i++) {
    const d = document.createElement('div');
    d.className = 'lv-dot' + (i < G.level ? ' done' : i === G.level ? ' now' : '');
    dots.appendChild(d);
  }
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
function answerQuestion(i, btn){
  if (G.lock || G.state !== 'battle') return;
  G.lock = true;
  const correct = i === G.currentAnswer;
  const opts = toArr($('qOptions').children);
  opts.forEach((b, idx) => {
    b.style.pointerEvents = 'none';
    if (idx === G.currentAnswer) b.classList.add('right');
  });
  if (correct) {
    const t = activeT();
    G.combo++;
    G.maxCombo = Math.max(G.maxCombo, G.combo);
    G.correctCount++;
    G.lvCorrect++;
    G.lvSubj[G.currentQ.subj] = (G.lvSubj[G.currentQ.subj] || 0) + 1;
    const meta = SUBJ_META[G.currentQ.subj] || SUBJ_META.math;
    if (G.currentQ.kn) G.knHit[`${meta.name} · ${G.currentQ.kn}`] = 1;
    const em = elemMult(t.pet.elem, LEVELS[G.level].elem);
    const comboMult = 1 + 0.25 * Math.min(G.combo - 1, 4);
    const base = 20 + (RAR_BONUS[t.pet.rar] || 0);
    const dmg = Math.max(6, Math.round(base * em * comboMult));
    const isCrit = em > 1.2;
    if (isCrit) { bigVerdict('克制！', 'v-crit'); SND.crit(); }
    else if (G.combo >= 3) { bigVerdict(`连击 ×${G.combo}！`, 'v-good'); SND.correct(G.combo); }
    else { bigVerdict('命中！', 'v-good'); SND.correct(G.combo); }
    $('battleLog').textContent = `${t.pet.skill}！${isCrit ? '属性克制，' : ''}造成 ${dmg} 点伤害${G.combo >= 2 ? `（连击 ×${G.combo}）` : ''}`;
    enemyCast(dmg, isCrit);
  } else {
    btn.classList.add('wrong');
    G.combo = 0;
    G.wrongCount++;
    G.lvWrong++;
    const t = activeT();
    const dmg = LEVELS[G.level].boss ? 20 : 16;
    t.hp = clamp(t.hp - dmg, 0, t.maxHp);
    if (G.currentQ) G.wrongPool.push({ q:G.currentQ.q, a:G.currentOpts[G.currentAnswer] });
    bigVerdict('再想想～', 'v-bad');
    SND.wrong();
    $('battleLog').textContent = '答错了，' + t.pet.name + '被反击，掉了 ' + dmg + ' 点体力。看看正确答案，下一题再来！';
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
      SND.boss();
      $('battleLog').textContent = ['', '', '它散成书页，又重新聚起来了——还有两下！', '最后一段了，别放松！'][G.bossPhase] || '它又变了！';
      updateHUD(); G.lock = false; setTimeout(nextQ, 900); return;
    }
    pages(FW/2, FH*0.32, 22);
    flash('rgba(255,230,160,.7)');
    G.state = 'levelClear';
    SND.clear();
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
function startGame(){
  if (G.team.length !== 3) return;
  G.team.forEach(t => { t.hp = t.maxHp; });
  G.state = 'battle';
  G.level = clamp(G.chosenLevel | 0, 0, LEVELS.length - 1); G.bossPhase = 1;
  G.combo = 0; G.maxCombo = 0; G.correctCount = 0; G.wrongCount = 0;
  G.lvCorrect = 0; G.lvWrong = 0; G.lvSubj = {}; G.runDrops = [];
  if (G.chosenLevel === 0) G.sessionDrops = [];
  G.questionNo = 0; G.notes = 2; G.bags = {}; G.usedQ = new Set(); G.pickedLog = []; G.wrongPool = []; G.knHit = {};
  G.active = 0; G.lock = false; G.startTime = performance.now();
  particles = []; flashes = [];
  const cfg = LEVELS[0];
  G.enemyMax = cfg.hp; G.enemyHp = cfg.hp;
  $('selectView').classList.add('hidden');
  $('mapView').classList.add('hidden');
  $('resultView').classList.add('hidden');
  $('defeat').classList.add('hidden');
  $('levelClear').classList.add('hidden');
  $('battleView').classList.remove('hidden');
  buildTeamRow();
  updateHUD();
  $('battleLog').textContent = `${cfg.enemy}（${ELEMENTS[cfg.elem].name}）挡在前面，答对题目让宠物出招！`;
  nextQ();
  SND.tap();
  BGM.setTheme('battle');
}
function goNextLevel(){
  $('levelClear').classList.add('hidden');
  markCleared(G.level);
  G.chosenLevel = G.level + 1;
  G.level++;
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
  if (cfg.boss) SND.boss();
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
  $('mapSub').textContent = '已通关 ' + Math.min(prog, LEVELS.length) + ' / ' + LEVELS.length + ' 关 · 通关解锁下一站';
  $('mapTip').textContent = prog >= LEVELS.length ? '🏆 全部通关！可重刷任意关卡拿满星。' : '点亮金色据点开始挑战';
  $('bagCount').textContent = Object.keys(G.bag).reduce((a, k) => a + G.bag[k], 0);
}
function beginLevel(i){ G.chosenLevel = clamp(i, 0, LEVELS.length - 1); startGame(); }
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
  $('startBtn').disabled = true;
  $('startBtn').textContent = '再选 3 只宠物出发';
  $('selectView').classList.remove('hidden');
  renderPets(); renderTeamPreview();
  SND.tap();
}
function useNote(){
  if (G.state !== 'battle' || G.lock || G.notes <= 0) return;
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
$('startBtn').addEventListener('click', enterMap);
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
  get question(){ return G.currentQ ? { q:G.currentQ.q, kn:G.currentQ.kn, subj:G.currentQ.subj, opts:G.currentOpts } : null; },
  get picked(){ return (G.pickedLog || []).slice(); },
  get answer(){ return G.currentAnswer; },
  setGrade(g){ G.grade = g; renderGrades(); },
  setTeam(ids){ G.team = ids.map(id => { const p = PETS.find(x => x.id === id); return p ? { pet:p, hp:100, maxHp:100 } : null; }).filter(Boolean); renderPets(); renderTeamPreview(); $('startBtn').disabled = G.team.length !== 3; },
  start(){ startGame(); },
  correct(){ answerQuestion(G.currentAnswer, $('qOptions').children[G.currentAnswer]); },
  wrong(){ const i = toArr(Array(G.currentOpts.length).keys()).find(x => x !== G.currentAnswer); answerQuestion(i, $('qOptions').children[i]); },
  next(){ goNextLevel(); },
  swap(i){ switchPet(i); },
  restart(){ startGame(); },
  setMute(m){ SND.muted = !!m; LS.set('battle.muted', m ? '1' : '0'); BGM.toggleMute(); },
  get bgm(){ return { theme:BGM.theme, playing:BGM.playing, muted:SND.muted }; },
  get bag(){ return Object.assign({}, G.bag); },
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
  setTimeout(() => showHowto(false), 400);
}
function safeBoot(){
  try { boot(); window.__bootOk = true; }
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
