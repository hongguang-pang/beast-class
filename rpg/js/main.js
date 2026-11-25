/* ============================================================
 * 知识大陆 · 知识远征  —  主控 / 装配
 * ============================================================ */
'use strict';
var D=window.RPG_DATA, E=window.RPG_ENGINE, W=window.RPG_WORLD, B=window.RPG_BATTLE, U=window.RPG_UI, A=window.RPG_AUDIO;
function $(id){ return document.getElementById(id); }

/* 确保年级题库分片加载后，初始化/检测战役（版本变了自动重建关卡） */
function initCampaignForGrade(grade, cb){
  var C=window.RPG_CAMPAIGN; if(!C){ cb&&cb(); return; }
  E.ensureGradeLoaded(grade, function(ok){
    if (!ok){ cb&&cb(false); return; }
    var r=C.initCampaign(E.S, grade, false);
    E.save();
    if (r.rebuilt && E.S.seenIntro){
      U.toast('📚 题库已更新，关卡已按最新知识点重新生成');
    }
    cb&&cb(true, r);
  });
}

function startGame(teamIds, grade, isNew){
  if (isNew || !E.hasSave()) E.init(teamIds, grade);
  else E.load();
  U.renderTitle();
  U.show('worldStage');
  W.resetToSave();
  /* 按当前年级知识点生成/校验剧情关卡 */
  initCampaignForGrade(E.S.grade, function(ok){
    /* 天赋树：老档按已覆盖知识点一次性补发知识星尘（仅一次） */
    if (window.RPG_TALENTS) window.RPG_TALENTS.seedFromSave();
    if (ok) U.updateHUD();
  });
  U.toast('欢迎来到知识大陆！靠近 NPC 按「对话」接任务');
  if(A){ A.unlock(); A.playBGM('world'); }
  /* 首次：世界观序章 → 新手引导 */
  if (!E.S.seenIntro || !E.S.tutorialDone){
    setTimeout(function(){
      var startTut=function(){
        E.S.seenIntro=true; E.save();
        W.enabled=false;   /* 引导时暂时冻结移动 */
        if(window.RPG_TUTORIAL) window.RPG_TUTORIAL.maybeStart(function(){ W.enabled=true; });
        else W.enabled=true;
      };
      if (window.RPG_STORY){
        U.dialog('序章 · 知识大陆', window.RPG_STORY.WORLD.prologue+'<br><br>'+window.RPG_STORY.WORLD.mission, startTut);
      } else startTut();
    },500);
  }
}

