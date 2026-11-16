/* ============================================================
 * 《知识大陆 · 宠物远征》核心逻辑
 * 状态机：select → battle → levelClear → (boss) → victory / defeat → again
 * 零外部依赖。Canvas 画演出粒子，DOM 画血条/题卡。
 * ============================================================ */
'use strict';
const $ = id => document.getElementById(id);
const clamp = (v,a,b) => v<a?a:v>b?b:v;
const rand = n => Math.floor(Math.random()*n);
const QS = window.BATTLE_Q, PETS = window.BATTLE_PETS;
const RAR_BONUS = window.RAR_BONUS, RAR_COLOR = window.RAR_COLOR;

/* ---------- 关卡 ---------- */
const LEVELS = [
  { name:'石板路', enemy:'题块怪',   emoji:'🧱', hp:60,  maxLevel:1, boss:false },
  { name:'雾林',   enemy:'雾侍从',   emoji:'🌫️', hp:80,  maxLevel:2, boss:false },
  { name:'问答桥', enemy:'守桥者',   emoji:'🦉', hp:100, maxLevel:2, boss:false },
  { name:'书山王座', enemy:'知识魔王', emoji:'📚', hp:160, maxLevel:3, boss:true }
];

/* ---------- 全局状态 ---------- */
const G = {
  state:'select',        // select | battle | anim | levelClear | defeat | result
  level:0, playerHp:100, enemyHp:60, enemyMax:60,
  combo:0, maxCombo:0, correctCount:0, wrongCount:0, questionNo:0,
  pet:null, usedIds:[], wrongPool:[], notes:2, usedThisQ:[],
  bossPhase:0, startTime:0, lock:false
};

/* ---------- Canvas 演出 ---------- */
const fx = $('fx'), ctx = fx.getContext('2d');
let FW=390, FH=844, DPR=1;
function resize(){
  FW = $('stage').clientWidth; FH = $('stage').clientHeight;
  DPR = Math.min(2, window.devicePixelRatio||1);
  fx.width = FW*DPR; fx.height = FH*DPR;
  ctx.setTransform(DPR,0,0,DPR,0,0);
}
window.addEventListener('resize', resize);
let particles = [], flashes = [];
function burst(x,y,color,n=18){
  for(let i=0;i<n;i++){
    const a=Math.random()*Math.PI*2, s=2+Math.random()*5;
    particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-1,life:1,color,r:2+Math.random()*4});
  }
}
function pages(x,y,n=14){
  for(let i=0;i<n;i++){
    particles.push({x,y,vx:(Math.random()-.5)*6,vy:-2-Math.random()*4,life:1.4,
      color:i%2?'#fff3cf':'#ffe08a',r:3+Math.random()*5,page:true,rot:Math.random()*6,vr:(Math.random()-.5)*.3});
  }
}
function flash(color='rgba(255,220,140,.5)'){ flashes.push({a:1,color}); }
function bigVerdict(text,good){
  const d=document.createElement('div');
  d.className='verdict '+(good?'v-good':'v-bad'); d.textContent=text;
  const s=$('stage').getBoundingClientRect();
  d.style.left='0'; d.style.top=(s.height*0.36)+'px';
  $('stage').appendChild(d);
  setTimeout(()=>d.remove(),1100);
}
function drawFx(dt){
  ctx.clearRect(0,0,FW,FH);
  for(const f of flashes){ f.a-=dt*2.4; if(f.a>0){ ctx.fillStyle=f.color; ctx.globalAlpha=f.a; ctx.fillRect(0,0,FW,FH);} ctx.globalAlpha=1; }
  flashes=flashes.filter(f=>f.a>0);
  for(const p of particles){
    p.x+=p.vx; p.y+=p.vy; p.vy+=0.12; p.life-=dt*1.1;
    if(p.life<=0) continue;
    ctx.globalAlpha=Math.max(0,p.life); ctx.fillStyle=p.color;
    if(p.page){ ctx.save(); ctx.translate(p.x,p.y); p.rot+=p.vr; ctx.rotate(p.rot); ctx.fillRect(-p.r,-p.r*.7,p.r*2,p.r*1.4); ctx.restore(); }
    else { ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,7); ctx.fill(); }
  }
  ctx.globalAlpha=1;
  particles=particles.filter(p=>p.life>0);
}
let lastT=performance.now();
function loop(t){
  const dt=Math.min(.05,(t-lastT)/1000); lastT=t;
  drawFx(dt);
  requestAnimationFrame(loop);
}

