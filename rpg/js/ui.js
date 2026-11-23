/* ============================================================
 * 精灵大陆 · 知识远征  —  UI 层
 * 视图切换 / HUD / 队伍 / 背包 / 任务 / 战斗界面 / 答题弹层 / 剧情
 * ============================================================ */
'use strict';
var D=window.RPG_DATA, E=window.RPG_ENGINE, W=window.RPG_WORLD, B=window.RPG_BATTLE;

var UI = {
  view:'title',
  quizCb:null,
  toastTimer:null
};
function $(id){ return document.getElementById(id); }
function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }

UI.show = function(view){
  this.view=view;
  ['titleView','partyView','worldStage','battleView'].forEach(function(v){
    var el=$(v); if(el) el.classList.toggle('hidden', v!==view);
  });
  if (view==='worldStage'){
    W.enabled=true;
    setTimeout(function(){W.resize(); W.start();},30);
  } else { W.enabled=false; }
  if (view==='partyView') UI.renderParty();
  if (view==='battleView') UI.renderBattle();
  UI.updateHUD();
};

UI.updateHUD = function(){
  var S=E.S; if(!S) return;
  var g=D.PET_BY_ID[S.team[S.active].id];
  var el=$('hudGold'); if(el) el.textContent=S.gold;
  var el2=$('hudZone'); if(el2) el2.textContent=(window.__curZone||'精灵大陆');
  var q=E.curQuest();
  var el3=$('hudQuest');
  if(el3) el3.textContent = q ? (q.title+' '+(S.quests.prog[q.id]||0)+'/'+q.need) : '主线已完成 ✓';
  /* 队伍缩略血条 */
  var bar=$('hudTeam');
  if(bar){
    bar.innerHTML=S.team.map(function(p,i){
      var pet=D.PET_BY_ID[p.id];
      var st=D.stageForLv(p.lv);
      var pct=Math.round(p.hp/E.curMaxHp(p)*100);
      var color=pct>50?'#7ee08f':pct>25?'#ffd35c':'#ff7a7a';
      return '<div class="ht-item'+(i===S.active?' on':'')+'" data-i="'+i+'">'+
        '<img src="'+D.petImg(p.id,st.key)+'" onerror="this.style.display=\'none\'">'+
        '<span class="ht-name">'+esc(pet.name)+'</span>'+
        '<span class="ht-hp"><i style="width:'+pct+'%;background:'+color+'"></i></span>'+
        '<span class="ht-lv">Lv'+p.lv+'</span></div>';
    }).join('');
    Array.prototype.forEach.call(bar.querySelectorAll('.ht-item'),function(node){
      node.addEventListener('click',function(){
        var i=+node.getAttribute('data-i');
        if(B.active){ B.act('switch',i); }
        else { S.active=i; E.save(); UI.renderParty(); UI.updateHUD(); }
      });
    });
  }
};

/* ---------- 标题/选队 ---------- */
UI.renderTitle = function(){
  var saved=E.hasSave();
  $('titleContinue').style.display=saved?'':'none';
  $('titleNew').textContent=saved?'重新开始游戏':'开始冒险';
  var grid=$('starterGrid');
  if (grid && !grid.dataset.built){
    grid.innerHTML=D.PETS.map(function(p){
      return '<button class="starter" data-id="'+p.id+'" style="--rar:'+D.RAR_COLOR[p.rar]+'">'+
        '<img src="'+D.petImg(p.id,'adult')+'" onerror="this.style.display=\'none\'">'+
        '<div class="st-name">'+esc(p.name)+'</div>'+
        '<div class="st-meta"><span style="color:'+D.ELEMENTS[p.elem].color+'">'+D.ELEMENTS[p.elem].icon+D.ELEMENTS[p.elem].name+'</span> · <span style="color:'+D.RAR_COLOR[p.rar]+'">'+p.rar+'</span></div>'+
        '</button>';
    }).join('');
    grid.dataset.built='1';
    window.__selPets=[];
    Array.prototype.forEach.call(grid.querySelectorAll('.starter'),function(btn){
      btn.addEventListener('click',function(){
        var id=btn.getAttribute('data-id');
        var arr=window.__selPets;
        var i=arr.indexOf(id);
        if(i>=0){arr.splice(i,1);btn.classList.remove('on');}
        else if(arr.length<3){arr.push(id);btn.classList.add('on');}
        else {UI.toast('最多选 3 只宠物');return;}
        var btnStart=$('btnStartAdventure');
        if(btnStart) btnStart.disabled=arr.length!==3;
      });
    });
  }
};

