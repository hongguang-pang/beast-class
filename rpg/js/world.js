/* ============================================================
 * 精灵大陆 · 知识远征  —  地图探索
 * Canvas 俯视地图 / 碰撞 / 虚拟摇杆 / 随机遇敌 / 交互触发
 * ============================================================ */
'use strict';
var D = window.RPG_DATA, E = window.RPG_ENGINE;
var MAP = D.MAP_CFG;

var World = {
  canvas:null, ctx:null, tile:MAP.tile,
  px:0, py:0,               // 玩家格坐标（浮点，用于平滑移动）
  camX:0, camY:0,           // 相机左上角（像素）
  viewW:0, viewH:0,
  keys:{}, joy:{x:0,y:0},
  moving:false, moveTimer:0,
  obstacles:{},             // 'x,y' -> true
  chests:{},                // 剩余宝箱 key -> {x,y}
  encounterCooldown:0,
  running:false, enabled:false,
  onEncounter:null, onTalk:null, onChest:null, onBoss:null,
  toast:null, toastTimer:0,
  playerSprite:'🧑',
  lastDir:'down',
  imgCache:{},            // 图片缓存：路径 -> Image
  mobs:[],                // 地图上可见的野生怪物 [{key,x,y,img,phase}]
  mobRespawn:{}           // 怪物击杀后重生计时 key->时间戳
};

function key(x,y){ return x+','+y; }

World.init = function(canvas){
  this.canvas = canvas; this.ctx = canvas.getContext('2d');
  this.buildObstacles();
  this.resetToSave();
  this.buildMobs();
  this.preloadImages();
  this.bindInput();
  this.resize();
  var self=this;
  window.addEventListener('resize', function(){ self.resize(); });
};
/* 预加载 NPC/怪物图片 */
World.preloadImages = function(){
  var self=this;
  function load(src){ if(self.imgCache[src])return; var im=new Image(); im.src=src; self.imgCache[src]=im; }
  load('../images/npc/player-hero.png');
  MAP.npcs.forEach(function(n){ load(D.npcImg(n)); });
  D.MONSTERS.concat(D.BOSSES).forEach(function(m){ load(D.monsterImg(m)); });
};
/* 在地图上按区域生成可见怪物（固定点位，确定性） */
World.buildMobs = function(){
  this.mobs=[];
  var self=this;
  function h(x,y,s){ var n=Math.sin(x*127.1+y*311.7+(s||0)*74.7)*43758.5453; return n-Math.floor(n); }
  MAP.zones.forEach(function(z){
    if (!z.monsters.length) return;
    var count = z.id<=1 ? 5 : 6;
    for(var i=0;i<count;i++){
      var x=z.x0+Math.floor(h(i,1,z.id)*(z.x1-z.x0));
      var y=z.y0+Math.floor(h(i,2,z.id)*(z.y1-z.y0));
      if(self.blocked(x,y)) continue;
      if(Math.abs(x-20)<=8&&y>=36) continue; // 村庄安全区不放
      var mk=z.monsters[Math.floor(h(i,3,z.id)*z.monsters.length)];
      self.mobs.push({ key:mk, x:x, y:y, phase:h(i,4,z.id)*6 });
    }
  });
};
World.resize = function(){
  var stage = document.getElementById('worldStage');
  var w = stage ? stage.clientWidth : window.innerWidth;
  var h = stage ? stage.clientHeight : window.innerHeight;
  this.viewW = w; this.viewH = h;
  var dpr = Math.min(2, window.devicePixelRatio||1);
  this.canvas.width = w*dpr; this.canvas.height = h*dpr;
  this.canvas.style.width = w+'px'; this.canvas.style.height = h+'px';
  this.ctx.setTransform(dpr,0,0,dpr,0,0);
  this.updateCam();
};
World.buildObstacles = function(){
  this.obstacles = {};
  /* 确定性伪随机障碍：树/石头/水，靠 hash 保证每次一致 */
  function hash(x,y){ var n=x*374761393+y*668265263; n=(n^(n>>13))*1274126177; return ((n^(n>>16))>>>0)/4294967296; }
  for (var y=0;y<MAP.rows;y++) for (var x=0;x<MAP.cols;x++){
    /* 村庄周围(安全区)清空障碍 */
    var inVillage = Math.abs(x-20)<=8 && y>=36;
    if (inVillage) continue;
    var r = hash(x,y);
    if (r < 0.10) this.obstacles[key(x,y)] = (hash(x+99,y)>0.5?'🌳':'🪨');
  }
  /* NPC/Boss/宝箱/出生点强制可走 */
  MAP.npcs.forEach(n=>delete this.obstacles[key(n.x,n.y)]);
  MAP.bosses.forEach(b=>delete this.obstacles[key(b.x,b.y)]);
  MAP.chests.forEach(c=>delete this.obstacles[key(c.x,c.y)]);
  delete this.obstacles[key(MAP.spawn.x,MAP.spawn.y)];
};
World.resetToSave = function(){
  var S=E.S||E.load();
  this.px = S ? S.player.x : MAP.spawn.x;
  this.py = S ? S.player.y : MAP.spawn.y;
  this.chests = {};
  var self=this;
  MAP.chests.forEach(function(c,i){ if(!(S&&S.chestsOpened[i])) self.chests[i]={x:c.x,y:c.y}; });
  this.updateCam();
};
World.savePos = function(){
  if (!E.S) return;
  E.S.player.x = Math.round(this.px);
  E.S.player.y = Math.round(this.py);
  E.save();
};

