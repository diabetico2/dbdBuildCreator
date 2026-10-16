import test from 'node:test';
import assert from 'node:assert/strict';
import {seedCatalog as catalog} from '../src/catalog.js';
import {family} from '../src/recommender.js';
import {themedBuilds,prepareThemedBuild,themedStatus,themedNotes} from '../src/themed-builds.js';
const input={catalog,collection:[],overrides:[],killerId:'legion',weights:catalog.config.weights};
const preset=id=>themedBuilds.find(p=>p.id===id);

test('seis receitas completas não inventam desbloqueios nem repetem efeitos',()=>{
 assert.equal(themedBuilds.length,6);
 for(const p of themedBuilds){
  const status=themedStatus(p,input);assert.equal(status.error,null);assert.equal(status.missing.length,4);
  assert.equal(status.build.perks.length,4);assert.equal(new Set(status.build.perks.map(family)).size,4);
  assert.ok(p.plan.length>=3);assert.ok(p.cautions.length>=2);assert.ok(p.sources.every(url=>url.startsWith('https://')));
 }
});
test('M1 Nurse exige add-on e suas notas preservam plano e adaptações',()=>{
 const b=prepareThemedBuild(preset('m1-nurse'),input);
 assert.equal(b.preset.addons.find(a=>a.required).name,'Spasmodic Breath');
 assert.match(themedNotes(b),/Obrigatório: Spasmodic Breath/);
 assert.match(themedNotes({...b,modified:true}),/Adaptada/);
 for(const p of themedBuilds)assert.ok(themedNotes(prepareThemedBuild(p,input)).length<=2000);
});
test('receitas resolvem nomes legados e disponibilidade no assassino correto',()=>{
 const args={...input,collection:[{killer_id:'clown',prestige:0},{killer_id:'shape',prestige:3}]};
 const b=prepareThemedBuild(preset('speedblitz-clown'),args);
 const run=b.perks.find(p=>family(p)==='see-how-they-run');assert.equal(run.id,'play-with-your-food');assert.equal(run.available,true);
 assert.equal(b.perks.find(p=>p.id==='bamboozle').available,true);
 const blocked=prepareThemedBuild(preset('speedblitz-clown'),{...args,overrides:[{killer_id:'clown',perk_id:'play-with-your-food',tier:0},{killer_id:'clown',perk_id:'bamboozle',tier:0}]});
 assert.equal(blocked.perks.find(p=>family(p)==='see-how-they-run').available,false);
 assert.equal(blocked.perks.find(p=>p.id==='bamboozle').available,false);
});
test('receita informa catálogo incompatível e não devolve combinação parcial',()=>{
 const broken={...input,catalog:{...catalog,perks:catalog.perks.filter(p=>p.id!=='agitation')}};
 assert.match(themedStatus(preset('basement-trapper'),broken).error,/ausente/);
 assert.equal(themedStatus(preset('basement-trapper'),broken).build,null);
});
