import test from 'node:test';
import assert from 'node:assert/strict';
import {seedCatalog as catalog,defaults} from '../src/catalog.js';
import {availablePerks,scoreBuild,recommend,alternatives,normalizeWeights,family,candidatePool} from '../src/recommender.js';
const collection=catalog.killers.map(k=>({killer_id:k.id,prestige:3}));
const input={catalog,collection,overrides:[],killerId:'legion',style:'balanced',weights:defaults};
test('catálogo cobre 44 assassinos, três perks por origem e 19 gerais, sem IDs quebrados',()=>{
 assert.equal(catalog.killers.length,44);assert.equal(catalog.perks.length,151);assert.equal(new Set(catalog.perks.map(family)).size,145);
 assert.equal(new Set(catalog.perks.map(p=>p.id)).size,151);assert.equal(catalog.perks.filter(p=>!p.owner_id).length,19);
 for(const k of catalog.killers){assert.equal(catalog.perks.filter(p=>p.owner_id===k.id).length,3);assert.ok(catalog.assets.some(a=>a.id===k.portrait_asset&&a.entity_id===k.id));}
 for(const p of catalog.perks){assert.ok(['control','chase','information','utility'].includes(p.category));assert.ok(catalog.assets.some(a=>a.id===p.icon_asset&&a.entity_id===p.id));}
 for(const s of catalog.synergies){assert.ok(catalog.perks.some(p=>p.id===s.perk_a));assert.ok(catalog.perks.some(p=>p.id===s.perk_b));assert.ok(s.perk_a<s.perk_b);}
 assert.ok(catalog.assets.every(a=>a.status==='license_pending'&&a.storage_path===null));
});
test('P0 não compartilha; P1 compartilha; níveis manuais, bloqueios e P100',()=>{
 const owned=[{killer_id:'legion',prestige:0},{killer_id:'hillbilly',prestige:0}];
 assert.equal(availablePerks(catalog,owned,[],'legion').length,3);owned[1].prestige=1;
 assert.equal(availablePerks(catalog,owned,[],'legion').find(p=>p.id==='enduring').tier,1);
 const overrides=[{killer_id:'legion',perk_id:'enduring',tier:3},{killer_id:'legion',perk_id:'discordance',tier:0},{killer_id:'legion',perk_id:'corrupt',tier:2}];
 const pool=availablePerks(catalog,owned,overrides,'legion');assert.equal(pool.find(p=>p.id==='enduring').tier,3);assert.equal(pool.find(p=>p.id==='corrupt').tier,2);assert.ok(!pool.some(p=>p.id==='discordance'));assert.equal(availablePerks(catalog,owned,overrides,'nurse').length,0);
 owned[1].prestige=100;assert.equal(availablePerks(catalog,owned,[],'legion').find(p=>p.id==='enduring').tier,3);
});
test('não assume perks gerais e não devolve build parcial',()=>{
 assert.ok(!availablePerks(catalog,collection,[],'legion').some(p=>!p.owner_id));
 assert.equal(recommend({...input,collection:[{killer_id:'legion',prestige:0}]}).builds.length,0);
});
test('três recomendações determinísticas, quatro efeitos únicos e pelo menos duas mudanças',()=>{
 const result=recommend(input);assert.equal(result.method,'shortlist');assert.equal(result.builds.length,3);assert.deepEqual(result,recommend(input));
 for(const [i,b] of result.builds.entries()){assert.equal(new Set(b.perks.map(family)).size,4);assert.ok(b.perks.every(p=>p.available));assert.ok(Number.isFinite(b.score));for(const prev of result.builds.slice(0,i))assert.ok(b.perks.filter(p=>prev.perks.some(q=>family(q)===family(p))).length<=2);}
});
test('nomes legados não duplicam efeitos nem perdem a disponibilidade',()=>{
 const all=candidatePool({...input,onlyAvailable:false});assert.equal(all.length,145);
 assert.equal(all.find(p=>family(p)==='no-holds-barred').id,'deadlock');
 const killer=catalog.killers.find(k=>k.id==='legion');const pick=ids=>ids.map(id=>({...catalog.perks.find(p=>p.id===id),tier:3}));
 assert.throws(()=>scoreBuild(pick(['deadlock','no-holds-barred','enduring','corrupt']),killer,'balanced',catalog.synergies,defaults));
});
test('sinergias, afinidade e pesos compõem a pontuação',()=>{
 const pick=ids=>ids.map(id=>({...catalog.perks.find(p=>p.id===id),tier:3}));const killer=catalog.killers.find(k=>k.id==='legion');
 const positive=scoreBuild(pick(['enduring','spirit-fury','corrupt','discordance']),killer,'balanced',catalog.synergies,defaults,catalog.perks);
 assert.equal(positive.parts.synergy,4);const no=scoreBuild(positive.perks,killer,'balanced',catalog.synergies,{...defaults,synergy:0},catalog.perks);assert.equal(positive.score-no.score,4);
 assert.ok(scoreBuild(positive.perks,catalog.killers.find(k=>k.id==='nurse'),'balanced',catalog.synergies,defaults,catalog.perks).parts.compatibility<positive.parts.compatibility);
 assert.deepEqual(normalizeWeights({strength:Infinity,synergy:-4,style:99}),{...defaults,synergy:0,style:5});
});
test('busca exaustiva corresponde à enumeração independente no conjunto pequeno',()=>{
 const ids=['discordance','enduring','brutal','spirit-fury','lightborn','corrupt','bamboozle'];const small={...catalog,perks:catalog.perks.filter(p=>ids.includes(p.id))};
 const pool=availablePerks(small,collection,[],'legion');let max=-Infinity;for(let mask=0;mask<2**pool.length;mask++){const selected=pool.filter((_,i)=>mask&(1<<i));if(selected.length===4)max=Math.max(max,scoreBuild(selected,catalog.killers.find(k=>k.id==='legion'),'balanced',catalog.synergies,defaults,catalog.perks).score);}
 assert.equal(recommend({...input,catalog:small}).builds[0].score,max);
});
test('substituição lista todas as candidatas compatíveis e reavalia a combinação',()=>{
 const b=recommend(input).builds[0],list=alternatives(b,0,input);assert.ok(list.length>3);
 for(const a of list){assert.ok(!b.perks.some(p=>family(p)===family(a.perk)));assert.ok(Math.abs(a.delta-(a.score-b.score))<1e-8);}assert.ok(list.every((a,i)=>!i||a.score<=list[i-1].score));
});
