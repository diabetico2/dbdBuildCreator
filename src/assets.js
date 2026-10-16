import {assetUrl,localAsset} from './asset-source.js';
const cache=new Map(),failures=new Map(),inFlight=new Map(),controllers=new Set();
let observer,epoch=0;
const base=import.meta.env.VITE_SUPABASE_URL;
export const assetFailures=()=>[...failures.entries()].map(([id,error])=>({id,error}));
export function assetView(asset,label,escape,kind='perk'){
  if(!assetUrl(asset,base))return '<span class="asset-pending '+kind+'" role="img" aria-label="'+escape(label)+': imagem indisponível"><span>Imagem indisponível</span></span>';
  const legacy=localAsset(asset.id)?.variant==='legacy_equivalent';
  return '<span class="asset-image '+kind+'" '+(legacy?'title="Arte do nome legado equivalente; consulte os créditos."':'')+'><img data-asset="'+escape(asset.id)+'" alt="'+escape(label)+'" decoding="async" width="'+(kind==='portrait'?240:96)+'" height="'+(kind==='portrait'?360:96)+'"></span>';
}
export function mountAssets(root,catalog){
  observer?.disconnect();
  const lookup=new Map((catalog.assets||[]).map(a=>[a.id,a]));
  observer=new IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting)continue;observer.unobserve(entry.target);load(entry.target,lookup.get(entry.target.dataset.asset));}},{rootMargin:'160px'});
  root.querySelectorAll('img[data-asset]:not([src])').forEach(img=>observer.observe(img));
}
async function fetchImage(asset,generation){
  const controller=new AbortController();controllers.add(controller);
  const timer=setTimeout(()=>controller.abort(),12000);
  try {
    const response=await fetch(assetUrl(asset,base),{cache:'no-store',signal:controller.signal});
    if(!response.ok)throw Error('HTTP '+response.status);
    const blob=await response.blob();
    if(!blob.type.startsWith('image/')||blob.size>5_000_000||!blob.size)throw Error('Formato ou tamanho inválido');
    if(generation!==epoch)return null;
    const url=URL.createObjectURL(blob);cache.set(asset.id,url);
    if(cache.size>64){const first=cache.keys().next().value;URL.revokeObjectURL(cache.get(first));cache.delete(first);}
    return url;
  }finally{clearTimeout(timer);controllers.delete(controller);}
}
async function load(img,asset){
  if(!assetUrl(asset,base))return;
  const generation=epoch;
  try {
    let url=cache.get(asset.id);
    if(url){cache.delete(asset.id);cache.set(asset.id,url);}
    else {
      let request=inFlight.get(asset.id);
      if(!request){request=fetchImage(asset,generation);inFlight.set(asset.id,request);}
      try{url=await request;}finally{if(inFlight.get(asset.id)===request)inFlight.delete(asset.id);}
    }
    if(generation!==epoch||!img.isConnected||!url)return;
    img.onerror=()=>{if(generation===epoch)fail(img,asset,'Não foi possível decodificar a imagem');};
    img.src=url;
  }catch(error){if(generation===epoch&&img.isConnected)fail(img,asset,error.message);}
}
function fail(img,asset,message){
  failures.set(asset.id,message);
  const span=document.createElement('span');span.className='asset-pending';span.textContent='Imagem indisponível';span.setAttribute('role','img');span.setAttribute('aria-label',img.alt+': imagem indisponível');img.replaceWith(span);
}
export function clearAssets(){
  epoch++;observer?.disconnect();for(const controller of controllers)controller.abort();controllers.clear();inFlight.clear();
  for(const url of cache.values())URL.revokeObjectURL(url);cache.clear();failures.clear();
}