/* 装配回调 */
function wire(){
  /* 世界事件 → 战斗/对话/宝箱 */
  W.onEncounter = function(mon, lv, isBoss){
    W.stop();
    B.start(mon, lv, isBoss);
    U.show('battleView');
    if(A){ A.sfx('encounter'); A.playBGM(isBoss?'boss':'battle'); }
  };
  W.onBoss = function(mon){
    W.stop();
    B.start(mon, 1 + D.BOSSES.findIndex(function(b){return b.key===mon.key;})*8, true);
    U.show('battleView');
    if(A){ A.sfx('encounter'); A.playBGM('boss'); }
  };
  W.onTalk = function(npc){ U.talkNPC(npc); };
  W.onChest = function(){
    var gold=20+Math.floor(Math.random()*60);
    var potion=Math.random()<0.6?1:0;
    E.S.gold+=gold; if(potion)E.S.bag.potion=(E.S.bag.potion||0)+potion; E.save();
    U.toast('🎁 宝箱：+'+gold+' 金币'+(potion?' · +1 药水':''));
    U.updateHUD();
    if(A) A.sfx('chest');
    /* chest 主线/支线进度在 world.js 开箱处已推进，这里不重复 */
  };
  U.toastFn=function(m){ U.toast(m); };
  W.zoneFn=function(name){ window.__curZone=name; var el=$('hudZone'); if(el)el.textContent=name; };

  /* 战斗回调 */
  B.onLog=function(s){
    U.battleLog(s); U.updateHUD(); U.renderBattle();
    if(A){
      if(s.indexOf('答对了')>=0) A.sfx('correct');
      else if(s.indexOf('答错了')>=0) A.sfx('wrong');
      else if(s.indexOf('针对')>=0 || s.indexOf('弱点')>=0) A.sfx('target');
      else if(s.indexOf('眩晕')>=0) A.sfx('stun');
      else if(s.indexOf('造成')>=0 && s.indexOf('攻击')>=0) A.sfx('hit');
      else if(s.indexOf('胜利')>=0) A.sfx('win');
      else if(s.indexOf('升到')>=0) A.sfx('levelup');
    }
  };
  B.onTurn=function(){ U.renderBattle(); U.updateHUD(); };
  B.onQuiz=function(kind, skill){ if(A) A.sfx('click'); U.openQuiz(kind, skill); };
  B.onEnd=function(r){
    if(r.win) W.markMobDefeated();
    U.battleEnd(r);
    /* 回到地图时由 UI.show('worldStage') 恢复地图音乐 */
  };

  /* 战斗按钮 */
  $('bNormal').addEventListener('click',function(){ B.act('normal'); });
  $('bSpell').addEventListener('click',function(){ B.act('spell'); });
  $('bUlt').addEventListener('click',function(){ B.act('ult'); });
  $('bGuard').addEventListener('click',function(){ B.defend(); });
  $('bRun').addEventListener('click',function(){ B.act('run'); });
  $('bBag').addEventListener('click',function(){ openBattleBag(); });
  /* 答题关闭（不允许中途退出，强制答） */

  /* HUD 按钮 */
  var hudPark=$('hudPark');
  if(hudPark) hudPark.addEventListener('click',function(){
    if(A)A.sfx('click');
    if(window.RPG_PETDEXPARK) window.RPG_PETDEXPARK.show();
  });
  $('hudParty').addEventListener('click',function(){ if(A)A.sfx('click'); U.show('partyView'); });
  $('btnPartyBack').addEventListener('click',function(){ if(A)A.sfx('click'); U.show('worldStage'); });

  /* 切换宠物 / 编队 */
  var hudSwitch=$('hudSwitch');
  if(hudSwitch) hudSwitch.addEventListener('click',function(){
    if(A)A.sfx('click');
    U.switchSel=E.S.team.map(function(p){return p.id;});
    U.show('switchView');
  });
  var btnSwitchBack=$('btnSwitchBack');
  if(btnSwitchBack) btnSwitchBack.addEventListener('click',function(){ if(A)A.sfx('click'); U.show('worldStage'); });
  var btnSwitchSave=$('btnSwitchSave');
  if(btnSwitchSave) btnSwitchSave.addEventListener('click',function(){
    if(A)A.sfx('click');
    var ok=E.setTeam(U.switchSel);
    if(ok){ U.toast('✅ 编队已保存 · 首发：'+D.PET_BY_ID[E.S.team[0].id].name); E.syncRoster(); U.show('worldStage'); U.updateHUD(); }
    else U.toast('编队失败，请至少保留 1 只宠物');
  });

  /* 图鉴与成就勋章：记录来源，返回时回到原视图 */
  var codexFrom='titleView';
  function openCodex(from){
    if(A)A.unlock();
    codexFrom=from||'titleView';
    U.show('codexView');
  }
  var hudCodex=$('hudCodex');
  if(hudCodex) hudCodex.addEventListener('click',function(){ if(A)A.sfx('click'); openCodex('worldStage'); });
  var btnCodex=$('btnCodex');
  if(btnCodex) btnCodex.addEventListener('click',function(){ openCodex('titleView'); });
  var btnCodexBack=$('btnCodexBack');
  if(btnCodexBack) btnCodexBack.addEventListener('click',function(){
    if(A)A.sfx('click');
    U.show(codexFrom);
    if(codexFrom==='worldStage' && window.RPG_WORLD) W.resetToSave();
  });
  /* 技能天赋树入口（标题页 + 地图 HUD） */
  var talentsFrom='titleView';
  function openTalents(from){ talentsFrom=from||'titleView'; U.show('talentsView'); }
  var btnTalents=$('btnTalents');
  if(btnTalents) btnTalents.addEventListener('click',function(){ openTalents('titleView'); });
  var hudTalents=$('hudTalents');
  if(hudTalents) hudTalents.addEventListener('click',function(){ if(A)A.sfx('click'); openTalents('worldStage'); });
  var btnTalentsBack=$('btnTalentsBack');
  if(btnTalentsBack) btnTalentsBack.addEventListener('click',function(){
    if(A)A.sfx('click');
    U.show(talentsFrom);
    if(talentsFrom==='worldStage' && window.RPG_WORLD) W.resetToSave();
  });
  Array.prototype.forEach.call(document.querySelectorAll('.codex-tab'),function(b){
    b.addEventListener('click',function(){
      if(A)A.sfx('click');
      U.codexTab=b.getAttribute('data-tab');
      U.renderCodex();
    });
  });
  var codexBody=$('codexBody');
  if(codexBody) codexBody.addEventListener('click',function(ev){
    var b=ev.target.closest ? ev.target.closest('[data-summon]') : null;
    if(!b) return;
    if(A)A.sfx('click');
    var r=window.RPG_CODEX.summon(b.getAttribute('data-summon'));
    U.toast(r.msg);
    U.renderCodex();
    U.updateHUD();
  });
  $('btnAction').addEventListener('click',function(){ W.interact(); });
  /* 音乐开关 */
  var hm=$('hudMusic');
  function renderMusicBtn(){ if(hm) hm.textContent=A&&A.isMuted()?'🔇':'🔊'; }
  renderMusicBtn();
  if(hm) hm.addEventListener('click',function(){
    if(!A) return;
    var m=A.toggleMute(); renderMusicBtn();
    if(!m && W.enabled) A.playBGM('world');
    U.toast(m?'🔇 音乐已关闭':'🔊 音乐已开启');
  });
  $('hudMenu').addEventListener('click',function(){
    U.dialog('菜单','🌍 大地图：走动探索<br>🔄 换宠：调整出战编队（按学科挑宠物）<br>📜 队伍：看宠物、背包、任务、剧情关卡<br>⚔️ 战斗：答对题放技能，属性克制暴击×2<br>📖 图鉴：收藏与成就勋章<br><br>进度自动保存在本机，随时回来继续。');
  });
  $('shopClose').addEventListener('click',function(){ $('shopOverlay').classList.add('hidden'); });

  /* 标题页按钮 */
  U.renderTitle();
  /* 世界观剧情 */
  var btnStory=$('btnStory');
  if(btnStory) btnStory.addEventListener('click',function(){
    if(A)A.unlock();
    if(!window.RPG_STORY){ U.toast('剧情模块加载中'); return; }
    var chapters=window.RPG_STORY.CHAPTERS.map(function(c,i){
      return (i+1)+'. '+c.no+' · '+c.title+'（'+c.npc+'）';
    }).join('<br>');
    U.dialog('📜 知识大陆 · 主线剧情',
      '<b>'+window.RPG_STORY.WORLD.prologue+'</b><br><br>'+
      window.RPG_STORY.WORLD.mission+'<br><br>'+
      '<span style="color:#ffd35c">【章节】</span><br>'+chapters+'<br><br>'+
      '<small>'+window.RPG_STORY.WORLD.critRule+'</small>');
  });
  /* 新手引导（标题页提示去游戏内看，HUD 可随时重看） */
  var btnTutorial=$('btnTutorial');
  if(btnTutorial) btnTutorial.addEventListener('click',function(){
    if(A)A.unlock();
    U.toast('进入游戏后点右上角 ❔ 可随时重看新手引导');
  });
  var hudTutorial=$('hudTutorial');
  if(hudTutorial) hudTutorial.addEventListener('click',function(){
    if(A)A.sfx('click');
    if(!window.RPG_TUTORIAL){ U.toast('引导模块加载中'); return; }
    W.enabled=false;
    window.RPG_TUTORIAL.start(function(){ W.enabled=true; });
  });
  var btnPark=$('btnPetPark');
  if(btnPark) btnPark.addEventListener('click',function(){
    if(A)A.unlock();
    if(window.RPG_PETDEXPARK) window.RPG_PETDEXPARK.show();
  });
  $('titleContinue').addEventListener('click',function(){
    E.load(); U.show('worldStage'); W.resetToSave();
    if(A){ A.unlock(); A.playBGM('world'); }
    /* 继续游戏时同样检测题库版本，确保关卡覆盖最新知识点 */
    initCampaignForGrade(E.S.grade, function(ok){ if(ok) U.updateHUD(); });
  });
  function doNewGame(){
    if (E.hasSave() && !confirm('重新开始会清空当前进度，确定吗？')) return;
    var arr=window.__selPets||[];
    if(arr.length!==3){ U.toast('请先选择 3 只宠物'); return; }
    var grade=$('selGrade').value||'g3';
    /* 确保题库分片已加载 */
    E.ensureGradeLoaded(grade,function(ok){
      if(!ok){ U.toast('题库加载失败，请检查网络'); return; }
      startGame(arr, grade, true);
    });
  }
  $('btnStartAdventure').addEventListener('click',doNewGame);
  $('titleNew').addEventListener('click',doNewGame);
  var sg=$('selGrade');
  if(sg){
    (window.GRADES||[]).forEach(function(g){
      var o=document.createElement('option'); o.value=g.id; o.textContent=g.name; sg.appendChild(o);
    });
    sg.value='g3';
  }
}

