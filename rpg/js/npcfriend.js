/* ============================================================
 * 知识大陆 · NPC 好感互动模块
 * 与 5 位 NPC 闲聊 / 赠礼提升好感 / 好感等级奖励
 * 存档挂在 rpg.save.v1 的 npcFriend 字段，兼容旧档
 * ============================================================ */
'use strict';
(function(){
var E=window.RPG_ENGINE;

/* 好感等级：0未识 1认识 2友好 3亲密 4挚友 */
var LEVELS=[
  { need:0,   name:'陌生', icon:'·' },
  { need:15,  name:'认识', icon:'💛' },
  { need:40,  name:'友好', icon:'💛💛' },
  { need:80,  name:'亲密', icon:'💗💗' },
  { need:140, name:'挚友', icon:'💖💖💖' }
];

/* 每位 NPC：喜好礼物 + 分好感度的闲聊台词（多句随机） */
var NPCS={
  '村长':{
    title:'守典人 · 阿尔文', likes:['candy','antidote'],
    lines:{
      low:['路上的魔物越来越多了，孩子，小心些。','知识圣殿的光辉，终有一天会重现大陆。','我守着村子，也守着这些古籍里的知识。'],
      mid:['你比我想象的还要勇敢，去做该做的事吧。','当年我也曾是冒险者，可惜年纪大了……','记住，答对题目时的专注，就是最强的力量。'],
      high:['孩子，你是这片大陆真正的希望。','我珍藏的一枚古币送你了——别嫌弃。','有你在，知识的光就不会熄灭。']
    },
    giftLike:'嗯！这正合我意，年轻人有心了。',
    giftMeh:'谢谢你的心意，我收下了。'
  },
  '探险家':{
    title:'游历者 · 莓莓', likes:['potion','ether'],
    lines:{
      low:['我走遍了大陆，还没见过像你这么拼的新人。','沙漠绿洲的风景很美，不过小心沙蝎！','地图上没标出来的地方，才是最有趣的。'],
      mid:['下次远征带上我怎么样？我方向感可好了。','风暴高地有宝藏，但那里的怪可不是吃素的。','看见你，我就想起自己第一次出远门。'],
      high:['我们是搭档了！有福同享有难同当！','这份探险日志送你，里面记着不少秘密地点。','有你在，再远的路我也不怕。']
    },
    giftLike:'哇！这正是我需要的补给，太棒啦！',
    giftMeh:'嘿，谢谢啦！下次请你喝沙漠果汁。'
  },
  '训练师':{
    title:'驯宠师 · 洛克', likes:['ether','candy'],
    lines:{
      low:['宠物是你的伙伴，不是工具，要好好待它们。','想变强？那就多答对几道题。','属性克制是关键，用对了宠物能打出暴击。'],
      mid:['你的队伍配合得不错嘛，有进步！','我当年也是靠一群小伙伴打天下的。','战斗不只是蛮力，时机和属性都很重要。'],
      high:['你已经是比我更强的训练师了！','这枚训练徽章送你，它见证了我的青春。','我的宠物们都很喜欢你呢。']
    },
    giftLike:'好东西！拿去强化你的队伍吧，我收下了！',
    giftMeh:'哈，谢啦，练宠可是很费补给的。'
  },
  '学者':{
    title:'博物学者 · 塞拉', likes:['antidote','candy'],
    lines:{
      low:['每道题目背后，都是一个等待被理解的知识点。','知识不是死记硬背，而是理解与运用。','图书馆的典籍里，藏着大陆的过去。'],
      mid:['你最近答对的题目我都有在关注，很不错。','收集的知识点越多，你能解锁的天赋就越强。','科学的魅力在于发现规律，你去森林里找找看。'],
      high:['能教你这样的学生，是我的荣幸。','这本笔记是我毕生所学，现在它是你的了。','去吧，用知识照亮这片大陆。']
    },
    giftLike:'啊，你真细心！这些我正用得上。',
    giftMeh:'谢谢你，心意我收到了。'
  },
  '药剂师':{
    title:'炼金药师 · 莉莉', likes:['antidote','potion'],
    lines:{
      low:['受伤了就来找我，我这里有最好的药剂。','活力药水能回血，能量水晶能回蓝，别弄混了。','炼药可细致了，急不得。'],
      mid:['看你生龙活虎的，我的药没白喝。','下次给你调配更强力的药水，不要钱！','战斗打输了也别灰心，回来补满状态再来。'],
      high:['你是我最好的顾客，也是最好的朋友。','这瓶珍藏药剂送你，关键时刻能救命。','随时欢迎你，我的冒险者朋友。']
    },
    giftLike:'哎呀谢谢！我正好缺这些材料呢！',
    giftMeh:'嘿嘿，谢谢惠顾～下次再来哦。'
  }
};

function S(){ return E && E.S; }
function ensureSave(){
  var s=S(); if(!s) return null;
  if(!s.npcFriend) s.npcFriend={};
  return s;
}
function friend(name){ var s=ensureSave(); return s?(s.npcFriend[name]||0):0; }
function level(name){ var v=friend(name), lv=0; for(var i=0;i<LEVELS.length;i++) if(v>=LEVELS[i].need) lv=i; return lv; }
function addFriend(name, amount){
  var s=ensureSave(); if(!s) return {gain:0,levelUp:false};
  var before=level(name);
  var old=s.npcFriend[name]||0;
  s.npcFriend[name]=Math.min(200, old+amount);
  var after=level(name);
  E.save();
  return { gain:s.npcFriend[name]-old, levelUp:after>before, level:after };
}
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function chatLine(name){
  var info=NPCS[name]; if(!info) return '……';
  var lv=level(name);
  var key = lv>=3 ? 'high' : lv>=1 ? 'mid' : 'low';
  return pick(info.lines[key]);
}
function giftInfo(name){ var info=NPCS[name]; return info?info.likes:[]; }
function giftLine(name, itemId){
  var info=NPCS[name]; if(!info) return '谢谢！';
  return (info.likes.indexOf(itemId)>=0)?info.giftLike:info.giftMeh;
}
function friendBarHTML(name){
  var v=friend(name), lv=level(name), L=LEVELS[lv];
  var nextNeed = lv<LEVELS.length-1 ? LEVELS[lv+1].need : LEVELS[lv].need;
  var curNeed = L.need;
  var pct = lv>=LEVELS.length-1 ? 100 : Math.round((v-curNeed)/(nextNeed-curNeed)*100);
  return '<div class="friend-line"><span>'+L.icon+' '+L.name+'</span>'+
    '<span class="fl-bar"><i style="width:'+Math.max(0,Math.min(100,pct))+'%"></i></span>'+
    '<span>'+v+'/'+nextNeed+'</span></div>';
}

window.RPG_NPCFRIEND={
  LEVELS:LEVELS, NPCS:NPCS,
  friend:friend, level:level, addFriend:addFriend,
  chatLine:chatLine, giftInfo:giftInfo, giftLine:giftLine, friendBarHTML:friendBarHTML
};
})();