/* ================= 选宠 ================= */
function renderSelect(){
  const grid=$('petGrid'); grid.innerHTML='';
  PETS.forEach(p=>{
    const card=document.createElement('div');
    card.className='pet-card'+(G.pet&&G.pet.id===p.id?' sel':'');
    card.dataset.id=p.id;
    card.innerHTML=`<div class="pemoji">${p.emoji}</div>
      <div class="pname">${p.name}</div>
      <div class="prar" style="background:${RAR_COLOR[p.rar]}22;color:${RAR_COLOR[p.rar]};border:1px solid ${RAR_COLOR[p.rar]}">${p.rar}</div>
      <div class="pskill">技能 · ${p.skill}</div>`;
    card.addEventListener('click',()=>{
      G.pet=p;
      [...grid.children].forEach(c=>c.classList.toggle('sel',c.dataset.id===p.id));
      const btn=$('startBtn'); btn.disabled=false; btn.textContent=`带 ${p.name} 出发！`;
    });
    grid.appendChild(card);
  });
}

/* ================= 出题 ================= */
function pickQuestion(){
  const cfg=LEVELS[G.level];
  let pool=QS.filter(q=>q.level<=cfg.maxLevel && !G.usedIds.includes(q.id));
  // 错题回流（原著规矩#11）：30% 概率把错题重新混入
  if(G.wrongPool.length && Math.random()<0.3){
    const wid=G.wrongPool[rand(G.wrongPool.length)];
    const wq=QS.find(q=>q.id===wid);
    if(wq) pool=[wq, ...pool.filter(q=>q.id!==wid)];
  }
  if(!pool.length){ G.usedIds=[]; pool=QS.filter(q=>q.level<=cfg.maxLevel); }
  const q=pool[rand(pool.length)];
  G.usedIds.push(q.id);
  // 生成选项（打乱），记录正确项新下标
  const order=[0,1,2,3].sort(()=>Math.random()-.5);
  const opts=order.map(i=>q.options[i]);
  const answer=order.indexOf(q.a);
  G.currentQ=q; G.currentOpts=opts; G.currentAnswer=answer;
  G.usedThisQ=[];
  G.questionNo++;
  return q;
}
function renderQuestion(){
  const q=G.currentQ, cfg=LEVELS[G.level];
  $('qSubj').textContent=`${q.icon} ${q.subj}`;
  $('qProgress').textContent=`第 ${G.questionNo} 题 · ${cfg.name}`;
  $('qText').textContent=q.q;
  const box=$('qOptions'); box.innerHTML='';
  G.currentOpts.forEach((txt,i)=>{
    const b=document.createElement('button');
    b.className='opt'; b.textContent=txt; b.dataset.i=i;
    b.addEventListener('click',()=>answerQuestion(i,b));
    box.appendChild(b);
  });
  updateNoteBtn();
}
function updateNoteBtn(){
  const b=$('noteBtn');
  b.textContent=`📓 米娅的笔记（去掉一个错项） ×${G.notes}`;
  b.disabled=G.notes<=0 || G.usedThisQ.includes(G.currentAnswer)===false && G.notes<=0;
  b.disabled = G.notes<=0;
}

