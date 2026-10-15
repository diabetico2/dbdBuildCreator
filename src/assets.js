const cache=new Map(),failures=new Map();
let observer;
const base=import.meta.env.VITE_SUPABASE_URL;
export const assetFailures=()=>[...failures.entries()].map(([id,error])=>({id,error}));
export function assetView(asset,label,escape,kind='perk'){
  if(!asset||asset.status!=='ready'||!asset.storage_path)return `<span class="asset-pending ${kind}" role="img" aria-label="${escape(label)}: imagem pendente de licença"><span>${kind==='portrait'?'RETRATO':'ÍCONE'}</span><small>Licença pendente</small></span>`;
  return `<span class="asset-image ${kind}"><img data-asset="${escape(asset.id)}" alt="${escape(label)}" decoding="async" width="${kind==='portrait'?240:96}" height="${kind==='portrait'?360:96}"></span>`;
}
export function mountAssets(root,catalog){
  observer?.disconnect();
  const lookup=new Map((catalog.assets||[]).map(a=>[a.id,a]));
  observer=new IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting)continue;observer.unobserve(entry.target);load(entry.target,lookup.get(entry.target.dataset.asset));}},{rootMargin:'160px'});
  root.querySelectorAll('img[data-asset]').forEach(img=>observer.observe(img));
}
async function load(img,asset){
  if(!base||!asset?.storage_path||asset.status!=='ready')return;
  const path=asset.storage_path;
  if(!/^(killers|perks)\/[a-z0-9-]+\.(png|webp|jpg)$/.test(path))return fail(img,asset,'Caminho inválido');
  try{
    let url=cache.get(asset.id);
    if(!url){
      const response=await fetch(`${base}/storage/v1/object/public/dbc-assets/${path}`,{cache:'no-store',signal:AbortSignal.timeout(12000)});
      if(!response.ok)throw Error(`HTTP ${response.status}`);
      const blob=await response.blob();if(!blob.type.startsWith('image/')||blob.size>5_000_000)throw Error('Formato ou tamanho inválido');
      url=URL.createObjectURL(blob);cache.set(asset.id,url);
      if(cache.size>64){const first=cache.keys().next().value;URL.revokeObjectURL(cache.get(first));cache.delete(first);}
    }
    img.onerror=()=>fail(img,asset,'Não foi possível decodificar a imagem');img.src=url;
  }catch(error){fail(img,asset,error.message);}
}
function fail(img,asset,message){failures.set(asset.id,message);const span=document.createElement('span');span.className='asset-pending';span.textContent='Imagem indisponível';img.replaceWith(span);}
export function clearAssets(){observer?.disconnect();for(const url of cache.values())URL.revokeObjectURL(url);cache.clear();failures.clear();}
