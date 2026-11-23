/* ============================================================
 * 精灵大陆 · 知识远征  —  战斗系统
 * 回合制：普攻 / 知识技能(答题) / 必杀(答题) / 道具 / 逃跑
 * 属性克制、队伍切换、答题判定、经验掉落、Boss 剧情
 * ============================================================ */
'use strict';
var D = window.RPG_DATA, E = window.RPG_ENGINE;

var Battle = {
  active:false, mon:null, monLv:1, monHp:0, monMaxHp:0, isBoss:false,
  turn:'player', busy:false, logLines:[],
  pendingSkill:null,          // 等待答题的技能 kind
  usedTexts:{},
  onEnd:null, onQuiz:null, onLog:null,
  playerGuard:false
};

function log(s){ Battle.logLines.push(s); if(Battle.onLog) Battle.onLog(s); }

Battle.start = function(mon, lv, isBoss){
  this.active=true; this.mon=mon; this.monLv=lv; this.isBoss=!!isBoss;
  var scale = 1 + (lv-1)*0.16;
  this.monMaxHp = Math.round(mon.base.hp*scale);
  this.monHp = this.monMaxHp;
  this.turn='player'; this.busy=false; this.logLines=[]; this.usedTexts={};
  this.playerGuard=false;
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
  if (correct){
    E.S.stats.quizzes++; E.S.stats.quizOk++;
    var moveN = D.moveName(pet.id, kind);
    log('✅ 答对了！'+moveN+' 发动！');
    this.playerAttack(skill.power, true, kind);
  } else {
    E.S.stats.quizzes++;
    log('❌ 答错了，技能被打断！');
    if (this.onLog) this.onLog('答错了，先准确回答才能放出技能哦');
    this.enemyTurn();
  }
};

Battle.playerAttack = function(power, isSkill, kind){
  var pet=E.activePet();
  var r=E.damage(pet, 'atk', this.mon, power, isSkill, this.monLv);
  this.monHp -= r.value;
  var eff = r.mult>1 ? ' 克制！×'+r.mult : (r.mult<1 ? ' 效果不佳…' : '');
  var moveN = D.moveName(pet.id, kind || (isSkill?'spell':'normal'));
  var armored = r.armorCut ? '（护甲吸收，普攻收效甚微·用知识技能破防！）' : '';
  log((isSkill?'✨':'⚔️')+moveN+' 造成 '+r.value+' 伤害'+eff+armored);
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
  pet.hp = Math.max(0, pet.hp - dmg);
  E.save();
  var eff = r.mult>1 ? ' 克制！×'+r.mult : (r.mult<1 ? ' 被抵抗…' : '');
  log(mon.name+' 攻击 '+D.PET_BY_ID[pet.id].name+'，造成 '+dmg+' 伤害'+eff+(this.playerGuard?'（防御中）':''));
  this.playerGuard=false;
  if (pet.hp<=0){
    log(D.PET_BY_ID[pet.id].name+' 倒下了！');
    var next=E.firstAlive();
    if (next<0){ setTimeout(function(){Battle.lose();},400); return; }
    E.S.active=next; E.save();
    log('换上 '+D.PET_BY_ID[E.S.team[next].id].name+' 继续战斗！');
  }
  var self=this;
  setTimeout(function(){ self.turn='player'; self.busy=false; if(Battle.onTurn) Battle.onTurn(); }, 400);
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
  if (k==='potion'){ pet.hp=Math.min(E.curMaxHp(pet),pet.hp+50); log('🧪 恢复 50 HP'); }
  else if (k==='ether'){ pet.mp=Math.min(E.curMaxMp(pet),pet.mp+20); log('💎 恢复 20 MP'); }
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
  var exp=this.mon.exp + this.monLv*3, gold=this.mon.gold;
  if (this.isBoss){ exp=this.mon.exp; gold=this.mon.gold; E.S.stats.bosses++; E.S.bossDefeated[this.mon.key]=1; }
  else E.S.stats.kills++;
  E.S.gold+=gold;
  var ups=[];
  E.alivePets().forEach(function(p){ E.addExp(p, exp, ups); });
  var qp = E.bumpQuest('kill', this.mon.key);
  if (this.isBoss) E.bumpQuest('boss', this.mon.key);
  E.save();
  log('🎉 胜利！获得 '+exp+' 经验、'+gold+' 金币');
  if (this.onEnd) this.onEnd({ win:true, exp:exp, gold:gold, ups:ups, quest:qp, isBoss:this.isBoss, mon:this.mon });
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
