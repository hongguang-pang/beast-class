/* ============================================================
 * 精灵大陆 · 知识远征  —  伙伴乐园（动画宠物展示与互动）
 * 依赖 window.RPG_PETDEX，独立命名空间 window.RPG_PETDEXPARK
 * ============================================================ */
'use strict';
(function(){
  var P=window.RPG_PETDEX;
  var curState='idle';
  var curScale=1.6;
  var view=null, grid=null, tabBar=null;

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
        applyAllStates();
      };
    });
  }

  /* 渲染 24 只宠物卡片 */
  function renderGrid(){
    if(!grid) return;
    grid.innerHTML=P.PETS.map(function(p){ return P.cardHTML(p,curState,curScale); }).join('');
    /* 点击卡片：播放一次跳跃/挥手互动 */
    Array.prototype.forEach.call(grid.querySelectorAll('.pd-card'),function(card){
      card.onclick=function(){
        var id=card.getAttribute('data-pd');
        var sp=card.querySelector('.pd-sprite');
        if(window.RPG_AUDIO) window.RPG_AUDIO.sfx('click');
        /* 依次播放 挥手->跳跃->回到当前状态 */
        P.setSpriteState(card,id,'wave');
        setTimeout(function(){ P.setSpriteState(card,id,'jump'); },600);
        setTimeout(function(){ P.setSpriteState(card,id,curState); },1300);
      };
    });
  }

  function applyAllStates(){
    if(!grid) return;
    Array.prototype.forEach.call(grid.querySelectorAll('.pd-card'),function(card){
      P.setSpriteState(card,card.getAttribute('data-pd'),curState);
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
