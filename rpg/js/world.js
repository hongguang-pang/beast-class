/* ============================================================
 * 知识大陆 · 知识远征  —  地图探索
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
  vx:0, vy:0,               // 平滑速度（格/秒），带惯性
  walkPhase:0,              // 行走动画相位
  footDust:[],              // 脚步尘粒
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
  /* 烘焙整张地图美术底图（一次绘制，运行时零成本） */
  if (window.RPG_MAPART) window.RPG_MAPART.build(this.obstacles);
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
  var hero=D.npcImg({img:'player-hero.png'});   /* 带 sharecode 容错 */
  load(hero);
  this._heroSrc=hero;
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
  var w = stage ? stage.clientWidth : 0;
  var h = stage ? stage.clientHeight : 0;
  /* v6.2.1：布局未稳时 clientWidth/Height 可能为 0，回退到窗口尺寸，
   * 避免 canvas 被设成 0×0 导致主画面永久空白（小地图是独立 canvas 不受影响）。 */
  if (!w || !h){ w = window.innerWidth||375; h = window.innerHeight||667; }
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
    if (r < 0.062){
      /* 按区域决定树石比例：草原/森林多树，沙漠/高地多石 */
      var z=MAP.zones[0];
      for(var zi=0;zi<MAP.zones.length;zi++){ var zz=MAP.zones[zi];
        if(y>=zz.y0&&y<zz.y1&&x>=zz.x0&&x<zz.x1){ z=zz; break; } }
      var treeChance = (z.id===0||z.id===1) ? 0.78 : (z.id===4 ? 0.5 : 0.28);
      this.obstacles[key(x,y)] = (hash(x+99,y)<treeChance?'🌳':'🪨');
    }
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
  this.vx=0; this.vy=0; this.moving=false; this.footDust=[]; this.joy.x=0; this.joy.y=0;
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

