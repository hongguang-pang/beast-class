/* 知识大陆 · 知识远征 离线缓存（scope=/rpg/，与主站/诊断站隔离） */
const VERSION = 'rpg-v6.4.7';
const SHELL = [
  './','./index.html','./style.css?v=26','./manifest.webmanifest',
  './icons/icon-192.png','./icons/icon-512.png','./icons/icon-192-maskable.png','./icons/icon-512-maskable.png',
  './images/pets/P001-baby.png','./images/pets/P011-baby.png','./images/pets/P027-baby.png','./images/pets/P035-baby.png',
  './images/pets/P042-baby.png','./images/pets/P051-baby.png','./images/pets/D201-baby.png','./images/pets/D203-baby.png',
  './images/pets/D207-baby.png','./images/pets/D209-baby.png',
  './data/knowledge.js?v=8','./data/kg/g1.js?v=8','./data/kg/g2.js?v=8','./data/kg/g3.js?v=8',
  './data/kg/g4.js?v=8','./data/kg/g5.js?v=8','./data/kg/g6.js?v=8','./data/kg/g7.js?v=8',
  './data/kg/g8.js?v=8','./data/kg/g9.js?v=8','./data/kg/g10.js?v=8','./data/kg/g11.js?v=8','./data/kg/g12.js?v=8',
  './js/data.js?v=20','./js/mapart.js?v=14','./js/audio.js?v=9','./js/fx.js?v=8','./js/engine.js?v=18','./js/codex.js?v=12','./js/campaign.js?v=15','./js/story.js?v=13','./js/npcfriend.js?v=14','./js/talents.js?v=14','./js/world.js?v=19','./js/battle.js?v=19','./js/ui.js?v=25','./js/tutorial.js?v=12','./js/main.js?v=17',
  './audio/sfx/click.ogg','./audio/sfx/hit.ogg','./audio/sfx/skill.ogg','./audio/sfx/correct.ogg','./audio/sfx/wrong.ogg','./audio/sfx/win.ogg','./audio/sfx/levelup.ogg','./audio/sfx/chest.ogg','./audio/sfx/encounter.ogg','./audio/sfx/stun.ogg','./audio/sfx/target.ogg','./audio/sfx/run.ogg','./audio/sfx/heal.ogg',
  './js/petdex.js?v=12','./js/petdexpark.js?v=10',
  './images/mon/b01-mushroom-king.webp','./images/mon/b02-toy-trex.webp','./images/mon/b03-storm-lord.webp','./images/mon/b04-lava-beast.webp','./images/mon/b05-frost-queen.webp','./images/mon/b06-knowledge-lord.webp','./images/mon/e01-data-slime.webp','./images/mon/e02-noisy-bat.webp','./images/mon/e03-ink-octopus.webp','./images/mon/e04-howling-wolf.webp','./images/mon/e05-sand-scorpion.webp','./images/mon/e06-letter-snake.webp','./images/mon/e07-abacus-beetle.webp','./images/mon/e08-mist-jelly.webp','./images/mon/e09-typo-spider.webp','./images/mon/e10-doze-ghost.webp','./images/mon/e11-fire-spirit.webp','./images/mon/e12-moss-golem.webp','./images/mon/e13-water-slime.webp','./images/mon/e14-shadow-bat.webp','./images/mon/e15-star-sprite.webp','./images/mon/e16-crystal-golem.webp','./images/npc/npc-chief.webp','./images/npc/npc-explorer.webp','./images/npc/npc-pharmacist.webp','./images/npc/npc-scholar.webp','./images/npc/npc-trainer.webp','./images/npc/player-hero.webp',
  './images/petdex/thumb/pd00.webp','./images/petdex/thumb/pd01.webp','./images/petdex/thumb/pd02.webp','./images/petdex/thumb/pd03.webp','./images/petdex/thumb/pd04.webp','./images/petdex/thumb/pd05.webp','./images/petdex/thumb/pd06.webp','./images/petdex/thumb/pd07.webp','./images/petdex/thumb/pd08.webp','./images/petdex/thumb/pd09.webp','./images/petdex/thumb/pd10.webp','./images/petdex/thumb/pd11.webp','./images/petdex/thumb/pd12.webp','./images/petdex/thumb/pd13.webp','./images/petdex/thumb/pd14.webp','./images/petdex/thumb/pd15.webp','./images/petdex/thumb/pd16.webp','./images/petdex/thumb/pd17.webp','./images/petdex/thumb/pd18.webp','./images/petdex/thumb/pd19.webp','./images/petdex/thumb/pd20.webp','./images/petdex/thumb/pd21.webp','./images/petdex/thumb/pd22.webp','./images/petdex/thumb/pd23.webp',
  './images/petdex/p00_doraemon.webp','./images/petdex/p01_boba.webp','./images/petdex/p02_lulu-capybara-2.webp','./images/petdex/p03_capvolt.webp','./images/petdex/p04_kirby.webp','./images/petdex/p05_chiikawa.webp','./images/petdex/p06_totoro.webp','./images/petdex/p07_edogawa-conan.webp','./images/petdex/p08_hatsune-miku.webp','./images/petdex/p09_classic-qq-penguin.webp','./images/petdex/p10_shiba-4.webp','./images/petdex/p11_milkfrog.webp','./images/petdex/p12_yueya-moon-fox.webp','./images/petdex/p13_glaucira-blue-dragon.webp','./images/petdex/p14_glitchcat.webp','./images/petdex/p15_roubao.webp','./images/petdex/p16_maotuan.webp','./images/petdex/p17_daidai-bird-3.webp','./images/petdex/p18_mo-tuan-tuan.webp','./images/petdex/p19_naiwa-2.webp','./images/petdex/p20_biscuit.webp','./images/petdex/p21_bytechomp-v2.webp','./images/petdex/p22_jinluan.webp','./images/petdex/p23_silver-byte.webp',
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
