/* 精灵大陆 · 知识远征 离线缓存（scope=/rpg/，与主站/诊断站隔离） */
const VERSION = 'rpg-v2.0.0';
const SHELL = [
  './','./index.html','./style.css?v=8','./manifest.webmanifest',
  './icons/icon-192.png','./icons/icon-512.png','./icons/icon-192-maskable.png','./icons/icon-512-maskable.png',
  './images/pets/P001-baby.png','./images/pets/P011-baby.png','./images/pets/P027-baby.png','./images/pets/P035-baby.png',
  './images/pets/P042-baby.png','./images/pets/P051-baby.png','./images/pets/D201-baby.png','./images/pets/D203-baby.png',
  './images/pets/D207-baby.png','./images/pets/D209-baby.png',
  './data/knowledge.js?v=8','./data/kg/g1.js?v=8','./data/kg/g2.js?v=8','./data/kg/g3.js?v=8',
  './data/kg/g4.js?v=8','./data/kg/g5.js?v=8','./data/kg/g6.js?v=8','./data/kg/g7.js?v=8',
  './data/kg/g8.js?v=8','./data/kg/g9.js?v=8','./data/kg/g10.js?v=8','./data/kg/g11.js?v=8','./data/kg/g12.js?v=8',
  './js/data.js?v=9','./js/audio.js?v=9','./js/fx.js?v=8','./js/engine.js?v=8','./js/campaign.js?v=8','./js/world.js?v=8','./js/battle.js?v=8','./js/ui.js?v=9','./js/main.js?v=9',
  './audio/sfx/click.ogg','./audio/sfx/hit.ogg','./audio/sfx/skill.ogg','./audio/sfx/correct.ogg','./audio/sfx/wrong.ogg','./audio/sfx/win.ogg','./audio/sfx/levelup.ogg','./audio/sfx/chest.ogg','./audio/sfx/encounter.ogg','./audio/sfx/stun.ogg','./audio/sfx/target.ogg','./audio/sfx/run.ogg','./audio/sfx/heal.ogg',
  './js/petdex.js?v=9','./js/petdexpark.js?v=9',
  './images/petdex/p00_doraemon.webp','./images/petdex/p01_boba.webp','./images/petdex/p02_lulu-capybara-2.webp','./images/petdex/p03_capvolt.webp','./images/petdex/p04_kirby.webp','./images/petdex/p05_chiikawa.webp','./images/petdex/p06_totoro.webp','./images/petdex/p07_edogawa-conan.webp','./images/petdex/p08_hatsune-miku.webp','./images/petdex/p09_classic-qq-penguin.webp','./images/petdex/p10_shiba-4.webp','./images/petdex/p11_milkfrog.webp','./images/petdex/p12_yueya-moon-fox.webp','./images/petdex/p13_glaucira-blue-dragon.webp','./images/petdex/p14_glitchcat.webp','./images/petdex/p15_roubao.webp','./images/petdex/p16_maotuan.webp','./images/petdex/p17_daidai-bird-3.webp','./images/petdex/p18_mo-tuan-tuan.webp','./images/petdex/p19_naiwa-2.webp','./images/petdex/p20_biscuit.webp','./images/petdex/p21_bytechomp-v2.webp','./images/petdex/p22_jinluan.webp','./images/petdex/p23_silver-byte.webp',
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
