/* ============================================================
 * 知识大陆 · 知识远征  —  数据层
 * 宠物 / 怪物 / 技能 / 道具 / 任务 / 地图配置
 * 存档独立：所有 key 以 rpg. 开头，与 battle 完全隔离
 * ============================================================ */
'use strict';

/* ---------- 元素与克制 ---------- */
var ELEMENTS = {
  fire:  { name:'火', icon:'🔥', color:'#ff6b3d' },
  water: { name:'水', icon:'💧', color:'#3aa7ff' },
  wood:  { name:'木', icon:'🌿', color:'#4fbf6a' },
  light: { name:'光', icon:'✨', color:'#ffd34d' },
  dark:  { name:'暗', icon:'🌙', color:'#a377ff' }
};
/* 克制：攻方→守方 倍率表；1.6 克制 / 0.7 被克 */
/* 火克木 → 木克水 → 水克火；光克暗 → 暗克光 */
var ELEM_ADV = { fire:'wood', wood:'water', water:'fire', light:'dark', dark:'light' };
function elemMult(atk, def){
  if (ELEM_ADV[atk] === def) return 1.6;
  if (ELEM_ADV[def] === atk) return 0.7;
  return 1;
}

/* ---------- 属性 ↔ 学科 对应（答题暴击的核心） ----------
 * 每个学科归属一种属性；宠物属性「克制」某学科属性时，答对该学科题目触发暴击。
 * 例如 火系宠物（火克木）答对「科学/生物」(木) 题 → 暴击。
 * 例：水系宠物（水克火）答对「语文/化学」(火) 题 → 暴击。
 */
var SUBJ_ELEM = {
  cn:'fire',   his:'fire',      // 语文 / 历史 → 火
  math:'water',geo:'water',     // 数学 / 地理 → 水
  sci:'wood',  bio:'wood',      // 科学 / 生物 → 木
  en:'light',  phy:'light',     // 英语 / 物理 → 光
  eth:'dark',  chem:'dark'      // 道法 / 化学 → 暗
};
function subjectElement(subj){ return SUBJ_ELEM[subj] || 'light'; }
/* 属性对应的学科列表（用于展示「擅长科目」） */
function elemSubjects(elem){
  var out=[];
  for (var s in SUBJ_ELEM) if (SUBJ_ELEM[s]===elem) out.push(s);
  return out;
}
/* 宠物属性是否克制某学科（答对暴击判定） */
function isCritSubject(petElem, subj){
  var se = subjectElement(subj);
  return ELEM_ADV[petElem] === se;               // 克制（非被克）
}
/* 宠物被某学科属性克制（答对也无暴击，仅提示） */
function isWeakSubject(petElem, subj){
  var se = subjectElement(subj);
  return ELEM_ADV[se] === petElem;
}

var RAR = { N:0, R:2, SR:4, SSR:6 };
var RAR_COLOR = { N:'#9aa3b2', R:'#3b82f6', SR:'#a855f7', SSR:'#f5b301' };

/* ---------- 可选宠物（初始队伍从中选 3 只） ----------
 * moves: {normal:普攻, spell:知识技(答题), ult:必杀技(答题)} 个性化炫酷招式名
 */
