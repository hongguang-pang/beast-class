/* ============================================================
 * 知识大陆 · 技能天赋树模块
 * 收集知识点 → 知识星尘 → 解锁 5 属性分支天赋
 * 天赋加成接入 engine 的 petStat / damage / 答题经验 / 暴击
 * 存档挂在 rpg.save.v1 的 talents 字段（cloud/spent/nodes）
 * ============================================================ */
'use strict';
(function(){
var D=window.RPG_DATA, E=window.RPG_ENGINE;

/* 5 大分支对应 5 属性；每系 4 个节点，逐级解锁 */
var BRANCHES=[
  { elem:'fire',  name:'烈焰天赋', icon:'🔥', color:'#ff6b3d' },
  { elem:'water', name:'潮汐天赋', icon:'💧', color:'#3aa7ff' },
  { elem:'wood',  name:'森灵天赋', icon:'🌿', color:'#4fbf6a' },
  { elem:'light', name:'光辉天赋', icon:'✨', color:'#ffd34d' },
  { elem:'dark',  name:'暗影天赋', icon:'🌙', color:'#a377ff' }
];

/* 节点：id / 分支 / 层 / 名称 / 图标 / 描述 / 花费 / 效果key / 效果值 / 前置 */
var NODES=[
  /* 烈焰：进攻向 —— 攻击、暴击 */
  { id:'f1', b:'fire', tier:0, name:'灼热之心', icon:'🔥', desc:'全队攻击 +8%', cost:6,  eff:'atk', val:0.08, req:null },
  { id:'f2', b:'fire', tier:1, name:'烈焰锋芒', icon:'🗡️', desc:'全队攻击 +12%', cost:14, eff:'atk', val:0.12, req:'f1' },
  { id:'f3', b:'fire', tier:2, name:'暴击本能', icon:'💥', desc:'暴击伤害 +50%（克制×2 提升至×3）', cost:26, eff:'crit', val:0.5, req:'f2' },
  { id:'f4', b:'fire', tier:3, name:'焚天一击', icon:'☄️', desc:'全队攻击 +20%', cost:44, eff:'atk', val:0.20, req:'f3' },
  /* 潮汐：续航向 —— 生命、防御 */
  { id:'w1', b:'water', tier:0, name:'潮汐庇护', icon:'🛡️', desc:'全队生命 +10%', cost:6, eff:'hp', val:0.10, req:null },
  { id:'w2', b:'water', tier:1, name:'坚韧之躯', icon:'🧱', desc:'全队防御 +15%', cost:14, eff:'def', val:0.15, req:'w1' },
  { id:'w3', b:'water', tier:2, name:'深海守护', icon:'🌊', desc:'全队生命 +18%', cost:26, eff:'hp', val:0.18, req:'w2' },
  { id:'w4', b:'water', tier:3, name:'不朽潮汐', icon:'💠', desc:'全队防御 +25%', cost:44, eff:'def', val:0.25, req:'w3' },
  /* 森灵：成长向 —— 经验、速度 */
  { id:'g1', b:'wood', tier:0, name:'光合作用', icon:'🌱', desc:'答题经验 +15%', cost:6, eff:'exp', val:0.15, req:null },
  { id:'g2', b:'wood', tier:1, name:'疾风步', icon:'💨', desc:'全队速度 +12%', cost:14, eff:'spd', val:0.12, req:'g1' },
  { id:'g3', b:'wood', tier:2, name:'丰饶之赐', icon:'🍀', desc:'答题经验 +25%', cost:26, eff:'exp', val:0.25, req:'g2' },
  { id:'g4', b:'wood', tier:3, name:'世界树之叶', icon:'🌳', desc:'全队速度 +20%', cost:44, eff:'spd', val:0.20, req:'g3' },
  /* 光辉：知识向 —— 星尘获取、答题 */
  { id:'l1', b:'light', tier:0, name:'求知若渴', icon:'📚', desc:'收集新知识点获得的星尘 +25%', cost:6, eff:'dust', val:0.25, req:null },
  { id:'l2', b:'light', tier:1, name:'明察秋毫', icon:'🔍', desc:'答对题目金币奖励 +20%', cost:14, eff:'gold', val:0.20, req:'l1' },
  { id:'l3', b:'light', tier:2, name:'智慧之光', icon:'💡', desc:'收集新知识点星尘 +40%', cost:26, eff:'dust', val:0.40, req:'l2' },
  { id:'l4', b:'light', tier:3, name:'圣殿启智', icon:'🌟', desc:'答题经验 +30%', cost:44, eff:'exp', val:0.30, req:'l3' },
  /* 暗影：特殊向 —— 暴击率、综合 */
  { id:'d1', b:'dark', tier:0, name:'暗夜潜行', icon:'🌑', desc:'全队防御 +10%', cost:6, eff:'def', val:0.10, req:null },
  { id:'d2', b:'dark', tier:1, name:'致命一击', icon:'🗡️', desc:'暴击伤害 +30%', cost:14, eff:'crit', val:0.30, req:'d1' },
  { id:'d3', b:'dark', tier:2, name:'月蚀之影', icon:'🌘', desc:'全队攻击 +10%', cost:26, eff:'atk', val:0.10, req:'d2' },
  { id:'d4', b:'dark', tier:3, name:'深渊支配', icon:'👑', desc:'暴击伤害 +80%', cost:44, eff:'crit', val:0.80, req:'d3' }
];
var NODE_BY_ID={}; NODES.forEach(function(n){ NODE_BY_ID[n.id]=n; });

/* ---------- 存档访问 ---------- */
function T(){
  var s=E.S; if(!s) return {cloud:0,spent:0,nodes:{}};
  if(!s.talents) s.talents={cloud:0,spent:0,nodes:{}};
  if(!s.talents.nodes) s.talents.nodes={};
  return s.talents;
}
function cloud(){ return T().cloud||0; }
function spent(){ return T().spent||0; }
function isUnlocked(id){ return !!T().nodes[id]; }
function canUnlock(id){
  var n=NODE_BY_ID[id]; if(!n||isUnlocked(id)) return false;
  if(n.req && !isUnlocked(n.req)) return false;
  return cloud()>=n.cost;
}
function unlock(id){
  var n=NODE_BY_ID[id]; if(!canUnlock(id)) return {ok:false,msg:'星尘不足或未解锁前置'};
  var t=T(); t.cloud-=n.cost; t.spent=(t.spent||0)+n.cost; t.nodes[id]=1;
  E.save();
  if(window.RPG_AUDIO) window.RPG_AUDIO.sfx('levelup');
  return {ok:true,msg:'解锁天赋：'+n.name};
}

/* 累加某类效果的 total 值（同类节点可叠加） */
function bonus(eff){
  var t=T(), sum=0;
  Object.keys(t.nodes||{}).forEach(function(id){
    if(t.nodes[id] && NODE_BY_ID[id] && NODE_BY_ID[id].eff===eff) sum+=NODE_BY_ID[id].val;
  });
  return sum;
}

/* 收集知识点 → 星尘（每个新覆盖知识点 +2 星尘，可被 light 分支加成） */
function earnFromCoverage(count){
  if(!count || count<=0) return 0;
  var gain=Math.round(count*2*(1+bonus('dust')));
  var t=T(); t.cloud=(t.cloud||0)+gain;
  E.save();
  return gain;
}

/* 一次性：根据当前已覆盖知识点，补齐星尘（老档迁移用，记录已结算数量） */
function seedFromSave(){
  var s=E.S; if(!s) return 0;
  if(s.talents.seeded) return 0;
  var covered=0;
  if(s.campaign && s.campaign.covered){
    Object.keys(s.campaign.covered).forEach(function(k){ if(s.campaign.covered[k]) covered++; });
  }
  if(!covered) covered=(s.stats&&s.stats.quizOk)||0;
  var gain=earnFromCoverage(covered);
  s.talents.seeded=1; E.save();
  return gain;
}

/* 供 engine 调用的属性加成倍率 */
function statMult(key){ return 1 + bonus(key); }        // atk/def/hp/spd
function expMult(){ return 1 + bonus('exp'); }
function goldMult(){ return 1 + bonus('gold'); }
function critBonus(){ return bonus('crit'); }

/* 各分支解锁进度 */
function branchProgress(b){
  var nodes=NODES.filter(function(n){ return n.b===b; });
  var done=nodes.filter(function(n){ return isUnlocked(n.id); }).length;
  return { done:done, total:nodes.length };
}
function unlockedCount(){ return Object.keys(T().nodes||{}).filter(function(id){ return T().nodes[id]; }).length; }

window.RPG_TALENTS={
  BRANCHES:BRANCHES, NODES:NODES, NODE_BY_ID:NODE_BY_ID,
  cloud:cloud, spent:spent, isUnlocked:isUnlocked, canUnlock:canUnlock, unlock:unlock,
  bonus:bonus, earnFromCoverage:earnFromCoverage, seedFromSave:seedFromSave,
  statMult:statMult, expMult:expMult, goldMult:goldMult, critBonus:critBonus,
  branchProgress:branchProgress, unlockedCount:unlockedCount
};
})();
