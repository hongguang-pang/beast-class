/* ============================================================
 * 知识大陆 · 知识远征  —  战斗系统
 * 回合制：普攻 / 知识技能(答题) / 必杀(答题) / 道具 / 逃跑
 * 属性克制、队伍切换、答题判定、经验掉落、Boss 剧情
 * ============================================================ */
'use strict';
var D = window.RPG_DATA, E = window.RPG_ENGINE, FX = window.RPG_FX;

var Battle = {
  active:false, mon:null, monLv:1, monHp:0, monMaxHp:0, isBoss:false,
  turn:'player', busy:false, logLines:[],
  pendingSkill:null,          // 等待答题的技能 kind
  usedTexts:{},
  onEnd:null, onQuiz:null, onLog:null, onTurn:null,
  playerGuard:false,
  enraged:false,        // 弱点被针对（答对解除）
  stunNext:false,       // 下回合眩晕跳过
  currentQuiz:null,     // 当前正在作答的题（含 kid）
  critNext:false        // 答对且属性克制学科 → 本次技能暴击
};

function log(s){ Battle.logLines.push(s); if(Battle.onLog) Battle.onLog(s); }
function subjName(s){ return (window.SUBJ_META && window.SUBJ_META[s] && window.SUBJ_META[s].name) || s; }

/* Petdex 战斗伙伴动画：切换状态行，默认 700ms 后回到 idle */
function pdAni(state, backMs){
  var PD=window.RPG_PETDEX; if(!PD) return;
  var pet=E.activePet(); if(!pet || !PD.isPD(pet.id)) return;
  var holder=document.getElementById('bMyPdAni'); if(!holder) return;
  PD.setSpriteState(holder,pet.id,state);
  if(state!=='idle'){
    setTimeout(function(){
      if(holder && holder.parentNode) PD.setSpriteState(holder,pet.id,'idle');
    }, backMs||750);
  }
}

Battle.start = function(mon, lv, isBoss){
  this.active=true; this.mon=mon; this.monLv=lv; this.isBoss=!!isBoss;
  var scale = 1 + (lv-1)*0.16;
  this.monMaxHp = Math.round(mon.base.hp*scale);
  this.monHp = this.monMaxHp;
  this.turn='player'; this.busy=false; this.logLines=[]; this.usedTexts={};
  this.playerGuard=false; this.enraged=false; this.stunNext=false; this.currentQuiz=null; this.critNext=false;
  /* 清空上一场战斗残留的日志与特效 */
  var box=document.getElementById('bLog'); if(box) box.innerHTML='';
  if (FX) FX.clear();
  /* 确保上场的是存活宠物 */
  var ai=E.firstAlive();
  if (ai>=0) E.S.active=ai;
  var el=D.ELEMENTS[mon.elem];
  log((isBoss?'👹 BOSS 登场':'⚔️ 遭遇野怪')+'：'+mon.name+'（'+el.icon+el.name+' Lv'+lv+'）');
};

/* 玩家选择动作：normal / spell / ult / item / run / switch */
Battle.act = function(action, arg){
  if (!this.active || this.busy || this.turn!=='player') return;
  var pet=E.activePet();
  if (!pet || pet.hp<=0){ this.petFaint(); return; }
  if (action==='normal'){
    this.busy=true;
    this.playerAttack(1.0, false, 'normal');
  } else if (action==='spell' || action==='ult'){
    var skill = action==='ult' ? D.SKILLS.ult : D.SKILLS.spell;
    if (pet.mp < skill.mp){ log('💧 MP 不足，无法使用'+D.moveName(pet.id, action)); return; }
    this.pendingSkill = action;
    this.busy=true;
    if (this.onQuiz) this.onQuiz(action, skill);
    else this.resolveQuiz(true);   // 无 UI 时默认答对（测试用）
  } else if (action==='run'){
    if (this.isBoss){ log('👹 BOSS 战无法逃跑！'); this.busy=false; return; }
    if (Math.random()<0.6){ log('🏃 成功逃脱！'); this.end('run'); }
    else { log('😰 逃跑失败！'); this.enemyTurn(); }
  } else if (action==='item'){
    this.useItem(arg);
  } else if (action==='switch'){
    var idx=arg|0;
    if (idx<0||idx>=E.S.team.length){ this.busy=false; return; }
    if (E.S.team[idx].hp<=0){ log('这只宠物已经无法战斗'); this.busy=false; return; }
    if (idx===E.S.active){ this.busy=false; return; }
    E.S.active=idx; E.save();
    log('🔄 换上 '+D.PET_BY_ID[E.S.team[idx].id].name);
    this.enemyTurn();
  }
};

