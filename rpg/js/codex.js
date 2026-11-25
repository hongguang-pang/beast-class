/* ============================================================
 * 知识大陆 · 知识远征  —  图鉴与成就勋章模块
 * 独立命名空间 window.RPG_CODEX
 * 宠物图鉴 / 怪兽图鉴 / 成就勋章 · 存档在 rpg.save.v1 的 codex 字段
 * 依赖：RPG_DATA（宠物/怪兽数据）、RPG_ENGINE（存档与金币）
 * ============================================================ */
'use strict';
(function(){
  var D = window.RPG_DATA;
  var E = window.RPG_ENGINE;

  /* ---------- 成就定义（20 枚） ---------- */
  var ACH = [
    /* 战斗 */
    { id:'a01', icon:'⚔️', name:'初露锋芒', cat:'battle', desc:'赢得第一场战斗', gold:50 },
    { id:'a02', icon:'🗡️', name:'百战之将', cat:'battle', desc:'累计击败 50 只怪兽', gold:300 },
    { id:'a03', icon:'🏆', name:'屠魔者',   cat:'battle', desc:'击败全部 6 位 Boss', gold:1000 },
    { id:'a04', icon:'👑', name:'终焉之战', cat:'battle', desc:'击败知识魔王', gold:500 },
    /* 学习 */
    { id:'a05', icon:'💡', name:'知识萌芽', cat:'study', desc:'答对第一道题', gold:30 },
    { id:'a06', icon:'📚', name:'勤学好问', cat:'study', desc:'累计答对 30 道题', gold:150 },
    { id:'a07', icon:'🎓', name:'学霸之路', cat:'study', desc:'累计答对 100 道题', gold:400 },
    { id:'a08', icon:'🧠', name:'知识渊博', cat:'study', desc:'累计答对 500 道题', gold:1500 },
    /* 收集 */
    { id:'a09', icon:'🐾', name:'初识伙伴', cat:'collect', desc:'图鉴解锁 5 只宠物', gold:80 },
    { id:'a10', icon:'🐹', name:'宠物收藏家', cat:'collect', desc:'图鉴解锁 15 只宠物', gold:300 },
    { id:'a11', icon:'🦄', name:'图鉴大师', cat:'collect', desc:'图鉴解锁全部 34 只宠物', gold:2000 },
    { id:'a12', icon:'👾', name:'怪兽猎手', cat:'collect', desc:'怪兽图鉴解锁 10 种', gold:200 },
    { id:'a13', icon:'🔍', name:'怪兽百科', cat:'collect', desc:'怪兽图鉴全部解锁（22 种）', gold:1200 },
    /* 成长 */
    { id:'a14', icon:'🌱', name:'茁壮成长', cat:'grow', desc:'任意宠物达到 Lv12', gold:100 },
    { id:'a15', icon:'🌳', name:'独当一面', cat:'grow', desc:'任意宠物达到 Lv30', gold:400 },
    { id:'a16', icon:'⭐', name:'满级传说', cat:'grow', desc:'任意宠物达到 Lv60', gold:1500 },
    /* 探索 */
    { id:'a17', icon:'🎁', name:'寻宝者', cat:'explore', desc:'累计开启 10 个宝箱', gold:200 },
    { id:'a18', icon:'🗺️', name:'旅行家', cat:'explore', desc:'累计行走 1000 步', gold:150 },
    { id:'a19', icon:'✅', name:'支线达人', cat:'explore', desc:'完成 3 条支线委托', gold:300 },
    { id:'a20', icon:'📜', name:'学业有成', cat:'explore', desc:'完成全部主线任务', gold:1000 }
  ];
  var CAT = {
    battle:{ name:'战斗', icon:'⚔️' }, study:{ name:'学习', icon:'📚' },
    collect:{ name:'收集', icon:'🐾' }, grow:{ name:'成长', icon:'🌱' }, explore:{ name:'探索', icon:'🗺️' }
  };
  var ACH_BY_ID={}; ACH.forEach(function(a){ ACH_BY_ID[a.id]=a; });

  /* 召唤价格：按稀有度 */
  var SUMMON_PRICE = { N:50, R:80, SR:150, SSR:300 };

  var _busy=false;

  function S(){ return E && E.S; }
  function ensure(s){
    if(!s) return null;
    if(!s.codex) s.codex={ pets:{}, mons:{}, ach:{} };
    if(!s.codex.pets) s.codex.pets={};
    if(!s.codex.mons) s.codex.mons={};
    if(!s.codex.ach) s.codex.ach={};
    return s.codex;
  }
  function st(s,k){ return (s.stats && s.stats[k]) || 0; }
  function petCount(c){ var n=0; for(var k in c.pets){ if(c.pets[k] && D.PET_BY_ID[k]) n++; } return n; }
  function monCount(c){ var n=0; for(var k in c.mons){ if(c.mons[k] && D.MON_BY_KEY[k]) n++; } return n; }
  function bossCount(c){ var n=0; for(var k in c.mons){ if(k.charAt(0)==='b' && c.mons[k]) n++; } return n; }
  function maxLv(s){ var m=0; (s.team||[]).forEach(function(p){ if(p.lv>m) m=p.lv; }); return m; }
  function sideDone(s){ var n=0; for(var k in (s.side&&s.side.done||{})){ if(s.side.done[k]) n++; } return n; }
  function questDone(s){ var n=0; for(var k in (s.quests&&s.quests.done||{})){ if(s.quests.done[k]) n++; } return n; }

  /* 成就达成条件 */
  function reached(id, s, c){
    switch(id){
      case 'a01': return st(s,'kills')+st(s,'bosses')>=1;
      case 'a02': return st(s,'kills')>=50;
      case 'a03': return bossCount(c)>=6;
      case 'a04': return !!(c.mons.b06);
      case 'a05': return st(s,'quizOk')>=1;
      case 'a06': return st(s,'quizOk')>=30;
      case 'a07': return st(s,'quizOk')>=100;
      case 'a08': return st(s,'quizOk')>=500;
      case 'a09': return petCount(c)>=5;
      case 'a10': return petCount(c)>=15;
      case 'a11': return petCount(c)>=D.PETS.length;
      case 'a12': return monCount(c)>=10;
      case 'a13': return monCount(c)>=D.MONSTERS.length+D.BOSSES.length;
      case 'a14': return maxLv(s)>=12;
      case 'a15': return maxLv(s)>=30;
      case 'a16': return maxLv(s)>=60;
      case 'a17': return st(s,'chests')>=10;
      case 'a18': return st(s,'steps')>=1000;
      case 'a19': return sideDone(s)>=3;
      case 'a20': return questDone(s)>=D.QUESTS.length;
    }
    return false;
  }

  /* 自动检查（由 engine.save() 调用）。用 E.lsSet 直接落盘，避免递归。 */
  function autoCheck(){
    var s=S(); if(!s) return;
    var c=ensure(s); if(!c || _busy) return;
    _busy=true;
    try{
      var got=[];
      ACH.forEach(function(a){
        if(c.ach[a.id]) return;
        if(reached(a.id,s,c)){
          c.ach[a.id]=Date.now();
          s.gold += a.gold;
          got.push(a);
        }
      });
      if(got.length && E){
        E.lsSet(E.SAVE_KEY, JSON.stringify(s));
        notify(got);
      }
    } finally { _busy=false; }
  }

  function notify(got){
    var delay=0;
    got.forEach(function(a){
      setTimeout(function(){
        if(window.RPG_AUDIO) window.RPG_AUDIO.sfx('levelup');
        if(window.RPG_UI) window.RPG_UI.toast('🏅 成就达成：'+a.name+'  +'+a.gold+' 金币');
      }, delay);
      delay += 1400;
    });
  }

  /* 解锁宠物（初始队伍自动解锁） */
  function unlockPet(id, quiet){
    var s=S(); if(!s) return false;
    var c=ensure(s); if(!c || !D.PET_BY_ID[id]) return false;
    if(c.pets[id]) return false;
    c.pets[id]=1;
    if(E) E.save();
    if(!quiet && window.RPG_UI) window.RPG_UI.toast('🐾 图鉴解锁：'+D.PET_BY_ID[id].name);
    return true;
  }
  function syncTeam(){
    var s=S(); if(!s) return;
    (s.team||[]).forEach(function(p){ unlockPet(p.id, true); });
  }

  /* 记录击败怪兽（Boss 也走这里） */
  function recordMon(key){
    var s=S(); if(!s || !D.MON_BY_KEY[key]) return;
    var c=ensure(s); if(!c) return;
    c.mons[key]=(c.mons[key]||0)+1;
    if(E) E.save();
  }

  /* 花金币召唤未解锁宠物 */
  function summon(id){
    var s=S(); if(!s) return { ok:false, msg:'尚未开始冒险' };
    var p=D.PET_BY_ID[id], c=ensure(s);
    if(!p) return { ok:false, msg:'宠物不存在' };
    if(c.pets[id]) return { ok:false, msg:'已在图鉴中' };
    var price=SUMMON_PRICE[p.rar]||80;
    if(s.gold<price) return { ok:false, msg:'金币不足（需要 '+price+'）' };
    s.gold-=price;
    c.pets[id]=1;
    /* 召唤的宠物进入仓库，可在「切换宠物」界面编入出战队伍 */
    if(E && E.gainPet) E.gainPet(id); else if(E) E.save();
    if(window.RPG_AUDIO) window.RPG_AUDIO.sfx('levelup');
    if(window.RPG_UI){ window.RPG_UI.updateHUD(); window.RPG_UI.toast('✨ 召唤成功：'+p.name+'（可在「切换宠物」编队）'); }
    return { ok:true, msg:'召唤成功' };
  }

  /* 旧存档迁移：从已有统计反推图鉴，避免升级后图鉴空白 */
  function migrateFromStats(){
    var s=S(); if(!s) return;
    var c=ensure(s); if(!c) return;
    var changed=false;
    /* Boss 已击败记录 */
    for(var bk in (s.bossDefeated||{})){
      if(s.bossDefeated[bk] && !c.mons[bk] && D.MON_BY_KEY[bk]){ c.mons[bk]=1; changed=true; }
    }
    /* 当前队伍 */
    (s.team||[]).forEach(function(p){
      if(!c.pets[p.id]){ c.pets[p.id]=1; changed=true; }
    });
    if(changed && E) E.lsSet(E.SAVE_KEY, JSON.stringify(s));
    autoCheck();
  }

  window.RPG_CODEX = {
    ACH:ACH, ACH_BY_ID:ACH_BY_ID, CAT:CAT, SUMMON_PRICE:SUMMON_PRICE,
    ensure:ensure, autoCheck:autoCheck, unlockPet:unlockPet, syncTeam:syncTeam,
    recordMon:recordMon, summon:summon, migrateFromStats:migrateFromStats,
    petCount:function(){ var c=ensure(S()); return c?petCount(c):0; },
    monCount:function(){ var c=ensure(S()); return c?monCount(c):0; },
    achCount:function(){ var c=ensure(S()); if(!c)return 0; var n=0; for(var k in c.ach){ if(c.ach[k]) n++; } return n; },
    isPetUnlocked:function(id){ var c=ensure(S()); return !!(c&&c.pets[id]); },
    isMonDefeated:function(key){ var c=ensure(S()); return !!(c&&c.mons[key]); },
    monKills:function(key){ var c=ensure(S()); return c?(c.mons[key]||0):0; },
    isAchieved:function(id){ var c=ensure(S()); return !!(c&&c.ach[id]); },
    reached:reached
  };
})();
