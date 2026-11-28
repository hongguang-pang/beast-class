/* ============================================================
 * 知识大陆 · 知识远征  —  伙伴乐园（动画宠物展示与互动）
 * 依赖 window.RPG_PETDEX，独立命名空间 window.RPG_PETDEXPARK
 * ============================================================ */
'use strict';
(function(){
  var P=window.RPG_PETDEX;
  var curState='idle';
  var curScale=1.6;
  var view=null, grid=null, tabBar=null;
  var activeCard=null, activeId=null;   /* v6.4.4：当前互动中的卡片（状态按钮只作用于它） */
  var animTimers=[];

  function $(id){ return document.getElementById(id); }

  /* 构建伙伴乐园视图（动态插入到 #app） */
  function ensureView(){
    if($('petdexParkView')) return $('petdexParkView');
    var app=$('app');
    var sec=document.createElement('section');
    sec.id='petdexParkView';
    sec.className='view hidden';
    sec.innerHTML=
      '<div class="panel-head"><h2>🎪 伙伴乐园</h2>'+
        '<button id="pdParkBack" class="back-btn">← 返回</button></div>'+
      '<p class="pd-park-tip">24 只动画伙伴 · 点卡片互动 · 点状态按钮让它们动起来</p>'+
      '<div id="pdTabs" class="pd-tabs"></div>'+
      '<div id="pdGrid" class="pd-grid"></div>';
    app.appendChild(sec);
    return sec;
  }

  /* 渲染状态切换标签 */
  function renderTabs(){
    if(!tabBar) return;
    tabBar.innerHTML=P.STATES.map(function(s){
      return '<button class="pd-tab'+(s[0]===curState?' on':'')+'" data-state="'+s[0]+'">'+s[2]+'</button>';
    }).join('');
    Array.prototype.forEach.call(tabBar.querySelectorAll('.pd-tab'),function(b){
      b.onclick=function(){
        curState=b.getAttribute('data-state');
        if(window.RPG_AUDIO) window.RPG_AUDIO.sfx('click');
        renderTabs();
        if(activeCard && activeId) playAnim(activeCard,activeId,curState);
        else if(window.RPG_UI) window.RPG_UI.toast('先点一只宠物，再选动作');
      };
    });
  }
  /* 清理上一段动画定时器 */
  function clearTimers(){ animTimers.forEach(clearTimeout); animTimers=[]; }
  /* 播放一次互动动画（wave→jump→回到选中状态），结束后恢复静态缩略图，避免持续晃动 */
  function playAnim(card, pdId, state){
    clearTimers();
    P.upgradeCardToSprite(card,pdId,'wave');
    animTimers.push(setTimeout(function(){ P.setSpriteState(card,pdId,'jump'); },650));
    animTimers.push(setTimeout(function(){ P.setSpriteState(card,pdId,state); },1350));
    /* 3 秒后恢复静态，彻底停住晃动 */
    animTimers.push(setTimeout(function(){ P.restoreCardThumb(card,pdId); },3000));
  }

  /* 渲染 24 只宠物卡片（静态缩略图首屏，秒开不晃） */
  function renderGrid(){
    if(!grid) return;
    clearTimers(); activeCard=null; activeId=null;
    grid.innerHTML=P.PETS.map(function(p){ return P.cardHTML(p,'idle',curScale); }).join('');
    Array.prototype.forEach.call(grid.querySelectorAll('.pd-card'),function(card){
      card.onclick=function(){
        var id=card.getAttribute('data-pd');
        if(window.RPG_AUDIO) window.RPG_AUDIO.sfx('click');
        /* 若上一只正在播放动画，先恢复它的静态图 */
        if(activeCard && activeCard!==card && activeId) P.restoreCardThumb(activeCard,activeId);
        activeCard=card; activeId=id;
        /* 高亮当前选中的卡片 */
        Array.prototype.forEach.call(grid.querySelectorAll('.pd-card'),function(c){ c.classList.remove('active'); });
        card.classList.add('active');
        /* 点击才懒加载大图，播放一次互动动画 */
        playAnim(card,id,curState);
      };
    });
  }

  /* 显示伙伴乐园（隐藏其它视图） */
  function show(){
    var v=ensureView();
    P.injectKeyframes();
    ['titleView','partyView','worldStage','battleView'].forEach(function(x){
      var el=$(x); if(el) el.classList.add('hidden');
    });
    if(window.RPG_WORLD) window.RPG_WORLD.enabled=false;
    v.classList.remove('hidden');
    grid=$('pdGrid'); tabBar=$('pdTabs');
    renderTabs(); renderGrid();
    var back=$('pdParkBack');
    back.onclick=function(){
      if(window.RPG_AUDIO) window.RPG_AUDIO.sfx('click');
      hide();
      if(window.RPG_UI) window.RPG_UI.show('worldStage');
    };
    if(window.RPG_AUDIO) window.RPG_AUDIO.playBGM('none');
  }
  function hide(){
    var v=$('petdexParkView'); if(v) v.classList.add('hidden');
  }

  window.RPG_PETDEXPARK={ show:show, hide:hide, renderGrid:renderGrid, setScale:function(s){curScale=s;renderGrid();} };
})();
