/* ============================================================
 * 知识大陆 · 地图美术烘焙模块
 * 把整张地图一次性绘制到离屏 canvas：差异化地形 / 道路网 / 水系 /
 * 村庄建筑 / 装饰物 / 精致树石。运行时 world.js 只需 drawImage 一次，
 * 既丰富画面又不掉帧，且完全静态、离线可用。
 * ============================================================ */
'use strict';
(function(){
var D = window.RPG_DATA, MAP = D && D.MAP_CFG;
var A = { base:null, T:MAP?MAP.tile:30, W:0, H:0, ready:false };

/* 确定性 hash（同一格每次结果一致） */
function hash(x,y,s){ var n=Math.sin(x*127.1+y*311.7+(s||0)*74.7)*43758.5453; return n-Math.floor(n); }

function ellipse(c,x,y,rx,ry,fill){ c.beginPath(); c.ellipse(x,y,rx,ry,0,0,6.2832); c.fillStyle=fill; c.fill(); }
function poly(c,pts,fill,stroke,lw){
  c.beginPath(); c.moveTo(pts[0][0],pts[0][1]);
  for(var i=1;i<pts.length;i++) c.lineTo(pts[i][0],pts[i][1]);
  c.closePath();
  if(fill){ c.fillStyle=fill; c.fill(); }
  if(stroke){ c.lineWidth=lw||1; c.strokeStyle=stroke; c.stroke(); }
}
function rr(c,x,y,w,h,r,fill){ c.beginPath();
  if(c.roundRect) c.roundRect(x,y,w,h,r);
  else { c.rect(x,y,w,h); }
  c.fillStyle=fill; c.fill();
}
function zoneOf(x,y){
  var zs=MAP.zones;
  for(var i=0;i<zs.length;i++){ var z=zs[i]; if(y>=z.y0&&y<z.y1&&x>=z.x0&&x<z.x1) return z; }
  return zs[0];
}

/* 每个区域的调色板（地面双色 + 草/花 + 树冠） */
var PAL={
  0:{g:'#4a7d45',g2:'#3f6e3c',grass:'#79bd60',flower:['#fff3b0','#ffd1e8','#ffffff'],tree:['#2f7d3a','#3f9c49','#276b32']},
  1:{g:'#2f603c',g2:'#285134',grass:'#469a54',flower:['#ff8fa3','#ffd166','#c9a7ff'],tree:['#1f5e2e','#2b7c3b','#194d26']},
  2:{g:'#c0a165',g2:'#b09257',grass:'#e0c983',flower:['#e07a5f','#f4d35e','#fff1c9'],tree:['#7fa05b','#93b066']},
  3:{g:'#606b88',g2:'#525c78',grass:'#8b96b6',flower:['#cfe3ff','#ffffff','#b9d6ff'],tree:['#3f7261','#4f8370']},
  4:{g:'#63507d',g2:'#55436e',grass:'#9580c4',flower:['#ffe3a3','#e0c8ff','#fff'],tree:['#7d5fba','#9573d1']}
};

/* ---------- 装饰元素 ---------- */
function grassTuft(c,x,y,col,s){
  c.strokeStyle=col; c.lineWidth=1.4; c.lineCap='round';
  for(var i=-1;i<=1;i++){ c.beginPath(); c.moveTo(x+i*3,y); c.quadraticCurveTo(x+i*4,y-4*s,x+i*5,y-7*s); c.stroke(); }
}
function flower(c,x,y,cols){
  var r=1.6;
  ellipse(c,x,y-r, r,r*0.7, cols[0]);
  ellipse(c,x,y+r, r,r*0.7, cols[0]);
  ellipse(c,x-r,y, r*0.7,r, cols[0]);
  ellipse(c,x+r,y, r*0.7,r, cols[0]);
  ellipse(c,x,y, 1.3,1.3, '#ffcf3f');
}
function mushroom(c,x,y,cap){
  rr(c,x-1.5,y-1,3,5,1.5,'#f3ead2');
  ellipse(c,x,y-1,5,3.4,cap);
  ellipse(c,x-1.6,y-2,1,0.7,'#ffffffbb');
  ellipse(c,x+1.8,y-1.4,0.8,0.6,'#ffffffaa');
}
function cactus(c,x,y,col){
  rr(c,x-3,y-11,6,13,3,col);
  rr(c,x-6,y-8,3,6,1.5,col);
  rr(c,x+4,y-10,3,7,1.5,col);
  c.strokeStyle='#0004'; c.lineWidth=0.6;
  for(var k=-8;k<=0;k+=3){ c.beginPath(); c.moveTo(x-3,y+k); c.lineTo(x-4,y+k); c.stroke(); }
}
function crystal(c,x,y,col){
  var g=c.createLinearGradient(x,y-13,x,y+2); g.addColorStop(0,'#ffffffcc'); g.addColorStop(1,col);
  poly(c,[[x,y-13],[x+5,y-3],[x,y+2],[x-5,y-3]],g,'#ffffff55',1);
  poly(c,[[x,y-13],[x,y+2],[x-5,y-3]],'#ffffff33');
}
function runeTile(c,x,y,T){
  c.strokeStyle='#e0c8ff55'; c.lineWidth=1;
  c.strokeRect(x+4,y+4,T-8,T-8);
  c.beginPath(); c.arc(x+T/2,y+T/2,T*0.22,0,6.2832); c.stroke();
  c.beginPath(); c.moveTo(x+T/2,y+6); c.lineTo(x+T/2,y+T-6); c.moveTo(x+6,y+T/2); c.lineTo(x+T-6,y+T/2); c.stroke();
}
function snowCap(c,x,y,r){ ellipse(c,x,y,r,r*0.5,'#ffffffcc'); }

/* 程序化树：替代单调 emoji 🌳 */
function drawTree(c,cx,cy,T,kind,pal){
  var s=T*(0.9+hash(cx,cy,7)*0.25);
  ellipse(c,cx,cy+T*0.36,s*0.42,s*0.14,'rgba(0,0,0,.22)');          // 影子
  rr(c,cx-s*0.11,cy-T*0.1,s*0.22,T*0.5,2,'#6b4a2f');                // 树干
  rr(c,cx-s*0.02,cy-T*0.05,s*0.05,T*0.45,1,'#8a6542');              // 树干高光
  var col=pal.tree[Math.floor(hash(cx,cy,8)*pal.tree.length)];
  var cy0=cy-T*0.28;
  ellipse(c,cx,cy0,s*0.46,s*0.42,col);                              // 树冠主
  ellipse(c,cx-s*0.26,cy0+T*0.12,s*0.3,s*0.28,pal.tree[0]);          // 左下
  ellipse(c,cx+s*0.26,cy0+T*0.12,s*0.3,s*0.28,pal.tree[pal.tree.length-1]); // 右下
  ellipse(c,cx,cy0-T*0.24,s*0.32,s*0.26,pal.tree[Math.min(1,pal.tree.length-1)]); // 顶
  ellipse(c,cx-s*0.14,cy0-T*0.12,s*0.12,s*0.08,'#ffffff33');        // 高光
  if(kind===4){ ellipse(c,cx,cy0-T*0.34,s*0.18,s*0.1,'#e0c8ff88'); }  // 圣殿发光树
}
/* 程序化石：替代单调 emoji 🪨 */
function drawRock(c,cx,cy,T,kind){
  var s=T*(0.5+hash(cx,cy,9)*0.3), pts=[], n=8;
  for(var i=0;i<n;i++){ var a=i/n*6.2832, r=s*(0.62+hash(cx+i,cy,10)*0.5); pts.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r*0.68]); }
  ellipse(c,cx,cy+s*0.32,s*0.62,s*0.18,'rgba(0,0,0,.18)');
  var base = kind===2?'#a99a78' : kind===3?'#828ca8' : kind===4?'#8a78a4' : '#929b8c';
  poly(c,pts,base,'#0002',0.8);
  /* 顶面高光 + 苔藓点缀，减少六边形规整感 */
  poly(c,[[cx,cy-s*0.45],[cx+s*0.42,cy-s*0.12],[cx,cy+s*0.08],[cx-s*0.42,cy-s*0.12]],'#ffffff3a');
  if(kind===0||kind===1) ellipse(c,cx-s*0.3,cy-s*0.3,s*0.22,s*0.12,'#5a8f4a66');
  if(hash(cx,cy,12)>0.6) ellipse(c,cx+s*0.25,cy-s*0.1,s*0.12,s*0.08,'#ffffff44');
}

