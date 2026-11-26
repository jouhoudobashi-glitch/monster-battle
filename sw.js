// MONSTER ARENA 7.2.32 - PWA offline shell cache.
const CACHE = 'monster-arena-7.2.32-v1';
const PREFIX = 'monster-arena-';
const VERSION = '7.2.32';
const isMotion = u => /\/assets\/three_monsters_v32\/[^/]+\.webp$/.test(u.pathname);
const versionAsset = a => {const u=new URL(a,root);if(isMotion(u))u.searchParams.set('ma_v',VERSION);return u;};
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-180.png", "./icons/icon-192.png", "./icons/icon-512.png", "./effects/c_course/stage5r/bug_fx.png", "./effects/c_course/stage5r/dragon_fx.png", "./effects/c_course/stage5r/electric_fx.png", "./effects/c_course/stage5r/fighting_fx.png", "./effects/c_course/stage5r/fire_fx.png", "./effects/c_course/stage5r/flying_fx.png", "./effects/c_course/stage5r/ghost_fx.png", "./effects/c_course/stage5r/grass_fx.png", "./effects/c_course/stage5r/ground_fx.png", "./effects/c_course/stage5r/ice_fx.png", "./effects/c_course/stage5r/normal_fx.png", "./effects/c_course/stage5r/particles_atlas.png", "./effects/c_course/stage5r/poison_fx.png", "./effects/c_course/stage5r/psychic_fx.png", "./effects/c_course/stage5r/rock_fx.png", "./effects/c_course/stage5r/water_fx.png", "./assets/three_monsters_v32/fire_attack.webp", "./assets/three_monsters_v32/fire_defeat.webp", "./assets/three_monsters_v32/fire_hurt.webp", "./assets/three_monsters_v32/fire_idle.webp", "./assets/three_monsters_v32/fire_portrait.png", "./assets/three_monsters_v32/fire_victory.webp", "./assets/three_monsters_v32/fire_walk.webp", "./assets/three_monsters_v32/grass_attack.webp", "./assets/three_monsters_v32/grass_defeat.webp", "./assets/three_monsters_v32/grass_hurt.webp", "./assets/three_monsters_v32/grass_idle.webp", "./assets/three_monsters_v32/grass_portrait.png", "./assets/three_monsters_v32/grass_victory.webp", "./assets/three_monsters_v32/grass_walk.webp", "./assets/three_monsters_v32/motion_manifest.json", "./assets/three_monsters_v32/water_attack.webp", "./assets/three_monsters_v32/water_defeat.webp", "./assets/three_monsters_v32/water_hurt.webp", "./assets/three_monsters_v32/water_idle.webp", "./assets/three_monsters_v32/water_portrait.png", "./assets/three_monsters_v32/water_victory.webp", "./assets/three_monsters_v32/water_walk.webp"];
const shell = new URL('./index.html', self.registration.scope).href;
const root = new URL('./', self.registration.scope).href;
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // A fresh shell is required. Optional assets must not prevent updating the game.
    const fresh = await fetch(shell, {cache: 'reload'});
    if (!fresh.ok) throw new Error('Could not refresh game shell');
    await cache.put(shell, fresh.clone());
    await cache.put(root, fresh);
    const optional=ASSETS.filter(a=>a!=='./'&&a!=='./index.html');
    for(let i=0;i<optional.length;i+=4)await Promise.allSettled(optional.slice(i,i+4).map(a=>cache.add(new Request(versionAsset(a),{cache:'reload'}))));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || request.headers.has('range')) return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(new URL(root).pathname)) return;
  if (/\/audio\/.*\.mp3$/i.test(url.pathname)) return;
  const isShell = url.pathname === new URL(root).pathname || url.pathname === new URL(shell).pathname;
  if (isShell) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const response = await fetch(request, {cache: 'no-store'});
        if (!response.ok) throw new Error('Shell network request failed');
        if (response.status === 200) {
          await cache.put(shell,response.clone()).catch(()=>{});
          await cache.put(root,response.clone()).catch(()=>{});
        }
        return response;
      } catch (err) {
        return await cache.match(shell) || Response.error();
      }
    })());
    return;
  }
  if(isMotion(url)&&url.searchParams.get('ma_v')===VERSION){
    event.respondWith((async()=>{const cache=await caches.open(CACHE);const saved=await cache.match(request);if(saved)return saved;const response=await fetch(request);if(response.ok&&response.status===200)await cache.put(request,response.clone()).catch(()=>{});return response;})());
    return;
  }
  event.respondWith(fetch(request).then(response => {
    if (response.ok && response.status === 200) {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE).then(cache => cache.put(request, copy)).catch(() => {}));
    }
    return response;
  }).catch(async () => (await caches.match(request)) || Response.error()));
});