/* 答题结果回调：correct? */
Battle.resolveQuiz = function(correct){
  if (!this.pendingSkill){ this.busy=false; return; }
  var kind=this.pendingSkill; this.pendingSkill=null;
  var skill = kind==='ult'?D.SKILLS.ult:D.SKILLS.spell;
  var pet=E.activePet();
  pet.mp = Math.max(0, pet.mp - skill.mp);
  E.save();
  var ca = null;
  if (window.RPG_CAMPAIGN && this.currentQuiz && this.currentQuiz.kid){
    ca = window.RPG_CAMPAIGN.recordAnswer(E.S, this.currentQuiz.kid, correct);
  }
  if (correct){
    E.S.stats.quizzes++; E.S.stats.quizOk++;
    E.save(); /* 立即检查答题类成就 */
    E.bumpSide('quiz');
    var moveN = D.moveName(pet.id, kind);
    log('✅ 答对了！'+moveN+' 发动！');
    /* 属性克制学科 → 暴击 */
    var petElem = D.PET_BY_ID[pet.id].elem;
    var subj = null;
    if (this.currentQuiz && this.currentQuiz.level) subj = this.currentQuiz.level.subj;
    if (!subj && this.currentQuiz && this.currentQuiz.subj) subj = this.currentQuiz.subj;
    this.critNext = subj ? D.isCritSubject(petElem, subj) : false;
    if (this.critNext){
      var se = D.subjectElement(subj), pe = D.ELEMENTS[petElem];
      log('💥 属性克制！'+pe.icon+pe.name+' 克 '+D.ELEMENTS[se].icon+subjName(subj)+' → 暴击！');
      if (this.onLog) this.onLog('暴击！属性克制，本次技能伤害翻倍');
    }
    /* 答对解除针对性 */
    if (this.enraged){ this.enraged=false; log('✨ 答对知识点，怪物失去了针对机会！'); }
    if (ca && ca.cleared && this.onLog) this.onLog('🎉 本单元知识点已全部覆盖，关卡完成！');
    this.playerAttack(skill.power, true, kind);
    this.critNext=false;
  } else {
    E.S.stats.quizzes++;
    if (FX){ FX.shake(4,0.2); FX.flash('rgba(120,40,160,.22)'); }
    log('❌ 答错了，技能被打断！');
    if (ca && ca.weak){
      /* 连错2次：怪物针对弱点 + 概率眩晕 */
      this.enraged=true;
      var kn = (window.KG_NAMES && window.KG_NAMES[this.currentQuiz.kid]) || (this.currentQuiz.q && this.currentQuiz.q.kn) || '这个知识点';
      log('🎯 '+this.mon.name+' 抓住了你的薄弱点「'+kn+'」，开始针对性攻击！');
      if (this.onLog) this.onLog('薄弱点：'+kn+'（连错'+ca.weakLevel+'次）· 怪物已针对，答对即可解除');
      /* 连错3次以上眩晕概率提升 */
      var stunChance = ca.weakLevel>=3 ? 0.5 : 0.3;
      if (Math.random()<stunChance){ this.stunNext=true; log('💫 你的宠物被弱点冲击眩晕，下回合将无法行动！'); }
    } else if (ca && ca.weakLevel===1){
      if (this.onLog) this.onLog('注意：这个知识点答错了，再错一次怪物会针对弱点');
    } else if (!ca){
      if (this.onLog) this.onLog('答错了，先准确回答才能放出技能哦');
    }
    this.enemyTurn();
  }
  this.currentQuiz=null;
};