/* ---------- 道路网 ---------- */
function drawRoads(c,T){
  var roads=[
    // 村庄主街（东西向）
    [[11,40],[15,40],[20,40],[24,41],[28,41]],
    // 北上主干：村庄→森林→沙漠→圣殿
    [[20,40],[20,34],[19,29],[21,25],[26,22],[33,19],[40,17],[46,14],[50,10],[52,6],[53,4]],
    // 村长→训练师
    [[20,40],[17,38],[14,36]],
    // 村长→学者/探险家
    [[20,40],[25,40],[30,40],[34,38]],
    // 森林→沙漠支线
    [[21,25],[29,25],[36,24],[42,22]],
    // 高地→各 Boss
    [[40,17],[36,13],[36,12]],
    [[50,10],[46,7],[46,6]],
    [[50,10],[54,8],[56,4]]
  ];
  function path(pts){ c.beginPath(); c.moveTo(pts[0][0]*T+T/2,pts[0][1]*T+T/2);
    for(var i=1;i<pts.length;i++) c.lineTo(pts[i][0]*T+T/2,pts[i][1]*T+T/2); }
  roads.forEach(function(pts){
    path(pts); c.lineCap='round'; c.lineJoin='round'; c.lineWidth=T*0.62; c.strokeStyle='#0003'; c.stroke();
    path(pts); c.lineWidth=T*0.5; c.strokeStyle='#cbb893'; c.stroke();
    path(pts); c.lineWidth=T*0.36; c.strokeStyle='#e3d3ae'; c.stroke();
  });
  // 路面碎石
  roads.forEach(function(pts,ri){
    for(var i=0;i<pts.length-1;i++){
      var x0=pts[i][0]*T+T/2,y0=pts[i][1]*T+T/2,x1=pts[i+1][0]*T+T/2,y1=pts[i+1][1]*T+T/2;
      for(var t=0.15;t<1;t+=0.22){ var px=x0+(x1-x0)*t, py=y0+(y1-y0)*t;
        ellipse(c,px+(hash(ri,i*10+t|0,1)-0.5)*T*0.4,py+(hash(ri,i*10+t|0,2)-0.5)*T*0.4,1.6,1.1,'#00000018'); }
    }
  });
}

