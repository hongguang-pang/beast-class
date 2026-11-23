/* ============================================================
 * 精灵大陆 · 知识远征  —  音频（Web Audio 程序化合成）
 * 不依赖任何外部音频文件，PWA 离线可用
 * 地图轻音乐 / 战斗紧张乐 / Boss 乐 + 各类音效
 * ============================================================ */
'use strict';
(function(){
  var ctx=null, master=null, muted=false, schedTimer=null;
  var curScene='none', nextT=0, step=0;
  var MUTE_KEY='rpg.audio.muted';
  try{ muted = localStorage.getItem(MUTE_KEY)==='1'; }catch(e){}

  function ensure(){
    if(ctx) return ctx;
    try{
      var AC=window.AudioContext||window.webkitAudioContext;
      if(!AC) return null;
      ctx=new AC();
      master=ctx.createGain();
      master.gain.value=muted?0:0.45;
      master.connect(ctx.destination);
    }catch(e){ ctx=null; }
    return ctx;
  }
  function midi(n){ return 440*Math.pow(2,(n-69)/12); }
  function applyMute(){ if(master) master.gain.value=muted?0:0.45; }

  /* 单个音符（带 ADSR 包络，可选滑音） */
  function note(freq, dur, type, vol, when, glideTo){
    if(!ctx||muted) return;
    var t=when||ctx.currentTime;
    var o=ctx.createOscillator(), g=ctx.createGain();
    o.type=type||'triangle';
    o.frequency.setValueAtTime(freq,t);
    if(glideTo) o.frequency.exponentialRampToValueAtTime(Math.max(1,glideTo),t+dur);
    g.gain.setValueAtTime(0.0001,t);
    g.gain.exponentialRampToValueAtTime(vol||0.2,t+0.012);
    g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t+dur+0.03);
  }
  /* 噪声（打击/受击） */
  function noise(dur, vol, when, freq){
    if(!ctx||muted) return;
    var t=when||ctx.currentTime, len=Math.floor(ctx.sampleRate*dur);
    var buf=ctx.createBuffer(1,len,ctx.sampleRate), d=buf.getChannelData(0);
    for(var i=0;i<len;i++) d[i]=(Math.random()*2-1)*(1-i/len);
    var src=ctx.createBufferSource(); src.buffer=buf;
    var f=ctx.createBiquadFilter(); f.type='bandpass'; f.frequency.value=freq||1100; f.Q.value=0.8;
    var g=ctx.createGain(); g.gain.value=vol||0.14;
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t);
  }

  /* ---- BGM 音型：数组为 midi 音高，null=休止 ---- */
  var PATTERNS={
    /* 地图：温暖大调琶音，舒缓 */
    world:{
      dur:0.26, wave:'triangle', vol:0.16,
      mel:[60,64,67,72, 71,67,64,67, 62,65,69,74, 72,69,65,69],
      bass:[48,45,41,43], bassEvery:8, bassVol:0.11
    },
    /* 战斗：紧张小调，快速推进 */
    battle:{
      dur:0.15, wave:'square', vol:0.12,
      mel:[69,72,76,72, 71,69,67,69, 68,72,75,72, 70,67,65,67],
      bass:[45,43,41,40], bassEvery:4, bassVol:0.13, beat:true
    },
    /* Boss：更快更压迫，加入半音不和谐 */
    boss:{
      dur:0.12, wave:'sawtooth', vol:0.11,
      mel:[57,60,63,64, 63,60,58,60, 56,59,62,63, 62,59,57,56],
      bass:[33,33,34,32], bassEvery:4, bassVol:0.15, beat:true
    }
  };

  function playStep(scene, s, t){
    var p=PATTERNS[scene]; if(!p) return;
    var m=p.mel[s%p.mel.length];
    if(m!=null) note(midi(m), p.dur*0.92, p.wave, p.vol, t);
    if(p.bass && s%p.bassEvery===0){
      var b=p.bass[Math.floor(s/p.bassEvery)%p.bass.length];
      note(midi(b), p.dur*p.bassEvery*0.9, 'sine', p.bassVol, t);
    }
    if(p.beat && s%2===0) noise(0.05, 0.05, t, 130);
  }
  function schedule(){
    if(!ctx||curScene==='none') return;
    var p=PATTERNS[curScene]; if(!p) return;
    while(nextT < ctx.currentTime+0.18){
      playStep(curScene, step, nextT);
      nextT+=p.dur; step++;
    }
  }
  function startSched(){
    if(schedTimer){ clearInterval(schedTimer); schedTimer=null; }
    if(!ctx||curScene==='none') return;
    step=0; nextT=ctx.currentTime+0.06;
    schedTimer=setInterval(schedule, 45);
    schedule();
  }

  /* ---- 对外接口 ---- */
  var A={};
  A.unlock=function(){
    var c=ensure();
    if(c && c.state==='suspended') c.resume();
    return !!c;
  };
  A.playBGM=function(scene){
    if(!PATTERNS[scene]) scene='none';
    curScene=scene;
    if(scene==='none'){ if(schedTimer){clearInterval(schedTimer);schedTimer=null;} return; }
    ensure();
    if(!ctx) return;
    if(ctx.state==='suspended') ctx.resume();
    startSched();
  };
  A.stopBGM=function(){ A.playBGM('none'); };
  A.toggleMute=function(){
    muted=!muted;
    try{ localStorage.setItem(MUTE_KEY, muted?'1':'0'); }catch(e){}
    applyMute();
    return muted;
  };
  A.isMuted=function(){ return muted; };

  A.sfx=function(name){
    if(muted) return;
    ensure(); if(!ctx) return;
    if(ctx.state==='suspended') ctx.resume();
    var t=ctx.currentTime;
    switch(name){
      case 'click':  note(880,0.06,'sine',0.12,t); break;
      case 'hit':    noise(0.09,0.16,t,900); note(180,0.12,'square',0.14,t,80); break;
      case 'skill':  [523,659,784].forEach(function(n,i){ note(n,0.12,'triangle',0.18,t+i*0.06); }); break;
      case 'correct':[659,784,988,1319].forEach(function(n,i){ note(n,0.1,'sine',0.2,t+i*0.055); }); break;
      case 'wrong':  note(220,0.3,'sawtooth',0.16,t,110); break;
      case 'win':    [523,659,784,1047].forEach(function(n,i){ note(n,0.22,'triangle',0.22,t+i*0.09); }); break;
      case 'levelup':[523,659,784,1047,1319,1568].forEach(function(n,i){ note(n,0.16,'sine',0.2,t+i*0.07); }); break;
      case 'chest':  [784,988,784,1175].forEach(function(n,i){ note(n,0.14,'triangle',0.18,t+i*0.08); }); break;
      case 'encounter': note(330,0.12,'square',0.14,t); note(277,0.18,'square',0.14,t+0.1); noise(0.08,0.08,t,600); break;
      case 'stun':   note(400,0.28,'sine',0.16,t,90); break;
      case 'target': note(160,0.22,'sawtooth',0.18,t,120); noise(0.1,0.1,t,400); break;
      case 'run':    note(600,0.2,'sine',0.14,t,180); break;
      case 'heal':   [523,659,784].forEach(function(n,i){ note(n,0.18,'sine',0.16,t+i*0.07); }); break;
      default: break;
    }
  };

  window.RPG_AUDIO=A;
})();