/* ================= HUD 更新 ================= */
function updateHUD(){
  const cfg=LEVELS[G.level];
  $('chapter').textContent=`第 ${G.level+1} 关 · ${cfg.name}`;
  $('enemyName').textContent=cfg.enemy+(cfg.boss?` · 第${G.bossPhase+1}阶`:'');
  $('enemyEmoji').textContent=cfg.emoji;
  $('notes').textContent=`📓 ×${G.notes}`;
  // 血条
  const ep=clamp(G.enemyHp/G.enemyMax*100,0,100);
  $('enemyHpFill').style.width=ep+'%';
  $('enemyHpTxt').textContent=`${Math.max(0,Math.ceil(G.enemyHp))}/${G.enemyMax}`;
  const pp=clamp(G.playerHp/100*100,0,100);
  $('playerHpFill').style.width=pp+'%';
  $('playerHpTxt').textContent=`${Math.max(0,Math.ceil(G.playerHp))}/100`;
  $('playerName').innerHTML=`${G.pet.name} <small style="background:${RAR_COLOR[G.pet.rar]}22;color:${RAR_COLOR[G.pet.rar]}">${G.pet.rar}</small>`;
  $('playerEmoji').textContent=G.pet.emoji;
  // 连击
  const cb=$('combo');
  if(G.combo>=2){ cb.classList.remove('hidden'); $('comboNum').textContent=G.combo;
    cb.style.color=G.combo>=5?'#ff7a4d':G.combo>=3?'#f5b301':'#fff'; }
  else cb.classList.add('hidden');
  // Boss 阶段提示
  const bp=$('bossPhase');
  if(cfg.boss){ bp.classList.remove('hidden'); bp.textContent=`第 ${G.bossPhase+1} / 3 阶段`; }
  else bp.classList.add('hidden');
}