/* ---------- 水系 ---------- */
function water(c,x,y,w,h,r,col){
  rr(c,x,y,w,h,r,col);
}
function drawWater(c,T){
  // 森林蜿蜒小溪（纵向）
  c.save();
  c.lineCap='round'; c.lineJoin='round';
  var stream=[[22,20],[21,24],[23,27],[22,30],[24,33]];
  c.beginPath(); c.moveTo(stream[0][0]*T+T/2,stream[0][1]*T+T/2);
  for(var i=1;i<stream.length;i++) c.lineTo(stream[i][0]*T+T/2,stream[i][1]*T+T/2);
  c.lineWidth=T*1.1; c.strokeStyle='#3f7fb0'; c.stroke();
  c.lineWidth=T*0.85; c.strokeStyle='#4f9fd4'; c.stroke();
  c.lineWidth=T*0.3; c.strokeStyle='#a8ddff88'; c.stroke();
  c.restore();
  // 沙漠绿洲池塘
  ellipse(c,54*T+T/2,26*T+T/2,T*2.6,T*1.9,'#3f9fd4');
  ellipse(c,54*T+T/2,26*T+T/2,T*2.2,T*1.5,'#5bb4e0');
  ellipse(c,54*T+2,26*T-4,T*1.4,T*0.8,'#a8ddff66');
  // 圣殿前方护城河（弧）
  c.beginPath(); c.arc(52*T+T/2,6*T+T/2,T*5,Math.PI*1.05,Math.PI*1.95);
  c.lineWidth=T*1.2; c.strokeStyle='#3f7fb0'; c.stroke();
  c.lineWidth=T*0.85; c.strokeStyle='#5bb4e0'; c.stroke();
}

