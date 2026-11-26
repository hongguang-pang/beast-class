/* ============================================================
 * 知识大陆 · 知识远征  —  剧情 / 世界观 / NPC 任务背景
 * 独立命名空间 window.RPG_STORY
 * 提供：章节剧情、NPC 身世与任务背景台词、Boss 剧情、开场/结局
 * 依赖：RPG_DATA / RPG_ENGINE
 * ============================================================ */
'use strict';
(function(){
  var D = window.RPG_DATA;

  /* ---------- 世界观 ---------- */
  var WORLD = {
    name:'知识大陆',
    subtitle:'KNOWN CONTINENT · WISDOM QUEST',
    prologue:'很久以前，知识大陆由「知识圣殿」守护，万物因智慧而繁荣。'+
      '直到有一天，嫉妒智慧的<b>知识魔王</b>释放了「遗忘迷雾」，'+
      '把一个又一个知识点封印成魔物，大陆逐渐失去了知识的光辉。',
    mission:'你是被圣殿选中的「知识勇者」。与宠物缔结契约，<b>用答题唤醒被封印的知识点</b>，'+
      '净化魔物、收复失地，最终击败知识魔王，让知识之光重返大陆。',
    critRule:'每种学科都有自己的属性。当你的宠物属性<b>克制</b>题目学科属性时，答对即可触发<b>暴击</b>！'
  };

  /* ---------- NPC 身世 / 角色背景 ---------- */
  var NPCS = {
    '村长':{
      icon:'👴', title:'圣殿守典人',
      bg:'知识圣殿最后一位守典人，守护着记载大陆命运的知识卷轴。他知道魔王的起源，也在等待能扛起希望的知识勇者。',
      greet:'啊，你来了，孩子。遗忘迷雾越来越浓了……圣殿的卷轴指引着我，等待一位用知识战斗的勇者。',
      bye:'去吧，知识的光，就靠你点亮了。'
    },
    '探险家':{
      icon:'🧭', title:'寻宝旅人',
      bg:'走遍大陆的冒险家，专门寻找被迷雾吞没的失落宝箱。他熟悉每一条小径，也见过许多被封印的魔物。',
      greet:'嘿！又一个勇者？我在这片大陆转了好久，宝箱倒见过不少——说不定能帮你补给。',
      bye:'路上小心，迷雾里的东西可不好惹。'
    },
    '训练师':{
      icon:'🥋', title:'退役驯宠师',
      bg:'曾经最出色的宠物训练师，隐居在村庄边缘。他掌握「属性克制」的秘密——这是答对题目打出暴击的关键。',
      greet:'想让宠物更强？记住：属性克制学科，答对就能暴击。我来帮你训练它们。',
      bye:'用好属性克制，你会打得漂亮。'
    },
    '学者':{
      icon:'📖', title:'迷雾研究员',
      bg:'毕生研究遗忘迷雾的智者，编写了覆盖全年级的「知识点图鉴」。他认为每答对一道题，就是在驱散一片迷雾。',
      greet:'知识点是魔物的弱点！你每答对一题，圣殿的图鉴就会亮起一格。一起把这片大陆照亮吧。',
      bye:'知识，是对抗迷雾唯一的武器。'
    },
    '药剂师':{
      icon:'🧑‍⚕️', title:'炼金药师',
      bg:'经营着村里唯一的补给小店，用大陆上的草药炼制活力药水与能量水晶。她总是默默支持着每一位勇者。',
      greet:'需要补给吗？药水、能量水晶、经验糖果，我都备着——勇者可不能空着肚子去打魔王。',
      bye:'记得常回来补给呀。'
    }
  };

  /* ---------- 主线章节（与 QUESTS 顺序对应） ---------- */
  /* quest: 对应 engine 主线任务 id；scene: 场景台词；clear: 完成后台词 */
  var CHAPTERS = [
    { no:'序章', id:'q1',      title:'苏醒的村庄',     npc:'村长',
      scene:'迷雾蔓延到了村庄边缘。村长交给你第一个任务：击败 3 只被封印的魔物，证明你拥有守护大陆的力量。',
      clear:'做得好！看来圣殿没有看错人。森林深处传来异动——蘑菇王被迷雾侵蚀了。' },
    { no:'第一章', id:'q_boss1', title:'蘑菇森林的异变', npc:'村长',
      scene:'蘑菇森林的蘑菇王本是温顺的守护兽，如今被迷雾控制。去击败它，唤醒它的本心。',
      clear:'蘑菇王清醒了，森林重现绿意。可探险家发现，玩具谷的补给箱也失踪了……' },
    { no:'第二章', id:'q2',      title:'失踪的补给',     npc:'探险家',
      scene:'通往玩具谷的路上散落着失落宝箱。找回 2 个宝箱，补充远征所需的物资。',
      clear:'补给找齐了！但玩具谷深处，一只巨大的玩具霸王龙正被迷雾支配……' },
    { no:'第三章', id:'q_boss2', title:'玩具谷的咆哮', npc:'探险家',
      scene:'玩具霸王龙失控了。用你学到的属性克制，答对题目打出暴击，击败它！',
      clear:'霸王龙恢复了原样。训练师想见你——他说你的宠物，还有更大的潜力。' },
    { no:'第四章', id:'q3',      title:'成长的试炼',     npc:'训练师',
      scene:'把一只宠物训练到 12 级。记住：等级越高，答对题目的伤害越强。',
      clear:'训练得不错！风暴高地上空聚集着浓厚的迷雾，领主就在那里等你。' },
    { no:'第五章', id:'q_boss3', title:'风暴之眼',       npc:'训练师',
      scene:'风暴领主驾驭着狂风。冷静答题，用克制它的属性击溃迷雾的核心。',
      clear:'风暴散去，天空放晴。学者在图鉴里发现了一处被遗忘的知识宝藏……' },
    { no:'第六章', id:'q4',      title:'知识的宝藏',     npc:'学者',
      scene:'累计答对 30 道题，唤醒图鉴中被封印的知识。每答对一题，迷雾就淡去一分。',
      clear:'30 个知识点重新点亮！但熔岩洞窟里，巨兽的咆哮震动了整片大陆。' },
    { no:'第七章', id:'q_boss4', title:'熔岩洞窟',       npc:'学者',
      scene:'深入熔岩洞窟，击败被迷雾吞噬的熔岩巨兽。高温考验着你的判断力。',
      clear:'巨兽倒下了。更北边，冰封之地传来女王的呼唤——那是迷雾最后的屏障。' },
    { no:'第八章', id:'q_boss5', title:'冰封王座',       npc:'村长',
      scene:'冰霜女王守在通往圣殿的必经之路。击败她，通往知识魔王的大门就会开启。',
      clear:'冰层碎裂，圣殿之门缓缓打开。村长把古老的卷轴交到你手中——终章，开始了。' },
    { no:'终章', id:'q_boss6',   title:'知识圣殿',       npc:'村长',
      scene:'知识魔王就在圣殿之巅。它惧怕知识——用你一路学到的全部，答对每一题，打出暴击，守护知识大陆！',
      clear:'魔王溃散，遗忘迷雾退去，知识之光重新照亮整片大陆。你，就是知识大陆的守护者！' }
  ];
  var CH_BY_ID = {}; CHAPTERS.forEach(function(c){ CH_BY_ID[c.id]=c; });

  /* ---------- Boss 剧情 ---------- */
  var BOSS_STORY = {
    b01:'「蘑菇王」曾是森林的守护者，如今被迷雾扭曲了心智。',
    b02:'「玩具霸王龙」是孩子们昔日的伙伴，迷雾把它变成了凶兽。',
    b03:'「风暴领主」聚集着大陆的狂风，只有冷静的知识能让它平息。',
    b04:'「熔岩巨兽」栖息在地心，滚烫的岩浆护着它被封印的知识。',
    b05:'「冰霜女王」守着圣殿最后的屏障，冰冷的外表下是被困的智慧。',
    b06:'「知识魔王」——遗忘迷雾的源头。它最怕的，正是你手中的知识。'
  };

  /* ---------- API ---------- */
  function chapterOfQuest(qid){ return CH_BY_ID[qid] || null; }

  /* NPC 完整任务背景台词：结合当前主线/支线状态 */
  function npcLines(npc, ctx){
    ctx = ctx || {};
    var p = NPCS[npc.name] || { icon:npc.icon||'🧑', title:'居民', bg:'一位大陆的居民。', greet:'你好，勇者。', bye:'祝你好运。' };
    var lines = [];
    lines.push('<b>'+p.icon+' '+esc(npc.name)+' · '+p.title+'</b>');
    lines.push('<span class="story-bg">'+p.bg+'</span>');
    if (ctx.quest){
      var ch = chapterOfQuest(ctx.quest.id);
      lines.push('<span class="story-quest">📜 当前使命：'+esc(ctx.quest.title)+'<br>'+esc(ctx.quest.desc)+'</span>');
      if (ctx.quest.hint) lines.push('<span class="story-guide">💡 怎么完成：'+esc(ctx.quest.hint)+'</span>');
      if (ch) lines.push('<span class="story-scene">'+ch.scene+'</span>');
    } else if (ctx.allDone){
      lines.push('<span class="story-scene">'+WORLD.mission+'</span>');
    }
    lines.push('<span class="story-say">「'+p.greet+'」</span>');
    return lines.join('<br>');
  }
  function greeting(npc){
    var p = NPCS[npc] || null;
    return p ? p.greet : '你好，勇者。';
  }
  function bye(npc){
    var p = NPCS[npc] || null;
    return p ? p.bye : '祝你好运。';
  }
  function bossStory(key){ return BOSS_STORY[key] || ''; }
  function esc(s){ return String(s==null?'':s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];}); }

  window.RPG_STORY = {
    WORLD:WORLD, NPCS:NPCS, CHAPTERS:CHAPTERS, BOSS_STORY:BOSS_STORY,
    chapterOfQuest:chapterOfQuest, npcLines:npcLines, greeting:greeting, bye:bye,
    bossStory:bossStory
  };
})();