/* ================= 裁决 ================= */
function floatDmg(text,good,nearEnemy=true){
  const d=document.createElement('div');
  d.className='dmg '+(good?'good':'bad'); d.textContent=text;
  const r=(nearEnemy?$('enemyEmoji'):$('playerEmoji')).getBoundingClientRect();
  const s=$('stage').getBoundingClientRect();
  d.style.left=(r.left-s.left+r.width/2-20)+'px';
  d.style.top=(r.top-s.top+10)+'px';
  $('stage').appendChild(d);
  setTimeout(()=>d.remove(),1000);
}
function answerQuestion(i,btn){
  if(G.lock || G.state!=='battle') return;
  G.lock=true;
  const correct = i===G.currentAnswer;
  const opts=[...$('qOptions').children];
  // 标记答案
  opts.forEach((b,idx)=>{ b.style.pointerEvents='none'; if(idx===G.currentAnswer) b.classList.add('right'); });
  const cfg=LEVELS[G.level];
  if(correct){
    G.combo++; G.maxCombo=Math.max(G.maxCombo,G.combo); G.correctCount++;
    const bonus=RAR_BONUS[G.pet.rar]||0;
    const mult=1+0.25*Math.min(G.combo-1,4);
    const dmg=Math.round((25+bonus)*mult);
    bigVerdict(G.combo>=3?`连击 ×${G.combo}！漂亮！`:'命中！', true);
    $('battleLog').textContent=`${G.pet.skill}！连击 ×${G.combo}，造成 ${dmg} 点伤害！`;
    enemyCast(dmg);
  }else{
    btn.classList.add('wrong');
    G.combo=0; G.wrongCount++;
    G.wrongPool.push(G.currentQ.id);
    const dmg=12;
    G.playerHp=clamp(G.playerHp-dmg,0,100);
    G.enemyHp=clamp(G.enemyHp+(cfg.boss?12:8),0,G.enemyMax);
    bigVerdict('再想想～', false);
    $('battleLog').textContent='再想想～ 这次没打中，宠物鼓励你继续！';
    enemyAttack(dmg);
  }
  updateHUD();
}
function enemyCast(dmg){
  const pe=$('playerEmoji'); pe.classList.remove('cast'); void pe.offsetWidth; pe.classList.add('cast');
  setTimeout(()=>{
    G.enemyHp=clamp(G.enemyHp-dmg,0,G.enemyMax);
    const ee=$('enemyEmoji'); ee.classList.remove('hit'); void ee.offsetWidth; ee.classList.add('hit');
    const r=ee.getBoundingClientRect(); const s=$('stage').getBoundingClientRect();
    burst(r.left-s.left+r.width/2, r.top-s.top+r.height/2, '#ffd23f', 20);
    floatDmg('-'+dmg,true,true); flash('rgba(255,220,140,.35)');
    updateHUD();
    afterHit();
  },320);
}
function enemyAttack(dmg){
  setTimeout(()=>{
    const ee=$('enemyEmoji'); ee.classList.remove('grow'); void ee.offsetWidth; ee.classList.add('grow');
    const pe=$('playerEmoji'); pe.classList.remove('hurt'); void pe.offsetWidth; pe.classList.add('hurt');
    const r=pe.getBoundingClientRect(); const s=$('stage').getBoundingClientRect();
    burst(r.left-s.left+r.width/2, r.top-s.top+r.height/2, '#ff8fa8', 12);
    floatDmg('-'+dmg,false,false);
    updateHUD();
    afterHit();
  },280);
}
function afterHit(){
  const cfg=LEVELS[G.level];
  if(G.enemyHp<=0){
    // Boss 阶段推进
    if(cfg.boss && G.bossPhase<2){
      G.bossPhase++;
      G.enemyMax=cfg.hp; G.enemyHp=Math.round(cfg.hp*(1-G.bossPhase/3));
      pages(FW/2,FH*0.35,16); flash('rgba(255,230,160,.6)');
      $('battleLog').textContent=['','题目在变少，它也变小了！','就快成功了，再来！'][G.bossPhase];
      updateHUD(); G.lock=false; nextQuestion(); return;
    }
    // 过关
    pages(FW/2,FH*0.35,22); flash('rgba(255,230,160,.7)');
    G.state='levelClear';
    $('clearTitle').textContent=cfg.boss?'知识魔王散成书页了！':'过关！';
    $('clearSub').textContent=cfg.boss?'“你们真的学会了。”':'敌人碎成了书页';
    setTimeout(()=>$('levelClear').classList.remove('hidden'),450);
    return;
  }
  if(G.playerHp<=0){
    G.state='defeat';
    setTimeout(()=>$('defeat').classList.remove('hidden'),400);
    return;
  }
  G.lock=false;
  setTimeout(()=>{ if(G.state==='battle' && !G.lock) nextQuestion(); }, 520);
}
function nextQuestion(){ pickQuestion(); renderQuestion(); }

