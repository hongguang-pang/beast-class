/* ============================================================
 * 《知识大陆 · 雾灯》主逻辑
 * 状态机 + 渲染 + 输入，零外部依赖，Canvas 2D + DOM HUD。
 * 分节：常量 / 工具 / 存档 / 地图 / 寻路 / 移动 / 相机 / 雾 /
 *       渲染 / 托盘与拖放 / 碑逻辑 / 笔记 / 开场与收束 / 输入 / 主循环
 * ============================================================ */
'use strict';

/* ================= 1. 常量 ================= */
const TILE = 48;                          // 1 格 = 48px
const PICK_R = 0.55 * TILE;               // 拾取半径
const NEAR_R = 1.5 * TILE;                // 进入碑台距离
const SLOW_R = 2.0 * TILE;                // 靠碑减速半径
const PLAYER_R = 0.35 * TILE;             // 碰撞半径
const SPEED_BASE = 3.2 * TILE;            // 基础速度 px/s
const SPEED_FAST = 4.0 * TILE;            // 连续直线加速
const SPEED_SLOW = 2.0 * TILE;            // 近碑减速
const SAVE_KEY = 'fog.save.v1';
const FONT = 'system-ui,"PingFang SC","Microsoft YaHei",sans-serif';
/* 三段地图：尺寸与碑所在行 */
const SEGS = [
  { name: '石板路', w: 11, h: 20, rows: [3, 9, 15] },
  { name: '雾林',   w: 15, h: 30, rows: [6, 13, 20, 26] },
  { name: '问答桥', w: 9,  h: 22, rows: [4, 11, 18] }
];

/* ================= 2. 工具 ================= */
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const dist2 = (ax, ay, bx, by) => { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; };
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function fmtTime(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
}

/* ================= 3. DOM 引用与画布 ================= */
const stage = $('stage'), worldCv = $('world'), fogCv = $('fog');
const wctx = worldCv.getContext('2d');
const fctx = fogCv.getContext('2d');
const trayEl = $('tray'), ghostEl = $('dragGhost');
let CW = 390, CH = 844, DPR = 1;
function resize() {
  CW = stage.clientWidth; CH = stage.clientHeight;
  DPR = Math.min(2, window.devicePixelRatio || 1);
  worldCv.width = CW * DPR; worldCv.height = CH * DPR;
  fogCv.width = Math.floor(CW * 0.5); fogCv.height = Math.floor(CH * 0.5);  // 雾层 0.5 倍分辨率
}
window.addEventListener('resize', resize);

/* ================= 4. 游戏状态 ================= */
const G = {
  state: 'intro',            // intro | play | finale | results
  segIdx: 0, lamps: 0,
  litIds: new Set(), runCount: 0,
  notes: 2, noteUsed: 0, picked: 0, wrongPuts: 0,
  startTime: 0,
  bench: null, drag: null, hoverSlot: -1,
  fog: { curR: 180, curA: 0.34, targetR: 180, targetA: 0.34, presses: [] },
  zoom: 1, zoomTarget: 1,
  cam: { x: 0, y: 0 },
  flies: [], particles: [], titles: [], ripples: [],
  fadeA: 0, fadeDir: 0, pendingSeg: -1,
  finT0: 0, finTextDone: false,
  tutChip: null, tutGlowT0: 0,
  hintsShown: {},
  lampAnim: null,            // {stele, t0}
  segmentDoneT: 0, finalePendT: 0,
  shakeT: 0
};
const P = { x: 0, y: 0, spd: SPEED_BASE, path: null, straightT: 0, dirX: 1, dirY: 0, holdPt: null };
const pet = { x: 0, y: 0 };
const keys = {};
let grid = null, mapW = 0, mapH = 0, mapStyle = 1;
let steles = [], chips = [], trayChips = [];
let stepSlabs = new Map();   // 走过的石板：tileIdx -> 时间戳
let now = performance.now();

/* ================= 5. 存档 ================= */
function saveGame() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 1, lit: [...G.litIds], runCount: G.runCount })); } catch (e) { /* 忽略 */ }
}
function loadSave() {
  try {
    const d = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (d && d.v === 1 && Array.isArray(d.lit)) { G.litIds = new Set(d.lit); G.runCount = d.runCount || 0; return true; }
  } catch (e) { /* 忽略 */ }
  return false;
}
function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* 忽略 */ } }

/* ================= 6. 地图生成 ================= */
/* grid 值：0 可走，1 不可走（悬崖/树/云） */
function pathCenter1(y, w) { return clamp(Math.round(w / 2 + 2.2 * Math.sin(y * 0.42) + 1.1 * Math.sin(y * 0.13)), 2, w - 3); }
function genMap(segIdx, rng) {
  const cfg = SEGS[segIdx];
  mapW = cfg.w; mapH = cfg.h; mapStyle = segIdx + 1;
  grid = new Uint8Array(mapW * mapH).fill(1);
  const set = (x, y, v) => { if (x >= 0 && y >= 0 && x < mapW && y < mapH) grid[y * mapW + x] = v; };
  if (segIdx === 0) {                       // 段1：蜿蜒主路宽 3 + 一条支路
    for (let y = 0; y < mapH; y++) {
      const cx = pathCenter1(y, mapW);
      for (let x = cx - 1; x <= cx + 1; x++) set(x, y, 0);
    }
    const bx = pathCenter1(12, mapW);       // 支路：一条向右的死胡同口袋
    for (let y = 10; y <= 14; y++) for (let x = bx + 2; x <= Math.min(bx + 4, mapW - 1); x++) set(x, y, 0);
  } else if (segIdx === 1) {                // 段2：走廊格子保证连通，其余种树
    const lanesY = [2, 8, 14, 20, 26], lanesX = [2, 7, 12];
    for (const y of lanesY) for (let x = 0; x < mapW; x++) set(x, y, 0);
    for (const x of lanesX) for (let y = 0; y < mapH; y++) set(x, y, 0);
    // 部分不可走格之间留出小空地，避免整片纯黑
    for (let i = 0; i < 26; i++) {
      const x = 1 + Math.floor(rng() * (mapW - 2)), y = 1 + Math.floor(rng() * (mapH - 2));
      if (grid[y * mapW + x] === 1) set(x, y, 0);
    }
  } else {                                  // 段3：窄桥，两侧虚空
    for (let y = 0; y < mapH; y++) for (let x = 3; x <= 5; x++) set(x, y, 0);
  }
}
const tileAt = (tx, ty) => (tx < 0 || ty < 0 || tx >= mapW || ty >= mapH) ? 1 : grid[ty * mapW + tx];
const walkTile = (tx, ty) => tileAt(tx, ty) === 0;
function hitBox(x, y, r) {
  const x0 = Math.floor((x - r) / TILE), x1 = Math.floor((x + r) / TILE);
  const y0 = Math.floor((y - r) / TILE), y1 = Math.floor((y + r) / TILE);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (!walkTile(tx, ty)) return true;
  return false;
}

/* ================= 7. A* 寻路（4 邻接） ================= */
function astar(sx, sy, tx, ty) {
  if (!walkTile(tx, ty)) return null;
  const W = mapW, key = (x, y) => y * W + x;
  const open = [{ x: sx, y: sy, g: 0, f: 0, p: null }];
  const best = new Map([[key(sx, sy), 0]]);
  let it = 0;
  while (open.length && it++ < 900) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (open[i].f < open[bi].f) bi = i;
    const cur = open.splice(bi, 1)[0];
    if (cur.x === tx && cur.y === ty) {
      const pts = [];
      for (let n = cur; n; n = n.p) pts.push({ x: n.x * TILE + TILE / 2, y: n.y * TILE + TILE / 2 });
      return pts.reverse();
    }
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (const [dx, dy] of dirs) {
      const nx = cur.x + dx, ny = cur.y + dy;
      if (!walkTile(nx, ny)) continue;
      const k = key(nx, ny), g = cur.g + 1;
      if (best.has(k) && best.get(k) <= g) continue;
      best.set(k, g);
      open.push({ x: nx, y: ny, g, f: g + Math.abs(nx - tx) + Math.abs(ny - ty), p: cur });
    }
  }
  return null;
}
/* 直线可视（用于路径拉直，避免锯齿） */
function los(ax, ay, bx, by) {
  const d = Math.hypot(bx - ax, by - ay), n = Math.max(2, Math.ceil(d / 14));
  for (let i = 1; i < n; i++) {
    const t = i / n, x = ax + (bx - ax) * t, y = ay + (by - ay) * t;
    if (!walkTile(Math.floor(x / TILE), Math.floor(y / TILE))) return false;
  }
  return true;
}
function walkToPoint(wx, wy) {
  if (G.state !== 'play' || G.bench || G.fadeA > 0.3) return;
  const sx = clamp(Math.floor(P.x / TILE), 0, mapW - 1), sy = clamp(Math.floor(P.y / TILE), 0, mapH - 1);
  let tx = clamp(Math.floor(wx / TILE), 0, mapW - 1), ty = clamp(Math.floor(wy / TILE), 0, mapH - 1);
  if (!walkTile(tx, ty)) {                   // 目标不可走：找附近可走格
    let bd = 1e9, bx = -1, by = -1;
    for (let y = Math.max(0, ty - 3); y <= Math.min(mapH - 1, ty + 3); y++)
      for (let x = Math.max(0, tx - 3); x <= Math.min(mapW - 1, tx + 3); x++)
        if (walkTile(x, y)) { const d = dist2(x, y, tx, ty); if (d < bd) { bd = d; bx = x; by = y; } }
    if (bx < 0) return; tx = bx; ty = by;
  }
  let path = astar(sx, sy, tx, ty);
  if (!path) return;
  path = smoothPath(path);
  if (path.length > 1) P.path = path.slice(1);
}
function smoothPath(path) {
  const out = [path[0]];
  let i = 0;
  while (i < path.length - 1) {
    let j = path.length - 1;
    while (j > i + 1 && !los(path[i].x, path[i].y, path[j].x, path[j].y)) j--;
    out.push(path[j]); i = j;
  }
  return out;
}

