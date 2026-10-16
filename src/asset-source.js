import index from './asset-index.json' with {type:'json'};

export function localAsset(id){
  const item=index[id];
  return item&&/^catalog\/(killers|perks)\/[a-z0-9-]+\.webp$/.test(item.path)?item:null;
}
export function assetUrl(asset,base){
  const local=localAsset(asset?.id);
  if(local)return './'+local.path;
  if(asset?.status!=='ready'||! /^(killers|perks)\/[a-z0-9-]+\.(png|webp|jpg)$/.test(asset.storage_path||''))return null;
  try {
    const url=new URL(base);
    if(url.protocol!=='https:'||! /^[a-z0-9-]+\.supabase\.co$/.test(url.hostname)||url.username||url.password||url.port||url.pathname!=='/'||url.search||url.hash)return null;
    return url.origin+'/storage/v1/object/public/dbc-assets/'+asset.storage_path;
  }catch{return null;}
}
export const assetCredits=catalog=>(catalog.assets||[]).map(asset=>({...asset,...localAsset(asset.id),local:!!localAsset(asset.id)}));
export function assetSummary(catalog){
  const assets=assetCredits(catalog);
  return {ready:assets.filter(a=>a.local||a.status==='ready').length,pending:assets.filter(a=>!a.local&&a.status!=='ready').length,legacy:assets.filter(a=>a.variant==='legacy_equivalent').length};
}
