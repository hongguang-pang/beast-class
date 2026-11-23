/* ============================================================
 * 精灵大陆 · 知识远征  —  剧情战役 / 知识点覆盖 / 自适应弱点
 * 关卡 = 教材单元；一套关卡覆盖当前年级全部知识点。
 * 独立命名空间 rpg.campaign.*，通过 window.RPG_CAMPAIGN 暴露。
 * ============================================================ */
'use strict';
(function(){
var D = window.RPG_DATA;

/* ---------- 单元剧情文案（按学科给一套模板，按序号微调） ---------- */
var STORY = {
  math: ['数字迷雾笼罩了这片草原，解开计算的谜题才能驱散它。',
         '几何山谷的封印需要图形的智慧来解开。',
         '运算之河波涛汹涌，答对题目才能架起桥梁。'],
  en:   ['字母森林里回荡着陌生的单词，读懂它们才能通行。',
         '语法之塔的守卫只放行掌握句型的人。',
         '音节花园需要正确的发音才能绽放。'],
  cn:   ['文字古镇藏着失落的篇章，理解词句才能唤醒它。',
         '诗词长廊的壁画需要读懂诗文才能显现。',
         '阅读理解之门只为善于思考的旅人开启。'],
  sci:  ['科学实验室里藏着自然的奥秘，用知识点亮它。',
         '现象峡谷等待你去发现背后的规律。'],
  eth:  ['品德之城需要善良与智慧共同守护。'],
  phy:  ['物理高地遵循着不变的定律，理解才能前行。'],
  chem: ['化学工坊的元素正在躁动，配平它们才能平静。'],
  bio:  ['生命之森生机勃勃，认识万物才能与它共鸣。'],
  his:  ['历史长河奔流不息，读懂过去才能看清未来。'],
  geo:  ['地理沙盘展现山河，辨认方位才能找到出路。']
};
var UNIT_ICON = { math:'🧮', en:'🔤', cn:'📖', sci:'🔬', eth:'⚖️', phy:'⚛️', chem:'🧪', bio:'🧬', his:'🏛️', geo:'🌍' };

function subjName(s){ return (window.SUBJ_META && window.SUBJ_META[s] && window.SUBJ_META[s].name) || s; }
function subjIcon(s){ return (window.SUBJ_META && window.SUBJ_META[s] && window.SUBJ_META[s].icon) || UNIT_ICON[s] || '📚'; }

/* ---------- 根据年级知识点，按单元生成完整关卡链 ---------- */
function buildLevels(grade){
  var pts = window.KG_POINTS && window.KG_POINTS[grade];
  if (!pts) return [];
  var levels = [];
  Object.keys(pts).forEach(function(subj){
    var list = pts[subj] || [];
    /* 按 unit 分组，保留首次出现顺序；unit 内按 uidx 排序 */
    var groups = {};
    var order = [];
    list.forEach(function(p){
      var key = p.unit || (subjName(subj)+' 综合');
      if (!groups[key]){ groups[key] = []; order.push(key); }
      groups[key].push(p);
    });
    order.forEach(function(unit, ui){
      var kps = groups[unit].slice().sort(function(a,b){ return (a.uidx||0)-(b.uidx||0); });
      var stories = STORY[subj] || ['知识的试炼等待着你。'];
      var story = stories[ui % stories.length];
      levels.push({
        id: subj+'|'+ui+'|'+unit,
        subj: subj,
        unit: unit,
        uidx: kps.length ? kps[0].uidx : ui,
        kps: kps.map(function(p){ return p.id; }),
        names: kps.map(function(p){ return p.n; }),
        title: subjIcon(subj)+' '+subjName(subj)+' · '+unit.replace(/.*?(第?\d+单元|第?\d+章|综合与实践|Module|Unit)\s*/i,'$1 ').slice(0,18),
        story: story,
        need: kps.length
      });
    });
  });
  /* 学科内按单元序号排；学科顺序固定：数学/语文/英语/科学/... */
  var subjOrder = ['math','cn','en','sci','eth','phy','chem','bio','his','geo'];
  levels.sort(function(a,b){
    var ai=subjOrder.indexOf(a.subj), bi=subjOrder.indexOf(b.subj);
    if (ai!==bi) return ai-bi;
    return (a.uidx||0)-(b.uidx||0);
  });
  return levels;
}

/* ---------- 题库版本 ---------- */
function bankVersion(){
  return (window.KG_META && window.KG_META.updated) || (window.KG_VERSION ? String(window.KG_VERSION) : '0');
}

/* ---------- 初始化/重建战役（保留宠物、金币、道具、支线） ---------- */
function initCampaign(S, grade, force){
  var ver = bankVersion();
  var lv = buildLevels(grade);
  var c = S.campaign;
  if (!force && c && c.grade===grade && c.ver===ver && c.levels && c.levels.length===lv.length) {
    return { rebuilt:false, levels:c.levels };
  }
  /* 重建：关卡/覆盖/薄弱点归零，其余存档字段原样保留 */
  S.campaign = {
    grade: grade,
    ver: ver,
    levels: lv,
    cur: 0,
    covered: {},   /* kid -> 1，当前版本已答对覆盖的知识点 */
    weak: {},      /* kid -> 连续答错次数 */
    cleared: {},   /* levelId -> 1 */
    totalKps: lv.reduce(function(n,l){ return n + l.kps.length; }, 0)
  };
  return { rebuilt:true, levels:lv };
}

/* ---------- 当前关卡 ---------- */
function curLevel(S){
  if (!S || !S.campaign) return null;
  var lv = S.campaign.levels;
  return lv && lv[S.campaign.cur] ? lv[S.campaign.cur] : null;
}

/* ---------- 关卡内作答：记录覆盖 / 弱点 ---------- */
/* 返回 { weak:是否触发针对性, weakKid, justCovered, cleared } */
function recordAnswer(S, kid, correct){
  if (!S || !S.campaign) return { weak:false };
  var c = S.campaign;
  var res = { weak:false, weakKid:kid, justCovered:false, cleared:false, weakLevel:0 };
  if (correct){
    c.covered[kid] = 1;
    res.justCovered = true;
    if (c.weak[kid]) delete c.weak[kid];   /* 答对即解除弱点锁定 */
    /* 检查当前关卡是否全覆盖 */
    var L = curLevel(S);
    if (L){
      var all = L.kps.every(function(k){ return c.covered[k]; });
      if (all && !c.cleared[L.id]){ c.cleared[L.id] = 1; res.cleared = true; }
    }
  } else {
    c.weak[kid] = (c.weak[kid] || 0) + 1;
    res.weakLevel = c.weak[kid];
    res.weak = c.weak[kid] >= 2;           /* 连错2次触发针对性 */
  }
  return res;
}

/* ---------- 当前关卡的薄弱知识点（连错≥2，需反复巩固） ---------- */
function weakKids(S){
  if (!S || !S.campaign) return [];
  var c=S.campaign, L=curLevel(S);
  if (!L) return [];
  return L.kps.filter(function(k){ return (c.weak[k]||0) >= 2; });
}

/* ---------- 推进到下一关 ---------- */
function nextLevel(S){
  if (!S || !S.campaign) return null;
  var c=S.campaign;
  if (c.cur < c.levels.length-1){ c.cur++; return c.levels[c.cur]; }
  return null;
}
function gotoLevel(S, idx){
  if (!S || !S.campaign) return null;
  var c=S.campaign;
  if (idx>=0 && idx<c.levels.length){ c.cur=idx; return c.levels[c.cur]; }
  return null;
}

/* ---------- 覆盖统计 ---------- */
function coverage(S){
  if (!S || !S.campaign) return { covered:0, total:0, pct:0 };
  var c=S.campaign;
  var total=c.totalKps || c.levels.reduce(function(n,l){return n+l.kps.length;},0);
  var covered=Object.keys(c.covered).filter(function(k){ return c.covered[k]; }).length;
  return { covered:covered, total:total, pct: total? Math.round(covered/total*100):0,
           levelsCleared:Object.keys(c.cleared).filter(function(k){return c.cleared[k];}).length,
           levelsTotal:c.levels.length };
}

/* ---------- 为战斗抽题：优先当前关卡未覆盖/薄弱的知识点 ---------- */
/* 返回 {q, kid} 或 null；q 结构与 pickQuestion 输出一致 */
function pickBattleQuestion(S, usedTexts){
  if (!S || !S.campaign) return null;
  var L = curLevel(S); if (!L) return null;
  var grade = S.grade;
  var bank = window.KG_BANK && window.KG_BANK[grade];
  if (!bank) return null;
  var c = S.campaign;
  /* 收集当前关卡 kid -> 题目池 */
  var kidSet = {};
  L.kps.forEach(function(k){ kidSet[k]=1; });
  var byKid = {};
  Object.keys(bank).forEach(function(subj){
    if (L.subj && subj!==L.subj) return;   /* 只取本关学科 */
    (bank[subj]||[]).forEach(function(q){
      if (kidSet[q.kid]){
        if (!byKid[q.kid]) byKid[q.kid]=[];
        byKid[q.kid].push(q);
      }
    });
  });
  var kids = Object.keys(byKid);
  if (!kids.length) return null;
  /* 优先级：薄弱(连错≥2) > 未覆盖 > 已覆盖(复习) */
  var weak = kids.filter(function(k){ return (c.weak[k]||0)>=2; });
  var fresh = kids.filter(function(k){ return !c.covered[k] && (c.weak[k]||0)<2; });
  var done = kids.filter(function(k){ return c.covered[k] && (c.weak[k]||0)<2; });
  var pool = weak.length ? weak : (fresh.length ? fresh : done);
  /* 用题目文本去重 */
  var cand=[];
  pool.forEach(function(k){
    byKid[k].forEach(function(q){ if (!usedTexts || !usedTexts[q.q]) cand.push({q:q,kid:k}); });
  });
  if (!cand.length){ pool.forEach(function(k){ byKid[k].forEach(function(q){ cand.push({q:q,kid:k}); }); }); }
  if (!cand.length) return null;
  var pick = cand[Math.floor(Math.random()*cand.length)];
  return { raw:pick.q, kid:pick.kid, mode: weak.length?'weak':(fresh.length?'fresh':'review') };
}

window.RPG_CAMPAIGN = {
  buildLevels:buildLevels, bankVersion:bankVersion, initCampaign:initCampaign,
  curLevel:curLevel, recordAnswer:recordAnswer, weakKids:weakKids,
  nextLevel:nextLevel, gotoLevel:gotoLevel, coverage:coverage,
  pickBattleQuestion:pickBattleQuestion, subjName:subjName, subjIcon:subjIcon
};
})();