/* ================= 8. 玩家移动与碰撞 ================= */
function updatePlayer(dt) {
  if (G.state !== 'play') return;
  let vx = 0, vy = 0;
  const kx = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0);
  const ky = (keys.s || keys.arrowdown ? 1 : 0) - (keys.w || keys.arrowup ? 1 : 0);
  if (G.drag) { P.spd = 0; return; }
  if (G.bench) {                            // v1.1 碑台模式：允许 WASD 走动，走远自动退出碑台
    if (dist2(P.x, P.y, G.bench.x, G.bench.y) > (NEAR_R * 1.6) * (NEAR_R * 1.6)) exitBench();
    else { P.spd = 0; P.path = null; return; }
  }
  if (kx || ky) {                            // WASD 直接位移
    P.path = null;
    const l = Math.hypot(kx, ky); vx = kx / l; vy = ky / l;
    P.dirX = vx; P.dirY = vy;
  } else if (P.path && P.path.length) {
    const wp = P.path[0];
    const dx = wp.x - P.x, dy = wp.y - P.y, d = Math.hypot(dx, dy);
    if (d < 10) { P.path.shift(); if (!P.path.length) P.path = null; }
    else { vx = dx / d; vy = dy / d; P.dirX = vx; P.dirY = vy; }
  }
  const moving = (vx || vy);
  // 速度档位
  let target = SPEED_BASE;
  if (moving && sameDir(vx, vy)) P.straightT += dt; else P.straightT = 0;
  if (P.straightT > 2.5) target = SPEED_FAST;
  let nearStele = false;
  for (const s of steles) if (!s.lit && dist2(P.x, P.y, s.x, s.y) < SLOW_R * SLOW_R) nearStele = true;
  if (nearStele) target = SPEED_SLOW;
  P.spd += (target - P.spd) * Math.min(1, dt / 0.3);
  if (moving) {
    const step = P.spd * dt;
    const nx = P.x + vx * step;             // 轴分离滑动，避免卡墙
    if (!hitBox(nx, P.y, PLAYER_R)) P.x = nx;
    const ny = P.y + vy * step;
    if (!hitBox(P.x, ny, PLAYER_R)) P.y = ny;
    P.x = clamp(P.x, TILE * 0.4, mapW * TILE - TILE * 0.4);
    P.y = clamp(P.y, TILE * 0.4, mapH * TILE - TILE * 0.4);
    recordSlab(P.x, P.y);
    if (mapStyle === 3 && Math.random() < dt * 3) G.shakeT = Math.max(G.shakeT, 0.05); // 桥面微颤
  }
  // 宠物跟随
  const px = P.x - P.dirX * 40, py = P.y - P.dirY * 40 + 14;
  pet.x += (px - pet.x) * Math.min(1, dt * 4);
  pet.y += (py - pet.y) * Math.min(1, dt * 4);
}
function sameDir(vx, vy) { return Math.abs(vx - P.dirX) < 0.15 && Math.abs(vy - P.dirY) < 0.15; }
function recordSlab(x, y) {
  const idx = Math.floor(y / TILE) * mapW + Math.floor(x / TILE);
  if (!stepSlabs.has(idx)) stepSlabs.set(idx, now);
}

/* ================= 9. 相机 ================= */
function updateCam(dt) {
  let tx, ty;
  if (G.state === 'finale') {
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const s of steles) if (s.lit) { x0 = Math.min(x0, s.x); x1 = Math.max(x1, s.x); y0 = Math.min(y0, s.y); y1 = Math.max(y1, s.y); }
    tx = (x0 + x1) / 2 - CW / G.zoom / 2; ty = (y0 + y1) / 2 - CH / G.zoom / 2;
  } else if (G.bench) {                     // 把碑推到屏幕 (宽/2, 300)
    tx = G.bench.x - CW / 2 / G.zoom; ty = G.bench.y - 300 / G.zoom;
  } else {
    tx = P.x - CW / 2; ty = P.y - CH * 0.60;
  }
  const vw = CW / G.zoom, vh = CH / G.zoom;
  const m = G.bench ? 170 : 24;             // 碑台模式放宽钳制，保证碑推到屏幕中央
  if (mapW * TILE > vw - 48) tx = clamp(tx, -m, mapW * TILE - vw + m); else tx = (mapW * TILE - vw) / 2;
  if (mapH * TILE > vh - 48) ty = clamp(ty, -m, mapH * TILE - vh + m); else ty = (mapH * TILE - vh) / 2;
  const k = 1 - Math.exp(-(G.bench ? 6 : 8) * dt);
  G.cam.x += (tx - G.cam.x) * k;
  G.cam.y += (ty - G.cam.y) * k;
  G.zoom += (G.zoomTarget - G.zoom) * Math.min(1, dt / 0.5);
}
function w2s(wx, wy) { return { x: (wx - G.cam.x) * G.zoom, y: (wy - G.cam.y) * G.zoom }; }
function s2w(sx, sy) { return { x: sx / G.zoom + G.cam.x, y: sy / G.zoom + G.cam.y }; }