var PETS = [
  { id:'P001', name:'焰尾狐', emoji:'🔥', elem:'fire',  rar:'R',   skill:'焰爪击', base:{hp:110,atk:26,def:16,spd:18}, moves:{normal:'烈焰扑咬', spell:'赤焰·燎原爪', ult:'炎狱·焚天裂爪' } },
  { id:'P011', name:'潮汐猫', emoji:'💧', elem:'water', rar:'R',   skill:'潮汐弹', base:{hp:118,atk:24,def:18,spd:16}, moves:{normal:'浪花拍击', spell:'涌潮·回旋浪', ult:'深海·万潮归墟' } },
  { id:'P027', name:'森角鹿', emoji:'🦌', elem:'wood',  rar:'SR',  skill:'森光冲', base:{hp:106,atk:28,def:16,spd:20}, moves:{normal:'荆棘突刺', spell:'森罗·万叶斩', ult:'苍翠·世界树之怒' } },
  { id:'P035', name:'钢岩机甲', emoji:'🤖', elem:'wood',  rar:'R',   skill:'岩甲撞', base:{hp:140,atk:20,def:26,spd:10}, moves:{normal:'岩甲撞击', spell:'磐岩·崩山击', ult:'地脉·不动如山崩' } },
  { id:'P042', name:'寒冰晶', emoji:'❄️', elem:'water', rar:'SR',  skill:'冰晶刺', base:{hp:104,atk:29,def:15,spd:22}, moves:{normal:'冰棱弹射', spell:'寒霜·千冰刺', ult:'极寒·冰封万里' } },
  { id:'P051', name:'祥云兽', emoji:'☁️', elem:'light', rar:'R',   skill:'光羽闪', base:{hp:112,atk:25,def:17,spd:19}, moves:{normal:'光羽疾斩', spell:'圣光·羽翼风暴', ult:'曜日·天羽降临' } },
  { id:'D201', name:'星羽兽', emoji:'🦅', elem:'light', rar:'SSR', skill:'星羽坠', base:{hp:132,atk:34,def:20,spd:24}, moves:{normal:'星羽疾刺', spell:'星陨·银河坠', ult:'璀璨·星辰崩裂击' } },
  { id:'D203', name:'焰鳞机甲', emoji:'🐉', elem:'fire',  rar:'SSR', skill:'炎鳞破', base:{hp:128,atk:36,def:20,spd:21}, moves:{normal:'炎鳞冲撞', spell:'熔岩·龙焰吐息', ult:'焚世·炎龙灭世' } },
  { id:'D207', name:'月影兽', emoji:'🌙', elem:'dark',  rar:'SSR', skill:'月影斩', base:{hp:124,atk:35,def:19,spd:25}, moves:{normal:'暗月刃', spell:'月蚀·暗影绞杀', ult:'永夜·月影终结' } },
  { id:'D209', name:'钢影机甲', emoji:'🤖', elem:'dark',  rar:'SR',  skill:'暮影扑', base:{hp:108,atk:30,def:16,spd:23}, moves:{normal:'暗影扑咬', spell:'暮色·狂影袭', ult:'深渊·影狼噬魂' } }
];
/* 追加 24 只 Petdex 动画伙伴（私下娱乐用，作为可出战宠物）。
 * 元数据来自 window.RPG_PETDEX，属性做平衡：按 elem 分配，稀有度多为 R/SR。
 * id 前缀 PD 用于 UI 走精灵动画渲染分支。 */
if (window.RPG_PETDEX){
  var _rarPool=['R','R','R','SR','R','R','R','SR','SR','R','R','R','SR','SSR','R','R','R','R','SR','R','R','R','SR','SSR'];
  var _hp=[100,112,120,104,96,108,116,102,106,114,118,110,108,130,100,122,116,106,112,110,98,108,124,132];
  var _atk=[24,22,20,30,32,26,22,28,29,21,25,24,27,36,30,23,22,26,25,24,31,26,28,34];
  var _def=[16,18,20,14,13,17,19,15,16,19,18,17,16,20,14,20,19,16,17,17,13,16,19,21];
  var _spd=[18,16,12,24,26,20,14,22,23,12,17,18,21,20,26,14,15,20,18,17,24,18,22,25];
  var _cn=['哆啦A梦','奶茶水獭','噜噜水豚','皮卡丘','卡比','吉伊卡哇','龙猫','柯南','初音未来','QQ企鹅','柴犬','奶蛙','月芽狐','蓝龙琪拉','故障猫','肉包','毛团','呆呆鸟','墨团团','奶蛙仔','饼干猫','小蓝鲨','锦鸾','银月byte'];
  window.RPG_PETDEX.PETS.forEach(function(pd,i){
    PETS.push({
      id:pd.id, name:_cn[i]||pd.name, emoji:'🐾', elem:pd.elem, rar:_rarPool[i],
      skill:'伙伴技能',
      base:{hp:_hp[i],atk:_atk[i],def:_def[i],spd:_spd[i]},
      moves:{ normal:'伙伴·扑击', spell:'伙伴·知识波', ult:'伙伴·流星击' },
      _pd:true
    });
  });
}
var PET_BY_ID = {}; PETS.forEach(function(p){ PET_BY_ID[p.id] = p; });
/* 取某宠物某类招式的炫酷名称（normal/spell/ult），无则回退通用名 */
function moveName(petId, kind){
  var p = PET_BY_ID[petId];
  var d = SKILLS[kind] || SKILLS.normal;
  if (p && p.moves && p.moves[kind]) return p.moves[kind];
  return d.name;
}

