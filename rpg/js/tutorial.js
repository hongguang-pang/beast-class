/* ============================================================
 * 知识大陆 · 知识远征  —  新手引导模块
 * 独立命名空间 window.RPG_TUTORIAL
 * 分步高亮 UI 元素，讲清剧情 / 移动 / 对话 / 换宠 / 战斗暴击 / 图鉴
 * 首次进入自动触发，可跳过；完成后写入存档不再重复，可手动重看。
 * 依赖：RPG_ENGINE / RPG_UI
 * ============================================================ */
'use strict';
(function(){
  var E=window.RPG_ENGINE;
  var steps=[
    { key:'story',   target:null,           title:'📜 欢迎来到知识大陆',
      text:'知识魔王释放「遗忘迷雾」，把知识点封印成了魔物。<br>你是被圣殿选中的<b>知识勇者</b>——和宠物一起，靠答题唤醒被封印的知识，击败魔王！' },
    { key:'move',    target:'joyBase',      title:'🕹️ 自由探索',
      text:'拖动左下角<b>摇杆</b>（或方向键 / WASD）在大地图上走动。<br>草地会遇到野生魔物，路上的🎁宝箱靠近即可开启。' },
    { key:'talk',    target:'btnAction',    title:'💬 和 NPC 对话接任务',
      text:'走到 <b>NPC</b> 身边，点右下角<b>「对话 / 交互」</b>按钮。<br>每个 NPC 都有自己的身世和任务背景，他们会交给你主线与支线委托。' },
    { key:'switch',  target:'hudSwitch',    title:'🔄 切换宠物编队',
      text:'点右上角<b>「换宠」</b>进入编队界面。<br>图鉴召唤的宠物都在这里，最多带 3 只出战，第 1 只是首发。<b>按学科挑宠物</b>，战斗更轻松！' },
    { key:'battle',  target:'hudParty',     title:'💥 答题暴击的秘诀',
      text:'战斗里点<b>✨知识技能 / 🔥必杀</b>会弹出题目。<br>每种学科有属性，<b>当你的宠物属性克制题目学科时，答对就暴击×2</b>！答错则放不出技能还会被反击。' },
    { key:'codex',   target:'hudCodex',     title:'📖 图鉴 · 成就 · 剧情',
      text:'右上角<b>图鉴</b>可查看宠物 / 怪兽收藏和成就勋章，召唤新伙伴。<br>标题页的<b>「世界观与剧情」</b>可随时重读主线故事。现在，出发吧！' }
  ];

  var idx=0, active=false, onDone=null;
  function $(id){ return document.getElementById(id); }

  function place(){
    var step=steps[idx];
    var spot=$('tutorialSpot'), card=$('tutorialCard');
    var target=step.target?$(step.target):null;
    if (target && target.offsetParent!==null){
      var r=target.getBoundingClientRect();
      var pad=8;
      spot.style.display='block';
      spot.style.left=(r.left-pad)+'px'; spot.style.top=(r.top-pad)+'px';
      spot.style.width=(r.width+pad*2)+'px'; spot.style.height=(r.height+pad*2)+'px';
      /* 卡片放在目标上方或下方，避开遮挡 */
      var cardH=card.offsetHeight||190;
      var top=r.top-cardH-16;
      if (top<10) top=r.bottom+16;
      card.style.left=Math.max(8,Math.min(window.innerWidth-card.offsetWidth-8, r.left+r.width/2-card.offsetWidth/2))+'px';
      card.style.top=top+'px';
    } else {
      spot.style.display='none';
      card.style.left='50%'; card.style.top='50%';
      card.style.transform='translate(-50%,-50%)';
    }
  }
  function render(){
    var step=steps[idx];
    $('tutStepNow').textContent=(idx+1); $('tutStepAll').textContent=steps.length;
    $('tutTitle').innerHTML=step.title; $('tutText').innerHTML=step.text;
    $('tutNext').textContent=(idx===steps.length-1)?'开始冒险 →':'下一步 →';
    if (step.target){ $('tutorialCard').style.transform='none'; }
    place();
  }
  function finish(skipped){
    active=false;
    $('tutorialOverlay').classList.add('hidden');
    if (E.S){ E.S.tutorialDone=true; E.save(); }
    if (window.RPG_AUDIO) window.RPG_AUDIO.sfx('click');
    if (onDone) { var cb=onDone; onDone=null; cb(skipped); }
  }
  function next(){
    if (idx<steps.length-1){ idx++; if(window.RPG_AUDIO) window.RPG_AUDIO.sfx('click'); render(); }
    else finish(false);
  }
  function bind(){
    $('tutNext').onclick=next;
    $('tutSkip').onclick=function(){ finish(true); };
    window.addEventListener('resize',function(){ if(active) place(); });
  }

  window.RPG_TUTORIAL={
    steps:steps,
    start:function(done){
      onDone=done||null; idx=0; active=true;
      $('tutorialOverlay').classList.remove('hidden');
      bind(); render();
    },
    /* 首次进入时调用：未完成才弹出 */
    maybeStart:function(done){
      if (E.S && E.S.tutorialDone) { if(done)done(false); return; }
      this.start(done);
    },
    isActive:function(){ return active; }
  };
})();