/* ================= 10. 雾系统 ================= */
/* 可玩性优先：起步就能看清地形与词片，点灯后雾进一步退散，保留"拨云见路"的成长感 */
function fogParams(n) {
  return { r: Math.min(370, 180 + 20 * n), a: Math.max(0.12, 0.34 - 0.024 * n) };
}
/* 预烘焙径向渐变贴图（不逐帧 new 渐变） */
function makeRadial(size, stops) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [o, col] of stops) gr.addColorStop(o, col);
  g.fillStyle = gr; g.fillRect(0, 0, size, size);
  return c;
}
const SPR_HOLE = makeRadial(128, [[0, 'rgba(255,255,255,1)'], [0.55, 'rgba(255,255,255,0.95)'], [1, 'rgba(255,255,255,0)']]);
const SPR_SOFT = makeRadial(128, [[0, 'rgba(255,255,255,0.85)'], [0.6, 'rgba(255,255,255,0.35)'], [1, 'rgba(255,255,255,0)']]);
const SPR_WARM = makeRadial(256, [[0, 'rgba(242,178,74,0.5)'], [0.5, 'rgba(242,178,74,0.16)'], [1, 'rgba(242,178,74,0)']]);
const SPR_SPOT = makeRadial(128, [[0, 'rgba(255,236,180,0.55)'], [0.6, 'rgba(255,225,150,0.22)'], [1, 'rgba(255,220,140,0)']]);
function updateFog(dt) {
  const t = fogParams(G.lamps);
  G.fog.targetR = t.r; G.fog.targetA = t.a;
  const k = 1 - Math.exp(-dt / 0.09);       // 0.24s 内到达 ~92%，雾退肉眼可见
  G.fog.curR += (G.fog.targetR - G.fog.curR) * k;
  G.fog.curA += (G.fog.targetA - G.fog.curA) * k;
  G.fog.presses = G.fog.presses.filter(p => now - p.t0 < 1200);
}
function drawFog() {
  fctx.setTransform(1, 0, 0, 1, 0, 0);
  fctx.clearRect(0, 0, fogCv.width, fogCv.height);
  fctx.setTransform(0.5, 0, 0, 0.5, 0, 0);
  const F = G.fog;
  fctx.globalCompositeOperation = 'source-over';
  fctx.fillStyle = `rgba(70,86,107,${F.curA.toFixed(3)})`;
  fctx.fillRect(0, 0, CW, CH);
  fctx.globalCompositeOperation = 'destination-out';
  const pp = w2s(P.x, P.y);
  fctx.globalAlpha = 1;
  fctx.drawImage(SPR_HOLE, pp.x - F.curR, pp.y - F.curR, F.curR * 2, F.curR * 2);
  fctx.globalAlpha = 0.55;
  const rs = Math.min(640, F.curR * 2);
  fctx.drawImage(SPR_SOFT, pp.x - rs, pp.y - rs, rs * 2, rs * 2);
  if (G.bench) {                            // 碑台额外挖洞，保证槽位可见
    const sp = w2s(G.bench.x, G.bench.y);
    const r = Math.max(230, F.curR * 0.8);
    fctx.globalAlpha = 1;
    fctx.drawImage(SPR_HOLE, sp.x - r, sp.y - r, r * 2, r * 2);
  }
  for (const s of steles) if (s.lit) {      // 已亮灯的常驻小洞
    const sp = w2s(s.x, s.y);
    fctx.globalAlpha = 0.5;
    fctx.drawImage(SPR_SOFT, sp.x - 130, sp.y - 130, 260, 260);
  }
  fctx.globalAlpha = 1;
  fctx.globalCompositeOperation = 'source-over';
  for (const p of G.fog.presses) {          // 错放局部雾压 1.2s
    const a = 0.15 * (1 - (now - p.t0) / 1200);
    const sp = w2s(p.wx, p.wy);
    fctx.fillStyle = `rgba(70,86,107,${a.toFixed(3)})`;
    fctx.beginPath(); fctx.arc(sp.x, sp.y, 90, 0, 7); fctx.fill();
  }
  // 未点碑的白描边轮廓（保证可达性，画在雾上）
  fctx.strokeStyle = 'rgba(240,235,220,0.16)';
  fctx.lineWidth = 1.5;
  for (const s of steles) if (!s.lit) {
    const sp = w2s(s.x, s.y);
    fctx.strokeRect(sp.x - 66, sp.y - 150, 132, 300);
  }
  drawOverlayFx();
}
/* 画在雾层之上的特效：拾叶飞行、金点、浮字、灯河连线、渐隐 */
function drawOverlayFx() {
  fctx.setTransform(0.5, 0, 0, 0.5, 0, 0);
  // 拾叶飞行（贝塞尔飞入托盘）
  for (const f of G.flies) {
    const t = clamp((now - f.t0) / 400, 0, 1);
    const u = 1 - t;
    const x = u * u * f.sx + 2 * u * t * f.cx + t * t * f.tx;
    const y = u * u * f.sy + 2 * u * t * f.cy + t * t * f.ty;
    fctx.save(); fctx.translate(x, y); fctx.rotate(u * 1.2);
    fctx.fillStyle = '#cdb87e'; fctx.beginPath(); fctx.ellipse(0, 0, 9, 5, 0, 0, 7); fctx.fill();
    fctx.restore();
  }
  // 点灯金点（6 粒上浮淡出）
  for (const p of G.particles) {
    const t = clamp((now - p.t0) / 900, 0, 1);
    fctx.globalAlpha = 1 - t;
    fctx.fillStyle = '#f6df9a';
    fctx.beginPath(); fctx.arc(p.x + p.vx * t, p.y - (40 + p.r * 10) * t, p.r, 0, 7); fctx.fill();
  }
  fctx.globalAlpha = 1;
  // 碑亮浮出的知识点名
  fctx.textAlign = 'center'; fctx.font = `15px ${FONT}`;
  for (const t of G.titles) {
    const e = (now - t.t0) / 2400;
    if (e >= 1) continue;
    fctx.globalAlpha = e < 0.15 ? e / 0.15 : (e > 0.75 ? (1 - e) / 0.25 : 1);
    fctx.fillStyle = '#f6df9a';
    fctx.fillText(t.text, t.x, t.y - 170 - e * 14);
  }
  fctx.globalAlpha = 1;
  // 收束：灯河连线（按点亮顺序逐段推进）
  if (G.state === 'finale' || G.state === 'results') {
    const seq = steles.filter(s => s.lit).sort((a, b) => a.litAt - b.litAt);
    const segN = G.state === 'results' ? seq.length - 1 : clamp(Math.floor((now - G.finT0 - 1600) / 40), 0, seq.length - 1);
    fctx.strokeStyle = 'rgba(242,178,74,0.5)'; fctx.lineWidth = 1;
    fctx.beginPath();
    for (let i = 0; i <= segN && i < seq.length - 1; i++) {
      const a = w2s(seq[i].x, seq[i].y), b = w2s(seq[i + 1].x, seq[i + 1].y);
      fctx.moveTo(a.x, a.y); fctx.lineTo(b.x, b.y);
    }
    fctx.stroke();
  }
  // 段落过渡渐隐
  if (G.fadeA > 0.01) {
    fctx.fillStyle = `rgba(4,6,10,${G.fadeA.toFixed(3)})`;
    fctx.fillRect(0, 0, CW, CH);
  }
}