/* 进化阶段：等级阈值与图片后缀（P系列在 ../images/gif/，D系列在 ../images/m/） */
var STAGES = [
  { lv:1,  key:'baby',    name:'幼生' },
  { lv:10, key:'growth',  name:'成长' },
  { lv:22, key:'adult',   name:'成熟' },
  { lv:36, key:'ultimate',name:'终极' }
];
function petImg(id, stageKey){
  /* Petdex 动画伙伴：返回精灵图路径，由 UI 走 CSS steps 动画分支 */
  var pd = window.RPG_PETDEX && window.RPG_PETDEX.byId(id);
  if (pd) return window.RPG_PETDEX.BASE + pd.file;
  /* 统一使用 RPG 独立目录的轻量静态 PNG（128x128），加载快、尺寸一致 */
  var sc='';
  try{ var m=location.search.match(/[?&]sharecode=([^&]+)/); if(m) sc='?sharecode='+encodeURIComponent(m[1]); }catch(e){}
  return 'images/pets/' + id + '-' + stageKey + '.png' + sc;
}
function stageForLv(lv){
  var s = STAGES[0];
  for (var i=0;i<STAGES.length;i++) if (lv >= STAGES[i].lv) s = STAGES[i];
  return s;
}

/* ---------- 怪物（野外敌人） ---------- */
/* 图片在 ../images/mon/ ；elem / base 属性 / exp 经验 / gold 金币 */
var MONSTERS = [
  { key:'e01', name:'数据史莱姆', file:'e01-data-slime.png',   elem:'water', base:{hp:70,atk:14,def:8,spd:8},  exp:18, gold:12, zone:0 },
  { key:'e02', name:'噪点蝙蝠',   file:'e02-noisy-bat.png',    elem:'dark',  base:{hp:62,atk:16,def:7,spd:15}, exp:20, gold:14, zone:0 },
  { key:'e03', name:'墨汁章鱼',   file:'e03-ink-octopus.png',  elem:'water', base:{hp:88,atk:15,def:11,spd:9}, exp:24, gold:16, zone:1 },
  { key:'e04', name:'嚎叫野狼',   file:'e04-howling-wolf.png', elem:'wood',  base:{hp:96,atk:20,def:10,spd:16}, exp:30, gold:20, zone:1 },
  { key:'e05', name:'沙蝎',       file:'e05-sand-scorpion.png',elem:'fire',  base:{hp:104,atk:22,def:12,spd:12},exp:34, gold:22, zone:2 },
  { key:'e06', name:'字母蛇',     file:'e06-letter-snake.png', elem:'wood',  base:{hp:98,atk:21,def:11,spd:17}, exp:32, gold:21, zone:2 },
  { key:'e07', name:'算盘甲虫',   file:'e07-abacus-beetle.png',elem:'light', base:{hp:120,atk:19,def:18,spd:6}, exp:38, gold:25, zone:2 },
  { key:'e08', name:'迷雾水母',   file:'e08-mist-jelly.png',   elem:'water', base:{hp:110,atk:24,def:12,spd:13}, exp:42, gold:28, zone:3 },
  { key:'e09', name:'错别字蜘蛛', file:'e09-typo-spider.png',  elem:'dark',  base:{hp:116,atk:26,def:13,spd:15}, exp:46, gold:30, zone:3 },
  { key:'e10', name:'瞌睡幽灵',   file:'e10-doze-ghost.png',   elem:'dark',  base:{hp:132,atk:25,def:15,spd:11}, exp:50, gold:34, zone:3 },
  /* 新增怪物（AI 生成卡通图，地图可见） */
  { key:'e11', name:'火焰精灵',   file:'e11-fire-spirit.png',  elem:'fire',  base:{hp:92, atk:21,def:10,spd:14}, exp:28, gold:18, zone:0 },
  { key:'e12', name:'苔藓守卫',   file:'e12-moss-golem.png',   elem:'wood',  base:{hp:108,atk:18,def:16,spd:8},  exp:32, gold:20, zone:1 },
  { key:'e13', name:'水滴史莱姆', file:'e13-water-slime.png',  elem:'water', base:{hp:100,atk:20,def:12,spd:12}, exp:30, gold:19, zone:1 },
  { key:'e14', name:'暗影蝠',     file:'e14-shadow-bat.png',   elem:'dark',  base:{hp:88, atk:24,def:9, spd:18}, exp:36, gold:23, zone:3 },
  { key:'e15', name:'星光精灵',   file:'e15-star-sprite.png',  elem:'light', base:{hp:96, atk:22,def:11,spd:15}, exp:34, gold:22, zone:2 },
  { key:'e16', name:'晶岩兽',     file:'e16-crystal-golem.png',elem:'light', base:{hp:126,atk:23,def:19,spd:7},  exp:42, gold:27, zone:3 }
];
/* Boss */
var BOSSES = [
  { key:'b01', name:'蘑菇王',   file:'b01-mushroom-king.png', elem:'wood',  base:{hp:260,atk:30,def:20,spd:8},  exp:120, gold:150, quest:'q_boss1' },
  { key:'b02', name:'玩具霸王龙',file:'b02-toy-trex.png',     elem:'fire',  base:{hp:300,atk:36,def:22,spd:12}, exp:160, gold:200, quest:'q_boss2' },
  { key:'b03', name:'风暴领主', file:'b03-storm-lord.png',    elem:'light', base:{hp:340,atk:40,def:24,spd:18}, exp:210, gold:260, quest:'q_boss3' },
  { key:'b04', name:'熔岩巨兽', file:'b04-lava-beast.png',    elem:'fire',  base:{hp:380,atk:44,def:26,spd:14}, exp:260, gold:320, quest:'q_boss4' },
  { key:'b05', name:'冰霜女王', file:'b05-frost-queen.png',   elem:'water', base:{hp:420,atk:46,def:28,spd:20}, exp:320, gold:400, quest:'q_boss5' },
  { key:'b06', name:'知识魔王', file:'b06-knowledge-lord.png',elem:'dark',  base:{hp:520,atk:52,def:32,spd:22}, exp:500, gold:666, quest:'q_boss6' }
];
/* 国内节点子资源请求需携带 sharecode：从当前页 URL 提取并追加到图片路径，
 * GitHub Pages 等无 sharecode 的环境 getSharecode 返回空串，行为不变。 */
