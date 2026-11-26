/* ============================================================
 * 知识大陆 · 知识远征  —  Petdex 动画伙伴模块（私下娱乐，24 只 CC 角色）
 * 独立命名空间 window.RPG_PETDEX
 * 提供：动画精灵 DOM 渲染 / 伙伴乐园页面 / 战斗动画接入
 * ============================================================ */
'use strict';
(function(){
  var BASE='images/petdex/';
  /* 24 只宠物元数据（精灵图 8列×9/11行，每帧 96×104） */
  var PETS=[{"id": "PD00", "slug": "doraemon", "name": "Doraemon", "kind": "character", "file": "p00_doraemon.webp", "cols": 8, "rows": 9, "fw": 96, "fh": 104, "kb": 225, "by": "korkyzer", "cn": "哆啦A梦", "elem": "fire"}, {"id": "PD01", "slug": "boba", "name": "Boba", "kind": "creature", "file": "p01_boba.webp", "cols": 8, "rows": 11, "fw": 96, "fh": 104, "kb": 242, "by": "railly", "cn": "奶茶水獭", "elem": "water"}, {"id": "PD02", "slug": "lulu-capybara-2", "name": "噜噜", "kind": "creature", "file": "p02_lulu-capybara-2.webp", "cols": 8, "rows": 9, "fw": 96, "fh": 104, "kb": 160, "by": "gitcjp", "cn": "噜噜水豚", "elem": "wood"}, {"id": "PD03", "slug": "capvolt", "name": "Pikachu‌", "kind": "creature", "file": "p03_capvolt.webp", "cols": 8, "rows": 9, "fw": 96, "fh": 104, "kb": 239, "by": "zlss g.", "cn": "皮卡丘", "elem": "light"}, {"id": "PD04", "slug": "kirby", "name": "Kirby", "kind": "character", "file": "p04_kirby.webp", "cols": 8, "rows": 9, "fw": 96, "fh": 104, "kb": 154, "by": "Bao Chi P.", "cn": "卡比", "elem": "dark"}, {"id": "PD05", "slug": "chiikawa", "name": "Chiikawa", "kind": "character", "file": "p05_chiikawa.webp", "cols": 8, "rows": 9, "fw": 96, "fh": 104, "kb": 182, "by": "rui l.", "cn": "吉伊卡哇", "elem": "fire"}, {"id": "PD06", "slug": "totoro", "name": "Totoro", "kind": "creature", "file": "p06_totoro.webp", "cols": 8, "rows": 9, "fw": 96, "fh": 104, "kb": 203, "by": "vincentngo", "cn": "龙猫", "elem": "water"}, {"id": "PD07", "slug": "edogawa-conan", "name": "Edogawa Conan", "kind": "character", "file": "p07_edogawa-conan.webp", "cols": 8, "rows": 11, "fw": 96, "fh": 104, "kb": 242, "by": "brown", "cn": "柯南", "elem": "wood"}, {"id": "PD08", "slug": "hatsune-miku", "name": "Hatsune Miku", "kind": "character", "file": "p08_hatsune-miku.webp", "cols": 8, "rows": 9, "fw": 96, "fh": 104, "kb": 244, "by": "gway0521", "cn": "初音未来", "elem": "light"}, {"id": "PD09", "slug": "classic-qq-penguin", "name": "经典 QQ 企鹅", "kind": "creature", "file": "p09_classic-qq-penguin.webp", "cols": 8, "rows": 11, "fw": 96, "fh": 104, "kb": 234, "by": "志鸿 刘.", "cn": "QQ企鹅", "elem": "dark"}, {"id": "PD10", "slug": "shiba-4", "name": "Shiba", "kind": "creature", "file": "p10_shiba-4.webp", "cols": 8, "rows": 9, "fw": 96, "fh": 104, "kb": 236, "by": "franksong2702", "cn": "柴犬", "elem": "fire"}, {"id": "PD11", "slug": "milkfrog", "name": "奶蛙（naiwa）", "kind": "creature", "file": "p11_milkfrog.webp", "cols": 8, "rows": 9, "fw": 96, "fh": 104, "kb": 185, "by": "quantai1314", "cn": "奶蛙", "elem": "water"}, {"id": "PD12", "slug": "yueya-moon-fox", "name": "月芽 · Moon Fox", "kind": "creature", "file": "p12_yueya-moon-fox.webp", "cols": 8, "rows": 9, "fw": 96, "fh": 104, "kb": 131, "by": "Yux Y.", "cn": "月芽狐", "elem": "wood"}, {"id": "PD13", "slug": "glaucira-blue-dragon", "name": "Glaucira", "kind": "creature", "file": "p13_glaucira-blue-dragon.webp", "cols": 8, "rows": 11, "fw": 96, "fh": 104, "kb": 307, "by": "Reazent Z.", "cn": "蓝龙琪拉", "elem": "light"}, {"id": "PD14", "slug": "glitchcat", "name": "Glitchcat", "kind": "creature", "file": "p14_glitchcat.webp", "cols": 8, "rows": 9, "fw": 96, "fh": 104, "kb": 175, "by": "wangm23456", "cn": "故障猫", "elem": "dark"}, {"id": "PD15", "slug": "roubao", "name": "肉包", "kind": "creature", "file": "p15_roubao.webp", "cols": 8, "rows": 11, "fw": 96, "fh": 104, "kb": 202, "by": "happy y.", "cn": "肉包", "elem": "fire"}, {"id": "PD16", "slug": "maotuan", "name": "毛团", "kind": "creature", "file": "p16_maotuan.webp", "cols": 8, "rows": 9, "fw": 96, "fh": 104, "kb": 213, "by": "世华 唐.", "cn": "毛团", "elem": "water"}, {"id": "PD17", "slug": "daidai-bird-3", "name": "呆呆鸟", "kind": "creature", "file": "p17_daidai-bird-3.webp", "cols": 8, "rows": 9, "fw": 96, "fh": 104, "kb": 139, "by": "2230035325", "cn": "呆呆鸟", "elem": "wood"}, {"id": "PD18", "slug": "mo-tuan-tuan", "name": "墨团团", "kind": "creature", "file": "p18_mo-tuan-tuan.webp", "cols": 8, "rows": 9, "fw": 96, "fh": 104, "kb": 192, "by": "hui min T.", "cn": "墨团团", "elem": "light"}, {"id": "PD19", "slug": "naiwa-2", "name": "奶蛙", "kind": "creature", "file": "p19_naiwa-2.webp", "cols": 8, "rows": 11, "fw": 96, "fh": 104, "kb": 188, "by": "sandytruant", "cn": "奶蛙仔", "elem": "dark"}, {"id": "PD20", "slug": "biscuit", "name": "Biscuit", "kind": "creature", "file": "p20_biscuit.webp", "cols": 8, "rows": 9, "fw": 96, "fh": 104, "kb": 140, "by": "jiaao w.", "cn": "饼干猫", "elem": "fire"}, {"id": "PD21", "slug": "bytechomp-v2", "name": "Bytechomp v2", "kind": "creature", "file": "p21_bytechomp-v2.webp", "cols": 8, "rows": 9, "fw": 96, "fh": 104, "kb": 223, "by": "Carson K.", "cn": "小蓝鲨", "elem": "water"}, {"id": "PD22", "slug": "jinluan", "name": "锦鸾", "kind": "creature", "file": "p22_jinluan.webp", "cols": 8, "rows": 11, "fw": 96, "fh": 104, "kb": 245, "by": "相垠 郭.", "cn": "锦鸾", "elem": "wood"}, {"id": "PD23", "slug": "silver-byte", "name": "Silver Byte", "kind": "creature", "file": "p23_silver-byte.webp", "cols": 8, "rows": 9, "fw": 96, "fh": 104, "kb": 223, "by": "y17666", "cn": "银月byte", "elem": "light"}];
  var BY_ID={}; PETS.forEach(function(p){ BY_ID[p.id]=p; });
  /* 官方 9 状态 -> 精灵图行号 */
  var STATES=[["idle", 0, "😌待机"], ["runR", 1, "🏃右跑"], ["runL", 2, "🏃左跑"], ["wave", 3, "👋挥手"], ["jump", 4, "🦘跳跃"], ["failed", 5, "😢沮丧"], ["wait", 6, "⏳等待"], ["run", 7, "🏃奔跑"], ["review", 8, "🔍观察"]];
  var STATE_ROW={}; STATES.forEach(function(s){ STATE_ROW[s[0]]=s[1]; });

  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function byId(id){ return BY_ID[id]||null; }
  function isPD(id){ return !!BY_ID[id]; }

  /* 生成一段 CSS steps 精灵动画（返回一个 div 的 innerHTML + style） */
  function spriteStyle(p, row, scale, fps){
    scale=scale||1; fps=fps||8;
    var w=p.fw*scale, h=p.fh*scale;
    var bw=p.cols*p.fw*scale, bh=p.rows*p.fh*scale;
    var dur=(8/fps).toFixed(2);
    return 'width:'+w+'px;height:'+h+'px;'+
      'background-image:url('+BASE+p.file+');'+
      'background-size:'+bw+'px '+bh+'px;'+
      'background-repeat:no-repeat;'+
      'background-position:0px '+(-row*p.fh*scale)+'px;'+
      'image-rendering:pixelated;'+
      'animation:pd_'+p.id+'_'+row+' '+dur+'s steps(7) infinite;';
  }
  /* 百分比自适应精灵样式：精灵按容器 contain 缩放，与静态 PNG(object-fit:contain)
   * 视觉尺寸一致，解决各界面大小/样式不统一的问题。容器需为正方形且给定宽高。 */
  function fluidSpriteStyle(p, row, fps, noSize){
    fps=fps||8;
    var dur=(8/fps).toFixed(2);
    var py = p.rows>1 ? (row/(p.rows-1)*100).toFixed(3) : 0;
    return (noSize?'':'width:100%;height:100%;')+
      'background-image:url('+BASE+p.file+');'+
      'background-size:'+p.cols*100+'% '+p.rows*100+'%;'+
      'background-repeat:no-repeat;'+
      'background-position:0% '+py+'%;'+
      'animation:pdf_'+p.id+'_'+row+' '+dur+'s steps(7) infinite;';
  }
  /* v6.2.1：静态精灵样式——固定第一帧、无 animation。
   * 用于 HUD 队伍栏/图鉴/编队等"小图标"场景，消除持续闪动（steps infinite）。
   * 与 fluidSpriteStyle 只差一行 animation，视觉尺寸/缩放完全一致。 */
  function stillSpriteStyle(p, row, noSize){
    var py = p.rows>1 ? (((row||0)/(p.rows-1))*100).toFixed(3) : 0;
    return (noSize?'':'width:100%;height:100%;')+
      'background-image:url('+BASE+p.file+');'+
      'background-size:'+p.cols*100+'% '+p.rows*100+'%;'+
      'background-repeat:no-repeat;'+
      'background-position:0% '+py+'%;'+
      'animation:none;';
  }
  /* 注入所有 @keyframes（一次性）：像素版 + 百分比自适应版 */
  function injectKeyframes(){
    if(document.getElementById('pd-kf')) return;
    var css='';
    PETS.forEach(function(p){
      STATES.forEach(function(s){
        var row=s[1], dy=-row*p.fh;
        css+='@keyframes pd_'+p.id+'_'+row+'{from{background-position:0px '+dy+'px}to{background-position:'+(-7*p.fw)+'px '+dy+'px}}';
        var py = p.rows>1 ? (row/(p.rows-1)*100).toFixed(3) : 0;
        css+='@keyframes pdf_'+p.id+'_'+row+'{from{background-position:0% '+py+'%}to{background-position:100% '+py+'%}}';
      });
    });
    var st=document.createElement('style'); st.id='pd-kf'; st.textContent=css;
    document.head.appendChild(st);
  }

  /* 创建一个动画精灵 DOM 元素 */
  function makeSprite(pdId, state, scale){
    var p=byId(pdId); if(!p) return null;
    injectKeyframes();
    var row=STATE_ROW[state]!=null?STATE_ROW[state]:0;
    var el=document.createElement('div');
    el.className='pd-sprite';
    el.setAttribute('data-pd',pdId);
    el.setAttribute('data-state',state||'idle');
    el.style.cssText=spriteStyle(p,row,scale||1,8);
    return el;
  }

  /* 伙伴乐园：渲染某只宠物的动画卡（HTML 字符串，供 innerHTML 使用） */
  function cardHTML(p, state, scale){
    var row=STATE_ROW[state]!=null?STATE_ROW[state]:0;
    return '<div class="pd-card" data-pd="'+p.id+'">'+
      '<div class="pd-stage" data-row="'+row+'">'+
        '<div class="pd-sprite" style="'+spriteStyle(p,row,scale||1.6,8)+'"></div>'+
      '</div>'+
      '<div class="pd-name">'+esc(p.cn)+'</div>'+
      '<div class="pd-slug">No.'+p.id.slice(2)+' · '+esc(p.name)+'</div>'+
    '</div>';
  }

  /* 切换某个精灵元素的状态行 */
  function setSpriteState(el, pdId, state){
    var p=byId(pdId); if(!p||!el) return;
    injectKeyframes();
    var row=STATE_ROW[state]!=null?STATE_ROW[state]:0;
    var sp=el.querySelector('.pd-sprite')||el;
    var py = p.rows>1 ? (row/(p.rows-1)*100).toFixed(3) : 0;
    if (sp.classList && sp.classList.contains('pd-fluid')){
      /* 仅刷新动画相关属性，不覆盖 width/height/left/top/transform（战斗槽位定位） */
      sp.style.backgroundImage='url('+BASE+p.file+')';
      sp.style.backgroundSize=p.cols*100+'% '+p.rows*100+'%';
      sp.style.backgroundPosition='0% '+py+'%';
      sp.style.animation='pdf_'+p.id+'_'+row+' 1s steps(7) infinite';
    } else {
      sp.style.cssText=spriteStyle(p,row,parseFloat(el.getAttribute('data-scale'))||1.6,8);
    }
    el.setAttribute('data-state',state);
  }

  /* v6.1：把精灵图 idle 首帧烘焙成静态 PNG dataURL。
   * 战斗/卡片等"不想要动画"的场景直接用它当 <img>，彻底消除 steps 循环闪动。
   * 同步返回缓存；首次调用触发异步烘焙，完成后派发 pdstillready 事件供界面重绘。 */
  var stillCache={}, stillPending={};
  function stillFrame(pdId){
    if (stillCache[pdId]) return stillCache[pdId];
    var p=byId(pdId); if(!p) return null;
    if (!stillPending[pdId]){
      stillPending[pdId]=true;
      var img=new Image();
      img.onload=function(){
        try{
          var cv=document.createElement('canvas');
          cv.width=p.fw; cv.height=p.fh;
          var cx=cv.getContext('2d');
          cx.imageSmoothingEnabled=false;
          cx.drawImage(img,0,0,p.fw,p.fh,0,0,p.fw,p.fh);
          stillCache[pdId]=cv.toDataURL('image/png');
          if (window.dispatchEvent) window.dispatchEvent(new CustomEvent('pdstillready',{detail:{id:pdId}}));
        }catch(e){}
      };
      img.src=BASE+p.file;
    }
    return null;
  }

  window.RPG_PETDEX={
    PETS:PETS, BY_ID:BY_ID, STATES:STATES, STATE_ROW:STATE_ROW,
    byId:byId, isPD:isPD, makeSprite:makeSprite, cardHTML:cardHTML,
    spriteStyle:spriteStyle, fluidSpriteStyle:fluidSpriteStyle, stillSpriteStyle:stillSpriteStyle,
    setSpriteState:setSpriteState, stillFrame:stillFrame, injectKeyframes:injectKeyframes,
    BASE:BASE
  };
})();
