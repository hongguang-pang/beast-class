/* ============================================================
 * 知识大陆 · 知识远征  —  核心引擎
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
    roster:{},   /* 已拥有但未上阵的宠物状态：id -> {id,lv,exp,hp,mp} */
    bag:{ potion:3, ether:1, antidote:1, candy:0 },
    gold:120,
    player:{ x:D.MAP_CFG.spawn.x, y:D.MAP_CFG.spawn.y },
    quests:{ active:'q1', done:{}, prog:{} },
    side:{ accepted:{}, done:{}, prog:{} },
    stats:{ kills:0, quizzes:0, quizOk:0, bosses:0, chests:0, steps:0 },
    chestsOpened:{},
    bossDefeated:{},
    codex:{ pets:{}, mons:{}, ach:{} },
    npcFriend:{},   /* NPC 好感度：name -> 数值 */
    talents:{ cloud:0, spent:0, nodes:{} },  /* 天赋树：星尘/已投入/已解锁节点 */
    seenIntro:false
  };
}
function maxHp(p){ return p.base.hp + D.RAR[p.rar]*4; }
function maxMp(p){ return 30 + D.RAR[p.rar]*2; }
function petStat(pet, key){
  var base = D.PET_BY_ID[pet.id];
  var growth = 1 + (pet.lv-1)*0.09;
  var val = base.base[key] * growth;
  /* 天赋加成：atk/def/hp/spd 对应分支倍率 */
  if (window.RPG_TALENTS && window.RPG_TALENTS.statMult) val *= window.RPG_TALENTS.statMult(key);
  return Math.round(val) + (key==='hp' ? D.RAR[base.rar]*4 : 0);
}
function curMaxHp(pet){ return petStat(pet,'hp'); }
function curMaxMp(pet){ return D.PET_BY_ID[pet.id] ? maxMp(D.PET_BY_ID[pet.id]) : 30; }

/* ---------- 经验与升级 ---------- */
function expNeed(lv){ return Math.round(30 * Math.pow(lv, 1.45)); }
function addExp(pet, amount, log){
  if (window.RPG_TALENTS && window.RPG_TALENTS.expMult) amount=Math.round(amount*window.RPG_TALENTS.expMult());
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
    var petName = (D.PET_BY_ID[pet.id] && D.PET_BY_ID[pet.id].name) || pet.id;
    if (log) log.push(petName + ' 升到 Lv' + pet.lv + (beforeStage!==afterStage ? ' · 进化为'+D.stageForLv(pet.lv).name+'形态！' : ''));
  }
  return lvUp;
}

/* ---------- 存档读写 ---------- */
var S = null;
function load(){
  try { S = JSON.parse(lsGet(SAVE_KEY) || 'null'); } catch(e){ S=null; }
  if (S) migrate(S);
  /* 旧档图鉴迁移：从已有战绩/队伍反推，避免升级后图鉴空白 */
  if (S && window.RPG_CODEX) window.RPG_CODEX.migrateFromStats();
  return S;
}
/* 旧存档迁移：给老版本存档补齐新增字段，保证升级不丢档 */
function migrate(s){
  if (!s.side) s.side = { accepted:{}, done:{}, prog:{} };
  if (!s.side.accepted) s.side.accepted = {};
  if (!s.side.done) s.side.done = {};
  if (!s.side.prog) s.side.prog = {};
  if (!s.chestsOpened) s.chestsOpened = {};
  if (!s.bossDefeated) s.bossDefeated = {};
  if (!s.roster) s.roster = {};
  if (!s.codex) s.codex = { pets:{}, mons:{}, ach:{} };
  if (!s.codex.pets) s.codex.pets = {};
  if (!s.codex.mons) s.codex.mons = {};
  if (!s.codex.ach) s.codex.ach = {};
  if (!s.npcFriend) s.npcFriend = {};
  if (!s.talents) s.talents = { cloud:0, spent:0, nodes:{} };
  if (typeof s.talents.cloud !== 'number') s.talents.cloud = 0;
  if (typeof s.talents.spent !== 'number') s.talents.spent = 0;
  if (!s.talents.nodes) s.talents.nodes = {};
  /* 老档初始化引导标记：已有队伍视为已引导过，避免突然弹教程 */
  if (typeof s.tutorialDone !== 'boolean') s.tutorialDone = false;
}
function save(){
  if (S) lsSet(SAVE_KEY, JSON.stringify(S));
  /* 每次存档后自动检查成就（codex.js 内部防递归，成就奖励直接落盘） */
  if (S && window.RPG_CODEX) window.RPG_CODEX.autoCheck();
}
function hasSave(){ return !!load(); }
function init(teamIds, grade){
  S = newSave(teamIds, grade);
  /* 初始队伍同时写入仓库 */
  S.team.forEach(function(p){ S.roster[p.id] = p; });
  save();
  if (window.RPG_CODEX) window.RPG_CODEX.syncTeam();
  return S;
}
function reset(){ S=null; try{ localStorage.removeItem(SAVE_KEY);}catch(e){} delete mem[SAVE_KEY]; }