/* ================= 11. 世界渲染 ================= */
function shadeTile(tx, ty) {                // 程序化色差
  const h = ((tx * 73856093) ^ (ty * 19349663)) >>> 0;
  return (h % 100) / 100;
}
function drawWorld() {
  const shake = G.shakeT > 0 ? (Math.random() - 0.5) * 12 * Math.min(1, G.shakeT / 0.25) : 0;
  wctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  wctx.fillStyle = '#1a2029'; wctx.fillRect(0, 0, CW, CH);
  const z = G.zoom, shx = shake, shy = shake * 0.6;
  wctx.setTransform(DPR * z, 0, 0, DPR * z, DPR * (-(G.cam.x + shx) * z), DPR * (-(G.cam.y + shy) * z));
  const vw = CW / z, vh = CH / z;
  const x0 = Math.max(0, Math.floor(G.cam.x / TILE) - 1), x1 = Math.min(mapW - 1, Math.ceil((G.cam.x + vw) / TILE) + 1);
  const y0 = Math.max(0, Math.floor(G.cam.y / TILE) - 1), y1 = Math.min(mapH - 1, Math.ceil((G.cam.y + vh) / TILE) + 1);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) drawTile(tx, ty);
  // 走过的石板金光 1.2s 淡出
  const g1 = 1200;
  for (const [idx, t] of stepSlabs) {
    const e = (now - t) / g1;
    if (e >= 1) { stepSlabs.delete(idx); continue; }
    const a = 0.35 * (1 - e);
    wctx.fillStyle = `rgba(242,178,74,${a.toFixed(3)})`;
    const tx = idx % mapW, ty = (idx / mapW) | 0;
    roundRect(wctx, tx * TILE + 3, ty * TILE + 3, TILE - 6, TILE - 6, 7); wctx.fill();
  }
  // 世界里的词片
  for (const c of chips) if (c.state === 'world') drawWorldChip(c);
  // 碑
  for (const s of steles) drawStele(s);
  // 宠物
  drawPet();
  // 玩家：脚下 90px 光斑 + 剪影
  const spot = SPR_SPOT;
  wctx.globalAlpha = 0.9;
  wctx.drawImage(spot, P.x - 45, P.y - 45, 90, 90);
  wctx.globalAlpha = 1;
  wctx.fillStyle = 'rgba(0,0,0,0.3)';
  wctx.beginPath(); wctx.ellipse(P.x, P.y + 12, 11, 5, 0, 0, 7); wctx.fill();
  wctx.fillStyle = '#20242e';
  wctx.beginPath(); wctx.arc(P.x, P.y - 8, 7, 0, 7); wctx.fill();
  wctx.beginPath(); wctx.moveTo(P.x - 9, P.y + 14); wctx.quadraticCurveTo(P.x, P.y - 6, P.x + 9, P.y + 14); wctx.closePath(); wctx.fill();
  wctx.strokeStyle = 'rgba(246,223,154,0.5)'; wctx.lineWidth = 1;
  wctx.beginPath(); wctx.arc(P.x, P.y - 8, 7, 0, 7); wctx.stroke();
  // 教学引导：开场唯一自发光的叶
  if (G.tutChip && G.tutChip.state === 'world' && now - G.tutGlowT0 < 5000) {
    const a = 0.5 + 0.5 * Math.sin(now / 300);
    wctx.globalAlpha = a; wctx.drawImage(SPR_WARM, G.tutChip.wx - 45, G.tutChip.wy - 45, 90, 90);
    wctx.globalAlpha = 1;
  }
  // 已亮灯的 130px 暖光（叠加，不挖雾）+ 呼吸
  wctx.globalCompositeOperation = 'lighter';
  for (const s of steles) if (s.lit) {
    const age = now - s.litAt;
    const breath = age > 2400 ? 0.92 + 0.08 * Math.sin(now / 500) : 1;
    wctx.globalAlpha = 0.9 * breath;
    wctx.drawImage(SPR_WARM, s.x - 130, s.y - 130, 260, 260);
    wctx.globalAlpha = 1;
  }
  // 点灯 0.6s 序列：光核扩张 → 主光晕 130px
  if (G.lampAnim) {
    const t = now - G.lampAnim.t0, s = G.lampAnim.stele;
    if (t < 600) {
      let coreR, haloR;
      if (t < 140) coreR = 8 + (t / 140) * 14; else coreR = 22;
      if (t > 100) haloR = 22 + Math.min(1, (t - 100) / 260) * 108; else haloR = 22;
      wctx.globalAlpha = 1;
      wctx.fillStyle = '#fff8e0';
      wctx.beginPath(); wctx.arc(s.x, s.y - 160, coreR, 0, 7); wctx.fill();
      wctx.globalAlpha = Math.min(1, t / 360) * 0.85;
      wctx.drawImage(SPR_WARM, s.x - haloR, s.y - 160 - haloR, haloR * 2, haloR * 2);
      wctx.globalAlpha = 0.35 * Math.max(0, 1 - t / 500);  // 碑体白闪
      wctx.fillStyle = '#fff'; roundRect(wctx, s.x - 75, s.y - 170, 150, 340, 14); wctx.fill();
      wctx.globalAlpha = 1;
    } else G.lampAnim = null;
  }
  wctx.globalCompositeOperation = 'source-over';
  wctx.globalAlpha = 1;
  // 点击落点波纹（世界坐标，随相机移动）
  for (const rp of G.ripples) {
    const age = now - rp.t0;
    if (age > 620) continue;
    const t = age / 620;
    wctx.strokeStyle = `rgba(246,223,154,${(0.85 * (1 - t)).toFixed(3)})`;
    wctx.lineWidth = 2.5;
    wctx.beginPath(); wctx.ellipse(rp.x, rp.y, 6 + t * 26, (6 + t * 26) * 0.55, 0, 0, 7); wctx.stroke();
    wctx.strokeStyle = `rgba(255,255,255,${(0.5 * (1 - t)).toFixed(3)})`;
    wctx.lineWidth = 1.5;
    wctx.beginPath(); wctx.ellipse(rp.x, rp.y, 3 + t * 12, (3 + t * 12) * 0.55, 0, 0, 7); wctx.stroke();
  }
  G.ripples = G.ripples.filter(rp => now - rp.t0 < 620);
}
function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
function drawTile(tx, ty) {
  const px = tx * TILE, py = ty * TILE, v = shadeTile(tx, ty), walk = grid[ty * mapW + tx] === 0;
  if (mapStyle === 1) {                     // 段1 石板路：悬崖 + 石板
    if (walk) {
      wctx.fillStyle = `rgb(${52 + v * 10},${58 + v * 10},${70 + v * 10})`;
      roundRect(wctx, px + 2, py + 2, TILE - 4, TILE - 4, 7); wctx.fill();
      wctx.strokeStyle = 'rgba(10,14,20,0.6)'; wctx.lineWidth = 1;
      roundRect(wctx, px + 2, py + 2, TILE - 4, TILE - 4, 7); wctx.stroke();
    } else {
      wctx.fillStyle = `rgb(${22 + v * 6},${26 + v * 6},${34 + v * 6})`;
      wctx.fillRect(px, py, TILE, TILE);
      wctx.fillStyle = 'rgba(120,130,150,0.08)';
      wctx.fillRect(px, py, TILE, 3);
    }
  } else if (mapStyle === 2) {              // 段2 雾林：地面 + 树
    if (walk) {
      wctx.fillStyle = `rgb(${38 + v * 8},${46 + v * 8},${40 + v * 6})`;
      wctx.fillRect(px, py, TILE, TILE);
    } else {
      wctx.fillStyle = `rgb(${20 + v * 6},${26 + v * 6},${22 + v * 5})`;
      wctx.fillRect(px, py, TILE, TILE);
      const cx = px + TILE / 2 + (v - 0.5) * 10, cy = py + TILE / 2 + (v - 0.5) * 10;
      wctx.fillStyle = '#3a2d1d'; wctx.fillRect(cx - 3, cy + 4, 6, 12);
      wctx.fillStyle = `rgb(${26 + v * 14},${44 + v * 18},${28 + v * 10})`;
      wctx.beginPath(); wctx.arc(cx, cy, 13 + v * 5, 0, 7); wctx.fill();
    }
  } else {                                  // 段3 问答桥：桥板 + 云
    if (walk) {
      wctx.fillStyle = `rgb(${74 + v * 12},${60 + v * 10},${42 + v * 8})`;
      wctx.fillRect(px + 1, py + 4, TILE - 2, TILE - 8);
      wctx.fillStyle = 'rgba(0,0,0,0.25)';
      wctx.fillRect(px + 1, py + TILE / 2, TILE - 2, 2);
    } else {
      wctx.fillStyle = `rgba(${180 + v * 30},${190 + v * 30},${205 + v * 25},0.16)`;
      wctx.beginPath(); wctx.arc(px + TILE / 2, py + TILE / 2, 20 + v * 8, 0, 7); wctx.fill();
    }
  }
}
function drawWorldChip(c) {
  const bob = Math.sin(now / 400 + c.wx) * 2;
  wctx.save(); wctx.translate(c.wx, c.wy + bob);
  // 常驻微光：让词片在雾里也能被看见（可玩性优先）
  const pulse = 0.5 + 0.5 * Math.sin(now / 380 + c.wx);
  wctx.globalCompositeOperation = 'lighter';
  wctx.globalAlpha = 0.5 + 0.25 * pulse;
  wctx.drawImage(SPR_SPOT, -34, -34, 68, 68);
  wctx.globalAlpha = 1;
  wctx.globalCompositeOperation = 'source-over';
  if (c.kind === 'stone') {
    wctx.fillStyle = '#6d7686';
    wctx.beginPath(); wctx.ellipse(0, 0, 9, 7, 0, 0, 7); wctx.fill();
    wctx.fillStyle = '#8b95a6'; wctx.beginPath(); wctx.ellipse(-2, -2, 5, 3.5, 0, 0, 7); wctx.fill();
  } else {
    wctx.rotate(Math.sin(now / 600 + c.wx) * 0.2);
    wctx.fillStyle = '#5f7a44';
    wctx.beginPath(); wctx.ellipse(0, 0, 10, 5.5, 0.6, 0, 7); wctx.fill();
    wctx.strokeStyle = '#2f4223'; wctx.lineWidth = 1;
    wctx.beginPath(); wctx.moveTo(-8, 3); wctx.lineTo(8, -3); wctx.stroke();
  }
  wctx.restore();
}
function drawPet() {
  wctx.fillStyle = 'rgba(0,0,0,0.25)';
  wctx.beginPath(); wctx.ellipse(pet.x, pet.y + 8, 8, 4, 0, 0, 7); wctx.fill();
  wctx.fillStyle = '#2a2f3a';
  wctx.beginPath(); wctx.ellipse(pet.x, pet.y, 9, 6, 0, 0, 7); wctx.fill();
  wctx.beginPath(); wctx.arc(pet.x + 6, pet.y - 4, 4, 0, 7); wctx.fill();
  wctx.fillStyle = '#f2b24a';
  wctx.fillRect(pet.x + 7, pet.y - 5, 2, 2);
}

