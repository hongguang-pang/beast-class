/* 精灵大陆 · 知识远征 离线缓存（scope=/rpg/，与主站/诊断站隔离） */
const VERSION = 'rpg-v1.0.0';
const SHELL = [
  './','./index.html','./style.css?v=1',
  './data/knowledge.js?v=1','./data/kg/g1.js?v=1','./data/kg/g2.js?v=1','./data/kg/g3.js?v=1',
  './data/kg/g4.js?v=1','./data/kg/g5.js?v=1','./data/kg/g6.js?v=1','./data/kg/g7.js?v=1',
  './data/kg/g8.js?v=1','./data/kg/g9.js?v=1','./data/kg/g10.js?v=1','./data/kg/g11.js?v=1','./data/kg/g12.js?v=1',
  './js/data.js?v=1','./js/engine.js?v=1','./js/world.js?v=1','./js/battle.js?v=1','./js/ui.js?v=1','./js/main.js?v=1'
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