World.bindInput = function(){
  var self=this;
  /* 键盘 */
  window.addEventListener('keydown', function(e){
    var k=e.key.toLowerCase();
    if (['arrowup','arrowdown','arrowleft','arroww','w','a','s','d'].indexOf(k)>=0){ self.keys[k]=1; e.preventDefault(); }
  });
  window.addEventListener('keyup', function(e){ self.keys[e.key.toLowerCase()]=0; });
  /* 虚拟摇杆 */
  var base=document.getElementById('joyBase'), knob=document.getElementById('joyKnob');
  if (base){
    var rect, active=false;
    var move=function(cx,cy){
      var r=base.getBoundingClientRect();
      var dx=cx-(r.left+r.width/2), dy=cy-(r.top+r.height/2);
      var max=r.width*0.42, len=Math.sqrt(dx*dx+dy*dy);
      if(len>max){dx=dx/len*max;dy=dy/len*max;}
      self.joy.x=dx/max; self.joy.y=dy/max;
      knob.style.transform='translate('+dx+'px,'+dy+'px)';
    };
    base.addEventListener('touchstart',function(e){active=true;var t=e.touches[0];move(t.clientX,t.clientY);e.preventDefault();},{passive:false});
    base.addEventListener('touchmove',function(e){if(active){var t=e.touches[0];move(t.clientX,t.clientY);e.preventDefault();}},{passive:false});
    var end=function(){active=false;self.joy.x=0;self.joy.y=0;knob.style.transform='translate(0,0)';};
    base.addEventListener('touchend',end); base.addEventListener('touchcancel',end);
    /* 鼠标也支持（桌面调试） */
    base.addEventListener('mousedown',function(e){active=true;move(e.clientX,e.clientY);});
    window.addEventListener('mousemove',function(e){if(active)move(e.clientX,e.clientY);});
    window.addEventListener('mouseup',end);
  }
  /* 交互键 */
  var act=document.getElementById('btnAction');
  if (act) act.addEventListener('click', function(){ self.interact(); });
};

World.updateCam = function(){
  var t=this.tile;
  var targetX = this.px*t - this.viewW/2 + t/2;
  var targetY = this.py*t - this.viewH/2 + t/2;
  targetX = Math.max(0, Math.min(MAP.cols*t - this.viewW, targetX));
  targetY = Math.max(0, Math.min(MAP.rows*t - this.viewH, targetY));
  this.camX = targetX; this.camY = targetY;
};