/* ---------- 碑与槽绘制 ---------- */
function slotWorldPos(s, i) {
  if (s.layout === 'step') return { x: s.x, y: s.y + [116, 28, -60, -148][i], size: [46, 50, 54, 58][i] };
  if (s.layout === 'pair') return { x: s.x + 72, y: s.y + [-60, 0, 60][i], size: 54 };
  return { x: s.x + [-75, 0, 75][i], y: s.y + 40, size: 56 };
}
function slotScreenPos(s, i) { const p = slotWorldPos(s, i), q = w2s(p.x, p.y); return { x: q.x, y: q.y, size: p.size * G.zoom }; }
function pathShape(g, x, y, sz, shape) {
  const h = sz / 2;
  if (shape === 'ro') { g.arc(x, y, h, 0, 7); return; }
  if (shape === 'tr') { g.moveTo(x, y - h); g.lineTo(x + h * 0.95, y + h * 0.85); g.lineTo(x - h * 0.95, y + h * 0.85); g.closePath(); return; }
  if (shape === 'ci') {                     // 齿形：圆 + 8 个小圆齿
    g.arc(x, y, h * 0.82, 0, 7);
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      g.moveTo(x + Math.cos(a) * h * 0.95, y + Math.sin(a) * h * 0.95);
      g.arc(x + Math.cos(a) * h * 0.95, y + Math.sin(a) * h * 0.95, h * 0.22, 0, 7);
    }
    return;
  }
  roundRect(g, x - h * 0.92, y - h * 0.92, sz * 0.92, sz * 0.92, 5);
}
function drawStele(s) {
  const bw = s.layout === 'pair' ? 210 : (s.layout === 'fill' ? 240 : 150);
  const bh = s.layout === 'pair' ? 210 : (s.layout === 'fill' ? 170 : 340);
  const by = s.layout === 'fill' ? s.y + 40 : s.y;
  wctx.fillStyle = 'rgba(0,0,0,0.35)';
  roundRect(wctx, s.x - bw / 2 + 4, by - bh / 2 + 8, bw, bh, 14); wctx.fill();
  const grad = s.lit ? '#5c4c2c' : '#454b58';
  wctx.fillStyle = grad;
  roundRect(wctx, s.x - bw / 2, by - bh / 2, bw, bh, 14); wctx.fill();
  wctx.strokeStyle = s.lit ? 'rgba(246,223,154,0.8)' : (G.bench === s ? 'rgba(246,223,154,0.6)' : 'rgba(150,160,178,0.3)');
  wctx.lineWidth = s.lit ? 2 : 1.5;
  roundRect(wctx, s.x - bw / 2, by - bh / 2, bw, bh, 14); wctx.stroke();
  // 补型：句子刻痕
  if (s.layout === 'fill' && s.stem) {
    wctx.fillStyle = s.lit ? '#f5ecd8' : '#b9c2cf';
    wctx.font = `13px ${FONT}`; wctx.textAlign = 'center';
    const lines = wrapText(s.stem, bw - 40);
    lines.forEach((ln, i) => wctx.fillText(ln, s.x, s.y - 110 + i * 20));
  }
  // 槽
  s.slots.forEach((slot, i) => {
    const p = slotWorldPos(s, i), sz = p.size;
    if (s.layout === 'pair') {              // 左：题面石眼
      wctx.fillStyle = '#2c313b';
      wctx.beginPath(); wctx.arc(s.x - 72, p.y, 24, 0, 7); wctx.fill();
      wctx.strokeStyle = 'rgba(150,160,178,0.4)'; wctx.lineWidth = 1;
      wctx.beginPath(); wctx.arc(s.x - 72, p.y, 24, 0, 7); wctx.stroke();
      wctx.fillStyle = '#d8cdb4'; wctx.font = `13px ${FONT}`; wctx.textAlign = 'center';
      wctx.fillText(slot.hint, s.x - 72, p.y + 5);
    }
    // 槽体
    wctx.fillStyle = '#23272f';
    wctx.beginPath(); pathShape(wctx, p.x, p.y, sz, slot.shape); wctx.fill();
    const flash = slot.flashT && now - slot.flashT < 300;
    let strokeCol = 'rgba(120,130,148,0.6)';
    if (s.lit) strokeCol = 'rgba(246,223,154,0.9)';
    else if (G.hoverSlot === i && G.bench === s) strokeCol = '#f2b24a';
    else if (flash) strokeCol = 'rgba(90,96,108,0.9)';
    wctx.strokeStyle = strokeCol; wctx.lineWidth = 2;
    wctx.beginPath(); pathShape(wctx, p.x, p.y, sz, slot.shape); wctx.stroke();
    // 槽内片
    if (slot.chip) {
      wctx.fillStyle = '#e8d9a8';
      wctx.beginPath(); pathShape(wctx, p.x, p.y, sz - 10, slot.chip.shape); wctx.fill();
      wctx.fillStyle = '#4a3a15'; wctx.font = `12px ${FONT}`; wctx.textAlign = 'center';
      wctx.fillText(slot.chip.label, p.x, p.y + 4);
    } else if (slot.hint && s.layout === 'step') {   // 阶型刻字
      wctx.fillStyle = '#9aa3ad'; wctx.font = `12px ${FONT}`; wctx.textAlign = 'center';
      const above = i === s.slots.length - 1;
      wctx.fillText(slot.hint, p.x, p.y + (above ? -sz / 2 - 6 : sz / 2 + 15));
    } else if (s.layout === 'fill' && slot.hint) {
      wctx.fillStyle = '#9aa3ad'; wctx.font = `12px ${FONT}`; wctx.textAlign = 'center';
      wctx.fillText(slot.hint, p.x, p.y + sz / 2 + 15);
    }
    // 槽底渗光（刚吸附）
    if (slot.glowT && now - slot.glowT < 700) {
      const a = 0.5 * (1 - (now - slot.glowT) / 700);
      wctx.globalAlpha = a; wctx.drawImage(SPR_WARM, p.x - 40, p.y - 40, 80, 80); wctx.globalAlpha = 1;
    }
  });
  // 灯
  if (s.lit) {
    const age = now - s.litAt;
    const breath = age > 2400 ? 0.92 + 0.08 * Math.sin(now / 500) : 1;
    wctx.fillStyle = `rgba(255,217,138,${(0.95 * breath).toFixed(2)})`;
    wctx.beginPath(); wctx.arc(s.x, s.y - bh / 2 - 10, 9 * breath, 0, 7); wctx.fill();
    wctx.strokeStyle = 'rgba(246,223,154,0.7)'; wctx.lineWidth = 1;
    wctx.beginPath(); wctx.arc(s.x, s.y - bh / 2 - 10, 13, 0, 7); wctx.stroke();
  }
}
function wrapText(text, maxW) {
  const out = []; let line = '';
  for (const ch of text) {
    if (wctx.measureText(line + ch).width > maxW && line) { out.push(line); line = ch; }
    else line += ch;
  }
  if (line) out.push(line);
  return out;
}

/* ================= 12. 托盘（DOM） ================= */
function trayTop() { return trayEl.getBoundingClientRect().top; }
function chipFaceHTML(c) {
  const txt = c.revealed ? c.label : '?';
  return `<div class="face shape-${c.shape}"><span class="txt">${txt}</span></div>`;
}
function addTrayChip(c) {
  c.state = 'tray';
  trayChips.push(c);
  const el = document.createElement('div');
  el.className = 'chip fresh'; el.dataset.chipId = c.id;
  el.innerHTML = chipFaceHTML(c);
  trayEl.appendChild(el);
  c.el = el;
  setTimeout(() => el.classList.remove('fresh'), 400);
  el.addEventListener('pointerdown', e => onChipDown(e, c));
  el.addEventListener('click', () => { if (!G.dragMoved) revealChip(c); });
}
function removeTrayChip(c, fade) {
  const i = trayChips.indexOf(c);
  if (i >= 0) trayChips.splice(i, 1);
  const el = c.el;
  c.el = null;
  if (el) {
    if (fade) { el.style.opacity = '0'; setTimeout(() => el.remove(), 320); }
    else el.remove();
  }
}
function layoutTray() {                       // flex 自动换行，无需手动布局
  trayChips.forEach(c => { if (c.el) c.el.innerHTML = chipFaceHTML(c); });
}
function revealChip(c) {
  if (c.revealed || (c.state !== 'tray')) return;
  c.el.classList.add('revealing');
  setTimeout(() => { c.revealed = true; layoutTray(); }, 250);
  if (!G.hintsShown.read) { G.hintsShown.read = 1; }
}

/* ---------- 拖放 ---------- */
function onChipDown(e, c) {
  if (G.state !== 'play' || G.drag) return;
  G.dragMoved = false;
  if (!c.revealed) { revealChip(c); return; }  // 未展开的片显示 ?，不能拖
  e.preventDefault();
  const startPt = { x: e.clientX, y: e.clientY };
  G.drag = { chip: c, startPt };
  ghostEl.innerHTML = chipFaceHTML(c);
  ghostEl.classList.remove('hidden');
  moveGhost(e.clientX, e.clientY);
  const mv = ev => {
    if (Math.hypot(ev.clientX - startPt.x, ev.clientY - startPt.y) > 6) G.dragMoved = true;
    moveGhost(ev.clientX, ev.clientY);
    updateHoverSlot(ev.clientX, ev.clientY);
  };
  const up = ev => {
    window.removeEventListener('pointermove', mv);
    window.removeEventListener('pointerup', up);
    dropChip(ev.clientX, ev.clientY);
  };
  window.addEventListener('pointermove', mv);
  window.addEventListener('pointerup', up);
}
function moveGhost(x, y) {
  const r = stage.getBoundingClientRect();
  ghostEl.style.left = (x - r.left) + 'px';
  ghostEl.style.top = (y - r.top) + 'px';
}
function updateHoverSlot(px, py) {
  G.hoverSlot = -1;
  ghostEl.classList.remove('hover');
  if (!G.bench) return;
  const r = stage.getBoundingClientRect();
  const x = px - r.left, y = py - r.top;
  let bd = 40 * 40, bi = -1;
  G.bench.slots.forEach((slot, i) => {
    if (slot.chip) return;
    const p = slotScreenPos(G.bench, i);
    const d = dist2(x, y, p.x, p.y);
    if (d < bd) { bd = d; bi = i; }
  });
  if (bi >= 0) { G.hoverSlot = bi; ghostEl.classList.add('hover'); }
}
function dropChip(px, py) {
  const c = G.drag.chip, r = stage.getBoundingClientRect();
  const x = px - r.left, y = py - r.top;
  ghostEl.classList.add('hidden'); ghostEl.classList.remove('hover');
  let snap = null, bd = 8 * 8;
  if (G.bench) G.bench.slots.forEach((slot, i) => {
    if (slot.chip) return;
    const p = slotScreenPos(G.bench, i);
    const d = dist2(x, y, p.x, p.y);
    if (d < bd) { bd = d; snap = i; }
  });
  if (snap !== null) {
    const slot = G.bench.slots[snap];
    if (slot.shape === c.shape) {           // 形合：0.12s 吸附「咔」
      insertChip(G.bench, slot, c);
      slot.glowT = now;
      sndClick();
    } else {                                // 形不合：槽口灰一下 + 弹回
      slot.flashT = now;
      bounceBack(c);
      sndThud();
    }
  } else {
    /* v1.1 拖到雾里松手 = 放回世界（不占托盘位）：解决「托盘满 + 缺片」死锁 */
    const trayR = trayEl.getBoundingClientRect();
    if (y < trayR.top - 6) {
      c.state = 'world';
      /* 落到玩家附近 2-3 格内的可走格，并给 1.2s 拾取冷却，避免原地吸回 */
      const ptx = clamp(Math.round(P.x / TILE), 0, mapW - 1);
      const pty = clamp(Math.round(P.y / TILE), 0, mapH - 1);
      let bx = -1, by = -1, bd = 1e9;
      for (let ty2 = Math.max(0, pty - 3); ty2 <= Math.min(mapH - 1, pty + 3); ty2++)
        for (let tx2 = Math.max(0, ptx - 3); tx2 <= Math.min(mapW - 1, ptx + 3); tx2++) {
          if (!walkTile(tx2, ty2)) continue;
          const d = dist2(tx2, ty2, ptx, pty - 2);
          if (d < bd) { bd = d; bx = tx2; by = ty2; }
        }
      if (bx >= 0) { c.wx = bx * TILE + TILE / 2; c.wy = by * TILE + TILE / 2; }
      c.noPick = now + 1200;
      removeTrayChip(c, true);
      showHint('放回了雾里 · 随时可以再捡');
    } else bounceBack(c);
  }
  G.hoverSlot = -1;
  G.drag = null;
}
function bounceBack(c) {                      // 片滑回托盘原位
  const gx = ghostEl.offsetLeft, gy = ghostEl.offsetTop;
  ghostEl.classList.remove('hidden');
  ghostEl.style.transition = 'left .3s ease, top .3s ease';
  const el = c.el;
  if (el) {
    const tr = trayEl.getBoundingClientRect(), sr = stage.getBoundingClientRect();
    ghostEl.style.left = (el.offsetLeft + tr.left - sr.left + el.offsetWidth / 2) + 'px';
    ghostEl.style.top = (el.offsetTop + tr.top - sr.top + el.offsetHeight / 2) + 'px';
  }
  setTimeout(() => { ghostEl.style.transition = ''; ghostEl.classList.add('hidden'); }, 320);
}