/* ================= 流程控制 ================= */
function startGame(){
  if(!G.pet) return;
  G.state='battle'; G.level=0; G.playerHp=100; G.combo=0; G.maxCombo=0;
  G.correctCount=0; G.wrongCount=0; G.questionNo=0; G.usedIds=[]; G.wrongPool=[];
  G.notes=2; G.bossPhase=0; G.startTime=performance.now(); G.lock=false;
  particles=[]; flashes=[];
  $('selectView').classList.add('hidden');
  $('resultView').classList.add('hidden');
  $('defeat').classList.add('hidden');
  $('levelClear').classList.add('hidden');
  $('battleView').classList.remove('hidden');
  const cfg=LEVELS[0]; G.enemyMax=cfg.hp; G.enemyHp=cfg.hp;
  updateHUD(); nextQuestion();
  $('battleLog').textContent='选正确答案，让宠物出招！';
}
function goNextLevel(){
  $('levelClear').classList.add('hidden');
  G.level++;
  if(G.level>=LEVELS.length){ showResult(); return; }
  const cfg=LEVELS[G.level];
  G.enemyMax=cfg.hp; G.enemyHp=cfg.hp; G.bossPhase=0; G.combo=0;
  G.playerHp=clamp(G.playerHp+20,0,100);   // 过关回复 20
  G.state='battle'; G.lock=false;
  updateHUD(); nextQuestion();
  $('battleLog').textContent=cfg.boss?'最终关：知识魔王！答对削块，答错它会长大。':'新的一关，继续！';
}
function showResult(){
  G.state='result';
  $('battleView').classList.add('hidden');
  $('resultView').classList.remove('hidden');
  const sec=Math.max(0,Math.round((performance.now()-G.startTime)/1000));
  const acc=G.correctCount+G.wrongCount ? Math.round(G.correctCount/(G.correctCount+G.wrongCount)*100) : 0;
  $('resStats').innerHTML=`
    用时 <b>${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}</b><br>
    答对 <b>${G.correctCount}</b> 题 · 答错 ${G.wrongCount} 题<br>
    正确率 <b>${acc}%</b> · 最高连击 <b>${G.maxCombo}</b><br>
    出战宠物 ${G.pet.emoji} ${G.pet.name}`;
  if(G.wrongPool.length){
    const uniq=[...new Set(G.wrongPool)];
    $('resWrong').innerHTML='<h3>这些题目值得再看一眼（它们会回来找你）：</h3>'+
      uniq.slice(0,6).map(id=>{const q=QS.find(x=>x.id===id);return q?'· '+q.q:'';}).join('<br>');
  } else $('resWrong').innerHTML='';
}
function retry(){
  $('defeat').classList.add('hidden');
  startGame();
}
function again(){
  $('resultView').classList.add('hidden');
  G.pet=null;
  $('startBtn').disabled=true; $('startBtn').textContent='选择宠物后出发';
  G.state='select';
  $('selectView').classList.remove('hidden');
  renderSelect();
}
function useNote(){
  if(G.state!=='battle'||G.lock||G.notes<=0) return;
  const wrongIdx=[];
  G.currentOpts.forEach((_,i)=>{ if(i!==G.currentAnswer && !G.usedThisQ.includes(i)) wrongIdx.push(i); });
  if(!wrongIdx.length) return;
  const pick=wrongIdx[rand(wrongIdx.length)];
  G.usedThisQ.push(pick); G.notes--;
  const b=$('qOptions').children[pick]; if(b) b.classList.add('removed');
  $('battleLog').textContent='米娅帮你划掉了一个错误答案！';
  updateNoteBtn(); updateHUD();
}

/* ================= 事件绑定 ================= */
$('startBtn').addEventListener('click',startGame);
$('nextBtn').addEventListener('click',goNextLevel);
$('retryBtn').addEventListener('click',retry);
$('againBtn').addEventListener('click',again);
$('noteBtn').addEventListener('click',useNote);

/* ================= 调试接口（QA） ================= */
window.__battle = {
  get state(){ return G.state; },
  get hp(){ return G.playerHp; },
  get enemyHp(){ return G.enemyHp; },
  get combo(){ return G.combo; },
  get level(){ return G.level; },
  get correctCount(){ return G.correctCount; },
  get question(){ return G.currentQ ? G.currentQ.id : null; },
  get answer(){ return G.currentAnswer; },
  selectPet(id){ const p=PETS.find(x=>x.id===id); if(p){G.pet=p; return true;} return false; },
  answer(i){ answerQuestion(i, $('qOptions').children[i]); },
  correct(){ answerQuestion(G.currentAnswer, $('qOptions').children[G.currentAnswer]); },
  wrong(){ const i=[0,1,2,3].find(x=>x!==G.currentAnswer); answerQuestion(i, $('qOptions').children[i]); },
  next(){ goNextLevel(); },
  restart(){ startGame(); },
  get petName(){ return G.pet?G.pet.name:null; }
};

/* ================= 启动 ================= */
function boot(){ resize(); renderSelect(); requestAnimationFrame(loop); }
boot();