function getSharecode(){
  try{
    var m=location.search.match(/[?&]sharecode=([^&]+)/);
    return m ? ('?sharecode='+encodeURIComponent(m[1])) : '';
  }catch(e){ return ''; }
}
var _sc=getSharecode();
function monsterImg(m){ return '../images/mon/' + m.file + _sc; }
function npcImg(n){ return '../images/npc/' + n.img + _sc; }
/* Boss 也用 monsterImg（文件在 images/mon/） */

/* ---------- 道具 ---------- */
var ITEMS = {
  potion:  { name:'活力药水', emoji:'🧪', desc:'恢复一只宠物 50 HP', price:40,
    detail:'战斗中给当前出战宠物恢复 50 点生命（不超过上限）。血条见底前使用最划算，打完仗不会自动回血。' },
  ether:   { name:'能量水晶', emoji:'💎', desc:'恢复一只宠物 20 MP', price:60,
    detail:'给当前出战宠物恢复 20 点能量，战斗中 MP 见底时救急用。普攻和答题技能命中各回 2 点，战斗胜利后全队 MP 回满，所以一般不用囤太多。' },
  antidote:{ name:'清醒草',   emoji:'🌿', desc:'解除异常状态', price:30,
    detail:'用于解除宠物的异常状态（如眩晕、中毒）。当前版本怪物较少施加异常，可以先备着以防万一。' },
  candy:   { name:'经验糖果', emoji:'🍬', desc:'给一只宠物 +60 经验', price:80,
    detail:'给当前出战宠物加 60 点经验，经验够了会当场升级并回满 HP/MP。打 Boss 必掉，开箱也有机会拿到。' }
};