World.zoneAt = function(x,y){
  for (var i=0;i<MAP.zones.length;i++){
    var z=MAP.zones[i];
    if (y>=z.y0 && y<z.y1 && x>=z.x0 && x<z.x1) return z;
  }
  return MAP.zones[0];
};

World.blocked = function(x,y){
  x=Math.round(x); y=Math.round(y);
  if (x<0||y<0||x>=MAP.cols||y>=MAP.rows) return true;
  return !!this.obstacles[key(x,y)];
};

World.step = function(dt){
  if (!this.enabled) return;
  var dx=0, dy=0;
  if (this.keys['arrowleft']||this.keys['a']) dx-=1;
  if (this.keys['arrowright']||this.keys['d']) dx+=1;
  if (this.keys['arrowup']||this.keys['w']) dy-=1;
  if (this.keys['arrowdown']||this.keys['s']) dy+=1;
  dx += this.joy.x; dy += this.joy.y;
  var speed = 4.2;  // 格/秒
  var len=Math.sqrt(dx*dx+dy*dy);
  var moving = len>0.15;
  this.moving=moving;
  if (!moving) return;
  dx/=len; dy/=len;
  if (Math.abs(dx)>Math.abs(dy)) this.lastDir = dx>0?'right':'left';
  else this.lastDir = dy>0?'down':'up';
  var nx=this.px+dx*speed*dt, ny=this.py+dy*speed*dt;
  /* 分轴碰撞 */
  if (!this.blocked(nx, this.py)) this.px=nx;
  if (!this.blocked(this.px, ny)) this.py=ny;
  this.updateCam();
  if (E.S) E.S.stats.steps++;
  /* 随机遇敌：每移动一段距离判定一次 */
  this.moveTimer += dt;
  if (this.moveTimer > 0.55){
    this.moveTimer=0;
    this.tryEncounter();
  }
  /* 自动触发脚下事件 */
  this.checkTileEvent();
  this.savePosThrottled();
};
World._posSaveT=0;
World.savePosThrottled=function(){ var now=Date.now(); if(now-this._posSaveT>1500){this._posSaveT=now;this.savePos();} };

World.tryEncounter = function(){
  if (this.encounterCooldown>0){ this.encounterCooldown--; return; }
  var z=this.zoneAt(Math.round(this.px),Math.round(this.py));
  if (!z || !z.monsters.length) return;
  /* 村庄/圣殿安全区不遇敌 */
  if (z.id===0 && Math.abs(this.px-20)<=8 && this.py>=36) return;
  if (z.id===4) return;
  var chance = 0.16 + z.id*0.03;
  if (Math.random()>chance) return;
  var mk = z.monsters[Math.floor(Math.random()*z.monsters.length)];
  var mon = D.MON_BY_KEY[mk];
  /* 按区域给怪物等级加成 */
  var lv = 1 + z.id*4 + Math.floor(Math.random()*3);
  this.encounterCooldown=2;
  if (this.onEncounter) this.onEncounter(mon, lv, false);
};

World.checkTileEvent = function(){
  var gx=Math.round(this.px), gy=Math.round(this.py);
  var self=this, now=Date.now();
  /* 宝箱：靠近自动开 */
  Object.keys(this.chests).forEach(function(i){
    var c=self.chests[i];
    if (Math.abs(c.x-gx)<=0 && Math.abs(c.y-gy)<=0){
      delete self.chests[i];
      if (E.S){ E.S.chestsOpened[i]=1; E.S.stats.chests++; E.bumpQuest('chest'); E.save(); }
      if (self.onChest) self.onChest(i);
    }
  });
  /* 踩到可见怪物：自动遇敌 */
  for (var j=0;j<self.mobs.length;j++){
    var m=self.mobs[j];
    var rk='mob_'+m.x+'_'+m.y;
    if (self.mobRespawn[rk] && now-self.mobRespawn[rk]<20000) continue;
    if (m.x===gx && m.y===gy){
      var mon=D.MON_BY_KEY[m.key]; var z=self.zoneAt(m.x,m.y);
      var lv=1+(z?z.id:0)*4+Math.floor(Math.random()*3);
      self.pendingMob=m;
      if (self.onEncounter) self.onEncounter(mon, lv, false);
      break;
    }
  }
};

