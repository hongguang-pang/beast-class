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
/* 宠物图统一渲染：图片加载失败时回退显示 emoji，绝不空白 */
function petImgTag(id, stageKey, cls){
  var pet=D.PET_BY_ID[id]||{emoji:'❔'};
  var fb=pet.emoji||'❔';
  return '<span class="petimg'+(cls?' '+cls:'')+'" title="'+esc(pet.name)+'">'+
    '<span class="petimg-emoji">'+fb+'</span>'+
    '<img src="'+D.petImg(id,stageKey)+'" alt="'+esc(pet.name)+'" '+
    'onload="this.style.display=\'inline\';this.previousElementSibling.style.display=\'none\'" '+
    'onerror="this.style.display=\'none\';this.previousElementSibling.style.display=\'inline\'">'+
    '</span>';
}

UI.show = function(view){
  this.view=view;
  ['titleView','partyView','worldStage','battleView'].forEach(function(v){
    var el=$(v); if(el) el.classList.toggle('hidden', v!==view);
  });
  if (view==='worldStage'){
    W.enabled=true;
    setTimeout(function(){W.resize(); W.start();},30);
    /* 回到地图播放地图音乐（战斗音乐由遇敌回调单独切换） */
    if (window.RPG_AUDIO && !window.RPG_AUDIO.isMuted()) window.RPG_AUDIO.playBGM('world');
  } else { W.enabled=false; }
  if (view==='titleView'){ if(window.RPG_AUDIO) window.RPG_AUDIO.playBGM('none'); }
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
        petImgTag(p.id, st.key)+
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
  $('titleNew').textContent='重新开始游戏';
  $('titleNew').style.display=saved?'':'none'; /* 无存档时隐藏，避免与主「开始冒险」按钮文字重复 */
  var grid=$('starterGrid');
  if (grid && !grid.dataset.built){
    grid.innerHTML=D.PETS.map(function(p){
      return '<button class="starter" data-id="'+p.id+'" style="--rar:'+D.RAR_COLOR[p.rar]+'">'+
        petImgTag(p.id,'adult')+
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
      '<div class="pc-top">'+petImgTag(p.id,st.key)+
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
  /* 支线任务列表 */
  var sideBox=$('sideBox');
  if (sideBox){
    var sides=D.SIDE_QUESTS;
    var html='<div class="side-head">🔀 支线委托 <small>找对应 NPC 接取/交付</small></div>';
    sides.forEach(function(s){
      var accepted=E.S.side.accepted[s.id], done=E.S.side.done[s.id];
      var prog=E.S.side.prog[s.id]||0;
      var stat = done?'<span class="side-tag done">✓ 完成</span>'
        : accepted?('<span class="side-tag doing">'+(prog>=s.need?'可交付':Math.min(prog,s.need)+'/'+s.need)+'</span>')
        : '<span class="side-tag open">未接取</span>';
      html+='<div class="side-item'+(done?' dim':'')+'"><div class="side-row"><b>'+esc(s.title)+'</b>'+stat+'</div>'+
        '<div class="side-desc">'+esc(s.desc)+' <small>· '+esc(s.npc)+'</small></div></div>';
    });
    sideBox.innerHTML=html;
  }
  /* 剧情关卡链（当前年级全部知识点/单元） */
  var cb=$('campaignBox');
  if (cb && window.RPG_CAMPAIGN && E.S.campaign){
    var C=window.RPG_CAMPAIGN, camp=E.S.campaign;
    var cov=C.coverage(E.S);
    var h='<div class="campaign-summary">📚 '+esc((window.GRADES||[]).find(function(g){return g.id===camp.grade;})||{}).name+
      ' · 覆盖 '+cov.covered+'/'+cov.total+' 知识点（'+cov.pct+'%）· 关卡 '+cov.levelsCleared+'/'+cov.levelsTotal+'</div>'+
      '<div class="campaign-progress"><i style="width:'+cov.pct+'%"></i></div>'+
      '<div class="campaign-list">';
    camp.levels.forEach(function(L,i){
      var done=L.kps.filter(function(k){return camp.covered[k];}).length;
      var pct=L.kps.length?Math.round(done/L.kps.length*100):0;
      var cleared=camp.cleared[L.id];
      var weakN=L.kps.filter(function(k){return (camp.weak[k]||0)>=2;}).length;
      var cls='campaign-item'+(i===camp.cur?' cur':'')+(cleared?' cleared':'');
      h+='<button class="'+cls+'" data-i="'+i+'">'+
        '<span class="ci-icon">'+window.RPG_CAMPAIGN.subjIcon(L.subj)+'</span>'+
        '<span class="ci-body"><b>'+esc(L.title)+'</b><small>'+done+'/'+L.kps.length+' 知识点'+(weakN?' · 🎯'+weakN+'薄弱':'')+'</small>'+
        '<i class="ci-bar"><em style="width:'+pct+'%"></em></i></span>'+
        '<span class="ci-mark">'+(cleared?'✓':(i===camp.cur?'▶':'·'))+'</span></button>';
    });
    h+='</div>';
    cb.innerHTML=h;
    Array.prototype.forEach.call(cb.querySelectorAll('.campaign-item'),function(b){
      b.addEventListener('click',function(){
        var idx=+b.getAttribute('data-i');
        C.gotoLevel(E.S, idx); E.save();
        UI.toast('已切换到：'+C.curLevel(E.S).title);
        UI.renderParty();
      });
    });
  }
};

/* ---------- 战斗界面 ---------- */
UI.renderBattle = function(){
  if(!B.active) return;
  /* 章节/知识点覆盖信息条 */
  var cbar=$('bCampaignBar');
  if (cbar && window.RPG_CAMPAIGN){
    var L=window.RPG_CAMPAIGN.curLevel(E.S);
    var cov=window.RPG_CAMPAIGN.coverage(E.S);
    if (L){
      var doneK=L.kps.filter(function(k){ return E.S.campaign.covered[k]; }).length;
      var weakN=L.kps.filter(function(k){ return (E.S.campaign.weak[k]||0)>=2; }).length;
      cbar.innerHTML='<span class="bcb-title">'+esc(L.title)+'</span>'+
        '<span class="bcb-prog">单元知识点 '+doneK+'/'+L.kps.length+'</span>'+
        '<span class="bcb-global">全年级 '+cov.pct+'%</span>'+
        (weakN?'<span class="bcb-weak">🎯 薄弱 '+weakN+'</span>':'');
      cbar.style.display='flex';
    } else { cbar.style.display='none'; }
  }
  var mon=B.mon, el=D.ELEMENTS[mon.elem];
  $('bEnemyName').textContent=mon.name+' Lv'+B.monLv+(B.isBoss?' 👹':'');
  $('bEnemyElem').textContent=el.icon+el.name;
  $('bEnemyElem').style.color=el.color;
  var eImg=$('bEnemyImg');
  eImg.onerror=function(){ this.style.display='none'; var ph=$('bEnemyPh'); if(ph)ph.style.display='flex'; };
  eImg.onload=function(){ this.style.display='block'; var ph=$('bEnemyPh'); if(ph)ph.style.display='none'; };
  eImg.src=D.monsterImg(mon);
  var pct=Math.round(B.monHp/B.monMaxHp*100);
  $('bEnemyHpFill').style.width=pct+'%';
  $('bEnemyHpTxt').textContent=B.monHp+'/'+B.monMaxHp;
  var pet=E.activePet(), p=D.PET_BY_ID[pet.id], st=D.stageForLv(pet.lv);
  $('bMyName').textContent=p.name+' Lv'+pet.lv;
  var mImg=$('bMyImg');
  mImg.onerror=function(){ this.style.display='none'; var ph=$('bMyPh'); if(ph)ph.style.display='flex'; };
  mImg.onload=function(){ this.style.display='block'; var ph=$('bMyPh'); if(ph)ph.style.display='none'; };
  mImg.src=D.petImg(p.id,st.key);
  var mPh=$('bMyPh'); if(mPh) mPh.textContent=p.emoji||'❔';
  var hp=Math.round(pet.hp/E.curMaxHp(pet)*100);
  $('bMyHpFill').style.width=hp+'%';
  $('bMyHpTxt').textContent=pet.hp+'/'+E.curMaxHp(pet);
  $('bMyMp').textContent='MP '+pet.mp+'/'+E.curMaxMp(pet);
  /* 个性化炫酷招式名（随当前出战宠物变化） */
  var nNormal=D.moveName(pet.id,'normal'), nSpell=D.moveName(pet.id,'spell'), nUlt=D.moveName(pet.id,'ult');
  if($('bNormal')) $('bNormal').innerHTML='⚔️ '+esc(nNormal);
  if($('bSpell')) $('bSpell').innerHTML='✨ '+esc(nSpell)+'<small>答题·'+D.SKILLS.spell.mp+'MP</small>';
  if($('bUlt')) $('bUlt').innerHTML='🔥 '+esc(nUlt)+'<small>答题·'+D.SKILLS.ult.mp+'MP</small>';
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
  var q=null, kid=null, mode=null, L=null;
  /* 优先按当前剧情关卡的知识点出题（覆盖 + 薄弱巩固） */
  if (window.RPG_CAMPAIGN){
    L=window.RPG_CAMPAIGN.curLevel(E.S);
    var pick=window.RPG_CAMPAIGN.pickBattleQuestion(E.S, B.usedTexts);
    if (pick){ q=E.formatBankQ(pick.raw); kid=pick.kid; mode=pick.mode; }
  }
  /* 关卡无可用题时回退到年级随机题库 */
  if (!q) q=E.pickQuestion(E.S.grade, B.usedTexts);
  if (!q){ /* 题库不可用，直接当作答对 */
    UI.toast('题库加载中，技能直接发动');
    setTimeout(function(){B.resolveQuiz(true);},300);
    return;
  }
  B.usedTexts[q.q]=1;
  /* 保存当前题供结算时记录覆盖/薄弱（kid 缺失则从题库按题干反查） */
  if (!kid && q.kid) kid=q.kid;
  B.currentQuiz={ q:q, kid:kid, mode:mode, level:L };
  var box=$('quizQ'); box.textContent=q.q;
  var subj=$('quizSubj');
  if(subj){
    var tag = mode==='weak' ? '🎯 薄弱巩固 · ' : (L? (window.RPG_CAMPAIGN.subjIcon(L.subj)+' '):'');
    subj.textContent=tag+(q.kn||'知识挑战');
  }
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
  var activePet=E.activePet();
  var moveN=D.moveName(activePet.id, kind);
  $('quizTitle').textContent = (kind==='ult'?'🔥 ':'✨ ')+moveN+' · 答对发动';
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

/* ---------- NPC 交互：主线 + 支线 ---------- */
UI.talkNPC = function(npc){
  if (npc.role==='shop'){
    UI.dialog(npc.name+' · 药剂师','欢迎光临！用金币买些补给吧。<br>活力药水 40 · 能量水晶 60 · 经验糖果 80',function(){
      UI.shop();
    });
    return;
  }
  /* 优先：可交付的支线 */
  var readySides=E.readySideForNPC(npc.name);
  if (readySides.length){
    var rs=readySides[0];
    UI.dialog(npc.name,'「'+esc(rs.title)+'」完成了！辛苦你了。',function(){
      var r=E.completeSide(rs.id);
      UI.toast('支线完成！+'+r.q.reward.gold+' 金币 · +'+r.q.reward.exp+' 经验');
      UI.updateHUD(); UI.renderParty();
    });
    return;
  }
  /* 主线交付 */
  var q=E.curQuest();
  if (q && q.npc===npc.name && E.turnInAvailable()){
    UI.dialog(npc.name,'太棒了！你完成了「'+esc(q.title)+'」。',function(){
      var r=E.completeQuest();
      UI.toast('任务完成！+'+r.q.reward.gold+' 金币 · +'+r.q.reward.exp+' 经验');
      UI.updateHUD();
      if(r.next) setTimeout(function(){UI.dialog(npc.name,'下一个任务：「'+esc(r.next.title)+'」<br>'+esc(r.next.desc));},250);
    });
    return;
  }
  /* 可接取的支线（列出，玩家点选） */
  var openSides=E.openSideForNPC(npc.name);
  if (openSides.length){
    var os=openSides[0];
    UI.dialog(npc.name,'我这里有个小委托：<br><b>'+esc(os.title)+'</b><br>'+esc(os.desc)+
      '<br><small>奖励：'+os.reward.gold+' 金币 · '+os.reward.exp+' 经验</small>',function(){
      E.acceptSide(os.id);
      UI.toast('已接取支线：'+os.title);
      UI.renderParty();
    });
    return;
  }
  /* 在进行的支线进度提示 */
  var doing=D.SIDE_QUESTS.filter(function(s){return npc.name===s.npc && E.S.side.accepted[s.id] && !E.S.side.done[s.id];});
  if (doing.length){
    var ds=doing[0];
    UI.dialog(npc.name,'「'+esc(ds.title)+'」<br>'+esc(ds.desc)+'<br><small>进度 '+(E.S.side.prog[ds.id]||0)+'/'+ds.need+'</small>');
    return;
  }
  /* 主线进度或默认 */
  if (q && q.npc===npc.name){
    UI.dialog(npc.name,'「'+esc(q.title)+'」<br>'+esc(q.desc)+'<br><small>进度 '+(E.S.quests.prog[q.id]||0)+'/'+q.need+'</small>');
  } else if (q){
    UI.dialog(npc.name,'主线去找 '+esc(q.npc)+' 吧。我这边暂时没有委托了。');
  } else {
    UI.dialog(npc.name,'知识大陆就交给你守护了，去冒险吧！');
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
    if (r.drops && r.drops.length){
      msg+='<br><span style="color:#8fe3a8">🎁 掉落：'+r.drops.map(function(d){
        var it=D.ITEMS[d.item]; return (it?it.emoji:'🎁')+(it?it.name:d.item)+'×'+d.n;
      }).join('、')+'</span>';
    }
    if (r.ups && r.ups.length) msg+='<br><b style="color:#ffd35c">'+r.ups.join('<br>')+'</b>';
    /* 延迟弹窗，先让胜利礼花特效展示 */
    setTimeout(function(){ UI.dialog('战斗胜利', msg, function(){ UI.show('worldStage'); }); }, 850);
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