/* ---------- 战斗掉落表 ---------- */
/* 普通怪：按概率掉补给；Boss：必掉经验糖果+额外金币。rate 为概率(0~1) */
var DROPS = {
  common: [
    { item:'potion',   rate:0.30, min:1, max:1 },
    { item:'ether',    rate:0.12, min:1, max:1 },
    { item:'antidote', rate:0.10, min:1, max:1 },
    { item:'candy',    rate:0.08, min:1, max:1 }
  ],
  boss: [
    { item:'candy',    rate:1,    min:2, max:3 },
    { item:'potion',   rate:1,    min:1, max:2 },
    { item:'ether',    rate:0.8,  min:1, max:1 }
  ]
};

/* ---------- 支线任务（独立于主线，可同时挂多条） ---------- */
/* 结构同主线；多了 id 前缀 s_ 与 side:true；NPC 对话中接取/交付 */
var SIDE_QUESTS = [
  { id:'s1', title:'支线·贪吃的学者', desc:'累计答对 10 道题，帮学者整理知识笔记', type:'quiz', need:10, reward:{gold:120, exp:80}, npc:'学者' },
  { id:'s2', title:'支线·森林清道夫', desc:'再击败 8 只野外魔物，帮探险家清理道路', type:'kill', need:8, reward:{gold:150, exp:90}, npc:'探险家' },
  { id:'s3', title:'支线·训练师的考验', desc:'让任意宠物达到 15 级', type:'level', need:15, reward:{gold:200, exp:140}, npc:'训练师' },
  { id:'s4', title:'支线·宝箱猎人', desc:'累计开启 5 个宝箱', type:'chest', need:5, reward:{gold:180, exp:110}, npc:'探险家' },
  { id:'s5', title:'支线·蘑菇再临', desc:'再次击败蘑菇王，收集蘑菇王孢子', type:'boss', boss:'b01', need:1, reward:{gold:260, exp:180}, npc:'村长' },
  { id:'s6', title:'支线·百题达人', desc:'累计答对 100 道题，成为知识大陆的答题王者', type:'quiz', need:100, reward:{gold:600, exp:500}, npc:'学者' }
];

/* ---------- 技能（答题成功释放） ---------- */
/* power 倍率；mp 消耗；extra 附加效果 */
var SKILLS = {
  normal: { name:'普通攻击', mp:0,  power:1.0, desc:'无需答题的稳定一击' },
  spell:  { name:'知识技能', mp:8,  power:1.8, desc:'答对题目释放，伤害更高' },
  ult:    { name:'必杀技',   mp:20, power:2.8, desc:'答对题目释放的强力一击' }
};

/* ---------- 主线任务链 ---------- */
/* 每个任务：id / title / 目标类型 type(kill|boss|talk|chest|level) / 参数 / 奖励 */
var QUESTS = [
  { id:'q1', title:'初入知识大陆', desc:'击败 3 只野外魔物，证明你的实力', type:'kill', need:3, reward:{gold:80, exp:40}, npc:'村长' },
  { id:'q_boss1', title:'蘑菇王的威胁', desc:'前往蘑菇森林，击败蘑菇王', type:'boss', boss:'b01', need:1, reward:{gold:200, exp:120}, npc:'村长' },
  { id:'q2', title:'失踪的宝箱', desc:'在野外开启 2 个宝箱', type:'chest', need:2, reward:{gold:120, exp:60}, npc:'探险家' },
  { id:'q_boss2', title:'玩具霸王龙', desc:'挑战玩具谷的霸王龙', type:'boss', boss:'b02', need:1, reward:{gold:300, exp:200}, npc:'探险家' },
  { id:'q3', title:'成长的烦恼', desc:'让任意一只宠物达到 12 级', type:'level', need:12, reward:{gold:150, exp:100}, npc:'训练师' },
  { id:'q_boss3', title:'风暴领主', desc:'击败风暴高地的领主', type:'boss', boss:'b03', need:1, reward:{gold:400, exp:280}, npc:'训练师' },
  { id:'q4', title:'知识宝藏', desc:'累计答对 30 道题', type:'quiz', need:30, reward:{gold:250, exp:180}, npc:'学者' },
  { id:'q_boss4', title:'熔岩巨兽', desc:'深入熔岩洞窟击败巨兽', type:'boss', boss:'b04', need:1, reward:{gold:500, exp:360}, npc:'学者' },
  { id:'q_boss5', title:'冰霜女王', desc:'挑战冰封之地的女王', type:'boss', boss:'b05', need:1, reward:{gold:650, exp:450}, npc:'村长' },
  { id:'q_boss6', title:'终章 · 知识魔王', desc:'击败知识魔王，守护知识大陆', type:'boss', boss:'b06', need:1, reward:{gold:1000, exp:800}, npc:'村长' }
];