/* ---------- 队伍/背包/任务面板 ---------- */
UI.renderParty = function(){
  var S=E.S; if(!S) return;
  var grid=$('partyGrid');
  grid.innerHTML=S.team.map(function(p,i){
    var pet=D.PET_BY_ID[p.id], st=D.stageForLv(p.lv);
    var hp=Math.round(p.hp/E.curMaxHp(p)*100), mp=Math.round(p.mp/E.curMaxMp(p)*100);
    var nextExp=E.expNeed(p.lv);
    return '<div class="pet-card'+(i===S.active?' on':'')+'">'+
      '<div class="pc-top"><img src="'+D.petImg(p.id,st.key)+'" onerror="this.style.display=\'none\'">'+
      '<div class="pc-title"><b>'+esc(pet.name)+'</b><span class="pc-rar" style="color:'+D.RAR_COLOR[pet.rar]+'">'+pet.rar+'</span>'+
      '<div class="pc-sub" style="color:'+D.ELEMENTS[pet.elem].color+'">'+D.ELEMENTS[pet.elem].icon+D.ELEMENTS[pet.elem].name+' · '+st.name+' · Lv'+p.lv+'</div></div></div>'+
      '<div class="pc-bars">'+
      '<div class="pc-bar"><span>HP</span><i><b style="width:'+hp+'%;background:#7ee08f"></b></i><em>'+p.hp+'/'+E.curMaxHp(p)+'</em></div>'+
      '<div class="pc-bar"><span>MP</span><i><b style="width:'+mp+'%;background:#6ab8ff"></b></i><em>'+p.mp+'/'+E.curMaxMp(p)+'</em></div>'+
      '<div class="pc-bar"><span>EXP</span><i><b style="width:'+Math.min(100,Math.round(p.exp/nextExp*100))+'%;background:#ffd35c"></b></i><em>'+p.exp+'/'+nextExp+'</em></div>'+
      '</div>'+
      '<div class="pc-stats">攻 '+E.petStat(p,'atk')+' · 防 '+E.petStat(p,'def')+' · 速 '+E.petStat(p,'spd')+'</div>'+
      '<div class="pc-actions">'+
      (i===S.active?'<span class="pc-active">出战中</span>':'<button data-act="lead" data-i="'+i+'">设为首发</button>')+
      '</div></div>';
  }).join('');
  Array.prototype.forEach.call(grid.querySelectorAll('[data-act="lead"]'),function(b){
    b.addEventListener('click',function(){S.active=+b.getAttribute('data-i');E.save();UI.renderParty();UI.toast('已更换首发');});
  });
  /* 背包 */
  var bag=$('bagGrid');
  if(bag){
    bag.innerHTML=Object.keys(D.ITEMS).map(function(k){
      var it=D.ITEMS[k];
      return '<div class="bag-item"><span class="bi-icon">'+it.emoji+'</span><div><b>'+it.name+'</b><small>'+it.desc+'</small></div><span class="bi-num">×'+(S.bag[k]||0)+'</span></div>';
    }).join('');
  }
  /* 任务 */
  var questBox=$('questBox');
  if(questBox){
    var q=E.curQuest();
    if(q){
      var prog=S.quests.prog[q.id]||0;
      var ready=prog>=q.need;
      questBox.innerHTML='<div class="q-title">📜 '+esc(q.title)+'</div>'+
        '<div class="q-desc">'+esc(q.desc)+'</div>'+
        '<div class="q-prog">进度 '+Math.min(prog,q.need)+' / '+q.need+'</div>'+
        '<div class="q-reward">奖励：'+q.reward.gold+' 金币 · '+q.reward.exp+' 经验</div>'+
        (ready?'<button class="q-turnin" id="btnTurnIn">✅ 回 '+esc(q.npc)+' 处交付</button>':
         '<div class="q-hint">完成后回到 '+esc(q.npc)+' 处交付</div>');
      var ti=$('btnTurnIn'); if(ti) ti.addEventListener('click',function(){
        if(E.turnInAvailable()){
          var r=E.completeQuest();
          UI.toast('任务完成！+'+r.q.reward.gold+' 金币 · +'+r.q.reward.exp+' 经验');
          UI.renderParty(); UI.updateHUD();
        } else UI.toast('任务还没完成');
      });
    } else {
      questBox.innerHTML='<div class="q-title">🏆 全部主线完成！</div><div class="q-desc">你是知识大陆的守护者了。</div>';
    }
  }
};