/* ---------- 队伍操作 ---------- */
function activePet(){ return S && S.team[S.active]; }
function alivePets(){ return S ? S.team.filter(function(p){ return p.hp>0; }) : []; }
function firstAlive(){ for (var i=0;i<S.team.length;i++) if (S.team[i].hp>0) return i; return -1; }
function healAll(){ S.team.forEach(function(p){ p.hp=curMaxHp(p); p.mp=curMaxMp(p); }); save(); }

/* ---------- 宠物仓库 / 出战编队 ----------
 * roster 保存所有「已拥有」宠物的养成状态；team 是其中 3 只的出战顺序。
 * 换宠只改 team 组成，宠物等级/经验/HP 都留在 roster，切换不丢进度。 */
function makePetState(id){
  var p = D.PET_BY_ID[id];
  return { id:id, lv:1, exp:0, hp:maxHp(p), mp:maxMp(p) };
}
/* 把当前 team 的状态同步回 roster（换宠前调用，保证不丢状态） */
function syncRoster(){
  if (!S) return;
  S.team.forEach(function(p){
    var st = p.lv ? p : makePetState(p.id);
    S.roster[st.id] = st;
  });
}
/* 已拥有的全部宠物 id（图鉴解锁的 + 队伍里的） */
function ownedIds(){
  if (!S) return [];
  var ids = [], seen = {};
  (S.team||[]).forEach(function(p){ if(!seen[p.id]){seen[p.id]=1;ids.push(p.id);} });
  var c = S.codex && S.codex.pets || {};
  Object.keys(c).forEach(function(id){ if(c[id] && D.PET_BY_ID[id] && !seen[id]){seen[id]=1;ids.push(id);} });
  if (S.roster) Object.keys(S.roster).forEach(function(id){ if(D.PET_BY_ID[id] && !seen[id]){seen[id]=1;ids.push(id);} });
  return ids;
}
/* 取某只已拥有宠物的养成状态（优先 roster，否则新建） */
function rosterState(id){
  if (!S) return null;
  if (S.team) { var t=S.team.find(function(p){return p.id===id;}); if (t) return t; }
  if (S.roster && S.roster[id]) return S.roster[id];
  var st = makePetState(id);
  S.roster[id] = st;
  return st;
}
/* 设置出战队伍：ids 为宠物 id 数组（最多 3 只，至少 1 只） */
function setTeam(ids){
  if (!S || !ids || !ids.length) return false;
  syncRoster();
  var team = [];
  ids.slice(0,3).forEach(function(id){
    if (!D.PET_BY_ID[id]) return;
    if (team.some(function(p){return p.id===id;})) return;   // 去重
    var st = S.roster[id] || makePetState(id);
    S.roster[id] = st;                                        // 确保仓库保留
    team.push(st);
  });
  if (!team.length) return false;
  S.team = team;
  if (S.active >= team.length) S.active = 0;
  save();
  if (window.RPG_CODEX) window.RPG_CODEX.syncTeam();
  return true;
}
/* 将一只新宠物加入仓库并解锁图鉴（召唤/奖励时用） */
function gainPet(id){
  if (!S || !D.PET_BY_ID[id]) return false;
  if (!S.roster) S.roster = {};
  if (!S.roster[id]) S.roster[id] = makePetState(id);
  if (window.RPG_CODEX) window.RPG_CODEX.unlockPet(id, true);
  save();
  return true;
}

/* ---------- 伤害公式 ---------- */
/* 护甲：怪物等级越高护甲越厚。普攻被护甲大幅削减，答题技能可破防无视护甲。
 * 这样中后期怪物「不答题放技能就几乎打不动」，逼用户持续答题。 */