/* ---------- 村庄建筑 ---------- */
function house(c,gx,gy,T,roof){
  var x=gx*T, y=gy*T, w=T*2.2, h=T*1.9;
  ellipse(c,x+w/2,y+h+T*0.1,w*0.5,T*0.18,'rgba(0,0,0,.22)');      // 影
  rr(c,x+T*0.15,y+T*0.55,w-T*0.3,h-T*0.55,3,'#e8d8ad');            // 墙
  rr(c,x+T*0.15,y+T*0.55,w-T*0.3,T*0.22,2,'#fff6dd');              // 墙高光
  // 屋顶
  poly(c,[[x,y+T*0.6],[x+w/2,y-T*0.35],[x+w,y+T*0.6]],roof,'#0004',1.4);
  poly(c,[[x+w/2,y-T*0.35],[x+w,y+T*0.6],[x+w/2,y+T*0.6]],'#00000022'); // 屋顶暗面
  // 门窗
  rr(c,x+w*0.42,y+h-T*0.62,T*0.34,T*0.62,2,'#8a5a34');
  rr(c,x+w*0.44,y+h-T*0.6,T*0.1,T*0.58,1,'#a87448');
  rr(c,x+w*0.2,y+h-T*0.86,T*0.28,T*0.28,2,'#8fd0ff');
  rr(c,x+w*0.66,y+h-T*0.86,T*0.28,T*0.28,2,'#8fd0ff');
  // 烟囱
  rr(c,x+w*0.74,y-T*0.1,T*0.22,T*0.5,1,'#b06a4a');
}
function lamp(c,gx,gy,T){
  var x=gx*T+T/2,y=gy*T+T/2;
  var g=c.createRadialGradient(x,y-T*0.9,2,x,y-T*0.9,T*2.2);
  g.addColorStop(0,'#ffd87366'); g.addColorStop(1,'#ffd87300');
  c.fillStyle=g; c.beginPath(); c.arc(x,y-T*0.9,T*2.2,0,6.2832); c.fill();
  c.strokeStyle='#5a4630'; c.lineWidth=2.4; c.beginPath(); c.moveTo(x,y+T*0.3); c.lineTo(x,y-T*0.7); c.stroke();
  ellipse(c,x,y-T*0.85,T*0.2,T*0.26,'#ffe9a0');
}
function drawVillage(c,T){
  // 村庄石地板
  c.fillStyle='#00000018'; c.fillRect(12*T,36*T,16*T,12*T);
  for(var gy=36;gy<48;gy+=2) for(var gx=12;gx<28;gx+=2){
    if(hash(gx,gy,21)>0.35) rr(c,gx*T+3,gy*T+3,T*2-6,T*2-6,4,'#d9cfae44');
  }
  // 围栏（村庄北边界）
  for(var fx=12;fx<=28;fx++){ var fy=36;
    rr(c,fx*T+T*0.35,fy*T-T*0.1,T*0.3,T*0.7,1,'#8a6542');
  }
  rr(c,12*T,36*T-T*0.05,16*T,T*0.18,1,'#a07c52');
  // 房屋（避开 NPC 与出生点）
  house(c,15,44,T,'#d9666a');
  house(c,25,45,T,'#6aa7d9');
  house(c,16,37,T,'#e0a24f');
  house(c,26,37,T,'#8f6fc4');
  // 路灯（暖光）
  lamp(c,18,40,T); lamp(c,22,40,T); lamp(c,14,41,T); lamp(c,27,41,T);
  // 中央告示牌
  var bx=24*T+T/2, by=39*T+T/2;
  c.strokeStyle='#6b4a2f'; c.lineWidth=3; c.beginPath(); c.moveTo(bx,by+T*0.4); c.lineTo(bx,by-T*0.5); c.stroke();
  rr(c,bx-T*0.55,by-T*0.85,T*1.1,T*0.55,3,'#c99b5a');
  rr(c,bx-T*0.45,by-T*0.75,T*0.9,T*0.08,1,'#fff2c9');
  rr(c,bx-T*0.45,by-T*0.58,T*0.7,T*0.06,1,'#fff2c988');
}

/* 区域名大字（半透明，铺在地形上做地标） */
function drawZoneTitles(c,T){
  var titles=[
    {t:'新 手 草 原',x:8,y:44,z:0},
    {t:'蘑 菇 森 林',x:15,y:22,z:1},
    {t:'玩 具 谷',x:44,y:19,z:2},
    {t:'风 暴 高 地',x:24,y:8,z:3},
    {t:'知 识 圣 殿',x:43,y:2,z:4}
  ];
  titles.forEach(function(o){
    c.save();
    c.globalAlpha=0.16; c.font='900 '+T*1.7+'px "PingFang SC",sans-serif';
    c.textAlign='center'; c.textBaseline='middle'; c.fillStyle='#fff';
    c.shadowColor='#000'; c.shadowBlur=T*0.5;
    c.fillText(o.t,o.x*T+T/2,o.y*T+T/2);
    c.restore();
  });
}

