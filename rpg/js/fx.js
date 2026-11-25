/* ============================================================
 * 知识大陆 · 知识远征  —  战斗特效引擎 RPG_FX
 * 借鉴 pixelfx 理念：代码化特效 / palette 配色解耦 / 分层 / 命中定格+震屏
 * 纯 Canvas 粒子，零外部素材，PWA 离线可用
 * ============================================================ */
'use strict';
(function(){
  var canvas=null, ctx=null, W=0, H=0, dpr=1;
  var particles=[], rings=[], texts=[], running=false, lastT=0, shakeUntil=0, shakeMag=0;
  var sceneEl=null;

  /* 属性调色板（从暗到亮，类似 pixelfx 的 palette ramp） */
  var PAL={
    fire : ['#7a1500','#e13b0f','#ff7b1f','#ffc23d','#fff3b0'],
    water: ['#0b2e6b','#1668c7','#38a9ef','#8fe0ff','#eafaff'],
    wood : ['#124d1c','#2e9e3f','#67cf5a','#b6f07a','#efffd6'],
    light: ['#8a6100','#e0a20d','#ffd94a','#fff2a8','#ffffff'],
    dark : ['#25063c','#6a1b9a','#a63fd6','#d98cff','#f4e0ff'],
    hit  : ['#8a1a1a','#e04a3a','#ff9a6a','#ffe0b0','#ffffff'],
    heal : ['#0e6b3a','#1fbf6a','#6ef0a0','#c6ffd9','#ffffff'],
    gold : ['#8a5a00','#e0a020','#ffd94a','#fff2a8','#ffffff']
  };
  function pick(pal){ return pal[Math.floor(Math.random()*pal.length)]; }
  function rand(a,b){ return a+Math.random()*(b-a); }

  function resize(){
    if(!canvas) return;
    W=window.innerWidth; H=window.innerHeight; dpr=Math.min(2,window.devicePixelRatio||1);
    canvas.width=W*dpr; canvas.height=H*dpr;
    canvas.style.width=W+'px'; canvas.style.height=H+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }

  /* 取得战斗中某个元素的中心坐标（canvas 为 fixed，取视口坐标） */
  function centerOf(id){
    var el=document.getElementById(id);
    if(!el||!canvas) return {x:W/2,y:H/2};
    var a=el.getBoundingClientRect();
    return { x:a.left+a.width/2, y:a.top+a.height/2, w:a.width, h:a.height };
  }

  /* ---------- 粒子发射器 ---------- */
  function spark(x,y,opt){
    opt=opt||{};
    var ang=opt.ang!=null?opt.ang:rand(0,Math.PI*2);
    var spd=opt.spd!=null?opt.spd:rand(60,220);
    particles.push({
      x:x, y:y,
      vx:Math.cos(ang)*spd, vy:Math.sin(ang)*spd,
      g:opt.g!=null?opt.g:180, drag:opt.drag!=null?opt.drag:0.92,
      life:opt.life!=null?opt.life:rand(0.4,0.9), max:0,
      size:opt.size!=null?opt.size:rand(2,5),
      shape:opt.shape||'dot', pal:opt.pal||PAL.fire,
      spin:rand(-6,6), rot:rand(0,6.28), glow:opt.glow!==false,
      shrink:opt.shrink!==false
    });
    particles[particles.length-1].max=particles[particles.length-1].life;
  }
  function ring(x,y,opt){
    opt=opt||{};
    rings.push({ x:x,y:y, r:opt.r0||6, r1:opt.r1||70, life:opt.life||0.5, max:opt.life||0.5,
      w:opt.w||4, pal:opt.pal||PAL.fire, fill:!!opt.fill });
  }
  function floatText(x,y,txt,opt){
    opt=opt||{};
    texts.push({ x:x,y:y, txt:String(txt), vy:opt.vy||-70, life:opt.life||0.95, max:opt.life||0.95,
      color:opt.color||'#fff', size:opt.size||26, bold:opt.bold!==false, stroke:opt.stroke||'#1a1030' });
  }

  /* ---------- 具体特效 ---------- */

  /* 斩击刀光（普攻）：一道斜向弧光 + 火花 */
  var FX_slash = function(targetId, pal){
    var c=centerOf(targetId||'bEnemyImg'); pal=pal||PAL.hit;
    for(var i=0;i<8;i++){
      spark(c.x+rand(-18,18), c.y+rand(-18,18), {ang:rand(-2.4,-0.5), spd:rand(120,300), g:120, life:rand(0.25,0.45), size:rand(2,4), pal:pal, shape:'slash'});
    }
    ring(c.x,c.y,{r0:10,r1:52,life:0.32,w:5,pal:pal});
  };

  /* 属性技能爆发：核心大招粒子（借鉴 fire/fireball、frost-nova、chain-lightning 等） */
  var FX_burst = function(targetId, elem, big){
    var c=centerOf(targetId||'bEnemyImg');
    var pal=PAL[elem]||PAL.light;
    var n=big?56:34;
    /* 放射粒子 */
    for(var i=0;i<n;i++){
      var ang=rand(0,Math.PI*2), spd=rand(90, big?340:250);
      spark(c.x,c.y,{ang:ang, spd:spd, g:elem==='fire'?60:150, life:rand(0.5,big?1.15:0.85),
        size:rand(2,big?7:5), pal:pal, shape: elem==='wood'?'leaf': (elem==='light'||elem==='dark'?'star':'dot')});
    }
    /* 属性特有形态 */
    if (elem==='fire'){ for(var f=0;f<12;f++) spark(c.x+rand(-14,14),c.y+rand(6,20),{ang:rand(-1.9,-1.2),spd:rand(40,120),g:-30,life:rand(0.5,1),size:rand(4,9),pal:pal,shape:'dot'}); }
    if (elem==='water'){ ring(c.x,c.y,{r0:8,r1:big?96:74,life:0.6,w:6,pal:pal}); for(var w=0;w<10;w++) spark(c.x,c.y,{ang:rand(0,6.28),spd:rand(60,160),g:260,life:0.7,size:rand(3,6),pal:pal,shape:'dot'}); }
    if (elem==='wood'){ for(var l=0;l<14;l++) spark(c.x,c.y,{ang:rand(0,6.28),spd:rand(70,180),g:120,life:rand(0.7,1.1),size:rand(4,8),pal:pal,shape:'leaf'}); }
    if (elem==='light'){ for(var s=0;s<16;s++) spark(c.x,c.y,{ang:rand(0,6.28),spd:rand(120,300),g:20,life:rand(0.6,1),size:rand(3,7),pal:pal,shape:'star'}); ring(c.x,c.y,{r0:6,r1:big?110:84,life:0.7,w:4,pal:pal}); }
    if (elem==='dark'){ for(var d=0;d<16;d++) spark(c.x,c.y,{ang:rand(0,6.28),spd:rand(50,200),g:-10,life:rand(0.7,1.2),size:rand(5,11),pal:pal,shape:'orb'}); ring(c.x,c.y,{r0:40,r1:6,life:0.6,w:5,pal:pal}); }
    /* 多层冲击环 */
    ring(c.x,c.y,{r0:6,r1:big?88:64,life:0.45,w:big?7:5,pal:pal});
    setTimeout(function(){ ring(c.x,c.y,{r0:10,r1:big?120:86,life:0.5,w:3,pal:pal}); },90);
  };

  /* 魔法阵蓄力（答题成功→技能发动前的仪式感） */
  var FX_circle = function(targetId, elem){
    var c=centerOf(targetId||'bMyImg');
    var pal=PAL[elem]||PAL.light;
    rings.push({ x:c.x,y:c.y, r:8, r1:60, life:0.55,max:0.55, w:3, pal:pal, glyph:true });
    for(var i=0;i<18;i++){
      var a=i/18*Math.PI*2;
      spark(c.x+Math.cos(a)*40, c.y+Math.sin(a)*40, {ang:a, spd:30, g:0, life:0.55, size:3, pal:pal, shape:'star'});
    }
  };

  /* 命中：闪光 + 震屏 + 击退抖动 */
  var FX_hit = function(targetId, crit){
    var c=centerOf(targetId||'bEnemyImg');
    for(var i=0;i<(crit?22:12);i++) spark(c.x,c.y,{ang:rand(0,6.28),spd:rand(80,crit?320:220),g:160,life:rand(0.25,0.5),size:rand(2,crit?5:4),pal:crit?PAL.gold:PAL.hit,shape:'dot'});
    ring(c.x,c.y,{r0:4,r1:crit?70:46,life:0.28,w:crit?6:4,pal:crit?PAL.gold:PAL.hit});
    FX_shake(crit?9:5, crit?0.34:0.22);
    FX_flash(crit?'rgba(255,220,120,.30)':'rgba(255,120,90,.20)');
  };

  /* 伤害飘字 */
  var FX_damage = function(targetId, value, crit){
    var c=centerOf(targetId||'bEnemyImg');
    floatText(c.x+rand(-14,14), c.y-20, '-'+value, {color:crit?'#ffd94a':'#fff4e6', size:crit?38:28, life:crit?1.15:0.9});
    if(crit) floatText(c.x, c.y-52, '暴击!', {color:'#ff8a4a', size:20, life:1});
  };
  var FX_healText = function(targetId, value){
    var c=centerOf(targetId||'bMyImg');
    floatText(c.x, c.y-16, '+'+value, {color:'#8fffb0', size:28, life:1});
  };

  /* 震屏：作用于战斗场景容器（transform 位移） */
  var FX_shake = function(mag, dur){
    shakeMag=Math.max(shakeMag,mag); shakeUntil=Math.max(shakeUntil, performance.now()+dur*1000);
  };
  /* 全屏闪光：叠加一层短暂半透明色 */
  var FX_flash = function(color){
    var f=document.getElementById('fxFlash');
    if(!f) return;
    f.style.background=color; f.style.opacity='1';
    f.style.transition='none';
    requestAnimationFrame(function(){ f.style.transition='opacity .3s ease-out'; f.style.opacity='0'; });
  };

  /* 胜利礼花 + 掉落光柱 */
  var FX_victory = function(isBoss){
    for(var b=0;b<(isBoss?5:3);b++){
      (function(k){ setTimeout(function(){
        var cx=rand(W*0.2,W*0.8), cy=rand(H*0.25,H*0.55);
        var pal=[PAL.gold,PAL.light,PAL.water,PAL.wood,PAL.dark][k%5];
        for(var i=0;i<34;i++) spark(cx,cy,{ang:rand(0,6.28),spd:rand(80,300),g:200,life:rand(0.8,1.5),size:rand(3,6),pal:pal,shape:Math.random()<0.5?'star':'dot'});
        ring(cx,cy,{r0:6,r1:80,life:0.5,w:4,pal:pal});
      },k*160); })(b);
    }
    FX_shake(4,0.3);
  };
  var FX_lootBeam = function(){
    var c=centerOf('bEnemyImg');
    for(var i=0;i<20;i++) spark(c.x+rand(-24,24), c.y+rand(-10,10), {ang:rand(-2.6,-0.5),spd:rand(40,140),g:-40,life:rand(0.7,1.2),size:rand(3,6),pal:PAL.gold,shape:'star'});
  };

  /* 升级光柱 */
  var FX_levelUp = function(targetId){
    var c=centerOf(targetId||'bMyImg');
    for(var i=0;i<30;i++) spark(c.x+rand(-30,30), c.y+rand(-6,10), {ang:rand(-2.5,-0.6),spd:rand(60,180),g:-20,life:rand(0.8,1.4),size:rand(3,7),pal:PAL.gold,shape:'star'});
    ring(c.x,c.y,{r0:10,r1:100,life:0.8,w:5,pal:PAL.gold});
    floatText(c.x, c.y-46, 'LEVEL UP!', {color:'#ffd94a', size:24, life:1.4});
  };

  /* 受击：目标红闪（CSS class） */
  var FX_hurt = function(targetId){
    var el=document.getElementById(targetId||'bMyImg');
    if(!el) return;
    el.style.transition='none'; el.style.filter='brightness(2.2) sepia(1) hue-rotate(-40deg) saturate(4)';
    setTimeout(function(){ el.style.transition='filter .28s ease-out'; el.style.filter=''; },70);
    FX_shake(6,0.25);
  };

  /* ---------- 渲染循环 ---------- */
  function tick(now){
    if(!running) return;
    var dt=Math.min(0.04,(now-lastT)/1000)||0.016; lastT=now;
    ctx.clearRect(0,0,W,H);

    /* 粒子 */
    for(var i=particles.length-1;i>=0;i--){
      var p=particles[i];
      p.life-=dt;
      if(p.life<=0){ particles.splice(i,1); continue; }
      p.vy+=p.g*dt; p.vx*=Math.pow(p.drag,dt*60); p.vy*=Math.pow(p.drag,dt*60);
      p.x+=p.vx*dt; p.y+=p.vy*dt; p.rot+=p.spin*dt;
      var t=p.life/p.max, alpha=Math.min(1,t*1.6), sz=p.shrink?p.size*(0.35+t*0.65):p.size;
      ctx.save();
      ctx.globalAlpha=alpha;
      if(p.glow){ ctx.shadowBlur=sz*2.2; ctx.shadowColor=pick(p.pal); }
      ctx.fillStyle=pick(p.pal);
      var col=ctx.fillStyle;
      ctx.translate(p.x,p.y); ctx.rotate(p.rot);
      if(p.shape==='star'){
        star(ctx,0,0,sz*1.6,sz*0.5,4); ctx.fill();
      } else if(p.shape==='leaf'){
        ctx.beginPath(); ctx.ellipse(0,0,sz*1.5,sz*0.6,0,0,6.28); ctx.fill();
      } else if(p.shape==='slash'){
        ctx.fillRect(-sz*2.2,-sz*0.35,sz*4.4,sz*0.7);
      } else if(p.shape==='orb'){
        ctx.beginPath(); ctx.arc(0,0,sz,0,6.28); ctx.fill();
        ctx.globalAlpha=alpha*0.4; ctx.beginPath(); ctx.arc(0,0,sz*1.8,0,6.28); ctx.fill();
      } else {
        ctx.beginPath(); ctx.arc(0,0,sz,0,6.28); ctx.fill();
      }
      ctx.restore();
    }
    /* 冲击环 */
    for(var j=rings.length-1;j>=0;j--){
      var r=rings[j]; r.life-=dt;
      if(r.life<=0){ rings.splice(j,1); continue; }
      var rt=1-r.life/r.max, rr=r.r+(r.r1-r.r)*easeOut(rt);
      ctx.save(); ctx.globalAlpha=Math.min(1,r.life/r.max*1.5);
      ctx.strokeStyle=pick(r.pal); ctx.lineWidth=r.w*(1-rt*0.5);
      ctx.shadowBlur=10; ctx.shadowColor=ctx.strokeStyle;
      ctx.beginPath(); ctx.arc(r.x,r.y,rr,0,6.28); ctx.stroke();
      if(r.glyph){
        ctx.lineWidth=2; ctx.setLineDash([6,10]);
        ctx.beginPath(); ctx.arc(r.x,r.y,rr*0.72,0,6.28); ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();
    }
    /* 飘字 */
    for(var k=texts.length-1;k>=0;k--){
      var tx=texts[k]; tx.life-=dt;
      if(tx.life<=0){ texts.splice(k,1); continue; }
      tx.y+=tx.vy*dt; tx.vy*=0.96;
      var ta=Math.min(1,tx.life/tx.max*2);
      ctx.save(); ctx.globalAlpha=ta;
      ctx.font=(tx.bold?'800 ':'')+tx.size+'px system-ui,sans-serif';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.lineWidth=Math.max(3,tx.size*0.18); ctx.strokeStyle=tx.stroke;
      ctx.strokeText(tx.txt,tx.x,tx.y);
      ctx.shadowBlur=12; ctx.shadowColor=tx.color; ctx.fillStyle=tx.color;
      ctx.fillText(tx.txt,tx.x,tx.y);
      ctx.restore();
    }
    /* 震屏：位移战斗场景内容 */
    if(sceneEl){
      if(now<shakeUntil){
        var m=shakeMag*(shakeUntil-now)/340;
        sceneEl.style.transform='translate('+rand(-m,m).toFixed(1)+'px,'+rand(-m,m).toFixed(1)+'px)';
      } else if(sceneEl.style.transform){
        sceneEl.style.transform=''; shakeMag=0;
      }
    }
    requestAnimationFrame(tick);
  }
  function easeOut(t){ return 1-Math.pow(1-t,3); }
  function star(c,x,y,r1,r2,n){
    c.beginPath();
    for(var i=0;i<n*2;i++){ var a=i*Math.PI/n-Math.PI/2, r=i%2?r2:r1;
      var px=x+Math.cos(a)*r, py=y+Math.sin(a)*r; i?c.lineTo(px,py):c.moveTo(px,py); }
    c.closePath();
  }

  /* ---------- 对外接口 ---------- */
  var FX={
    init: function(){
      canvas=document.getElementById('fxCanvas');
      if(!canvas) return;
      ctx=canvas.getContext('2d');
      sceneEl=canvas.parentElement.querySelector('.battle-scene');
      resize();
      window.addEventListener('resize',resize);
      if(!running){ running=true; lastT=performance.now(); requestAnimationFrame(tick); }
    },
    palette:PAL,
    slash:FX_slash, burst:FX_burst, circle:FX_circle, hit:FX_hit,
    damage:FX_damage, healText:FX_healText, shake:FX_shake, flash:FX_flash,
    victory:FX_victory, lootBeam:FX_lootBeam, levelUp:FX_levelUp, hurt:FX_hurt,
    clear: function(){ particles=[]; rings=[]; texts=[]; if(ctx)ctx.clearRect(0,0,W,H); if(sceneEl)sceneEl.style.transform=''; }
  };
  window.RPG_FX=FX;
})();
