/* 《知识大陆 · 宠物远征》知识数据 v5.1（分片版）
 * 来源：math-learning-app / cn-math-taxonomy (CC BY-NC 4.0)
 * 全量 4068 知识点 / 13679 题按年级拆分为分片，首屏只加载核心，切年级时按需加载。
 * 生成器：_tools/gen_shards.py（数据来自 v5 无损全量题库，答案 100% 正确）
 */
window.KG_VERSION = 5;
window.KG_META = {"points":4068,"questions":16419,"source":"cn-math-taxonomy CC BY-NC 4.0","updated":"9879dd00c1"};
window.GRADES = [{"id":"g1","name":"1年级","short":"1","stage":"小学"},{"id":"g2","name":"2年级","short":"2","stage":"小学"},{"id":"g3","name":"3年级","short":"3","stage":"小学"},{"id":"g4","name":"4年级","short":"4","stage":"小学"},{"id":"g5","name":"5年级","short":"5","stage":"小学"},{"id":"g6","name":"6年级","short":"6","stage":"小学"},{"id":"g7","name":"初一","short":"7","stage":"初中"},{"id":"g8","name":"初二","short":"8","stage":"初中"},{"id":"g9","name":"初三","short":"9","stage":"初中"},{"id":"g10","name":"高一","short":"10","stage":"高中"},{"id":"g11","name":"高二","short":"11","stage":"高中"},{"id":"g12","name":"高三","short":"12","stage":"高中"}];
window.SUBJ_META = {"math":{"name":"数学","icon":"🧮"},"cn":{"name":"语文","icon":"📖"},"en":{"name":"英语","icon":"🔤"},"sci":{"name":"科学","icon":"🔬"},"eth":{"name":"道德与法治","icon":"⚖️"},"phy":{"name":"物理","icon":"⚛️"},"chem":{"name":"化学","icon":"🧪"},"bio":{"name":"生物","icon":"🧬"},"his":{"name":"历史","icon":"🏛️"},"geo":{"name":"地理","icon":"🌍"}};
window.ELEMENTS = {"fire":{"name":"火","icon":"🔥","color":"#ff6b3d"},"water":{"name":"水","icon":"💧","color":"#3aa7ff"},"wood":{"name":"木","icon":"🌿","color":"#4fbf6a"},"light":{"name":"光","icon":"✨","color":"#ffd34d"},"dark":{"name":"暗","icon":"🌙","color":"#a377ff"}};
window.ELEM_ADV = {"fire":"wood","wood":"water","water":"fire","light":"dark","dark":"light"};
window.ELEM_ADV_MULT = 1.6; window.ELEM_WEAK_MULT = 0.7;
window.BATTLE_PETS = [{"id":"P001","name":"焰爪犬","emoji":"🔥","rar":"R","elem":"fire","skill":"焰爪击"},{"id":"P011","name":"潮汐猫","emoji":"💧","rar":"R","elem":"water","skill":"潮汐弹"},{"id":"P027","name":"森角鹿","emoji":"🦌","rar":"SR","elem":"wood","skill":"森光冲"},{"id":"P035","name":"岩甲龟","emoji":"🐢","rar":"R","elem":"wood","skill":"岩甲撞"},{"id":"P042","name":"冰晶狐","emoji":"❄️","rar":"SR","elem":"water","skill":"冰晶刺"},{"id":"P051","name":"光羽鹤","emoji":"🕊️","rar":"R","elem":"light","skill":"光羽闪"},{"id":"D201","name":"星羽兽","emoji":"🦅","rar":"SSR","elem":"light","skill":"星羽坠"},{"id":"D203","name":"焰鳞兽","emoji":"🐉","rar":"SSR","elem":"fire","skill":"炎鳞破"},{"id":"D207","name":"月影兽","emoji":"🌙","rar":"SSR","elem":"dark","skill":"月影斩"},{"id":"D209","name":"暮影狼","emoji":"🐺","rar":"SR","elem":"dark","skill":"暮影扑"}];
window.RAR_BONUS = {"N":0,"R":2,"SR":4,"SSR":6}; window.RAR_COLOR = {"N":"#9aa3b2","R":"#3b82f6","SR":"#a855f7","SSR":"#f5b301"};
window.KG_TOTAL = 4068;
window.KG_BANK_TOTAL = 16419;
/* 空容器：分片加载后填充 */
window.KG_POINTS = {}; window.KG_NAMES = {}; window.KG_BANK = {};
window.KG_SHARDS = {"g1":{"p":186,"q":744,"f":"data/kg/g1.js"},"g2":{"p":182,"q":728,"f":"data/kg/g2.js"},"g3":{"p":277,"q":1108,"f":"data/kg/g3.js"},"g4":{"p":270,"q":1080,"f":"data/kg/g4.js"},"g5":{"p":289,"q":1156,"f":"data/kg/g5.js"},"g6":{"p":270,"q":1080,"f":"data/kg/g6.js"},"g7":{"p":444,"q":1824,"f":"data/kg/g7.js"},"g8":{"p":466,"q":1928,"f":"data/kg/g8.js"},"g9":{"p":357,"q":1463,"f":"data/kg/g9.js"},"g10":{"p":313,"q":1252,"f":"data/kg/g10.js"},"g11":{"p":256,"q":1024,"f":"data/kg/g11.js"},"g12":{"p":758,"q":3032,"f":"data/kg/g12.js"}};
window.KG_LOADED = {};
window.KG_API = {
  loaded: function(g){ return !!window.KG_LOADED[g]; },
  meta: function(g){ return window.KG_SHARDS[g]; },
  /* 用普通 <script> 标签动态加载分片（微信 X5 对同步 XHR/eval 兼容差，故不用它们） */
  load: function(g, cb){
    if (window.KG_LOADED[g]) { cb && cb(true); return true; }
    var m = window.KG_SHARDS[g]; if (!m) { cb && cb(false); return false; }
    try {
      var s = document.createElement('script');
      s.src = m.f;
      s.onload = function(){ window.KG_LOADED[g] = true; cb && cb(true); };
      s.onerror = function(){ console.error('[分片加载失败]', g); cb && cb(false); };
      (document.head || document.body).appendChild(s);
      return true;  /* 已发起加载 */
    } catch (e) { cb && cb(false); return false; }
  }
};