World._camTarget = function(){
  var t=this.tile;
  var targetX = this.px*t - this.viewW/2 + t/2;
  var targetY = this.py*t - this.viewH/2 + t/2;
  targetX = Math.max(0, Math.min(MAP.cols*t - this.viewW, targetX));
  targetY = Math.max(0, Math.min(MAP.rows*t - this.viewH, targetY));
  return {x:targetX, y:targetY};
};
/* 瞬间对齐（读档/传送时用） */
World.updateCam = function(){
  var p=this._camTarget(); this.camX=p.x; this.camY=p.y;
};
/* 平滑跟随：相机以缓动追赶玩家，画面更柔和 */
World.updateCamSmooth = function(dt){
  var p=this._camTarget();
  var k=1-Math.exp(-7*dt);
  this.camX += (p.x-this.camX)*k;
  this.camY += (p.y-this.camY)*k;
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
  var MAX = 4.6;  // 最高速度（格/秒）
  var len=Math.sqrt(dx*dx+dy*dy);
  var input = len>0.12;
  if (input){ dx/=len; dy/=len; }
  /* 目标速度：有输入=最高速，松手=0；用指数缓动逼近，起步/刹车都平滑 */
  var tvx = input ? dx*MAX : 0, tvy = input ? dy*MAX : 0;
  var k = 1 - Math.exp(-(input?9:13)*dt);   // 起步稍慢、刹车更快
  this.vx += (tvx-this.vx)*k;
  this.vy += (tvy-this.vy)*k;
  if (Math.abs(this.vx)<0.02) this.vx=0;
  if (Math.abs(this.vy)<0.02) this.vy=0;
  var spd=Math.sqrt(this.vx*this.vx+this.vy*this.vy);
  this.moving = spd>0.25;
  /* 朝向取速度主导方向 */
  if (spd>0.4){
    if (Math.abs(this.vx)>Math.abs(this.vy)) this.lastDir = this.vx>0?'right':'left';
    else this.lastDir = this.vy>0?'down':'up';
  }
  /* 行走相位 & 脚步尘粒 */
  if (this.moving){
    this.walkPhase += dt*spd*3.2;
    if (this.walkPhase - (this._lastDust||0) > 0.9){
      this._lastDust=this.walkPhase;
      this.footDust.push({x:this.px, y:this.py+0.42, life:1});
      if (this.footDust.length>12) this.footDust.shift();
    }
  }
  /* 尘粒衰减 */
  for (var i=this.footDust.length-1;i>=0;i--){
    this.footDust[i].life -= dt*1.8;
    if (this.footDust[i].life<=0) this.footDust.splice(i,1);
  }
  if (!this.moving){ this.updateCamSmooth(dt); return; }
  var nx=this.px+this.vx*dt, ny=this.py+this.vy*dt;
  /* 分轴碰撞：撞墙时该轴速度归零，避免贴墙抖动 */
  if (!this.blocked(nx, this.py)) this.px=nx; else this.vx=0;
  if (!this.blocked(this.px, ny)) this.py=ny; else this.vy=0;
  this.updateCamSmooth(dt);
  if (E.S) E.S.stats.steps++;
  /* 随机遇敌：按实际移动距离判定 */
  this.moveTimer += spd*dt;
  if (this.moveTimer > 2.2){
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
      if (E.S){ E.S.chestsOpened[i]=1; E.S.stats.chests++; E.bumpQuest('chest'); E.bumpSide('chest'); E.save(); }
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
  /* v6.2.1 自愈：画布像素尺寸异常（0 或与视口*dpr 不符）时重算，
   * 修复移动端初始化竞态导致的主画面全黑。 */
  var dpr=Math.min(2,window.devicePixelRatio||1);
  if (!this.canvas.width || !this.canvas.height ||
      Math.abs(this.canvas.width-this.viewW*dpr)>2 ||
      Math.abs(this.canvas.height-this.viewH*dpr)>2){
    this.resize();
  }
  var c=this.ctx, t=this.tile;
  var camX0=this.camX, camY0=this.camY;
  var now=Date.now();
  c.clearRect(0,0,this.viewW,this.viewH);
  /* 烘焙好的美术底图：一次贴图，含地形/道路/水系/村庄/树石/区域名 */
  var blitted = window.RPG_MAPART ? window.RPG_MAPART.blit(c, this.camX, this.camY, this.viewW, this.viewH) : false;
  if (!blitted){
    /* 回退：旧版逐格纯色绘制 */
    var startX=Math.floor(this.camX/t), startY=Math.floor(this.camY/t);
    var endX=Math.ceil((this.camX+this.viewW)/t), endY=Math.ceil((this.camY+this.viewH)/t);
    for (var y=startY;y<=endY;y++) for (var x=startX;x<=endX;x++){
      if (x<0||y<0||x>=MAP.cols||y>=MAP.rows) continue;
      var z=this.zoneAt(x,y);
      var sx=Math.round(x*t-this.camX), sy=Math.round(y*t-this.camY);
      c.fillStyle=z.color; c.fillRect(sx,sy,t+1,t+1);
      if ((x+y)%2===0){ c.fillStyle='rgba(255,255,255,.025)'; c.fillRect(sx,sy,t,t); }
      var ob=this.obstacles[key(x,y)];
      if (ob){ c.font=(t*0.86)+'px serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillText(ob, sx+t/2, sy+t/2+1); }
    }
  }
  /* 动态水面波光（在底图之上，随时间流动） */
  this.drawWaterShimmer(now);
  /* 宝箱 */
  var self=this;
  Object.keys(this.chests).forEach(function(i){
    var ch=self.chests[i];
    self.sprite('🎁', ch.x, ch.y, true);
  });
  /* 可见野生怪物（用生成的卡通图，带轻微上下浮动） */
  this.mobs.forEach(function(m){
    var rk='mob_'+m.x+'_'+m.y;
    if (self.mobRespawn[rk] && now-self.mobRespawn[rk]<20000) return; // 击杀后20秒重生
    var mon=D.MON_BY_KEY[m.key]; if(!mon)return;
    var bob=Math.sin(now/500+m.phase)*2;
    self.imageSprite(D.monsterImg(mon), m.x, m.y, t*1.15, bob, 'rgba(0,0,0,.22)');
  });
  /* NPC（用生成的卡通图，带名字标签；好感度高时头顶显示爱心） */
  MAP.npcs.forEach(function(n){
    self.imageSprite(D.npcImg(n), n.x, n.y, t*1.5, 0, 'rgba(0,0,0,.3)', n.name);
    if (window.RPG_NPCFRIEND && window.RPG_NPCFRIEND.level(n.name)>=1){
      var hx=n.x*t-this.camX+t/2, hy=n.y*t-this.camY-t*0.55;
      var pulse=0.85+0.15*Math.sin(now/300+n.x);
      c.save(); c.globalAlpha=pulse; c.font=(t*0.5)+'px serif'; c.textAlign='center'; c.textBaseline='middle';
      c.fillText(window.RPG_NPCFRIEND.level(n.name)>=3?'💗':'💛', hx, hy); c.restore();
    }
  });
  /* Boss（用怪物图） */
  MAP.bosses.forEach(function(b){
    if (E.S && E.S.bossDefeated[b.key]) return;
    var mon=D.MON_BY_KEY[b.key];
    self.imageSprite(mon?D.monsterImg(mon):'', b.x, b.y, t*1.8, 0, '#ff7a7a');
  });
  /* 脚步尘粒 */
  this.footDust.forEach(function(d){
    var dx2=d.x*t-camX0, dy2=d.y*t-camY0;
    c.fillStyle='rgba(220,210,190,'+(d.life*0.35)+')';
    c.beginPath(); c.arc(dx2+t/2, dy2+t/2, t*0.06*(2-d.life), 0, Math.PI*2); c.fill();
  });
  /* 玩家（卡通角色图）：行走时上下起伏 + 左右朝向翻转 */
  var bob=this.moving ? Math.abs(Math.sin(this.walkPhase))*t*0.14 : 0;
  this.drawPlayer(t*1.6, bob);
  /* 环境氛围粒子：萤火虫/星光（轻量，随时间浮动，不占状态） */
  this.drawAmbient(now);
  /* 区域名提示 + 小地图 */
  var pz=this.zoneAt(Math.round(this.px),Math.round(this.py));
  if (this.zoneFn) this.zoneFn(pz ? pz.name : '');
  this.miniMapThrottled();
  /* 跨区域时弹出区域横幅 */
  if (pz && pz.id!==this._lastZoneId){
    this._lastZoneId=pz.id;
    var zb=document.getElementById('zoneBanner');
    if (zb && this._zoneBannerReady){
      var nm=document.getElementById('zoneBannerName'), sb=document.getElementById('zoneBannerSub');
      var subs=['🌱 冒险的起点','🍄 迷雾与奇遇','🏜️ 玩具与黄沙','⛈️ 风暴试炼','✨ 知识的尽头'];
      if(nm) nm.textContent=pz.name;
      if(sb) sb.textContent=subs[pz.id]||'';
      zb.classList.remove('show'); void zb.offsetWidth; zb.classList.add('show');
    } else { this._zoneBannerReady=true; }  // 首帧不弹，避免刚进游戏就闪
  }
};
/* 小地图：绘制区域色块 + 玩家/NPC/Boss/宝箱点位（节流调用） */
World.drawMiniMap = function(){
  var mc=document.getElementById('miniMap'); if(!mc) return;
  var mc2=mc.getContext('2d'), W=mc.width, H=mc.height;
  var sx=W/MAP.cols, sy=H/MAP.rows;
  mc2.clearRect(0,0,W,H);
  /* 区域底色 */
  MAP.zones.forEach(function(z){
    mc2.fillStyle=z.color;
    mc2.fillRect(z.x0*sx,z.y0*sy,(z.x1-z.x0)*sx,(z.y1-z.y0)*sy);
  });
  /* 宝箱 */
  var self=this;
  Object.keys(this.chests).forEach(function(i){ var c=self.chests[i];
    mc2.fillStyle='#ffd35c'; mc2.fillRect(c.x*sx-1.5,c.y*sy-1.5,3,3); });
  /* NPC */
  mc2.fillStyle='#8fe3ff';
  MAP.npcs.forEach(function(n){ mc2.fillRect(n.x*sx-1,n.y*sy-1,2.5,2.5); });
  /* Boss（未击败） */
  MAP.bosses.forEach(function(b){ if(E.S&&E.S.bossDefeated[b.key])return;
    mc2.fillStyle='#ff6b6b'; mc2.beginPath(); mc2.arc(b.x*sx,b.y*sy,2.4,0,6.2832); mc2.fill(); });
  /* 玩家（带光晕） */
  var pxx=this.px*sx, pyy=this.py*sy;
  mc2.fillStyle='rgba(255,255,255,.35)'; mc2.beginPath(); mc2.arc(pxx,pyy,4.5,0,6.2832); mc2.fill();
  mc2.fillStyle='#fff'; mc2.beginPath(); mc2.arc(pxx,pyy,2.4,0,6.2832); mc2.fill();
  mc2.strokeStyle='#ffd35c'; mc2.lineWidth=1; mc2.strokeRect(0.5,0.5,W-1,H-1);
};
World._mmT=0;
World.miniMapThrottled=function(){ var now=Date.now(); if(now-this._mmT>180){this._mmT=now;this.drawMiniMap();} };

/* 水面动态波光：在烘焙水系之上叠加随时间流动的白色波纹 */
World.drawWaterShimmer = function(now){
  var c=this.ctx, t=this.tile;
  function wave(cx,cy,phase,scale){
    var x=cx*t-this.camX, y=cy*t-this.camY;
    var off=Math.sin(now/900+phase)*t*0.12;
    c.strokeStyle='rgba(220,245,255,.45)'; c.lineWidth=1.6; c.lineCap='round';
    c.beginPath(); c.moveTo(x-t*scale+off,y); c.quadraticCurveTo(x,y-t*0.12,x+t*scale+off,y); c.stroke();
    c.beginPath(); c.moveTo(x-t*scale*0.7-off,y+t*0.32); c.quadraticCurveTo(x,y+t*0.2,x+t*scale*0.7-off,y+t*0.32); c.stroke();
  }
  wave.call(this,54,26,0,1.3);      // 绿洲池塘
  wave.call(this,52,6,1.8,1.6);     // 圣殿护城河
  wave.call(this,22,28,3.2,0.6);    // 森林小溪
};
/* 地图氛围粒子：漂浮的光点，营造森林萤火虫/魔法大陆氛围 */
World.drawAmbient = function(now){
  var c=this.ctx;
  if (!this._amb){
    this._amb=[];
    for (var i=0;i<26;i++) this._amb.push({ x:Math.random(), y:Math.random(), p:Math.random()*6.28, s:0.6+Math.random()*1.2, warm:Math.random()<0.5 });
  }
  for (var i=0;i<this._amb.length;i++){
    var a=this._amb[i];
    /* 在可视区内循环漂移 */
    var ax=((a.x + Math.sin(now/2600+a.p)*0.02)%1+1)%1;
    var ay=((a.y + now/9000*a.s)%1+1)%1;
    var px=ax*this.viewW, py=ay*this.viewH;
    var glow=0.45+0.55*(0.5+0.5*Math.sin(now/380+a.p));
    c.save(); c.globalAlpha=glow*0.7;
    c.shadowBlur=8*a.s; c.shadowColor=a.warm?'#ffd873':'#9fe8ff';
    c.fillStyle=a.warm?'#ffecae':'#d8f4ff';
    c.beginPath(); c.arc(px,py,1.6*a.s,0,6.28); c.fill();
    c.restore();
  }
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

/* 玩家角色绘制：支持左右朝向翻转与行走起伏 */
World.drawPlayer = function(size, bob){
  var c=this.ctx, t=this.tile;
  var sx=this.px*t-this.camX, sy=this.py*t-this.camY+(bob||0);
  /* 地面阴影（不随起伏浮动，贴地） */
  c.fillStyle='rgba(0,0,0,.35)';
  c.beginPath(); c.ellipse(sx+t/2, sy+t*0.86-(bob||0), size*0.3, size*0.1, 0, 0, Math.PI*2); c.fill();
  var img=this.imgCache[this._heroSrc||'../images/npc/player-hero.png'];
  var cx=sx+t/2, cy=sy+t/2-size*0.06;
  if (img && img.complete && img.naturalWidth>0){
    c.save();
    if (this.lastDir==='left'){ c.translate(cx,0); c.scale(-1,1); c.translate(-cx,0); }
    c.drawImage(img, cx-size/2, cy-size/2, size, size);
    c.restore();
  } else {
    c.font=(t)+'px serif'; c.textAlign='center'; c.textBaseline='middle';
    c.fillText(this.playerSprite||'🧑', cx, cy);
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
