/* ============================================================
 * 精灵大陆 · 知识远征  —  核心引擎
 * 存档 / 队伍状态 / 等级经验 / 伤害公式 / 题库出题桥接
 * 独立 localStorage 命名空间：rpg.*
 * ============================================================ */
'use strict';
var D = window.RPG_DATA;

var SAVE_KEY = 'rpg.save.v1';
var mem = {};
function lsGet(k){ try { var v=localStorage.getItem(k); return v===null?(k in mem?mem[k]:null):v; } catch(e){ return k in mem?mem[k]:null; } }
function lsSet(k,v){ mem[k]=v; try{ localStorage.setItem(k,v); }catch(e){} }

/* ---------- 存档结构 ---------- */
function newSave(teamIds, grade){
  var team = teamIds.map(function(id){
    var p = D.PET_BY_ID[id];
    return {
      id:id, lv:1, exp:0,
      hp:maxHp(p), mp:maxMp(p)
    };
  });
  return {
    v:1, grade:grade||'g3',
    team:team, active:0,
    bag:{ potion:3, ether:1, antidote:1, candy:0 },
    gold:120,
    player:{ x:D.MAP_CFG.spawn.x, y:D.MAP_CFG.spawn.y },
    quests:{ active:'q1', done:{}, prog:{} },
    stats:{ kills:0, quizzes:0, quizOk:0, bosses:0, chests:0, steps:0 },
    chestsOpened:{},
    bossDefeated:{},
    seenIntro:false
  };
}
function maxHp(p){ return p.base.hp + D.RAR[p.rar]*4; }
function maxMp(p){ return 30 + D.RAR[p.rar]*2; }
function petStat(pet, key){
  var base = D.PET_BY_ID[pet.id];
  var growth = 1 + (pet.lv-1)*0.09;
  return Math.round(base.base[key] * growth) + (key==='hp' ? D.RAR[base.rar]*4 : 0);
}
function curMaxHp(pet){ return petStat(pet,'hp'); }
function curMaxMp(pet){ return D.PET_BY_ID[pet.id] ? maxMp(D.PET_BY_ID[pet.id]) : 30; }

/* ---------- 经验与升级 ---------- */
function expNeed(lv){ return Math.round(30 * Math.pow(lv, 1.45)); }
function addExp(pet, amount, log){
  pet.exp += amount;
  var lvUp = 0;
  while (pet.lv < 60 && pet.exp >= expNeed(pet.lv)) {
    pet.exp -= expNeed(pet.lv);
    pet.lv++;
    lvUp++;
    var beforeStage = D.stageForLv(pet.lv-1).key;
    var afterStage = D.stageForLv(pet.lv).key;
    /* 升级回满并提升上限 */
    pet.hp = curMaxHp(pet); pet.mp = curMaxMp(pet);
    if (log) log.push(pet.id + ' 升到 Lv' + pet.lv + (beforeStage!==afterStage ? ' · 进化为'+D.stageForLv(pet.lv).name+'形态！' : ''));
  }
  return lvUp;
}

/* ---------- 存档读写 ---------- */
var S = null;
function load(){
  try { S = JSON.parse(lsGet(SAVE_KEY) || 'null'); } catch(e){ S=null; }
  return S;
}
function save(){ if (S) lsSet(SAVE_KEY, JSON.stringify(S)); }
function hasSave(){ return !!load(); }
function init(teamIds, grade){ S = newSave(teamIds, grade); save(); return S; }
function reset(){ S=null; try{ localStorage.removeItem(SAVE_KEY);}catch(e){} delete mem[SAVE_KEY]; }

/* ---------- 队伍操作 ---------- */
function activePet(){ return S && S.team[S.active]; }
function alivePets(){ return S ? S.team.filter(function(p){ return p.hp>0; }) : []; }
function firstAlive(){ for (var i=0;i<S.team.length;i++) if (S.team[i].hp>0) return i; return -1; }
function healAll(){ S.team.forEach(function(p){ p.hp=curMaxHp(p); p.mp=curMaxMp(p); }); save(); }

/* ---------- 伤害公式 ---------- */
function damage(atkPet, atkStat, defMon, power){
  var a = petStat(atkPet,'atk');
  var d = defMon.base.def;
  var mult = D.elemMult(D.PET_BY_ID[atkPet.id].elem, defMon.elem);
  var base = Math.max(1, Math.round((a*power - d*0.5) * (0.9 + Math.random()*0.2)));
  return { value: Math.max(1, Math.round(base*mult)), mult:mult };
}
function monsterDamage(mon, targetPet){
  var a = mon.base.atk;
  var d = petStat(targetPet,'def');
  var mult = D.elemMult(mon.elem, D.PET_BY_ID[targetPet.id].elem);
  var base = Math.max(1, Math.round((a - d*0.4) * (0.9+Math.random()*0.2)));
  return { value: Math.max(1, Math.round(base*mult)), mult:mult };
}

/* ---------- 题库出题桥接 ----------
 * 复用 battle 的知识分片数据（data/knowledge.js + data/kg/gN.js）。
 * 按当前年级随机抽一道有题库的知识点，软化为选择题副本。
 */