/* ---------- 战斗界面 ---------- */
UI.renderBattle = function(){
  if(!B.active) return;
  var mon=B.mon, el=D.ELEMENTS[mon.elem];
  $('bEnemyName').textContent=mon.name+' Lv'+B.monLv+(B.isBoss?' 👹':'');
  $('bEnemyElem').textContent=el.icon+el.name;
  $('bEnemyElem').style.color=el.color;
  $('bEnemyImg').src=D.monsterImg(mon);
  var pct=Math.round(B.monHp/B.monMaxHp*100);
  $('bEnemyHpFill').style.width=pct+'%';
  $('bEnemyHpTxt').textContent=B.monHp+'/'+B.monMaxHp;
  var pet=E.activePet(), p=D.PET_BY_ID[pet.id], st=D.stageForLv(pet.lv);
  $('bMyName').textContent=p.name+' Lv'+pet.lv;
  $('bMyImg').src=D.petImg(p.id,st.key);
  var hp=Math.round(pet.hp/E.curMaxHp(pet)*100);
  $('bMyHpFill').style.width=hp+'%';
  $('bMyHpTxt').textContent=pet.hp+'/'+E.curMaxHp(pet);
  $('bMyMp').textContent='MP '+pet.mp+'/'+E.curMaxMp(pet);
  /* 队伍切换小按钮 */
  var row=$('bTeamRow');
  row.innerHTML=E.S.team.map(function(pp,i){
    var ppet=D.PET_BY_ID[pp.id];
    return '<button data-i="'+i+'" class="'+(i===E.S.active?'on':'')+'" '+(pp.hp<=0?'disabled':'')+'>'+ppet.emoji+'</button>';
  }).join('');
  Array.prototype.forEach.call(row.querySelectorAll('button'),function(b){
    b.addEventListener('click',function(){ B.act('switch',+b.getAttribute('data-i')); });
  });
};
UI.battleLog = function(s){
  var box=$('bLog'); if(!box) return;
  var d=document.createElement('div'); d.textContent=s;
  box.appendChild(d); box.scrollTop=box.scrollHeight;
  while(box.children.length>7) box.removeChild(box.firstChild);
};

/* ---------- 答题弹层 ---------- */
UI.openQuiz = function(kind, skill){
  var q=E.pickQuestion(E.S.grade, B.usedTexts);
  if (!q){ /* 题库不可用，直接当作答对 */
    UI.toast('题库加载中，技能直接发动');
    setTimeout(function(){B.resolveQuiz(true);},300);
    return;
  }
  B.usedTexts[q.q]=1;
  var box=$('quizQ'); box.textContent=q.q;
  var subj=$('quizSubj'); if(subj) subj.textContent=(q.kn||'知识挑战');
  var opts=$('quizOpts');
  if(q.tp==='choice'){
    opts.innerHTML=q.o.map(function(o,i){
      return '<button data-i="'+i+'">'+esc(o)+'</button>';
    }).join('');
    Array.prototype.forEach.call(opts.querySelectorAll('button'),function(b){
      b.addEventListener('click',function(){
        var ok=E.judge(q, +b.getAttribute('data-i'));
        closeQuiz(); B.resolveQuiz(ok);
      });
    });
  } else {
    opts.innerHTML='<div class="q-fill"><input id="quizInput" placeholder="输入答案" autocomplete="off"><button id="quizSubmit">提交</button></div>';
    var inp=$('quizInput'), btn=$('quizSubmit');
    var submit=function(){ var ok=E.judge(q, inp.value); closeQuiz(); B.resolveQuiz(ok); };
    btn.addEventListener('click',submit);
    inp.addEventListener('keydown',function(e){ if(e.key==='Enter') submit(); });
    setTimeout(function(){inp.focus();},80);
  }
  $('quizTitle').textContent = kind==='ult'?'🔥 必杀技 · 答对发动':'✨ 知识技能 · 答对发动';
  $('quizOverlay').classList.remove('hidden');
};
function closeQuiz(){ $('quizOverlay').classList.add('hidden'); }