/* ---------- 主烘焙 ---------- */
A.build = function(obstacles){
  obstacles = obstacles || {};
  if(this.base && this.ready) return this.base;
  var T=this.T, cols=MAP.cols, rows=MAP.rows, W=this.W=cols*T, H=this.H=rows*T;
  var cv=document.createElement('canvas'); cv.width=W; cv.height=H;
  var c=cv.getContext('2d');

  // 1) 地块底色 + 噪声 + 网格 + 地形装饰
  for(var gy=0;gy<rows;gy++) for(var gx=0;gx<cols;gx++){
    var z=zoneOf(gx,gy), p=PAL[z.id], x=gx*T, y=gy*T;
    c.fillStyle=(hash(gx,gy,1)>0.5)?p.g:p.g2;
    c.fillRect(x,y,T+1,T+1);
    // 微妙明暗噪声
    var nz=hash(gx,gy,2);
    c.fillStyle=nz>0.5?'#ffffff08':'#0000000d';
    c.fillRect(x,y,T,T);
    // 区域边缘柔化描边
    if(gx===z.x0||gy===z.y0||gx===z.x1-1||gy===z.y1-1){ c.fillStyle='#ffffff08'; c.fillRect(x,y,T,T); }
    // 地形纹理（按区域）
    var h3=hash(gx,gy,3);
    if(z.id===0||z.id===1){
      if(h3>0.45) grassTuft(c,x+6+hash(gx,gy,4)*T*0.4,y+T-6,p.grass,0.8+hash(gx,gy,5)*0.5);
      if(h3>0.93) flower(c,x+8+hash(gx,gy,6)*T*0.5,y+T*0.55,p.flower);
      if(z.id===1&&h3>0.86) mushroom(c,x+T*0.35+hash(gx,gy,11)*T*0.3,y+T*0.7,'#d9606a');
    } else if(z.id===2){
      if(h3>0.6) { c.strokeStyle='#00000010'; c.lineWidth=1.2; c.beginPath(); c.moveTo(x+4,y+T*0.6); c.quadraticCurveTo(x+T/2,y+T*0.4,x+T-4,y+T*0.65); c.stroke(); }
      if(h3>0.91) cactus(c,x+T*0.5,y+T*0.85,'#6f9450');
      if(h3<0.04) drawRock(c,x+T/2,y+T/2,T,2);
    } else if(z.id===3){
      if(h3>0.7) { c.strokeStyle='#ffffff18'; c.lineWidth=1; c.beginPath(); c.moveTo(x+3,y+T*0.4); c.lineTo(x+T*0.55,y+T*0.7); c.lineTo(x+T-3,y+T*0.5); c.stroke(); }
      if(h3>0.94) crystal(c,x+T*0.5,y+T*0.7,'#7fb8ff');
      if(h3<0.05) snowCap(c,x+T*0.5,y+T*0.3,T*0.2);
    } else if(z.id===4){
      runeTile(c,x,y,T);
      if(h3>0.9) crystal(c,x+T*0.5,y+T*0.72,'#c79bff');
    }
  }

  // 2) 水系（在地形之上）
  drawWater(c,T);
  // 3) 道路网
  drawRoads(c,T);
  // 4) 村庄
  drawVillage(c,T);
  // 5) 障碍：精致树石（替代 emoji）
  Object.keys(obstacles).forEach(function(k){
    var pp=k.split(','), gx=+pp[0], gy=+pp[1], z=zoneOf(gx,gy), T2=T;
    var isTree=(obstacles[k]==='🌳');
    if(isTree) drawTree(c,gx*T2+T2/2,gy*T2+T2/2,T2,z.id,PAL[z.id]);
    else drawRock(c,gx*T2+T2/2,gy*T2+T2/2,T2,z.id);
  });
  // 6) 区域名大字
  drawZoneTitles(c,T);

  this.base=cv; this.ready=true;
  return cv;
};

/* 供 world.js 调用的便捷方法：把底图按视口贴到目标 ctx */
A.blit = function(ctx, camX, camY, viewW, viewH){
  if(!this.ready) return false;
  ctx.drawImage(this.base, camX, camY, viewW, viewH, 0, 0, viewW, viewH);
  return true;
};

window.RPG_MAPART=A;
})();
