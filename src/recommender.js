import {defaults} from './model-defaults.js';
export const family=p=>p.equivalent_id||p.id;
export function normalizeWeights(input={}) {
  return Object.fromEntries(Object.entries(defaults).map(([k,v])=>[k,Number.isFinite(input[k])?Math.max(0,Math.min(5,input[k])):v]));
}
// Gerais dependem da Teia de Sangue/Santuário; não são presumidas desbloqueadas.
export function availablePerks(catalog,collection,overrides,killerId) {
  if(!collection.some(k=>k.killer_id===killerId))return [];
  const owned=new Map(collection.map(k=>[k.killer_id,k.prestige]));
  const manual=new Map(overrides.filter(p=>p.killer_id===killerId).map(p=>[p.perk_id,p.tier]));
  return catalog.perks.flatMap(perk=>{
    const tier=manual.has(perk.id)?manual.get(perk.id):perk.owner_id===killerId?Math.max(1,Math.min(3,owned.get(killerId)||0)):Math.min(3,owned.get(perk.owner_id)||0);
    return tier>0?[{...perk,tier,available:true}]:[];
  });
}
export function candidatePool({catalog,collection,overrides,killerId,onlyAvailable=true}) {
  const actual=new Map(availablePerks(catalog,collection,overrides,killerId).map(p=>[p.id,p]));
  const pool=onlyAvailable?[...actual.values()]:catalog.perks.map(p=>actual.get(p.id)||({...p,tier:null,available:false}));
  const unique=new Map();
  for(const p of pool){const old=unique.get(family(p));if(!old||Number(p.available)>Number(old.available)||(p.available===old.available&&((p.tier||0)>(old.tier||0)||((p.tier||0)===(old.tier||0)&&old.legacy&&!p.legacy))))unique.set(family(p),p);}
  return [...unique.values()];
}
function individual(perk,killer,style,w){
  return {strength:perk.strength*([0,.85,.93,1][perk.tier||3])*w.strength,
    compatibility:(killer.tags||[]).reduce((sum,t)=>sum+(perk.affinities?.[t]||0),0)*w.compatibility,
    style:(style!=='balanced'&&perk.category===style?2:0)*w.style};
}
function categoryParts(perks,style,w){const counts={};for(const p of perks)counts[p.category]=(counts[p.category]||0)+1;
  return {diversity:Object.keys(counts).length*w.diversity*(style==='balanced'?1.5:1),redundancy:-Object.values(counts).reduce((s,c)=>s+Math.max(0,c-2)**2,0)*w.redundancy};}
function matchingInteractions(perks,synergies,catalogPerks=perks){
  const families=new Set(perks.map(family)),lookup=new Map(catalogPerks.map(p=>[p.id,family(p)]));
  return synergies.filter(s=>families.has(lookup.get(s.perk_a)||s.perk_a)&&families.has(lookup.get(s.perk_b)||s.perk_b));
}
export function scoreBuild(perks,killer,style,synergies,weights,catalogPerks=perks){
  if(perks.length!==4||new Set(perks.map(family)).size!==4)throw Error('A build deve conter quatro efeitos de vantagens diferentes.');
  const w=normalizeWeights(weights),parts={strength:0,compatibility:0,style:0,synergy:0,...categoryParts(perks,style,w)};
  const details=perks.map(p=>({id:p.id,...individual(p,killer,style,w)}));
  for(const d of details){parts.strength+=d.strength;parts.compatibility+=d.compatibility;parts.style+=d.style;}
  const interactions=matchingInteractions(perks,synergies,catalogPerks);parts.synergy=interactions.reduce((s,x)=>s+x.value*w.synergy,0);
  return {perks,parts,details,interactions,score:Object.values(parts).reduce((a,b)=>a+b,0),style};
}
// Pré-calcula parcelas e pares. Enumeração numérica roda somente no Worker.
function bestCombination(all,killer,style,catalog,w,previous=[],rotation=0){
  const sum=p=>Object.values(individual(p,killer,style,w)).reduce((a,b)=>a+b,0);
  const ranked=[...all].sort((a,b)=>sum(b)-sum(a)||a.id.localeCompare(b.id));
  const pool=ranked.slice(0,48).sort((a,b)=>a.id.localeCompare(b.id));
  if(pool.length<4)return null;
  const scores=pool.map(sum),pairs=pool.map(()=>new Float64Array(pool.length));
  const fmap=new Map(catalog.perks.map(p=>[p.id,family(p)]));
  const indices=new Map(pool.map((p,i)=>[family(p),i]));
  for(const s of catalog.synergies){const a=indices.get(fmap.get(s.perk_a)),b=indices.get(fmap.get(s.perk_b));if(a!==undefined&&b!==undefined)pairs[a][b]=pairs[b][a]=s.value*w.synergy;}
  let best=null,bestScore=-Infinity;
  const previousSets=previous.map(b=>new Set(b.perks.map(family)));
  const variation=rotation?new Set(ranked.slice(0,Math.min(8,ranked.length)).filter((_,i)=>i%3===rotation%3).map(family)):new Set();
  for(let a=0;a<pool.length-3;a++)for(let b=a+1;b<pool.length-2;b++)for(let c=b+1;c<pool.length-1;c++)for(let d=c+1;d<pool.length;d++){
    const selected=[pool[a],pool[b],pool[c],pool[d]];
    if(previousSets.some(s=>selected.filter(p=>s.has(family(p))).length>2))continue;
    const {diversity,redundancy}=categoryParts(selected,style,w);
    const score=scores[a]+scores[b]+scores[c]+scores[d]+pairs[a][b]+pairs[a][c]+pairs[a][d]+pairs[b][c]+pairs[b][d]+pairs[c][d]+diversity+redundancy;
    const objective=score-(rotation?selected.filter(p=>variation.has(family(p))).length*3:0);
    if(objective>bestScore){bestScore=objective;best=selected;}
  }
  return best?scoreBuild(best,killer,style,catalog.synergies,w,catalog.perks):null;
}
export function recommend(input){
  const {catalog,killerId,style='balanced',rotation=0}=input,killer=catalog.killers.find(k=>k.id===killerId);
  if(!killer)return {builds:[],available:0,method:'exact'};
  const pool=candidatePool(input),w=normalizeWeights(input.weights||catalog.config.weights),builds=[];
  const modes=[style,'balanced',style==='chase'?'information':'chase'];
  for(const [i,mode] of modes.entries()){
    const b=bestCombination(pool,killer,mode,catalog,w,builds,rotation);
    if(b)builds.push({...b,label:[rotation?'Nova combinação sugerida':'Melhor combinação do modelo','Alternativa equilibrada','Outra estratégia'][i]});
  }
  return {builds,available:pool.filter(p=>p.available).length,method:pool.length>48?'shortlist':'exact',candidateCount:pool.length};
}
export function alternatives(build,slot,input){
  const killer=input.catalog.killers.find(k=>k.id===input.killerId),current=new Set(build.perks.map(family));
  return candidatePool(input).filter(p=>!current.has(family(p))).map(perk=>{
    const next=[...build.perks];next[slot]=perk;
    const scored=scoreBuild(next,killer,build.style||input.style,input.catalog.synergies,input.weights,input.catalog.perks);
    return {perk,score:scored.score,delta:scored.score-build.score};
  }).sort((a,b)=>b.score-a.score||a.perk.id.localeCompare(b.perk.id));
}