Battle.playerAttack = function(power, isSkill, kind){
  var pet=E.activePet();
  pdAni(isSkill?'jump':'runR', 600);   /* Petdex 伙伴攻击动作 */
  var pdef=D.PET_BY_ID[pet.id];
  var elem=pdef?pdef.elem:'light';
  var subjectCrit = isSkill && this.critNext;   /* 答题暴击：伤害翻倍 */
  if (subjectCrit) power = power * 2;           /* 暴击 ×2 伤害 */
  /* 特效：技能先魔法阵蓄力，再属性爆发；普攻为属性斩击 */
  if (FX){
    if (isSkill){
      FX.circle('bMyImg', elem);
      (function(el,big){ setTimeout(function(){ FX.burst('bEnemyImg', el, big); }, 220); })(elem, kind==='ult'||subjectCrit);
      if (subjectCrit) setTimeout(function(){ FX.flash('rgba(255,211,92,.32)'); FX.shake(8,0.35); }, 210);
    } else {
      FX.slash('bEnemyImg', FX.palette[elem]||FX.palette.hit);
    }
  }
  var r=E.damage(pet, 'atk', this.mon, power, isSkill, this.monLv);
  var crit = subjectCrit || power>1.2 || r.mult>1;   // 答题暴击 / 高倍技能 / 属性克制 → 暴击视觉
  this.monHp -= r.value;
  var eff = r.mult>1 ? ' 克制！×'+r.mult : (r.mult<1 ? ' 效果不佳…' : '');
  var moveN = D.moveName(pet.id, kind || (isSkill?'spell':'normal'));
  var armored = r.armorCut ? '（护甲吸收，普攻收效甚微·用知识技能破防！）' : '';
  /* 命中特效：冲击环 + 震屏 + 伤害飘字（延迟到爆发帧对齐） */
  if (FX){
    (function(val,cr){ setTimeout(function(){ FX.hit('bEnemyImg',cr); FX.damage('bEnemyImg',val,cr); }, isSkill?250:90); })(r.value, crit||r.mult>1);
  }
  log((subjectCrit?'💥 暴击！':'')+(isSkill?'✨':'⚔️')+moveN+' 造成 '+r.value+' 伤害'+eff+armored);
  if (this.monHp<=0){ this.monHp=0; this.win(); return; }
  /* 知识技能答对额外回一点 MP；普攻也能回少量 MP 供继续放技能 */
  if (isSkill){ pet.mp=Math.min(E.curMaxMp(pet), pet.mp+2); }
  else { pet.mp=Math.min(E.curMaxMp(pet), pet.mp+2); }
  E.save();
  setTimeout(function(){ Battle.enemyTurn(); }, 350);
};

Battle.enemyTurn = function(){
  if (!this.active || this.monHp<=0) return;
  var mon=this.mon;
  var idx=E.firstAlive();
  if (idx<0){ this.lose(); return; }
  E.S.active=idx;
  var pet=E.S.team[idx];
  var r=E.monsterDamage(mon, pet, this.monLv);
  var dmg = this.playerGuard ? Math.round(r.value*0.4) : r.value;
  /* 🎯 针对性攻击：抓住薄弱点，锁定宠物属性弱点，伤害×1.6 且无视防御减伤 */
  var enrageTxt='';
  if (this.enraged){
    dmg = Math.round(dmg * 1.6);
    enrageTxt = ' 🎯针对弱点！';
  }
  pet.hp = Math.max(0, pet.hp - dmg);
  E.save();
  pdAni('failed', 700);   /* Petdex 伙伴受击动作 */
  /* 玩家受击特效：红闪 + 震屏 + 伤害飘字 */
  if (FX){ FX.slash('bMyImg', FX.palette.hit); FX.hurt('bMyImg'); FX.damage('bMyImg', dmg, this.enraged); }
  var eff = r.mult>1 ? ' 克制！×'+r.mult : (r.mult<1 ? ' 被抵抗…' : '');
  log(mon.name+' 攻击 '+D.PET_BY_ID[pet.id].name+'，造成 '+dmg+' 伤害'+eff+(this.playerGuard?'（防御中）':'')+enrageTxt);
  this.playerGuard=false;
  if (pet.hp<=0){
    log(D.PET_BY_ID[pet.id].name+' 倒下了！');
    var next=E.firstAlive();
    if (next<0){ setTimeout(function(){Battle.lose();},400); return; }
    E.S.active=next; E.save();
    log('换上 '+D.PET_BY_ID[E.S.team[next].id].name+' 继续战斗！');
  }
  var self=this;
  setTimeout(function(){
    if (self.stunNext){
      /* 💫 眩晕：跳过玩家这一回合，怪物再攻一次 */
      self.stunNext=false;
      log('💫 '+D.PET_BY_ID[E.activePet().id].name+' 处于眩晕，无法行动！');
      if (self.onLog) self.onLog('眩晕中，跳过本回合（答对薄弱知识点可解除针对）');
      self.turn='enemy'; self.busy=true;
      setTimeout(function(){ if(self.active) self.enemyTurn(); }, 500);
      return;
    }
    self.turn='player'; self.busy=false; if(Battle.onTurn) Battle.onTurn();
  }, 400);
};