/* ================= 13. 碑逻辑 ================= */
function enterBench(s) {
  G.bench = s;
  stage.classList.add('bench');
  $('leaveBtn').classList.remove('hidden');
  if (!G.hintsShown.drag) { G.hintsShown.drag = 1; showHint('把词片拖进对应形状的缺口'); }
  /* v1.1 空手进碑台时明确告知先去拾叶，避免"贴着碑无事可做"的卡死感 */
  const usable = trayChips.some(c => c.revealed);
  if (!usable && !s.lit) showHint('托盘还是空的 · 先去捡发光的词片');
}
function exitBench() {
  /* v1.1 退出后给这块碑加冷却：玩家走出 1.3 倍触发距离前不再自动进台，防止拉锯锁死 */
  if (G.bench) G.exitGuard = { id: G.bench.id, d2: (NEAR_R * 1.3) * (NEAR_R * 1.3) };
  G.bench = null; G.hoverSlot = -1;
  stage.classList.remove('bench');
  $('leaveBtn').classList.add('hidden');
}
function insertChip(s, slot, chip) {
  // 若片在别处（托盘 / 世界 / 其他槽），先取出
  if (chip.state === 'tray') removeTrayChip(chip);
  else if (chip.state === 'world') chip.state = 'slot';
  for (const sl of s.slots) if (sl !== slot && sl.chip === chip) sl.chip = null;
  for (const st of steles) if (st !== s) for (const sl of st.slots) if (sl.chip === chip) sl.chip = null;
  chip.state = 'slot';
  slot.chip = chip;
  judgeStele(s);
}
function judgeStele(s) {
  if (!s.slots.every(sl => sl.chip)) return;
  setTimeout(() => {                        // 整碑暂停 0.15s 再判定
    if (G.bench !== s || s.lit) return;
    let wrong = null;
    const order = s.slots.map((sl, i) => ({ sl, i }))
      .sort((a, b) => slotWorldPos(s, b.i).y - slotWorldPos(s, a.i).y);   // 从最靠下开始
    for (const o of order) if (!o.sl.accept.includes(o.sl.chip.id)) { wrong = o.sl; break; }
    if (wrong) {
      const chip = wrong.chip;
      wrong.chip = null;
      G.wrongPuts++;
      sndThud();
      G.fog.presses.push({ wx: slotWorldPos(s, s.slots.indexOf(wrong)).x, wy: slotWorldPos(s, s.slots.indexOf(wrong)).y, t0: now });
      chip.state = 'tray'; addTrayChip(chip);
      if (!G.hintsShown.wrong) { G.hintsShown.wrong = 1; showHint('放错了 · 按缺口的大小顺序（大→小）再试'); }
    } else lightStele(s);
  }, 150);
}
function lightStele(s) {
  if (s.lit) return;
  s.lit = true; s.litAt = now;
  sndDing();
  G.lamps++; G.litIds.add(s.id);
  G.lampAnim = { stele: s, t0: now };
  // 6 粒金点
  for (let i = 0; i < 6; i++) {
    const p = w2s(s.x, s.y - 160);
    G.particles.push({ x: p.x + (Math.random() - 0.5) * 60, y: p.y, vx: (Math.random() - 0.5) * 30, r: 1.5 + Math.random() * 1.5, t0: now + i * 20 });
  }
  G.titles.push({ text: `${s.subj} · ${s.title}`, x: w2s(s.x, s.y).x, y: w2s(s.x, s.y).y, t0: now });
  // 该碑剩余干扰片淡出托盘
  for (const c of [...trayChips]) if (c.steleId === s.id) removeTrayChip(c, true);
  // 每 3 盏灯 +1 张笔记（上限 3）
  if (G.lamps % 3 === 0 && G.notes < 3) { G.notes++; showHint('米娅多了一页新纸'); updateHUD(); }
  saveGame(); updateHUD();
  if (mapStyle === 3) G.shakeT = 0.25;      // 桥板前推的震屏
  setTimeout(() => { if (G.bench === s) exitBench(); }, 800);
  // 段落完成 → 过渡；全亮 → 收束
  const segSteles = steles.filter(st => st.seg === s.seg);
  if (G.lamps >= 10) G.finalePendT = now + 1200;
  else if (segSteles.every(st => st.lit)) G.segmentDoneT = now + 1400;
}
function checkProximity() {
  if (G.state !== 'play' || G.bench || G.fadeA > 0.3) return;
  for (const s of steles) {
    if (s.lit) continue;
    if (G.exitGuard && G.exitGuard.id === s.id) {
      if (dist2(P.x, P.y, s.x, s.y) < G.exitGuard.d2) continue;
      G.exitGuard = null;
    }
    if (dist2(P.x, P.y, s.x, s.y) < NEAR_R * NEAR_R) {
      /* v1.1 空手 / 无可用片不进台：托盘里没有能放上这座碑的片时，靠近碑只给提示 */
      const canPlace = trayChips.some(c => s.slots.some(sl => !sl.chip && sl.shape === c.shape));
      if (!canPlace) {
        if (!G.hintsShown.needleaf) { G.hintsShown.needleaf = 1; showHint('先去捡几片发光的词片，再来点碑'); }
        return;
      }
      enterBench(s); return;
    }
  }
}
/* 拾取 */
function checkPickup() {
  if (G.state !== 'play') return;
  for (const c of chips) {
    if (c.state !== 'world') continue;
    if (c.noPick && now < c.noPick) continue;
    if (dist2(P.x, P.y, c.wx, c.wy) < PICK_R * PICK_R) pickupChip(c);
  }
}
function pickupChip(c) {
  if (trayChips.length >= 8) { showHint('托盘满了 · 把不要的片拖回雾里'); return; }
  c.state = 'fly';
  const sp = w2s(c.wx, c.wy);
  const idx = trayChips.length;
  const tw = trayEl.clientWidth, perRow = Math.max(3, Math.floor((tw - 24) / 82));
  const tx = 16 + (idx % perRow) * 82 + 36, ty = trayTop() + 48 - 0;
  G.flies.push({ sx: sp.x, sy: sp.y, cx: (sp.x + tx) / 2, cy: Math.min(sp.y, ty) - 60, tx, ty, t0: now, chip: c });
  G.picked++;
  setTimeout(() => {
    const fi = G.flies.findIndex(f => f.chip === c);
    if (fi >= 0) G.flies.splice(fi, 1);
    addTrayChip(c);
    if (!G.hintsShown.pick) { G.hintsShown.pick = 1; showHint('点一下托盘里带「?」的词片，翻开它'); }
  }, 400);
}

/* ================= 14. 米娅的笔记 ================= */
function useNote() {
  if (G.state !== 'play') return;
  if (G.notes <= 0) { showHint('笔记用完了（每点亮 3 盏灯会补 1 页）'); return; }
  if (!G.bench) { showHint('先走近一座未点亮的碑，再点笔记'); return; }
  const s = G.bench;
  // 最靠下的未填 / 错槽
  const order = s.slots.map((sl, i) => ({ sl, i }))
    .sort((a, b) => slotWorldPos(s, b.i).y - slotWorldPos(s, a.i).y);
  let target = null;
  for (const o of order) if (!o.sl.chip || !o.sl.accept.includes(o.sl.chip.id)) { target = o.sl; break; }
  if (!target) { showHint('这座碑已经亮了'); return; }
  if (target.chip) {                        // 先弹回错片
    const old = target.chip; target.chip = null;
    old.state = 'tray'; addTrayChip(old);
  }
  const wantId = target.accept[0];
  let chip = chips.find(c => c.id === wantId);
  insertChip(s, target, chip);              // 若片在世界/托盘/别槽，会被自动归位
  target.glowT = now;
  G.notes--; G.noteUsed++;
  showHint('米娅把书翻到了那一页');
  updateHUD();
}

