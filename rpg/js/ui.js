/* ============================================================
 * 知识大陆 · 知识远征  —  UI 层
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
/* 宠物图统一渲染：图片加载失败时回退显示 emoji，绝不空白
 * Petdex 动画伙伴（_pd）：用 CSS steps 精灵动画渲染 idle 状态 */
function petImgTag(id, stageKey, cls){
  var pet=D.PET_BY_ID[id]||{emoji:'❔'};
  var wrap='<span class="petimg'+(cls?' '+cls:'')+'" title="'+esc(pet.name)+'">';
  /* Petdex 动画宠物：百分比自适应精灵，按容器 contain 缩放，与静态图观感一致 */
  if (pet._pd && window.RPG_PETDEX){
    var PD=window.RPG_PETDEX, pd=PD.byId(id);
    if (pd){
      /* v6.2.1：小图标固定第一帧，不播放 steps 动画，避免持续闪动 */
      return wrap+'<span class="petimg-emoji">'+ (pet.emoji||'🐾') +'</span>'+
        '<div class="pd-sprite pd-still" data-pd="'+id+'" data-state="idle" style="'+PD.stillSpriteStyle(pd,0)+'"></div></span>';
    }
  }
  var fb=pet.emoji||'❔';
  return wrap+'<span class="petimg-emoji">'+fb+'</span>'+
    '<img src="'+D.petImg(id,stageKey)+'" alt="'+esc(pet.name)+'" '+
    'onload="this.style.display=\'block\';this.previousElementSibling.style.display=\'none\'" '+
    'onerror="this.style.display=\'none\';this.previousElementSibling.style.display=\'inline\'">'+
    '</span>';
}

UI.show = function(view){
  this.view=view;
  ['titleView','partyView','worldStage','battleView','codexView','switchView','talentsView','questView'].forEach(function(v){
    var el=$(v); if(el) el.classList.toggle('hidden', v!==view);
  });
  if (view==='worldStage'){
    W.enabled=true;
    /* v6.2.1：移动端布局就绪时机不定，多重触发 resize 确保画布尺寸正确 */
    W.resize(); W.start();
    requestAnimationFrame(function(){ W.resize(); });
    setTimeout(function(){W.resize(); W.start();},30);
    /* 回到地图播放地图音乐（战斗音乐由遇敌回调单独切换） */
    if (window.RPG_AUDIO && !window.RPG_AUDIO.isMuted()) window.RPG_AUDIO.playBGM('world');
  } else { W.enabled=false; }
  if (view==='titleView'){ if(window.RPG_AUDIO) window.RPG_AUDIO.playBGM('none'); }
  if (view==='partyView') UI.renderParty();
  if (view==='questView') UI.renderQuestCenter();
  if (view==='codexView') UI.renderCodex();
  if (view==='switchView') UI.renderSwitch();
  if (view==='talentsView') UI.renderTalents();
  if (view==='battleView') UI.renderBattle();
  UI.updateHUD();
};

/* 探索进度：小地图标签显示 已发现区域数 / 总数 */
UI.updateExplore = function(){
  var el=$('mmExplore'); if(!el || !E || !E.exploreCount || !D) return;
  var total=D.MAP_CFG.zones.length, n=E.exploreCount();
  el.textContent='探索 '+n+'/'+total;
  el.classList.toggle('all-done', n>=total);
};

