/* 精灵大陆 · 知识远征 离线缓存（scope=/rpg/，与主站/诊断站隔离） */
const VERSION = 'rpg-v1.7.0';
const SHELL = [
  './','./index.html','./style.css?v=7','./manifest.webmanifest',
  './icons/icon-192.png','./icons/icon-512.png','./icons/icon-192-maskable.png','./icons/icon-512-maskable.png',
  './images/pets/P001-baby.png','./images/pets/P011-baby.png','./images/pets/P027-baby.png','./images/pets/P035-baby.png',
  './images/pets/P042-baby.png','./images/pets/P051-baby.png','./images/pets/D201-baby.png','./images/pets/D203-baby.png',
  './images/pets/D207-baby.png','./images/pets/D209-baby.png',
  './data/knowledge.js?v=7','./data/kg/g1.js?v=7','./data/kg/g2.js?v=7','./data/kg/g3.js?v=7',
  './data/kg/g4.js?v=7','./data/kg/g5.js?v=7','./data/kg/g6.js?v=7','./data/kg/g7.js?v=7',
  './data/kg/g8.js?v=7','./data/kg/g9.js?v=7','./data/kg/g10.js?v=7','./data/kg/g11.js?v=7','./data/kg/g12.js?v=7',
  './js/data.js?v=7','./js/audio.js?v=7','./js/engine.js?v=7','./js/campaign.js?v=7','./js/world.js?v=7','./js/battle.js?v=7','./js/ui.js?v=7','./js/main.js?v=7',
  './images/npc/player-hero.png','./images/npc/npc-chief.png','./images/npc/npc-explorer.png','./images/npc/npc-trainer.png','./images/npc/npc-scholar.png','./images/npc/npc-pharmacist.png',
  './images/mon/e11-fire-spirit.png','./images/mon/e12-moss-golem.png','./images/mon/e13-water-slime.png','./images/mon/e14-shadow-bat.png','./images/mon/e15-star-sprite.png','./images/mon/e16-crystal-golem.png'
];
self.addEventListener('install',(e)=>{
  e.waitUntil(caches.open(VERSION).then((c)=>c.addAll(SHELL).catch(()=>{})).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',(e)=>{
  e.waitUntil(caches.keys().then((keys)=>Promise.all(keys.filter((k)=>k!==VERSION&&k.indexOf('rpg-')===0).map((k)=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',(e)=>{
  const req=e.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin)return;
  /* 图片走缓存优先（素材大且不变） */
  if(url.pathname.indexOf('/images/')>=0){
    e.respondWith(caches.open(VERSION).then((c)=>c.match(req).then((hit)=>hit||fetch(req).then((res)=>{c.put(req,res.clone());return res;}).catch(()=>hit))));
    return;
  }
  /* 其余：网络优先，失败回缓存 */
  e.respondWith(fetch(req).then((res)=>{
    if(res&&res.status===200){const clone=res.clone();caches.open(VERSION).then((c)=>c.put(req,clone));}
    return res;
  }).catch(()=>caches.match(req)));
});
