/* 大图谱真题 v5.1（分片版）· 13679 题 · 来源 cn-math-taxonomy CC BY-NC 4.0
 * 字段 q=题干 o=选项 a=正确下标 k=知识点 l=难度 t=题型 ans=答案原文 exp=解析 ac=可接受答案
 * 按年级分片，首屏只加载核心，进入对应年级时按需加载。
 */
window.BIG_BANK = {};
window.BB_SHARDS = {"g1":{"q":756,"f":"bb/g1.js"},"g2":{"q":740,"f":"bb/g2.js"},"g3":{"q":1072,"f":"bb/g3.js"},"g4":{"q":1040,"f":"bb/g4.js"},"g5":{"q":1124,"f":"bb/g5.js"},"g6":{"q":1004,"f":"bb/g6.js"},"g7":{"q":1816,"f":"bb/g7.js"},"g8":{"q":1920,"f":"bb/g8.js"},"g9":{"q":1379,"f":"bb/g9.js"},"g10":{"q":596,"f":"bb/g10.js"},"g11":{"q":508,"f":"bb/g11.js"},"g12":{"q":1724,"f":"bb/g12.js"}};
window.BB_LOADED = {};
window.BB_API = {
  loaded: function(g){ return !!window.BB_LOADED[g]; },
  load: function(g){
    if (window.BB_LOADED[g]) return true;
    var m = window.BB_SHARDS[g]; if (!m) return false;
    try {
      var x = new XMLHttpRequest(); x.open('GET', m.f, false); x.send(null);
      if (x.status < 200 || x.status >= 400) return false;
      (0, eval)(x.responseText);
      window.BB_LOADED[g] = true; return true;
    } catch (e) { return false; }
  },
  ensure: function(g, cb){ if (this.load(g)) { cb && cb(true); return true; } cb && cb(false); return false; }
};