/* ---------- 地图配置 ---------- */
/* 世界 64x48 格；每格 30px。五个区域按 x/y 划分，越靠上/右越危险。 */
var MAP_CFG = {
  cols:64, rows:48, tile:30,
  zones:[
    { id:0, name:'新手草原', color:'#3c6b3f', y0:30, y1:48, x0:0,  x1:38, monsters:['e01','e02','e11'] },
    { id:1, name:'蘑菇森林', color:'#2f5d3a', y0:20, y1:30, x0:8,  x1:40, monsters:['e03','e04','e12','e13'] },
    { id:2, name:'玩具谷/沙漠', color:'#8a7a3f', y0:16, y1:28, x0:40, x1:64, monsters:['e05','e06','e07','e15'] },
    { id:3, name:'风暴高地', color:'#4a5570', y0:6,  y1:20, x0:20, x1:52, monsters:['e08','e09','e10','e14','e16'] },
    { id:4, name:'知识圣殿', color:'#5b4a72', y0:0,  y1:10, x0:40, x1:64, monsters:[] }
  ],
  /* NPC 位置（格坐标）：村长/探险家/训练师/学者 + 商店 */
  npcs:[
    { name:'村长',   x:20, y:40, color:'#ffd777', icon:'👴', img:'npc-chief.png',      role:'quest' },
    { name:'探险家', x:30, y:42, color:'#8fe3a8', icon:'🧭', img:'npc-explorer.png',   role:'quest' },
    { name:'训练师', x:14, y:36, color:'#7ad0ff', icon:'🥋', img:'npc-trainer.png',    role:'quest' },
    { name:'学者',   x:34, y:38, color:'#d7b3ff', icon:'📖', img:'npc-scholar.png',    role:'quest' },
    { name:'药剂师', x:24, y:42, color:'#ff9db1', icon:'🧑‍⚕️', img:'npc-pharmacist.png', role:'shop' }
  ],
  /* Boss 站位 */
  bosses:[
    { key:'b01', x:22, y:24 }, { key:'b02', x:50, y:22 },
    { key:'b03', x:36, y:12 }, { key:'b04', x:54, y:24 },
    { key:'b05', x:46, y:6  }, { key:'b06', x:56, y:4  }
  ],
  /* 宝箱位置 */
  chests:[
    { x:16,y:44 },{ x:28,y:34 },{ x:44,y:26 },{ x:50,y:14 },
    { x:30,y:22 },{ x:58,y:20 },{ x:40,y:8 },{ x:12,y:26 }
  ],
  spawn:{ x:20, y:43 }
};

/* 怪物按 key 索引 */
var MON_BY_KEY = {}; MONSTERS.concat(BOSSES).forEach(function(m){ MON_BY_KEY[m.key] = m; });

/* 导出到全局 */
window.RPG_DATA = {
  ELEMENTS:ELEMENTS, ELEM_ADV:ELEM_ADV, elemMult:elemMult, SUBJ_ELEM:SUBJ_ELEM, subjectElement:subjectElement,
  elemSubjects:elemSubjects, isCritSubject:isCritSubject, isWeakSubject:isWeakSubject,
  RAR:RAR, RAR_COLOR:RAR_COLOR,
  PETS:PETS, PET_BY_ID:PET_BY_ID, STAGES:STAGES, petImg:petImg, stageForLv:stageForLv, moveName:moveName,
  MONSTERS:MONSTERS, BOSSES:BOSSES, MON_BY_KEY:MON_BY_KEY, monsterImg:monsterImg, npcImg:npcImg,
  ITEMS:ITEMS, SKILLS:SKILLS, QUESTS:QUESTS, SIDE_QUESTS:SIDE_QUESTS, DROPS:DROPS, MAP_CFG:MAP_CFG
};