/* 主动交互（靠近怪物 / NPC / Boss 时点交互键）；同时踩到怪物也会自动遇敌 */
World.interact = function(){
  var gx=Math.round(this.px), gy=Math.round(this.py);
  /* 优先检测附近可见怪物 */
  var self=this, now=Date.now(), nearMob=null;
  this.mobs.some(function(m){
    if (self.mobRespawn['mob_'+m.x+'_'+m.y] && now-self.mobRespawn['mob_'+m.x+'_'+m.y]<20000) return false;
    if (Math.abs(m.x-gx)<=1 && Math.abs(m.y-gy)<=1){ nearMob=m; return true; }
    return false;
  });
  if (nearMob){
    var mon=D.MON_BY_KEY[nearMob.key];
    var z=this.zoneAt(nearMob.x,nearMob.y);
    var lv=1+(z?z.id:0)*4+Math.floor(Math.random()*3);
    this.pendingMob=nearMob;
    if (this.onEncounter) this.onEncounter(mon, lv, false);
    return;
  }
  var npc = MAP.npcs.find(function(n){ return Math.abs(n.x-gx)<=2 && Math.abs(n.y-gy)<=2; });
  if (npc){ if (this.onTalk) this.onTalk(npc); return; }
  var boss = MAP.bosses.find(function(b){ return Math.abs(b.x-gx)<=2 && Math.abs(b.y-gy)<=2; });
  if (boss){
    var m=D.MON_BY_KEY[boss.key];
    if (this.onBoss) this.onBoss(m);
    return;
  }
  if (this.toastFn) this.toastFn('附近没有可交互的对象');
};
/* 战斗胜利后，标记该可见怪物暂离（20秒重生） */
World.markMobDefeated = function(){
  if (this.pendingMob){ this.mobRespawn['mob_'+this.pendingMob.x+'_'+this.pendingMob.y]=Date.now(); this.pendingMob=null; }
};