UI.updateHUD = function(){
  var S=E.S; if(!S) return;
  var g=D.PET_BY_ID[S.team[S.active].id];
  var el=$('hudGold'); if(el) el.textContent=S.gold;
  var el2=$('hudZone'); if(el2) el2.textContent=(window.__curZone||'知识大陆');
  UI.updateExplore();
  var q=E.curQuest();
  var el3=$('hudQuestBar');
  if(el3){
    if(q){
      var pr=Math.min(S.quests.prog[q.id]||0,q.need);
      var pct=Math.round(pr/q.need*100);
      el3.innerHTML='<span class="hq-txt">🧒 '+esc(q.title)+' <b>'+pr+'/'+q.need+'</b></span>'+
        '<span class="hq-bar"><i style="width:'+pct+'%"></i></span>'+
        '<span class="hq-go">详情 ›</span>';
    } else {
      el3.innerHTML='<span class="hq-txt">🏆 主线全部完成</span><span class="hq-go">查看 ›</span>';
    }
  }
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
      questBox.innerHTML='<div class="q-title">🧒 '+esc(q.title)+'</div>'+
        '<div class="q-desc">'+esc(q.desc)+'</div>'+
        (q.hint?'<div class="q-guide">💡 '+esc(q.hint)+'</div>':'')+
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
  UI.renderSideBox($('sideBox'));
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

/* 支线委托渲染（队伍面板 / 任务中心共用） */
UI.renderSideBox = function(sideBox){
  if (!sideBox) return;
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
};

/* ---------- 任务中心：当前任务 + 主线列表 + 支线（一站式） ---------- */
UI.renderQuestCenter = function(){
  var S=E.S; if(!S) return;
  var q=E.curQuest();

  /* 1. 当前任务大卡片 */
  var focus=$('questFocus');
  if (focus){
    if (q){
      var prog=Math.min(S.quests.prog[q.id]||0,q.need);
      var pct=Math.round(prog/q.need*100);
      var ready=prog>=q.need;
      focus.innerHTML=
        '<div class="qf-top"><span class="qf-badge">当前目标</span>'+
          '<span class="qf-npc">交付人：'+esc(q.npc)+'</span></div>'+
        '<div class="qf-title">🧒 '+esc(q.title)+'</div>'+
        '<div class="qf-desc">'+esc(q.desc)+'</div>'+
        (q.hint?'<div class="qf-guide"><b>💡 怎么做</b><br>'+esc(q.hint)+'</div>':'')+
        '<div class="qf-progress"><span>完成进度</span><b>'+prog+' / '+q.need+'</b></div>'+
        '<div class="qf-bar"><i style="width:'+pct+'%"></i></div>'+
        '<div class="qf-reward">🎁 奖励：'+q.reward.gold+' 金币 · '+q.reward.exp+' 经验</div>'+
        (ready?'<button class="qf-turnin" id="btnQuestTurnIn">✅ 已完成 · 回 '+esc(q.npc)+' 处交付</button>':
         '<div class="qf-tip">完成后回到 <b>'+esc(q.npc)+'</b> 处交付</div>');
      var ti=$('btnQuestTurnIn'); if(ti) ti.addEventListener('click',function(){
        if(E.turnInAvailable()){
          var r=E.completeQuest();
          UI.toast('任务完成！+'+r.q.reward.gold+' 金币 · '+r.q.reward.exp+' 经验');
          UI.renderQuestCenter(); UI.updateHUD();
        } else UI.toast('任务还没完成');
      });
    } else {
      focus.innerHTML='<div class="qf-title">🏆 全部主线完成！</div>'+
        '<div class="qf-desc">你是知识大陆的守护者了，继续探索图鉴与支线吧。</div>';
    }
  }

  /* 2. 主线任务列表：完成 / 进行中 / 未解锁 */
  var list=$('questList');
  if (list){
    var all=D.QUESTS||[], curId=q&&q.id;
    var html='';
    all.forEach(function(t,i){
      var done=!!S.quests.done[t.id];
      var isCur=t.id===curId;
      var pr=Math.min(S.quests.prog[t.id]||0,t.need);
      var cls='ql-item'+(done?' done':'')+(isCur?' cur':'');
      var mark=done?'✓':(isCur?'▶':(i===0||S.quests.done[all[i-1].id]?'·':'🔒'));
      var sub=done?'已完成':(isCur?(pr+'/'+t.need+' · 进行中'):(mark==='🔒'?'前置任务未完成':'待接取'));
      html+='<div class="'+cls+'"><span class="ql-mark">'+mark+'</span>'+
        '<span class="ql-body"><b>'+esc(t.title)+'</b><small>'+esc(sub)+'</small></span>'+
        '<span class="ql-npc">'+esc(t.npc)+'</span></div>';
    });
    list.innerHTML=html;
  }

  /* 3. 支线委托 */
  UI.renderSideBox($('questSide'));
};

/* ---------- 属性↔学科 提示条 ---------- */
UI.renderSubjectBar = function(petId){
  var bar=$('bSubjectBar'); if(!bar || !window.RPG_DATA || !D.subjectElement) return;
  var pet=D.PET_BY_ID[petId]; if(!pet) return;
  var el=D.ELEMENTS[pet.elem];
  var beatsKey=D.ELEM_ADV[pet.elem];            /* 本属性克制的属性 */
  var beats=D.ELEMENTS[beatsKey];
  /* 被克制属性所对应的学科 = 能打出暴击的学科 */
  var critSubs=D.elemSubjects(beatsKey).map(function(s){
    return (window.SUBJ_META&&window.SUBJ_META[s]&&window.SUBJ_META[s].name)||s;
  }).join('/');
  var html='<span class="sb-elem" style="color:'+el.color+'">'+el.icon+' '+el.name+'系</span>'+
    '<span class="sb-crit">💥 答对【'+esc(critSubs)+'】暴击×2</span>';
  /* 当前关卡学科 + 克制它所需的宠物属性（缺哪个换哪个） */
  var L=(window.RPG_CAMPAIGN&&window.RPG_CAMPAIGN.curLevel(E.S));
  if (L && L.subj){
    var sName=(window.SUBJ_META&&window.SUBJ_META[L.subj]&&window.SUBJ_META[L.subj].name)||L.subj;
    var se=D.subjectElement(L.subj);
    /* 谁克制当前学科属性 → 用该属性宠物答题可暴击 */
    var counterElem=null;
    for (var k in D.ELEM_ADV){ if (D.ELEM_ADV[k]===se){ counterElem=k; break; } }
    var ce=counterElem?D.ELEMENTS[counterElem]:null;
    html+='<span class="sb-now">当前 '+esc(sName)+' → 换 '+(ce?ce.icon+ce.name:'?')+'系宠物可暴击</span>';
  }
  bar.innerHTML=html;
};

/* ---------- 战况预判 + 属性克制环（借鉴 Wesnoth / Unciv 的攻击预览） ----------
 * 出招前就看到：普攻/技能/必杀的预计伤害、怪物反击伤害、克制关系，
 * 以及“换哪只宠物能克制这只怪”的建议——把抽象的属性克制变成看得见的策略。
 */
UI.renderForecast = function(){
  var box=$('bForecast'); if(!box) return;
  if (!window.RPG_ENGINE || !E.forecast || !B || !B.active || !B.mon || !E.S){ box.style.display='none'; return; }
  box.style.display='block';
  var pet=E.activePet(); if(!pet || pet.hp<=0){ box.style.display='none'; return; }
  var f=E.forecast(pet, B.mon, B.monLv, false);
  var pdef=D.PET_BY_ID[pet.id], pe=D.ELEMENTS[pdef.elem]||D.ELEMENTS.light;
  var me=D.ELEMENTS[B.mon.elem]||D.ELEMENTS.light;

  /* 克制关系徽章 */
  var relTxt = f.relation==='adv' ? ('✅ 我克制它 ×'+f.mult.toFixed(1))
             : f.relation==='dis' ? ('⚠️ 被它克制 ×'+f.mult.toFixed(1))
             : '⚖️ 势均力敌';
  var relCls = 'fc-rel-'+f.relation;

  /* 三招伤害预估：普攻可能被护甲吃掉，技能/必杀破防 */
  var armorTip = f.armor>0 ? '<span class="fc-armor">🛡️ 护甲 '+f.armor+'（普攻削弱·技能破防）</span>' : '';
  var moves =
    '<div class="fc-move"><b>⚔️ 普攻</b><span>'+f.normal+'</span></div>'+
    '<div class="fc-move"><b>✨ 技能</b><span>'+f.spell+(f.spellCrit>f.spell?' <i>暴击'+f.spellCrit+'</i>':'')+'</span></div>'+
    '<div class="fc-move"><b>🔥 必杀</b><span>'+f.ult+(f.ultCrit>f.ult?' <i>暴击'+f.ultCrit+'</i>':'')+'</span></div>';

  /* 怪物反击预估 */
  var backTxt = '怪物反击约 <b>'+f.back+'</b>'+(f.backMult>1?' <span class="fc-danger">（克制我 ×'+f.backMult.toFixed(1)+'）</span>':'');

  /* 换宠建议：算队伍里每只存活宠物对怪物的技能伤害，挑最高的且能克制的 */
  var best=null, bestDmg=-1, counterTip='';
  E.S.team.forEach(function(pp){
    if (pp.hp<=0) return;
    var fd=E.forecast(pp, B.mon, B.monLv, false);
    if (fd.spell>bestDmg){ bestDmg=fd.spell; best={pp:pp, f:fd}; }
  });
  if (best && best.pp.id!==pet.id && bestDmg>f.spell){
    var bp=D.PET_BY_ID[best.pp.id], be=D.ELEMENTS[bp.elem];
    counterTip='<span class="fc-suggest">💡 换 '+be.icon+bp.name+'（'+(best.f.relation==='adv'?'克制':'更强')+'）→ 技能可打约 '+bestDmg+'</span>';
  }

  /* 属性克制环：fire→wood→water→fire，light↔dark 互克，高亮对局双方 */
  var order=['fire','wood','water','light','dark'];
  var ring='<div class="fc-ring">'+order.map(function(k){
    var e=D.ELEMENTS[k];
    var isMe=(k===pdef.elem), isMon=(k===B.mon.elem);
    /* 克制目标：我克制谁 / 谁克制我 */
    var iBeat=D.ELEM_ADV[k]===B.mon.elem;     // 该属性克制怪物
    var beatMe=D.ELEM_ADV[B.mon.elem]===k;    // 怪物克制该属性
    var cls='fc-node'+(isMe?' is-me':'')+(isMon?' is-mon':'')+(iBeat?' beats-mon':'')+(beatMe?' beaten':'');
    var tag=isMe?'我':(isMon?'怪':'');
    return '<span class="'+cls+'" style="--ec:'+e.color+'" title="'+e.name+'系"'+(tag?'>'+e.icon+'<em>'+tag+'</em>':'>'+e.icon)+'</span>';
  }).join('<span class="fc-arrow">›</span>')+'</div>';
  var ringTip='<span class="fc-ring-tip">🔥火 › 🌿木 › 💧水 › 🔥火 · ✨光 ↔ 🌙暗（箭头指向被克制方）</span>';

  box.innerHTML=
    '<div class="fc-head"><span class="fc-title">🔮 战况预判</span>'+
      '<span class="fc-rel '+relCls+'">'+relTxt+'</span></div>'+
    '<div class="fc-body">'+
      '<div class="fc-moves">'+moves+armorTip+'</div>'+
      '<div class="fc-back">'+backTxt+'</div>'+
    '</div>'+
    '<div class="fc-advice">'+counterTip+'</div>'+
    '<div class="fc-ring-wrap">'+ring+ringTip+'</div>';
};

/* ---------- 切换宠物 / 编队界面 ---------- */
UI.switchSel = [];   // 当前编辑中的出战顺序（宠物 id）
UI.renderSwitch = function(){
  var S=E.S; if(!S) return;
  if(!UI.switchSel || !UI.switchSel.length) UI.switchSel = S.team.map(function(p){return p.id;});
  /* 出战槽（最多3） */
  var slots=$('switchSlots');
  if(slots){
    slots.innerHTML=UI.switchSel.map(function(id,i){
      var pet=D.PET_BY_ID[id]; if(!pet) return '';
      var st=E.rosterState(id), stage=D.stageForLv(st.lv);
      return '<div class="sw-slot'+(i===0?' lead':'')+'" data-i="'+i+'">'+
        '<span class="sw-idx">'+(i===0?'⭐首发':(i+1))+'</span>'+
        petImgTag(id, stage.key)+
        '<span class="sw-sname">'+esc(pet.name)+' Lv'+st.lv+'</span>'+
        '<span class="sw-sactions">'+
          (i>0?'<button data-move="up" data-i="'+i+'" title="前移">◀</button>':'')+
          (i<UI.switchSel.length-1?'<button data-move="down" data-i="'+i+'" title="后移">▶</button>':'')+
          '<button data-remove="'+i+'" title="下阵">✕</button>'+
        '</span></div>';
    }).join('');
    Array.prototype.forEach.call(slots.querySelectorAll('button'),function(b){
      b.addEventListener('click',function(){
        if(A$) A$('click');
        var i=+b.getAttribute('data-i');
        if(b.getAttribute('data-remove')!=null){ UI.switchSel.splice(i,1); }
        else if(b.getAttribute('data-move')==='up'){ var t=UI.switchSel[i-1];UI.switchSel[i-1]=UI.switchSel[i];UI.switchSel[i]=t; }
        else if(b.getAttribute('data-move')==='down'){ var t2=UI.switchSel[i+1];UI.switchSel[i+1]=UI.switchSel[i];UI.switchSel[i]=t2; }
        UI.renderSwitch();
      });
    });
  }
  /* 全部已拥有宠物 */
  var grid=$('switchGrid');
  if(grid){
    var owned=E.ownedIds();
    grid.innerHTML=owned.map(function(id){
      var pet=D.PET_BY_ID[id], st=E.rosterState(id), stage=D.stageForLv(st.lv);
      var on=UI.switchSel.indexOf(id)>=0;
      var el=D.ELEMENTS[pet.elem];
      return '<button class="sw-pet'+(on?' on':'')+'" data-id="'+id+'" style="--rar:'+D.RAR_COLOR[pet.rar]+'">'+
        petImgTag(id, stage.key)+
        '<span class="sw-pname">'+esc(pet.name)+'</span>'+
        '<span class="sw-pmeta" style="color:'+el.color+'">'+el.icon+el.name+' · Lv'+st.lv+'</span>'+
        '<span class="sw-flag">'+(on?'✓ 出战':'+ 上阵')+'</span></button>';
    }).join('');
    Array.prototype.forEach.call(grid.querySelectorAll('.sw-pet'),function(b){
      b.addEventListener('click',function(){
        if(A$) A$('click');
        var id=b.getAttribute('data-id'), idx=UI.switchSel.indexOf(id);
        if(idx>=0){ if(UI.switchSel.length>1) UI.switchSel.splice(idx,1); else UI.toast('至少保留 1 只宠物'); }
        else if(UI.switchSel.length<3) UI.switchSel.push(id);
        else UI.toast('最多 3 只出战，先点 ✕ 下阵一只');
        UI.renderSwitch();
      });
    });
  }
};
/* 音频快捷调用（避免与全局 A 变量冲突） */
function A$(){ try{ if(window.RPG_AUDIO) window.RPG_AUDIO.sfx.apply(window.RPG_AUDIO,arguments); }catch(e){} }

/* ---------- 技能天赋树 ---------- */
UI.renderTalents = function(){
  var T=window.RPG_TALENTS; if(!T) return;
  var top=$('talentTop');
  if(top) top.innerHTML='<div class="tt-dust">✨ 知识星尘 '+T.cloud()+'</div>'+
    '<div class="tt-meta">已点亮 '+T.unlockedCount()+'/'+T.NODES.length+' 个天赋 · 累计投入 '+T.spent()+' 星尘</div>';
  var tree=$('talentTree'); if(!tree) return;
  tree.innerHTML=T.BRANCHES.map(function(br){
    var pr=T.branchProgress(br.elem);
    var nodes=T.NODES.filter(function(n){ return n.b===br.elem; });
    var cards=nodes.map(function(n){
      var un=T.isUnlocked(n.id), can=T.canUnlock(n.id);
      var cls=un?'unlocked':(can?'available':'locked');
      var lock=un?'✓':(!n.req||T.isUnlocked(n.req)?'':'🔒');
      return '<div class="tn '+cls+'" data-id="'+n.id+'" style="--bc:'+br.color+'">'+
        (lock?'<span class="tn-lock">'+lock+'</span>':'')+
        '<span class="tn-ico">'+n.icon+'</span>'+
        '<span class="tn-name">'+esc(n.name)+'</span>'+
        '<span class="tn-desc">'+esc(n.desc)+'</span>'+
        '<span class="tn-cost">'+(un?'已点亮':('✨'+n.cost))+'</span></div>';
    }).join('');
    return '<div class="tb" style="--bc:'+br.color+'">'+
      '<div class="tb-head"><span class="tb-icon">'+br.icon+'</span>'+
      '<span class="tb-name">'+br.name+'</span>'+
      '<span class="tb-prog">'+pr.done+'/'+pr.total+'</span></div>'+
      '<div class="tb-nodes">'+cards+'</div></div>';
  }).join('');
  Array.prototype.forEach.call(tree.querySelectorAll('.tn'),function(el){
    el.addEventListener('click',function(){
      var id=el.getAttribute('data-id');
      var r=T.unlock(id);
      if(r.ok){ UI.toast('🌟 '+r.msg); UI.renderTalents(); UI.updateHUD(); }
      else { UI.toast(T.isUnlocked(id)?'这个天赋已点亮':(T.cloud()<T.NODE_BY_ID[id].cost?'星尘不足（还差 '+(T.NODE_BY_ID[id].cost-T.cloud())+'）':'需要先点亮前置天赋')); }
    });
  });
};

/* ---------- 战斗界面 ---------- */
UI.renderBattle = function(){
  if(!B.active) return;
  /* 章节/知识点覆盖信息条 */
  var cbar=$('bCampaignBar');
  if (cbar && window.RPG_CAMPAIGN){
    var L=window.RPG_CAMPAIGN.curLevel(E.S);
    var cov=window.RPG_CAMPAIGN.coverage(E.S);
    /* v6.4.1：本题学科/知识点优先——混合出题后顶部不再固定显示关卡单元，
     * 否则「顶部写观察物体、实际答的是地理题」会让玩家困惑。
     * 出题时 B.currentQuiz 带 subj/kn；答完清空后回到当前关卡单元信息。 */
    var q=B.currentQuiz;
    if (q && (q.subj || q.q)){
      var ic = q.subj && window.RPG_CAMPAIGN ? window.RPG_CAMPAIGN.subjIcon(q.subj) : '📖';
      var sn = q.subj ? (window.RPG_CAMPAIGN.subjName(q.subj)) : '知识挑战';
      var kn = q.q && q.q.kn ? q.q.kn : '知识挑战';
      var modeTag = q.mode==='weak' ? '🎯 薄弱巩固 · ' : '';
      cbar.innerHTML='<span class="bcb-title">'+ic+' 本题 · '+esc(sn)+' · '+esc(kn)+'</span>'+
        (modeTag?'<span class="bcb-weak">'+modeTag+'</span>':'')+
        '<span class="bcb-global">全年级 '+cov.pct+'%</span>';
      cbar.style.display='flex';
    } else if (L){
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
  /* 我方属性行：与敌方对称，位置一致 */
  var myEl=D.ELEMENTS[p.elem];
  if ($('bMyElem') && myEl){ $('bMyElem').textContent=myEl.icon+myEl.name; $('bMyElem').style.color=myEl.color; }
  var mImg=$('bMyImg');
  /* Petdex 战斗伙伴：隐藏静态 img，叠加精灵动画（idle，可被战斗动作切换） */
  var pdFight = (p._pd && window.RPG_PETDEX) ? window.RPG_PETDEX.byId(p.id) : null;
  var oldAni=$('bMyPdAni'); if(oldAni) oldAni.remove();
  if (pdFight){
    /* v6.1：战斗伙伴改为静态图（取 idle 首帧），不做 steps 循环动画 → 不再"闪"；
     * 直接替换 img 元素本身，落在 .bs-side.mine 的正常文档流槽位里 → 位置正确。
     * 用 canvas 把精灵图首帧烘焙成 PNG dataURL，尺寸/样式与静态宠物图完全一致。 */
    var PD=window.RPG_PETDEX;
    var ph0=$('bMyPh'); if(ph0) ph0.style.display='none';
    var still=PD.stillFrame(pdFight.id);
    if (still){
      mImg.src=still; mImg.style.display='block'; mImg.style.objectFit='contain';
      mImg.style.imageRendering='auto';
    } else {
      /* 烘焙失败兜底：仍用静态精灵，但走正常流、无动画 */
      mImg.style.display='none';
      var oldA=$('bMyPdAni'); if(oldA) oldA.remove();
      var ani=document.createElement('div');
      ani.id='bMyPdAni'; ani.className='pd-sprite pd-still battle-pd-still';
      ani.setAttribute('data-pd',p.id);
      ani.style.cssText='width:100%;height:100%;background-image:url('+PD.BASE+pdFight.file+');'+
        'background-size:'+pdFight.cols*100+'% '+pdFight.rows*100+'%;'+
        'background-position:0 0;background-repeat:no-repeat;';
      mImg.parentNode.insertBefore(ani,mImg.nextSibling);
    }
  } else {
    mImg.onerror=function(){ this.style.display='none'; var ph=$('bMyPh'); if(ph)ph.style.display='flex'; };
    mImg.onload=function(){ this.style.display='block'; var ph=$('bMyPh'); if(ph)ph.style.display='none'; };
    mImg.src=D.petImg(p.id,st.key);
    var mPh=$('bMyPh'); if(mPh) mPh.textContent=p.emoji||'❔';
  }
  var hp=Math.round(pet.hp/E.curMaxHp(pet)*100);
  $('bMyHpFill').style.width=hp+'%';
  $('bMyHpTxt').textContent=pet.hp+'/'+E.curMaxHp(pet);
  $('bMyMp').textContent='MP '+pet.mp+'/'+E.curMaxMp(pet);
  /* 技能属性 / 擅长学科 / 克制提示 */
  UI.renderSubjectBar(p.id);
  /* 战况预判（Wesnoth 式伤害预览）+ 属性克制环 */
  UI.renderForecast();
  /* 个性化炫酷招式名（随当前出战宠物变化） */
  var nNormal=D.moveName(pet.id,'normal'), nSpell=D.moveName(pet.id,'spell'), nUlt=D.moveName(pet.id,'ult');
  if($('bNormal')) $('bNormal').innerHTML='⚔️ '+esc(nNormal);
  if($('bSpell')) $('bSpell').innerHTML='✨ '+esc(nSpell)+'<small>答题·'+D.SKILLS.spell.mp+'MP</small>';
  if($('bUlt')) $('bUlt').innerHTML='🔥 '+esc(nUlt)+'<small>答题·'+D.SKILLS.ult.mp+'MP</small>';
  /* 队伍切换小按钮：显示真实宠物小图标（PD 静态首帧 / 普通宠 petImg），不再一律 🐾 */
  var row=$('bTeamRow');
  row.innerHTML=E.S.team.map(function(pp,i){
    var ppet=D.PET_BY_ID[pp.id];
    var ico=UI.teamPetImg(pp, ppet);
    return '<button data-i="'+i+'" class="'+(i===E.S.active?'on':'')+'" '+(pp.hp<=0?'disabled':'')+'>'+ico+'</button>';
  }).join('');
  Array.prototype.forEach.call(row.querySelectorAll('button'),function(b){
    b.addEventListener('click',function(){ B.act('switch',+b.getAttribute('data-i')); });
  });
};
/* 队伍小图标：返回 <img> 或 emoji。PD 用静态首帧，普通宠用 petImg，都失败回退 emoji */
UI.teamPetImg = function(pp, ppet){
  var src='';
  var pd=(ppet && ppet._pd && window.RPG_PETDEX) ? window.RPG_PETDEX.byId(pp.id) : null;
  if (pd){
    src=window.RPG_PETDEX.stillFrame(pp.id);   /* 已烘焙则同步返回 dataURL */
  } else {
    src=D.petImg(pp.id, D.stageForLv(pp.lv).key);
  }
  if (src) return '<img src="'+src+'" alt="" style="width:100%;height:100%;object-fit:contain;">';
  return (ppet && ppet.emoji) || '🐾';   /* 首帧还没烘焙好，先显示 emoji；烘焙完成会触发重绘 */
};

UI.battleLog = function(s){
  var box=$('bLog'); if(!box) return;
  var d=document.createElement('div'); d.textContent=s;
  box.appendChild(d); box.scrollTop=box.scrollHeight;
  while(box.children.length>7) box.removeChild(box.firstChild);
};

/* ---------- 答题弹层 ---------- */
UI.openQuiz = function(kind, skill){
  var q=null, kid=null, mode=null, L=null, qSubj=null;
  /* v6.1：全年级跨学科混合出题（薄弱优先 + 已掌握降频），不再只出当前单元 */
  if (window.RPG_CAMPAIGN){
    L=window.RPG_CAMPAIGN.curLevel(E.S);
    var pick=window.RPG_CAMPAIGN.pickBattleQuestion(E.S, B.usedTexts);
    if (pick){ q=E.formatBankQ(pick.raw); kid=pick.kid; mode=pick.mode; qSubj=pick.subj; }
  }
  /* 关卡无可用题时回退到年级随机题库 */
  if (!q){ q=E.pickQuestion(E.S.grade, B.usedTexts); if(q) qSubj=q.subj; }
  if (!q){ /* 题库不可用，直接当作答对 */
    UI.toast('题库加载中，技能直接发动');
    setTimeout(function(){B.resolveQuiz(true);},300);
    return;
  }
  B.usedTexts[q.q]=1;
  /* 保存当前题供结算时记录覆盖/薄弱（kid 缺失则从题库按题干反查） */
  if (!kid && q.kid) kid=q.kid;
  /* 用题目真实学科判定暴击（混合出题后不能再用当前关卡学科），并保留 L 供覆盖结算 */
  var quizSubj = qSubj || q.subj || (L && L.subj) || null;
  B.currentQuiz={ q:q, kid:kid, mode:mode, level:L, subj:quizSubj };
  /* v6.4.1：出题后立即刷新顶部信息条，让顶部知识点与本题一致 */
  if (UI.renderBattle) UI.renderBattle();
  var box=$('quizQ'); box.textContent=q.q;
  var subjEl=$('quizSubj');
  if(subjEl){
    var tag = mode==='weak' ? '🎯 薄弱巩固 · ' : (quizSubj? (window.RPG_CAMPAIGN.subjIcon(quizSubj)+' '):'');
    subjEl.textContent=tag+(q.kn||'知识挑战');
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
UI.dialog = function(title, text, onClose, actions, okLabel){
  $('dlgTitle').textContent=title;
  $('dlgText').innerHTML=text;
  var okBtn=$('dlgOk'); if(okBtn) okBtn.textContent=okLabel||'知道了';
  /* 自定义动作按钮（如 NPC 闲聊/赠礼），每次打开先清空 */
  var acts=$('dlgActions'); if(acts){ acts.innerHTML=''; }
  if (acts && actions && actions.length){
    actions.forEach(function(a){
      var b=document.createElement('button');
      b.className='dlg-act'+(a.alt?' alt':'');
      b.innerHTML=a.label+(a.sub?'<small>'+a.sub+'</small>':'');
      b.addEventListener('click',function(){ if(a.fn) a.fn(); });
      acts.appendChild(b);
    });
  }
  $('dlgOverlay').classList.remove('hidden');
  var btn=$('dlgOk');
  /* 上一次若通过自定义动作按钮关闭，旧监听器可能残留，先清掉避免重复触发 */
  if (UI._dlgOkHandler) btn.removeEventListener('click', UI._dlgOkHandler);
  var handler=function(){ $('dlgOverlay').classList.add('hidden'); btn.removeEventListener('click',handler); UI._dlgOkHandler=null; if(onClose)onClose(); };
  UI._dlgOkHandler=handler;
  btn.addEventListener('click',handler);
};

/* ---------- NPC 交互：主线 + 支线 ---------- */
function storyTitle(npc){
  if (window.RPG_STORY && window.RPG_STORY.NPCS[npc.name]){
    return npc.name+' · '+window.RPG_STORY.NPCS[npc.name].title;
  }
  return npc.name;
}
function storyHeader(npc){
  if (!window.RPG_STORY) return '';
  var q=E.curQuest();
  var ctx={ quest:q, allDone:!q };
  var html=window.RPG_STORY.npcLines(npc, ctx);
  /* 去掉首行重复的「名字·称号」（已在 dlgTitle 显示） */
  var firstBreak=html.indexOf('<br>');
  if (firstBreak>=0 && html.indexOf(npc.name+' · ')>=0) html=html.slice(firstBreak+4);
  return html;
}
UI.talkNPC = function(npc){
  if (npc.role==='shop'){
    UI.dialog(npc.name+' · 药剂师','欢迎光临！用金币买些补给吧。<br>活力药水 40 · 能量水晶 60 · 经验糖果 80',function(){
      UI.shop();
    }, [{label:'💬 闲聊',fn:function(){ UI.npcChat(npc); }}]);
    return;
  }
  /* 开场：展示身世与任务背景 + 好感信息 + 闲聊/赠礼按钮 */
  var NF=window.RPG_NPCFRIEND;
  var extra = NF ? NF.friendBarHTML(npc.name) : '';
  var actions = NF ? [
    { label:'💬 闲聊', fn:function(){ UI.npcChat(npc); } },
    { label:'🎁 赠礼', alt:true, sub:'30 金币', fn:function(){ UI.npcGift(npc); } }
  ] : null;
  UI.dialog(storyTitle(npc), storyHeader(npc)+extra, function(){ UI.talkNPCQuest(npc); }, actions);
};

/* NPC 闲聊：按好感度给台词，每次 +2 好感（有上限，避免刷） */
UI.npcChat = function(npc){
  var NF=window.RPG_NPCFRIEND; if(!NF) return;
  var line=NF.chatLine(npc.name);
  var r=NF.addFriend(npc.name,2);
  var tip = r.levelUp ? '<br><b style="color:#c2185b">💖 好感提升！你们成为了「'+NF.LEVELS[r.level].name+'」</b>' : '';
  UI.dialog(npc.name, '“'+esc(line)+'”'+tip+NF.friendBarHTML(npc.name),
    function(){ UI.talkNPCQuest(npc); },
    [{label:'🎁 赠礼',alt:true,sub:'30 金币',fn:function(){ UI.npcGift(npc); }}]);
};

/* NPC 赠礼：消耗 30 金币，好感 +8（喜好道具 +15） */
UI.npcGift = function(npc){
  var NF=window.RPG_NPCFRIEND; if(!NF) return;
  if (!E.S || E.S.gold<30){ UI.toast('金币不足（需要 30）'); return; }
  /* 挑一件背包里有的、NPC 喜欢的道具作为礼物，否则送通用礼盒 */
  var likes=NF.giftInfo(npc.name), giftId=null;
  for (var i=0;i<likes.length;i++){ if((E.S.bag[likes[i]]||0)>0){ giftId=likes[i]; break; } }
  if (giftId) E.S.bag[giftId]--;
  E.S.gold-=30;
  var line=NF.giftLine(npc.name, giftId||'giftbox');
  var r=NF.addFriend(npc.name, giftId?15:8);
  E.save(); UI.updateHUD();
  var giftName = giftId ? (window.RPG_DATA.ITEMS[giftId]&&window.RPG_DATA.ITEMS[giftId].name||giftId) : '精美礼盒';
  var tip = r.levelUp ? '<br><b style="color:#c2185b">💖 好感提升！你们成为了「'+NF.LEVELS[r.level].name+'」</b>' : '';
  UI.dialog(npc.name, '你送上了 '+esc(giftName)+'。<br>“'+esc(line)+'”'+tip+NF.friendBarHTML(npc.name),
    function(){ UI.talkNPCQuest(npc); },
    [{label:'💬 继续聊聊',fn:function(){ UI.npcChat(npc); }}]);
};

/* NPC 任务分支（原 talkNPC 主体） */
UI.talkNPCQuest = function(npc){
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
      /* 章节通关剧情 */
      var ch=(window.RPG_STORY&&window.RPG_STORY.chapterOfQuest(r.q.id));
      var after=function(){
        if(r.next) setTimeout(function(){UI.dialog(npc.name,'下一个任务：「'+esc(r.next.title)+'」<br>'+esc(r.next.desc)+
          (r.next.hint?'<br><span class="story-guide">💡 '+esc(r.next.hint)+'</span>':''));},250);
        else if(ch) setTimeout(function(){UI.dialog('知识大陆 · 守护者',window.RPG_STORY.WORLD.mission);},250);
      };
      if(ch && ch.clear) setTimeout(function(){ UI.dialog(ch.no+' · '+ch.title+'（完成）',ch.clear,after); },250);
      else after();
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
    UI.dialog(npc.name,'「'+esc(q.title)+'」<br>'+esc(q.desc)+
      (q.hint?'<br><span class="story-guide">💡 '+esc(q.hint)+'</span>':'')+
      '<br><small>进度 '+(E.S.quests.prog[q.id]||0)+'/'+q.need+'</small>');
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
    return '<div class="shop-item">'+
      '<div class="shop-top">'+
        '<span class="shop-name">'+it.emoji+' '+esc(it.name)+'</span>'+
        '<span class="shop-price">'+it.price+' 金币</span>'+
        '<button data-k="'+k+'">买</button>'+
      '</div>'+
      '<div class="shop-detail">'+esc(it.detail||it.desc)+'</div>'+
    '</div>';
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
    var msg='🎉 胜利！<br>获得 '+r.exp+' 经验 · '+r.gold+' 金币'+
      '<br><span style="color:#6ab8ff">💗 全队回复 20% HP · 💧 25% MP</span>'+
      (r.revived && r.revived.length ? '<br><span style="color:#ffb3d1">🌸 '+r.revived.join('、')+' 已苏醒</span>' : '');
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

/* ---------- 图鉴与成就勋章 ---------- */
UI.codexTab = 'pet';

UI.renderCodex = function(){
  var C=window.RPG_CODEX; if(!C || !E.S) return;
  var s=E.S;
  var totalMon=D.MONSTERS.length+D.BOSSES.length;
  var pc=C.petCount(), mc=C.monCount(), ac=C.achCount();
  var prog=$('codexProgress');
  if(prog) prog.innerHTML=
    '<span>🐾 宠物 <b>'+pc+'/'+D.PETS.length+'</b></span>'+
    '<span>👾 怪兽 <b>'+mc+'/'+totalMon+'</b></span>'+
    '<span>🏅 成就 <b>'+ac+'/'+C.ACH.length+'</b></span>';

  Array.prototype.forEach.call(document.querySelectorAll('.codex-tab'),function(b){
    b.classList.toggle('on', b.getAttribute('data-tab')===UI.codexTab);
  });
  var body=$('codexBody'); if(!body) return;

  if (UI.codexTab==='pet'){
    var stage=D.stageForLv(1).key;
    var html='<div class="codex-grid">';
    D.PETS.forEach(function(p){
      var unlocked=C.isPetUnlocked(p.id);
      var color=D.RAR_COLOR[p.rar]||'#9aa3b2';
      if(unlocked){
        html+='<div class="codex-card" style="border-color:'+color+'">'+
          '<div class="codex-art">'+petImgTag(p.id, stage, 'codex')+'</div>'+
          '<div class="codex-name">'+esc(p.name)+'</div>'+
          '<div class="codex-meta" style="color:'+color+'">'+(D.ELEMENTS[p.elem]?D.ELEMENTS[p.elem].icon:'')+' '+p.rar+'</div>'+
        '</div>';
      } else {
        var price=(C.SUMMON_PRICE[p.rar]||80);
        html+='<div class="codex-card locked">'+
          '<div class="codex-art codex-unknown">❓</div>'+
          '<div class="codex-name">？？？</div>'+
          '<div class="codex-meta">未发现 · '+(D.ELEMENTS[p.elem]?D.ELEMENTS[p.elem].name:'?')+'系</div>'+
          '<button class="codex-summon" data-summon="'+p.id+'">✨ 召唤 '+price+'💰</button>'+
        '</div>';
      }
    });
    body.innerHTML=html+'</div>';
  }

  else if (UI.codexTab==='mon'){
    var mh='<div class="codex-grid">';
    D.MONSTERS.concat(D.BOSSES).forEach(function(m){
      var kills=C.monKills(m.key);
      var isBoss=m.key.charAt(0)==='b';
      var color=D.RAR_COLOR[isBoss?'SSR':'R'];
      if(kills){
        mh+='<div class="codex-card'+(isBoss?' boss':'')+'" style="border-color:'+color+'">'+
          '<div class="codex-art"><img class="codex-monimg" src="'+D.monsterImg(m)+'" alt="'+esc(m.name)+'" '+
          'onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'block\'">'+
          '<span class="codex-monfb" style="display:none">'+(isBoss?'👑':'👾')+'</span></div>'+
          '<div class="codex-name">'+esc(m.name)+'</div>'+
          '<div class="codex-meta">'+(D.ELEMENTS[m.elem]?D.ELEMENTS[m.elem].icon:'')+' 击败 ×'+kills+'</div>'+
        '</div>';
      } else {
        mh+='<div class="codex-card locked">'+
          '<div class="codex-art codex-unknown">'+(isBoss?'🔒':'❓')+'</div>'+
          '<div class="codex-name">？？？</div>'+
          '<div class="codex-meta">'+(isBoss?'未挑战的 Boss':'未遭遇')+'</div>'+
        '</div>';
      }
    });
    body.innerHTML=mh+'</div>';
  }

  else {
    var ah='';
    Object.keys(C.CAT).forEach(function(ck){
      var cat=C.CAT[ck];
      var list=C.ACH.filter(function(a){ return a.cat===ck; });
      ah+='<div class="ach-group"><h3>'+cat.icon+' '+cat.name+'</h3><div class="ach-grid">';
      list.forEach(function(a){
        var done=C.isAchieved(a.id);
        ah+='<div class="ach-card'+(done?' done':' lock')+'">'+
          '<div class="ach-icon">'+(done?a.icon:'🔒')+'</div>'+
          '<div class="ach-info"><div class="ach-name">'+esc(a.name)+'</div>'+
          '<div class="ach-desc">'+esc(a.desc)+'</div></div>'+
          '<div class="ach-gold">'+(done?'✓ ':'')+a.gold+'💰</div>'+
        '</div>';
      });
      ah+='</div></div>';
    });
    body.innerHTML=ah;
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