function ensureGradeLoaded(grade, cb){
  if (window.KG_LOADED && window.KG_LOADED[grade]) { cb && cb(true); return; }
  if (!window.KG_API) { cb && cb(false); return; }
  window.KG_API.load(grade, function(ok){ cb && cb(ok); });
}
function pickQuestion(grade, usedTexts){
  var bank = window.KG_BANK && window.KG_BANK[grade];
  if (!bank) return null;
  var subs = Object.keys(bank);
  if (!subs.length) return null;
  /* KG_BANK[grade][subj] = [题目...]，每题带 kid/q/tp/o/a */
  var all = [];
  subs.forEach(function(s){
    (bank[s]||[]).forEach(function(q){ if (!usedTexts || !usedTexts[q.q]) all.push(q); });
  });
  if (!all.length) {
    subs.forEach(function(s){ all = all.concat(bank[s]||[]); });
  }
  if (!all.length) return null;
  var q = all[Math.floor(Math.random()*all.length)];
  /* 复制并打散选项 */
  var out = { q:q.q, tp:q.tp, kid:q.kid, kn:q.kn, exp:q.exp, f:q.f };
  if (q.tp==='choice' && q.o && q.o.length){
    var opts = q.o.map(function(t,i){ return {t:t, right:i===q.a}; });
    for (var i=opts.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=opts[i];opts[i]=opts[j];opts[j]=t; }
    out.o = opts.map(function(x){return x.t;}); out.a = opts.findIndex(function(x){return x.right;});
    out.tp='choice';
  } else {
    /* fill/short：尝试用数字选项转成 choice，否则保留填空由玩家输入 */
    var num = numericOpts(q.ans);
    if (num){ out.tp='choice'; out.o=num.o; out.a=num.a; }
    else { out.tp='fill'; out.ans=q.ans; out.ac=q.ac||[]; }
  }
  return out;
}
function numericOpts(ans){
  var s = String(ans==null?'':ans).trim(); if(!s) return null;
  if (!/^-?\d+(?:\.\d+)?$/.test(s)) return null;
  var v=Number(s), dec=(s.split('.')[1]||'').length;
  var step = Math.abs(v)>=100?10:(Math.abs(v)>=10?2:1);
  var opts=[], cands=[step,-step,step*2,-step*2,1,-1];
  for (var k=0;k<cands.length && opts.length<3;k++){
    var nv=v+cands[k]; if(nv<0) continue;
    var txt=dec?nv.toFixed(dec):String(Math.round(nv));
    if(txt!==s && opts.indexOf(txt)<0) opts.push(txt);
  }
  if (opts.length<3) return null;
  var all=opts.slice(0,3).concat([s]);
  for (var i=all.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=all[i];all[i]=all[j];all[j]=t; }
  return { o:all, a:all.indexOf(s) };
}
function judge(q, input){
  if (q.tp==='choice') return Number(input)===q.a;
  var norm=function(s){return String(s==null?'':s).replace(/\s+/g,'').toLowerCase();};
  var ans=norm(q.ans), inp=norm(input);
  if (inp===ans) return true;
  if ((q.ac||[]).some(function(a){return norm(a)===inp;})) return true;
  var an=parseFloat(ans), inn=parseFloat(inp);
  if (!isNaN(an)&&!isNaN(inn)&&Math.abs(an-inn)<1e-6) return true;
  return false;
}

/* ---------- 任务进度 ---------- */
function quest(id){ return D.QUESTS.find(function(q){return q.id===id;}); }
function curQuest(){ return S ? quest(S.quests.active) : null; }
function bumpQuest(type, param){
  if (!S) return null;
  var q = curQuest(); if (!q) return null;
  var prog = S.quests.prog;
  if (q.type==='boss'){
    if (param===q.boss) prog[q.id]=q.need; else return null;
  } else if (q.type==='level'){
    var maxLv = Math.max.apply(null, S.team.map(function(p){return p.lv;}));
    prog[q.id] = maxLv;
  } else if (type===q.type){
    prog[q.id] = (prog[q.id]||0) + 1;
  } else return null;
  var done = prog[q.id] >= q.need;
  save();
  return { quest:q, done:done, prog:prog[q.id] };
}
function completeQuest(){
  if (!S) return null;
  var q = curQuest(); if (!q) return null;
  S.quests.done[q.id]=1;
  S.gold += q.reward.gold;
  var first = S.team[0];
  var ups=[]; addExp(first, q.reward.exp, ups);
  /* 找下一个未完成主线 */
  var idx = D.QUESTS.findIndex(function(x){return x.id===q.id;});
  var next = D.QUESTS[idx+1];
  S.quests.active = next ? next.id : '';
  save();
  return { q:q, next:next, ups:ups };
}
function turnInAvailable(){
  if (!S) return false;
  var q=curQuest(); if(!q) return false;
  return (S.quests.prog[q.id]||0) >= q.need;
}

window.RPG_ENGINE = {
  SAVE_KEY:SAVE_KEY, lsGet:lsGet, lsSet:lsSet,
  load:load, save:save, hasSave:hasSave, init:init, reset:reset,
  get S(){ return S; },
  maxHp:maxHp, maxMp:maxMp, petStat:petStat, curMaxHp:curMaxHp, curMaxMp:curMaxMp,
  expNeed:expNeed, addExp:addExp,
  activePet:activePet, alivePets:alivePets, firstAlive:firstAlive, healAll:healAll,
  damage:damage, monsterDamage:monsterDamage,
  ensureGradeLoaded:ensureGradeLoaded, pickQuestion:pickQuestion, judge:judge,
  quest:quest, curQuest:curQuest, bumpQuest:bumpQuest, completeQuest:completeQuest, turnInAvailable:turnInAvailable
};