/* ---------- 渲染 ---------- */
World.draw = function(){
  var c=this.ctx, t=this.tile;
  c.clearRect(0,0,this.viewW,this.viewH);
  var startX=Math.floor(this.camX/t), startY=Math.floor(this.camY/t);
  var endX=Math.ceil((this.camX+this.viewW)/t), endY=Math.ceil((this.camY+this.viewH)/t);
  /* 地块 */
  for (var y=startY;y<=endY;y++) for (var x=startX;x<=endX;x++){
    if (x<0||y<0||x>=MAP.cols||y>=MAP.rows) continue;
    var z=this.zoneAt(x,y);
    var sx=Math.round(x*t-this.camX), sy=Math.round(y*t-this.camY);
    c.fillStyle=z.color;
    c.fillRect(sx,sy,t+1,t+1);
    /* 网格纹理 */
    if ((x+y)%2===0){ c.fillStyle='rgba(255,255,255,.025)'; c.fillRect(sx,sy,t,t); }
    /* 障碍 */
    var ob=this.obstacles[key(x,y)];
    if (ob){
      c.font=(t*0.86)+'px serif'; c.textAlign='center'; c.textBaseline='middle';
      c.fillText(ob, sx+t/2, sy+t/2+1);
    }
  }
  /* 村庄地砖（浅色区域提示） */
  c.fillStyle='rgba(255,222,150,.06)';
  c.fillRect((12)*t-this.camX, 36*t-this.camY, 16*t, 12*t);
  /* 宝箱 */
  var self=this;
  Object.keys(this.chests).forEach(function(i){
    var ch=self.chests[i];
    self.sprite('🎁', ch.x, ch.y, true);
  });
  /* 可见野生怪物（用生成的卡通图，带轻微上下浮动） */
  var now=Date.now();
  this.mobs.forEach(function(m){
    var rk='mob_'+m.x+'_'+m.y;
    if (self.mobRespawn[rk] && now-self.mobRespawn[rk]<20000) return; // 击杀后20秒重生
    var mon=D.MON_BY_KEY[m.key]; if(!mon)return;
    var bob=Math.sin(now/500+m.phase)*2;
    self.imageSprite(D.monsterImg(mon), m.x, m.y, t*1.15, bob, 'rgba(0,0,0,.22)');
  });
  /* NPC（用生成的卡通图，带名字标签；阴影统一深色避免浅色块） */
  MAP.npcs.forEach(function(n){
    self.imageSprite(D.npcImg(n), n.x, n.y, t*1.5, 0, 'rgba(0,0,0,.3)', n.name);
  });
  /* Boss（用怪物图） */
  MAP.bosses.forEach(function(b){
    if (E.S && E.S.bossDefeated[b.key]) return;
    var mon=D.MON_BY_KEY[b.key];
    self.imageSprite(mon?D.monsterImg(mon):'', b.x, b.y, t*1.8, 0, '#ff7a7a');
  });
  /* 玩家（卡通角色图） */
  this.imageSprite('../images/npc/player-hero.png', this.px, this.py, t*1.6, 0, 'rgba(0,0,0,.35)');
  /* 区域名提示 */
  var pz=this.zoneAt(Math.round(this.px),Math.round(this.py));
  if (this.zoneFn) this.zoneFn(pz ? pz.name : '');
};
World.sprite = function(emoji, gx, gy, shadow, color){
  var c=this.ctx,t=this.tile;
  var sx=gx*t-this.camX, sy=gy*t-this.camY;
  if (shadow){ c.fillStyle=color||'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(sx+t/2,sy+t*0.82,t*0.34,t*0.13,0,0,Math.PI*2); c.fill(); }
  c.font=(t*0.95)+'px serif'; c.textAlign='center'; c.textBaseline='middle';
  c.fillText(emoji, sx+t/2, sy+t/2);
};
/* 用图片绘制 sprite（透明底卡通图），失败时回退 emoji */
World.imageSprite = function(src, gx, gy, size, bob, shadowColor, label){
  var c=this.ctx,t=this.tile;
  var sx=gx*t-this.camX, sy=gy*t-this.camY+(bob||0);
  var sz=size||t*1.2;
  /* 地面阴影 */
  if (shadowColor){ c.fillStyle=shadowColor; c.beginPath(); c.ellipse(sx+t/2,sy+t*0.86,sz*0.32,sz*0.11,0,0,Math.PI*2); c.fill(); }
  var img=this.imgCache[src];
  if (img && img.complete && img.naturalWidth>0){
    c.drawImage(img, sx+t/2-sz/2, sy+t/2-sz/2, sz, sz);
  }
  /* 名字标签 */
  if (label){
    c.font='bold 11px sans-serif'; c.textAlign='center'; c.textBaseline='middle';
    var tw=c.measureText(label).width+10;
    c.fillStyle='rgba(0,0,0,.6)';
    c.beginPath();
    if (c.roundRect) { c.roundRect(sx+t/2-tw/2, sy-sz/2-16, tw, 15, 7); c.fill(); }
    else c.fillRect(sx+t/2-tw/2, sy-sz/2-16, tw, 15);
    c.fillStyle='#fff'; c.fillText(label, sx+t/2, sy-sz/2-8);
  }
};

World.start = function(){
  this.enabled=true;
  if (this.running) return;              // 幂等：已在运行不重复起循环
  this.running=true; this.last=performance.now();
  var self=this;
  function loop(now){ if(!self.running)return; var dt=Math.min(0.05,(now-self.last)/1000); self.last=now; self.step(dt); self.draw(); requestAnimationFrame(loop);}
  requestAnimationFrame(loop);
};
World.stop = function(){ this.enabled=false; this.running=false; this.savePos(); };

window.RPG_WORLD = World;