/* ================= 15. 提示与 HUD ================= */
let hintTimer = 0;
function showHint(text) {
  const el = $('hintline');
  el.textContent = text; el.classList.add('show');
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => el.classList.remove('show'), 4000);
}
function updateHUD() {
  $('lampnum').textContent = `${G.lamps}/10`;
  $('notenum').textContent = `×${G.notes}`;
  $('notebox').classList.toggle('spent', G.notes <= 0);
  $('segname').textContent = SEGS[G.segIdx].name;
}

/* ================= 15.5 音效（WebAudio 程序化合成，无外部文件） ================= */
let AC = null;
function ac() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; } } return AC; }
function tone(type, f0, f1, dur, vol) {
  const a = ac();
  if (!a) return;
  try {
    const o = a.createOscillator(), gn = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, a.currentTime);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, a.currentTime + dur);
    gn.gain.setValueAtTime(vol, a.currentTime);
    gn.gain.exponentialRampToValueAtTime(0.001, a.currentTime + dur);
    o.connect(gn).connect(a.destination);
    o.start(); o.stop(a.currentTime + dur);
  } catch (e) { /* 忽略音频异常 */ }
}
const sndClick = () => tone('square', 720, 720, 0.05, 0.08);      // 吸附「咔」
const sndThud = () => tone('sine', 90, 70, 0.12, 0.15);           // 弹回闷「咚」
const sndDing = () => { tone('sine', 660, 880, 0.12, 0.18); tone('triangle', 110, 110, 0.18, 0.12); }; // 点灯「叮」

/* ================= 16. 布局构建 ================= */
function buildSegment(segIdx, reshuffle) {
  G.segIdx = segIdx;
  const seedBase = hashStr('fog-run') + G.runCount * 2654435761 + segIdx * 97;
  const rng = mulberry32(seedBase + (reshuffle ? 1 : 0));
  genMap(segIdx, rng);
  stepSlabs.clear();
  steles = []; chips = []; trayChips.forEach(c => { if (c.el) c.el.remove(); }); trayChips = [];
  G.bench = null; exitBench();
  G.flies = []; G.particles = []; G.titles = []; G.ripples = []; G.fog.presses = [];
  // 碑落位
  const cfg = SEGS[segIdx];
  const myData = window.KNOWLEDGE.filter(k => k.seg === segIdx + 1);
  myData.forEach((kd, i) => {
    const row = cfg.rows[i];
    let tx;
    if (segIdx === 0) tx = pathCenter1(row, mapW);
    else if (segIdx === 1) tx = 7;
    else tx = 4;
    steles.push({
      id: kd.id, seg: segIdx + 1, layout: kd.layout, title: kd.title, subj: kd.subj,
      stem: kd.stem || null,
      slots: kd.slots.map(sd => ({ id: sd.id, hint: sd.hint, shape: sd.shape, accept: sd.accept, chip: null, flashT: 0, glowT: 0 })),
      x: tx * TILE + TILE / 2, y: row * TILE + TILE / 2,
      lit: G.litIds.has(kd.id), litAt: 0
    });
  });
  // 词片落位（重排：换位）
  for (const s of steles) {
    const kd = myData.find(k => k.id === s.id);
    if (s.lit) continue;                    // 已亮的碑不再撒片
    const stx = Math.round(s.x / TILE - 0.5), sty = Math.round(s.y / TILE - 0.5);
    const cand = [];
    for (let y = Math.max(0, sty - 3); y <= Math.min(mapH - 1, sty + 3); y++)
      for (let x = Math.max(0, stx - 3); x <= Math.min(mapW - 1, stx + 3); x++)
        if (walkTile(x, y) && !(x === stx && y === sty)) cand.push({ x, y });
    for (let i = cand.length - 1; i > 0; i--) {   // 洗牌 = 词片换位
      const j = Math.floor(rng() * (i + 1));
      [cand[i], cand[j]] = [cand[j], cand[i]];
    }
    kd.chips.forEach((cd, i) => {
      const p = cand[i % cand.length];
      chips.push({
        id: cd.id, label: cd.label, shape: cd.shape, correct: cd.correct, steleId: s.id,
        kind: /^\d/.test(cd.label) || /^[0-9]/.test(cd.label) ? 'stone' : 'leaf',
        wx: p.x * TILE + TILE / 2 + (rng() - 0.5) * 8, wy: p.y * TILE + TILE / 2 + (rng() - 0.5) * 8,
        state: 'world', revealed: false, el: null
      });
    });
  }
  // 玩家落位
  const startY = segIdx === 0 ? mapH - 2 : mapH - 2;
  const startX = segIdx === 0 ? pathCenter1(startY, mapW) : (segIdx === 1 ? 7 : 4);
  P.x = startX * TILE + TILE / 2; P.y = startY * TILE + TILE / 2;
  P.path = null; P.straightT = 0;
  pet.x = P.x - 30; pet.y = P.y + 20;
  // 相机就位
  G.cam.x = P.x - CW / 2; G.cam.y = P.y - CH * 0.60;
  G.zoom = 1; G.zoomTarget = 1;
  // 教学引导叶
  G.tutChip = (segIdx === 0 && G.lamps === 0) ? chips.find(c => c.correct) : null;
  /* v1.1 教学叶必须落在出生点上方 2 格的主路上（设计：开局 1.6 格外可见一片），
     否则玩家在纯黑里朝错误方向走会永远捡不到第一片 */
  if (G.tutChip) {
    const ty2 = startY - 2, tx2 = pathCenter1(ty2, mapW);
    if (walkTile(tx2, ty2)) { G.tutChip.wx = tx2 * TILE + TILE / 2; G.tutChip.wy = ty2 * TILE + TILE / 2; }
  }
  G.tutGlowT0 = now;
  updateHUD();
}

/* 段落过渡 */
function updateTransition() {
  if (G.fadeDir !== 0) {
    G.fadeA += G.fadeDir * 0.033;
    if (G.fadeDir > 0 && G.fadeA >= 1) {
      G.fadeA = 1; G.fadeDir = -1;
      buildSegment(G.pendingSeg, true);
      showHint(SEGS[G.pendingSeg].name);
    } else if (G.fadeDir < 0 && G.fadeA <= 0) { G.fadeA = 0; G.fadeDir = 0; }
    return;
  }
  if (G.segmentDoneT && now >= G.segmentDoneT && G.segIdx < 2) {
    G.segmentDoneT = 0;
    G.pendingSeg = G.segIdx + 1; G.fadeDir = 1;
  }
}

/* ================= 17. 开场 / 收束 / 结算 ================= */
function startPlay() {
  $('intro').classList.add('hidden');
  G.state = 'play';
  if (!G.startTime) G.startTime = now;
  loadSaveApply();
  updateHUD();
  if (G.lamps >= 10) { startFinale(); return; }
  showHint(SEGS[G.segIdx].name);
  // 首次进入自动弹出玩法引导
  let seen = false;
  try { seen = localStorage.getItem('fog.howto.seen') === '1'; } catch (e) {}
  if (!seen) openHowto();
}
function openHowto() { $('howto').classList.remove('hidden'); }
function closeHowto() {
  $('howto').classList.add('hidden');
  try { localStorage.setItem('fog.howto.seen', '1'); } catch (e) {}
}
function loadSaveApply() {
  // 已点亮的碑按存档恢复；当前段 = 第一座未亮碑的段
  let segIdx = 0;
  for (let i = 0; i < window.KNOWLEDGE.length; i++) {
    if (!G.litIds.has(window.KNOWLEDGE[i].id)) { segIdx = window.KNOWLEDGE[i].seg - 1; break; }
    segIdx = 2;
  }
  buildSegment(segIdx, false);
}
function startFinale() {
  exitBench();
  G.state = 'finale'; G.finT0 = now;
  G.zoomTarget = 0.72;
  $('finale').classList.remove('hidden');
  const ft = $('finaleText');
  ft.innerHTML = '';
  const txt = '灯多了，路就出来了。';
  [...txt].forEach((ch, i) => {
    const sp = document.createElement('span');
    sp.className = 'ch'; sp.textContent = ch;
    sp.style.animationDelay = `${2.5 + i * 0.06 - (now - G.finT0) / 1000}s`;
    ft.appendChild(sp);
  });
  setTimeout(showResults, 3400);
}
function showResults() {
  G.state = 'results';
  const row = $('resLampRow'); row.innerHTML = '';
  for (let i = 0; i < 10; i++) row.appendChild(document.createElement('i'));
  $('resTime').textContent = `用时 ${fmtTime(now - G.startTime)}`;
  $('resStats').innerHTML =
    `拾片 ${G.picked} 张 · 笔记 用 ${G.noteUsed} 张 / 余 ${G.notes} 张<br>错放 ${G.wrongPuts} 次`;
  $('results').classList.remove('hidden');
}
function resetRun(reshuffle) {
  $('results').classList.add('hidden');
  $('finale').classList.add('hidden');
  G.lamps = 0; G.litIds = new Set();
  G.notes = 2; G.noteUsed = 0; G.picked = 0; G.wrongPuts = 0;
  G.startTime = now; G.state = 'play';
  G.zoom = 1; G.zoomTarget = 1;
  if (!reshuffle) { G.runCount = 0; clearSave(); } else G.runCount++;
  saveGame();
  buildSegment(0, true);
  updateHUD();
  showHint('石板路');
}