function monsterArmor(defMon, monLv){
  var lv = monLv || 1;
  if (lv <= 2) return 0;                       // 前两级无护甲，新手友好
  return Math.round((lv-2) * (3.2 + defMon.base.def*0.25));
}
function damage(atkPet, atkStat, defMon, power, isSkill, monLv){
  var a = petStat(atkPet,'atk');
  var d = defMon.base.def;
  var mult = D.elemMult(D.PET_BY_ID[atkPet.id].elem, defMon.elem);
  var armor = isSkill ? 0 : monsterArmor(defMon, monLv);  // 技能破防，无视护甲
  var raw = a*power - d*0.5 - armor;
  /* 普攻被护甲压到极低时，保底仅 1~2 点（体现「必须答题」） */
  var base = Math.max(isSkill ? 1 : 1, Math.round(raw * (0.9 + Math.random()*0.2)));
  var value = Math.max(1, Math.round(base*mult));
  return { value: value, mult:mult, armorCut: (!isSkill && armor>0 && raw <= a*power*0.35) };
}
function monsterDamage(mon, targetPet, monLv){
  var lv = monLv || 1;
  var a = mon.base.atk * (1 + (lv-1)*0.13);   // 怪物伤害随等级成长
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
  var fq = formatBankQ(q);
  /* 标注题目所属学科，供战斗暴击判定 */
  for (var sb in bank){ if ((bank[sb]||[]).indexOf(q)>=0){ fq.subj = sb; break; } }
  return fq;
}
/* 把题库原始题格式化为可作答结构（选项打散/填空转选择）；供 pickQuestion 与关卡战役复用 */
function formatBankQ(q){
  var out = { q:q.q, tp:q.tp, kid:q.kid, kn:q.kn, exp:q.exp, f:q.f, unit:q.unit, uidx:q.uidx };
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

/* ---------- 支线任务 ---------- */
function sideQuest(id){ return D.SIDE_QUESTS.find(function(q){return q.id===id;}); }
function acceptSide(id){
  if (!S) return null;
  var q=sideQuest(id); if(!q) return null;
  if (S.side.done[id]) return { q:q, status:'done' };
  if (S.side.accepted[id]) return { q:q, status:'accepted' };
  S.side.accepted[id]=1; S.side.prog[id]=0; save();
  return { q:q, status:'new' };
}
/* 支线进度推进：击杀/答题/开箱/等级/Boss 都会调用，遍历所有已接支线 */
function bumpSide(type, param){
  if (!S) return [];
  var changed=[];
  D.SIDE_QUESTS.forEach(function(q){
    if (!S.side.accepted[q.id] || S.side.done[q.id]) return;
    var prog=S.side.prog[q.id]||0;
    if (q.type==='boss'){ if (param===q.boss) prog=q.need; else return; }
    else if (q.type==='level'){
      var maxLv=Math.max.apply(null,S.team.map(function(p){return p.lv;}));
      prog=maxLv;
    }
    else if (type===q.type){ prog+=1; }
    else return;
    var was=prog;
    S.side.prog[q.id]=prog;
    changed.push({ q:q, prog:prog, done:prog>=q.need, gained:prog-was });
  });
  if (changed.length) save();
  return changed;
}
function sideTurnInAvailable(id){
  if (!S) return false;
  var q=sideQuest(id); if(!q||!S.side.accepted[id]||S.side.done[id]) return false;
  return (S.side.prog[id]||0) >= q.need;
}
function completeSide(id){
  if (!S) return null;
  var q=sideQuest(id); if(!q||!sideTurnInAvailable(id)) return null;
  S.side.done[id]=1;
  S.gold+=q.reward.gold;
  var ups=[]; addExp(S.team[0], q.reward.exp, ups);
  save();
  return { q:q, ups:ups };
}
/* 某 NPC 可交付的支线（已接且完成） */
function readySideForNPC(name){
  if (!S) return [];
  return D.SIDE_QUESTS.filter(function(q){ return q.npc===name && sideTurnInAvailable(q.id); });
}
/* 某 NPC 可接取的支线（未接未完成） */
function openSideForNPC(name){
  if (!S) return [];
  return D.SIDE_QUESTS.filter(function(q){ return q.npc===name && !S.side.accepted[q.id] && !S.side.done[q.id]; });
}

/* ---------- 战斗掉落 ---------- */
function rollDrops(isBoss){
  var table=isBoss ? D.DROPS.boss : D.DROPS.common;
  var got=[];
  table.forEach(function(d){
    if (Math.random() < d.rate){
      var n = d.min + Math.floor(Math.random()*(d.max-d.min+1));
      if (n>0){ S.bag[d.item]=(S.bag[d.item]||0)+n; got.push({ item:d.item, n:n }); }
    }
  });
  if (got.length) save();
  return got;
}

window.RPG_ENGINE = {
  SAVE_KEY:SAVE_KEY, lsGet:lsGet, lsSet:lsSet,
  load:load, save:save, hasSave:hasSave, init:init, reset:reset,
  get S(){ return S; },
  maxHp:maxHp, maxMp:maxMp, petStat:petStat, curMaxHp:curMaxHp, curMaxMp:curMaxMp,
  expNeed:expNeed, addExp:addExp,
  activePet:activePet, alivePets:alivePets, firstAlive:firstAlive, healAll:healAll,
  syncRoster:syncRoster, ownedIds:ownedIds, rosterState:rosterState, setTeam:setTeam, gainPet:gainPet,
  damage:damage, monsterDamage:monsterDamage, monsterArmor:monsterArmor,
  ensureGradeLoaded:ensureGradeLoaded, pickQuestion:pickQuestion, formatBankQ:formatBankQ, judge:judge,
  quest:quest, curQuest:curQuest, bumpQuest:bumpQuest, completeQuest:completeQuest, turnInAvailable:turnInAvailable,
  sideQuest:sideQuest, acceptSide:acceptSide, bumpSide:bumpSide, sideTurnInAvailable:sideTurnInAvailable,
  completeSide:completeSide, readySideForNPC:readySideForNPC, openSideForNPC:openSideForNPC, rollDrops:rollDrops
};
