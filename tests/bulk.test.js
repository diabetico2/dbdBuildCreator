import test from 'node:test';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {newKillers,perkUnlocks} from '../src/bulk.js';
import {acquireKillers,savePerkUnlocks,removeKillers,resetPerkUnlocks} from '../src/cloud.js';
import {seedCatalog as catalog} from '../src/catalog.js';

test('lote de killers preserva P100, deduplica seleção e cria somente os novos em P0',()=>{
  const collection=[{killer_id:'legion',prestige:100}];
  assert.deepEqual(newKillers(catalog,collection,['legion','nurse','nurse']),[{killer_id:'nurse',prestige:0}]);
  assert.equal(collection[0].prestige,100);
  assert.throws(()=>newKillers(catalog,collection,['invalid']));
});
test('perks em lote respeitam killer, prestígio, nível manual superior e bloqueio explícito',()=>{
  const collection=[{killer_id:'legion',prestige:0},{killer_id:'hillbilly',prestige:3}];
  const overrides=[{killer_id:'legion',perk_id:'corrupt',tier:2},{killer_id:'hillbilly',perk_id:'discordance',tier:3}];
  assert.deepEqual(perkUnlocks(catalog,collection,overrides,'legion',['enduring','corrupt','discordance'],1).map(x=>x.tier),[3,2,1]);
  assert.deepEqual(perkUnlocks(catalog,collection,overrides,'legion',['enduring'],0),[{killer_id:'legion',perk_id:'enduring',tier:0}]);
  assert.equal(overrides.length,2);
  assert.throws(()=>perkUnlocks(catalog,collection,overrides,'nurse',['enduring'],1));
  assert.throws(()=>perkUnlocks(catalog,collection,overrides,'legion',['enduring'],4));
});
test('cliente real envia um lote por ação, limita deletes ao usuário e propaga falhas',async()=>{
  const requests=[];
  let fail=false;
  const client=createClient('https://dbc-test.supabase.co','sb_publishable_test_fixture',{
    auth:{persistSession:false,autoRefreshToken:false},
    global:{fetch:async(input,options)=>{
      requests.push({url:new URL(input),options,body:options.body&&JSON.parse(options.body)});
      return new Response(JSON.stringify(fail?{message:'denied',code:'42501'}:[]),{status:fail?403:200,headers:{'Content-Type':'application/json'}});
    }},
  });
  await acquireKillers(client,'alice',[{killer_id:'legion',prestige:0},{killer_id:'nurse',prestige:0}]);
  assert.equal(requests.length,1);
  assert.equal(requests[0].body.length,2);
  assert.ok(requests[0].body.every(x=>x.user_id==='alice'));
  assert.match(new Headers(requests[0].options.headers).get('Prefer'),/ignore-duplicates/);
  await savePerkUnlocks(client,'alice',[{killer_id:'legion',perk_id:'enduring',tier:3},{killer_id:'legion',perk_id:'corrupt',tier:1}]);
  assert.equal(requests.length,2);
  assert.equal(requests[1].body.length,2);
  await removeKillers(client,'alice',['legion','nurse']);
  assert.equal(requests[2].options.method,'DELETE');
  assert.equal(requests[2].url.searchParams.get('user_id'),'eq.alice');
  assert.equal(requests[2].url.searchParams.get('killer_id'),'in.(legion,nurse)');
  await resetPerkUnlocks(client,'alice','legion',['corrupt','enduring']);
  assert.equal(requests[3].url.searchParams.get('killer_id'),'eq.legion');
  assert.equal(requests[3].url.searchParams.get('user_id'),'eq.alice');
  await acquireKillers(client,'alice',[]);
  assert.equal(requests.length,4);
  fail=true;
  await assert.rejects(savePerkUnlocks(client,'alice',[{killer_id:'legion',perk_id:'corrupt',tier:0}]),{message:'denied'});
});