/* ---------- 开场交互：长按金纸片 0.8s ---------- */
let pressT0 = 0, pressing = false;
const paper = $('paper'), ringFg = $('ringFg');
function pressStart(e) {
  if (G.state !== 'intro') return;
  e.preventDefault();
  pressing = true; pressT0 = now;
}
function pressMove() {
  if (!pressing) return;
  const t = (now - pressT0) / 800;
  ringFg.style.strokeDashoffset = String(327 * (1 - Math.min(1, t)));
}
function pressEnd() {
  if (!pressing) return;
  pressing = false;
  // 点一下纸片即可进入；按住满 0.8s 时进度环已走满（loop 内自动展开），这里只兜底短按
  beginSpread();
}
function beginSpread() {
  if ($('intro').classList.contains('spreading')) return;
  $('intro').classList.add('spreading');
  $('introTip').textContent = '';
  setTimeout(() => { $('intro').classList.add('hidden'); startPlay(); }, 1250);
}

/* ================= 18. 输入 ================= */
stage.addEventListener('pointerdown', e => {
  if (G.state !== 'play') return;
  if (e.target.closest('#tray,#topbar,#leaveBtn,#miniRestart,#results,button')) return;
  const r = stage.getBoundingClientRect();
  const x = e.clientX - r.left, y = e.clientY - r.top;
  if (G.bench) exitBench();                 // v1.1 碑台不再锁死走位：点地面即离开碑台走过去
  const w = s2w(x, y);
  P.holdPt = { x, y };
  G.ripples.push({ x: w.x, y: w.y, t0: now }); // 落点波纹：明确反馈"点到了这里，米娅正走过去"
  walkToPoint(w.x, w.y);
});
stage.addEventListener('pointermove', e => {
  if (G.state !== 'play' || !P.holdPt || G.bench) return;
  const r = stage.getBoundingClientRect();
  P.holdPt = { x: e.clientX - r.left, y: e.clientY - r.top };
  const w = s2w(P.holdPt.x, P.holdPt.y);
  walkToPoint(w.x, w.y);
});
window.addEventListener('pointerup', () => { P.holdPt = null; });
window.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  keys[k] = true;
  if (k === 'enter' && G.state === 'intro') beginSpread();
});
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
$('leaveBtn').addEventListener('click', exitBench);
$('notebox').addEventListener('click', useNote);
$('helpBtn').addEventListener('click', openHowto);
$('howtoGo').addEventListener('click', closeHowto);
$('skipIntro').addEventListener('click', () => { if (G.state === 'intro') { $('intro').classList.add('hidden'); startPlay(); } });
$('miniRestart').addEventListener('click', () => { if (G.state !== 'intro') { resetRun(false); showHint('已重新开始'); } });
$('btnAgain').addEventListener('click', () => resetRun(true));
$('btnReset').addEventListener('click', () => resetRun(false));

/* ================= 19. 调试接口（供自检脚本） ================= */
window.__game = {
  get state() { return G.state; },
  get lamps() { return G.lamps; },
  get player() { return { x: P.x, y: P.y }; },
  get fogR() { return G.fog.curR; },
  get fogTargetR() { return G.fog.targetR; },
  get fogA() { return G.fog.curA; },
  get trayCount() { return trayChips.length; },
  get notes() { return G.notes; },
  get benchId() { return G.bench ? G.bench.id : null; },
  get seg() { return G.segIdx; },
  get pathLen() { return P.path ? P.path.length : 0; },
  get spd() { return P.spd; },
  dbgPath(tx, ty) {
    const sx = Math.floor(P.x / TILE), sy = Math.floor(P.y / TILE);
    const raw = astar(sx, sy, tx, ty);
    return { from: { x: sx, y: sy }, to: { x: tx, y: ty }, targetWalkable: walkTile(tx, ty), rawLen: raw ? raw.length : null };
  },
  get steles() { return steles.map(s => ({ id: s.id, lit: s.lit })); },
  teleport(tx, ty) {
    // 吸附到最近的可走格，避免把角色卡进悬崖/树里
    let bx = clamp(Math.round(tx), 0, mapW - 1), by = clamp(Math.round(ty), 0, mapH - 1);
    if (!walkTile(bx, by)) {
      let bd = 1e9;
      for (let y = 0; y < mapH; y++) for (let x = 0; x < mapW; x++) {
        if (!walkTile(x, y)) continue;
        const d = dist2(x, y, tx, ty);
        if (d < bd) { bd = d; bx = x; by = y; }
      }
    }
    P.x = bx * TILE + TILE / 2; P.y = by * TILE + TILE / 2; P.path = null;
  },
  teleportToStele(id) {
    const s = steles.find(x => x.id === id);
    if (!s) return null;
    P.x = s.x; P.y = s.y + NEAR_R * 0.7; P.path = null;
    return s.id;
  },
  leafTile() {
    const c = chips.find(c => c.state === 'world');
    return c ? { x: Math.floor(c.wx / TILE), y: Math.floor(c.wy / TILE) } : null;
  },
  leafTiles() {
    return chips.filter(c => c.state === 'world').map(c => ({ x: Math.floor(c.wx / TILE), y: Math.floor(c.wy / TILE), id: c.id }));
  },
  slotShape(i) { return (G.bench && G.bench.slots[i]) ? G.bench.slots[i].shape : null; },
  slotsInfo() { return G.bench ? G.bench.slots.map((sl, i) => ({ i, shape: sl.shape, filled: !!sl.chip })) : []; },
  trayShapes() { return trayChips.map(c => ({ id: c.id, shape: c.shape, revealed: c.revealed })); },
  walkToTile(tx, ty) { walkToPoint(tx * TILE + TILE / 2, ty * TILE + TILE / 2); },
  slotScreen(i) { return G.bench ? slotScreenPos(G.bench, i) : null; },
  revealTray() { trayChips.forEach(c => revealChip(c)); },
  debugFill() {                       // 测试：清走错片，把正确片直接放进所有空槽
    if (!G.bench || G.bench.lit) return false;
    const s = G.bench;
    for (const sl of s.slots) {
      if (sl.chip && !sl.accept.includes(sl.chip.id)) {
        const old = sl.chip; sl.chip = null;
        old.state = 'tray'; addTrayChip(old);
      }
    }
    for (const sl of s.slots) {
      if (sl.chip) continue;
      const cid = sl.accept[0];
      const chip = chips.find(c => c.id === cid && c.state !== 'slot')
        || { id: cid, label: cid, shape: sl.shape, correct: true, state: 'none', el: null, steleId: s.id, revealed: true };
      if (chip.state === 'tray') removeTrayChip(chip);
      sl.chip = chip; chip.state = 'slot';
    }
    judgeStele(s);
    return true;
  }
};

/* ================= 20. 主循环 ================= */
paper.addEventListener('pointerdown', pressStart);
window.addEventListener('pointermove', pressMove);
window.addEventListener('pointerup', pressEnd);
window.addEventListener('pointercancel', pressEnd);

let lastT = performance.now();
function loop(t) {
  now = t;
  const dt = Math.min(0.05, (t - lastT) / 1000);
  lastT = t;
  if (G.state === 'intro') {
    if (pressing) {                          // 长按进度环逐帧推进
      const t = (now - pressT0) / 800;
      ringFg.style.strokeDashoffset = String(327 * (1 - Math.min(1, t)));
      if (t >= 1) { pressing = false; beginSpread(); }
    }
    requestAnimationFrame(loop); return;
  }
  updatePlayer(dt);
  updateCam(dt);
  updateFog(dt);
  checkPickup();
  checkProximity();
  updateTransition();
  if (G.shakeT > 0) G.shakeT -= dt;
  if (G.finalePendT && now >= G.finalePendT) { G.finalePendT = 0; startFinale(); }
  if (G.state === 'finale' && !G.finTextDone && now - G.finT0 > 2500) G.finTextDone = true;
  drawWorld();
  drawFog();
  requestAnimationFrame(loop);
}

/* ================= 启动 ================= */
function boot() {
  resize();
  const hasSave = loadSave();
  if (hasSave && G.litIds.size > 0) {
    loadSaveApply();                        // 先把世界搭好，开场后无缝续玩
    $('introTip').textContent = '点击纸片 · 继续上次的旅程';
  } else { G.segIdx = 0; }
  updateHUD();
  requestAnimationFrame(loop);
}
boot();