Battle.defend = function(){
  if(!this.active||this.busy) return;
  this.playerGuard=true; this.busy=true;
  log('🛡️ '+D.PET_BY_ID[E.activePet().id].name+' 进入防御姿态');
  this.enemyTurn();
};

Battle.useItem = function(k){
  if (!E.S.bag[k] || E.S.bag[k]<=0){ log('没有这个道具了'); this.busy=false; return; }
  var pet=E.activePet();
  if (k==='potion'){ pet.hp=Math.min(E.curMaxHp(pet),pet.hp+50); log('🧪 恢复 50 HP'); if(FX)FX.healText('bMyImg',50); }
  else if (k==='ether'){ pet.mp=Math.min(E.curMaxMp(pet),pet.mp+20); log('💎 恢复 20 MP'); if(FX)FX.healText('bMyImg',20); }
  else if (k==='antidote'){ log('🌿 使用了清醒草'); }
  else if (k==='candy'){ E.addExp(pet,60); log('🍬 获得 60 经验'); }
  E.S.bag[k]--; E.save(); this.busy=true; this.enemyTurn();
};

Battle.petFaint = function(){
  var next=E.firstAlive();
  if (next<0){ this.lose(); return; }
  E.S.active=next; this.busy=false;
};

Battle.win = function(){
  this.active=false;
  pdAni('wave', 2000);   /* Petdex 伙伴胜利挥手 */
  var exp=this.mon.exp + this.monLv*3, gold=this.mon.gold;
  if (this.isBoss){ exp=this.mon.exp; gold=this.mon.gold; E.S.stats.bosses++; E.S.bossDefeated[this.mon.key]=1; }
  else E.S.stats.kills++;
  /* 怪兽图鉴：记录每种怪兽/Boss 的击败次数 */
  if (window.RPG_CODEX) window.RPG_CODEX.recordMon(this.mon.key);
  E.S.gold+=gold;
  var ups=[];
  E.alivePets().forEach(function(p){ E.addExp(p, exp, ups); });
  var qp = E.bumpQuest('kill', this.mon.key);
  if (this.isBoss) E.bumpQuest('boss', this.mon.key);
  /* 支线进度：击杀 / Boss / 等级 */
  E.bumpSide('kill', this.mon.key);
  if (this.isBoss) E.bumpSide('boss', this.mon.key);
  E.bumpSide('level');
  /* 战斗掉落 */
  var drops = E.rollDrops(this.isBoss);
  var dropTxt = drops.map(function(d){ return (D.ITEMS[d.item]?D.ITEMS[d.item].emoji:'🎁')+D.ITEMS[d.item].name+'×'+d.n; }).join('、');
  E.save();
  log('🎉 胜利！获得 '+exp+' 经验、'+gold+' 金币'+(dropTxt?'；掉落 '+dropTxt:''));
  /* 胜利特效：礼花 + 掉落光柱 + 升级光柱 */
  if (FX){
    FX.victory(this.isBoss);
    FX.lootBeam();
    if (ups && ups.length) (function(){ setTimeout(function(){ FX.levelUp('bMyImg'); }, 500); })();
  }
  if (this.onEnd) this.onEnd({ win:true, exp:exp, gold:gold, ups:ups, quest:qp, drops:drops, isBoss:this.isBoss, mon:this.mon });
};

Battle.lose = function(){
  this.active=false;
  E.healAll();
  /* 失败损失少量金币 */
  var lost=Math.min(E.S.gold, Math.round(E.S.gold*0.1));
  E.S.gold-=lost; E.save();
  log('💤 队伍体力不支，被送回村庄休整（损失 '+lost+' 金币）');
  if (this.onEnd) this.onEnd({ win:false, lost:lost });
};

Battle.end = function(reason){
  this.active=false;
  if (this.onEnd) this.onEnd({ win:false, reason:reason });
};

window.RPG_BATTLE = Battle;
