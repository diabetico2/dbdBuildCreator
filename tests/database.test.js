import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

test('Postgres em memória: schema, restrições e isolamento RLS entre dois usuários',async()=>{
 const db=new PGlite();
 const alice='00000000-0000-0000-0000-000000000001',bob='00000000-0000-0000-0000-000000000002';
 try{
  await db.exec(`create role anon; create role authenticated; create schema auth;
   create table auth.users(id uuid primary key);
   create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
   grant usage on schema auth to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;
   insert into auth.users values ('${alice}'),('${bob}');`);
  await db.exec(await readFile(new URL('../supabase/schema.sql',import.meta.url),'utf8'));
  await db.exec(await readFile(new URL('../supabase/upgrade-v2.sql',import.meta.url),'utf8'));
  await db.exec(await readFile(new URL('../supabase/seed.sql',import.meta.url),'utf8'));
  const tables=await db.query("select relname,relrowsecurity from pg_class where relname like 'dbc_%' and relkind='r'");
  assert.equal(tables.rows.length,9);assert.ok(tables.rows.every(t=>t.relrowsecurity));
  const asUser=async id=>{await db.exec('reset role;');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);await db.exec('set role authenticated;');};
  await asUser(alice);
  await db.exec("insert into public.dbc_collection(killer_id,prestige) values ('legion',1)");
  await db.exec("insert into public.dbc_perk_unlocks(killer_id,perk_id,tier) values ('legion','enduring',3)");
  await db.exec("insert into public.dbc_preferences(style) values ('chase')");
  const favorite="insert into public.dbc_favorites(killer_id,name,style,perk_1,perk_2,perk_3,perk_4,catalog_version) values ('legion','Minha build','chase','enduring','discordance','corrupt','brutal','test')";
  await db.exec(favorite);
  assert.equal((await db.query('select * from public.dbc_killers')).rows.length,44);
  await assert.rejects(db.exec("update public.dbc_config set version='evil'"));
  await assert.rejects(db.exec("update public.dbc_perks set strength=10"));
  await assert.rejects(db.exec(`update public.dbc_collection set user_id='${bob}'`));
  await assert.rejects(db.exec(`insert into public.dbc_collection(user_id,killer_id) values ('${bob}','nurse')`));
  await assert.rejects(db.exec("update public.dbc_collection set prestige=101"));
  await assert.rejects(db.exec("update public.dbc_perk_unlocks set tier=4"));
  await assert.rejects(db.exec("update public.dbc_favorites set perk_2=perk_1"));
  await assert.rejects(db.exec("update public.dbc_favorites set perk_1='missing'"));
  await assert.rejects(db.exec("update public.dbc_favorites set perk_1='deadlock',perk_2='no-holds-barred'"));
  assert.equal((await db.query('select count(*)::int as n from public.dbc_assets')).rows[0].n,195);
  await assert.rejects(db.exec("update public.dbc_assets set status='ready'"));
  await asUser(bob);
  for(const table of ['dbc_collection','dbc_perk_unlocks','dbc_preferences','dbc_favorites']){
   assert.equal((await db.query(`select * from public.${table}`)).rows.length,0);
   assert.equal((await db.query(`delete from public.${table} where user_id='${alice}' returning *`)).rows.length,0);
  }
  assert.equal((await db.query(`update public.dbc_collection set prestige=20 where user_id='${alice}' returning *`)).rows.length,0);
  await assert.rejects(db.exec("insert into public.dbc_perk_unlocks(killer_id,perk_id,tier) values ('legion','enduring',3)"));
  await db.exec("insert into public.dbc_collection(killer_id,prestige) values ('legion',0)");
  await db.exec("insert into public.dbc_preferences(style) values ('control')");
  await asUser(alice);
  assert.equal((await db.query('select prestige from public.dbc_collection')).rows[0].prestige,1);
  await db.exec("update public.dbc_collection set prestige=2 where killer_id='legion'");
  assert.equal((await db.query('select prestige from public.dbc_collection')).rows[0].prestige,2);
  await db.exec("delete from public.dbc_collection where killer_id='legion'");
  assert.equal((await db.query('select * from public.dbc_perk_unlocks')).rows.length,0);
  assert.equal((await db.query('select * from public.dbc_favorites')).rows.length,0);
  await db.exec('reset role; set role anon;');
  await assert.rejects(db.exec('select * from public.dbc_collection'));
  await assert.rejects(db.exec('select * from public.dbc_config'));
 }finally{await db.close();}
});
