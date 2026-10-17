import {createClient} from '@supabase/supabase-js';
export function createCloud(env=import.meta.env, storage=globalThis.localStorage) {
  const url=env.VITE_SUPABASE_URL;
  const key=env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if(!url || !key || url.includes('SEU_PROJETO') || key.includes('SUBSTITUA')) return null;
  if(!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url) || !key.startsWith('sb_publishable_'))
    throw Error('Use a URL HTTPS do projeto e uma chave pública sb_publishable_.');
  if (!storage) throw Error('Armazenamento da sessão indisponível neste dispositivo.');
  // Fail visibly instead of silently falling back to an in-memory session.
  const probe = `dbc-storage-check-${Math.random()}`;
  try { storage.setItem(probe,'1'); storage.removeItem(probe); }
  catch { throw Error('Não foi possível salvar a sessão neste dispositivo.'); }
  return createClient(url,key,{
    auth:{storage,persistSession:true,autoRefreshToken:true,detectSessionInUrl:false},
    global:{fetch:(input,options={})=>fetch(input,{...options,cache:'no-store',signal:options.signal||AbortSignal.timeout(15000)})}
  });
}
function unwrap(result) {if(result.error)throw result.error;return result.data;}
async function all(client,table,userId) {
  const rows=[];
  for(let from=0;;from+=500) {
    let query=client.from(table).select('*');
    // Stable ordering avoids missing/duplicate rows across pages.
    if(table==='dbc_synergies') query=query.order('perk_a').order('perk_b');
    else if(table==='dbc_perk_unlocks') query=query.order('killer_id').order('perk_id');
    else if(table==='dbc_collection') query=query.order('killer_id');
    else query=query.order('id');
    if(userId) query=query.eq('user_id',userId);
    const page=unwrap(await query.range(from,from+499));rows.push(...page);if(page.length<500)break;
  }
  return rows;
}
export async function loadCloud(client,userId) {
  const [killers,perks,synergies,config,collection,overrides,preferences,favorites,assets]=await Promise.all([
    all(client,'dbc_killers'),all(client,'dbc_perks'),all(client,'dbc_synergies'),
    client.from('dbc_config').select('*').eq('id',1).single().then(unwrap),
    all(client,'dbc_collection',userId),all(client,'dbc_perk_unlocks',userId),
    client.from('dbc_preferences').select('*').eq('user_id',userId).maybeSingle().then(unwrap),
    all(client,'dbc_favorites',userId),all(client,'dbc_assets')
  ]);
  if(!killers.length || perks.length<4)throw Error('Catálogo vazio. Execute schema.sql e seed.sql no Supabase.');
  const expand=row=>({...row,...row.metadata,id:row.id});
  return {catalog:{killers:killers.map(expand),perks:perks.map(expand),synergies,config,assets},collection,overrides,preferences,favorites};
}
export async function upsert(client,table,row) {return unwrap(await client.from(table).upsert(row).select().single());}
export async function remove(client,table,match) {return unwrap(await client.from(table).delete().match(match).select());}

// One atomic PostgREST statement per batch; RLS remains enforced for the user.
export async function acquireKillers(client,userId,rows) {
  if(!rows.length)return [];
  return unwrap(await client.from('dbc_collection').upsert(
    rows.map(row=>({...row,user_id:userId})),
    {onConflict:'user_id,killer_id',ignoreDuplicates:true}
  ).select());
}
export async function savePerkUnlocks(client,userId,rows) {
  if(!rows.length)return [];
  return unwrap(await client.from('dbc_perk_unlocks').upsert(
    rows.map(row=>({...row,user_id:userId})),
    {onConflict:'user_id,killer_id,perk_id'}
  ).select());
}
export async function removeKillers(client,userId,ids) {
  if(!ids.length)return [];
  return unwrap(await client.from('dbc_collection').delete().eq('user_id',userId).in('killer_id',ids).select());
}
export async function resetPerkUnlocks(client,userId,killerId,ids) {
  if(!ids.length)return [];
  return unwrap(await client.from('dbc_perk_unlocks').delete().eq('user_id',userId).eq('killer_id',killerId).in('perk_id',ids).select());
}