/* 战斗中背包 */
function openBattleBag(){
  var S=E.S;
  var list=Object.keys(D.ITEMS).map(function(k){
    var it=D.ITEMS[k];
    return '<button class="bb-item" data-k="'+k+'" '+((S.bag[k]||0)<=0?'disabled':'')+'>'+
      '<span class="bb-name">'+it.emoji+' '+it.name+' <b>×'+(S.bag[k]||0)+'</b></span>'+
      '<span class="bb-detail">'+it.detail+'</span></button>';
  }).join('');
  $('battleBagList').innerHTML=list;
  $('battleBagOverlay').classList.remove('hidden');
  Array.prototype.forEach.call($('battleBagList').querySelectorAll('button'),function(b){
    b.addEventListener('click',function(){
      $('battleBagOverlay').classList.add('hidden');
      B.act('item', b.getAttribute('data-k'));
    });
  });
  $('battleBagClose').onclick=function(){ $('battleBagOverlay').classList.add('hidden'); };
}

/* 调试接口 */
window.__rpg = {
  get state(){ return E.S; },
  get view(){ return U.view; },
  get battle(){ return { active:B.active, mon:B.mon&&B.mon.name, hp:B.monHp }; },
  get pos(){ return { x:W.px, y:W.py }; },
  newGame(ids,grade){ startGame(ids||['P001','P011','P027'],grade||'g3',true); },
  load(){ E.load(); U.show('worldStage'); W.resetToSave(); },
  encounter(key){ var m=D.MON_BY_KEY[key]; if(!m)return; W.stop(); B.start(m,1,false); U.show('battleView'); },
  act(a,arg){ B.act(a,arg); },
  quiz(ok){ B.resolveQuiz(ok); },
  moveTo(x,y){ W.px=x; W.py=y; W.updateCam(); },
  interact(){ W.interact(); },
  give(k,n){ E.S.bag[k]=(E.S.bag[k]||0)+(n||1); E.save(); U.updateHUD(); },
  gold(n){ E.S.gold+=n; E.save(); U.updateHUD(); },
  quest(){ return { cur:E.curQuest(), prog:E.S.quests.prog }; }
};

/* 启动 */
(function boot(){
  wire();
  /* 初始化世界地图（canvas/碰撞/输入）——必须在 show 之前 */
  var canvas=document.getElementById('worldCanvas');
  if (canvas && window.RPG_WORLD.init) window.RPG_WORLD.init(canvas);
  if (window.RPG_FX && window.RPG_FX.init) window.RPG_FX.init();
  U.show('titleView');
  window.__rpgBootOk=true;
})();