/* ---------- 剧情对话 ---------- */
UI.dialog = function(title, text, onClose){
  $('dlgTitle').textContent=title;
  $('dlgText').innerHTML=text;
  $('dlgOverlay').classList.remove('hidden');
  var btn=$('dlgOk');
  var handler=function(){ $('dlgOverlay').classList.add('hidden'); btn.removeEventListener('click',handler); if(onClose)onClose(); };
  btn.addEventListener('click',handler);
};

/* ---------- NPC 交互 ---------- */
UI.talkNPC = function(npc){
  if (npc.role==='shop'){
    UI.dialog(npc.name+' · 药剂师','欢迎光临！用金币买些补给吧。<br>活力药水 40 · 能量水晶 60 · 经验糖果 80',function(){
      UI.shop();
    });
    return;
  }
  var q=E.curQuest();
  if (!q){ UI.dialog(npc.name,'知识大陆就交给你守护了，去冒险吧！'); return; }
  var ready=E.turnInAvailable();
  if (q.npc===npc.name && ready){
    UI.dialog(npc.name,'太棒了！你完成了「'+esc(q.title)+'」。',function(){
      var r=E.completeQuest();
      UI.toast('任务完成！+'+r.q.reward.gold+' 金币 · +'+r.q.reward.exp+' 经验');
      UI.updateHUD();
      if(r.next) setTimeout(function(){UI.dialog(npc.name,'下一个任务：「'+esc(r.next.title)+'」<br>'+esc(r.next.desc));},250);
    });
  } else if (q.npc===npc.name){
    UI.dialog(npc.name,'「'+esc(q.title)+'」<br>'+esc(q.desc)+'<br><small>进度 '+(E.S.quests.prog[q.id]||0)+'/'+q.need+'</small>');
  } else {
    UI.dialog(npc.name,'我现在没有任务交给你。去找 '+esc(q.npc)+' 看看吧。');
  }
};
UI.shop = function(){
  var S=E.S;
  var items=Object.keys(D.ITEMS).map(function(k){
    var it=D.ITEMS[k];
    return '<div class="shop-item"><span>'+it.emoji+' '+it.name+'</span><span>'+it.price+' 金币</span><button data-k="'+k+'">买</button></div>';
  }).join('');
  $('shopList').innerHTML=items;
  $('shopGold').textContent=S.gold;
  $('shopOverlay').classList.remove('hidden');
  Array.prototype.forEach.call($('shopList').querySelectorAll('button'),function(b){
    b.addEventListener('click',function(){
      var k=b.getAttribute('data-k'), it=D.ITEMS[k];
      if(S.gold<it.price){UI.toast('金币不足');return;}
      S.gold-=it.price; S.bag[k]=(S.bag[k]||0)+1; E.save();
      $('shopGold').textContent=S.gold; UI.toast('买到 '+it.name);
    });
  });
};

/* ---------- 战斗结算 ---------- */
UI.battleEnd = function(r){
  if (r.win){
    var msg='🎉 胜利！<br>获得 '+r.exp+' 经验 · '+r.gold+' 金币';
    if (r.ups && r.ups.length) msg+='<br><b style="color:#ffd35c">'+r.ups.join('<br>')+'</b>';
    UI.dialog('战斗胜利', msg, function(){ UI.show('worldStage'); });
  } else {
    UI.dialog('战斗失败', '队伍体力不支，被送回村庄休整。<br>'+(r.lost?('损失了 '+r.lost+' 金币'):'别灰心，再试一次！'), function(){
      E.S.player.x=D.MAP_CFG.spawn.x; E.S.player.y=D.MAP_CFG.spawn.y;
      W.resetToSave(); UI.show('worldStage');
    });
  }
};

/* ---------- 提示 ---------- */
UI.toast = function(msg){
  var t=$('toast'); if(!t) return;
  t.textContent=msg; t.classList.remove('hidden');
  clearTimeout(UI.toastTimer);
  UI.toastTimer=setTimeout(function(){t.classList.add('hidden');},2200);
};

window.RPG_UI = UI;
