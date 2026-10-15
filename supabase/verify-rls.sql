-- Remote integration check. All synthetic users and rows are rolled back.
-- Run as an administrator in the project's SQL Editor.
begin;
select set_config('dbc.test_alice', gen_random_uuid()::text, true);
select set_config('dbc.test_bob', gen_random_uuid()::text, true);
insert into auth.users(id) values
 (current_setting('dbc.test_alice')::uuid),
 (current_setting('dbc.test_bob')::uuid);
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('dbc.test_alice'), true);
select set_config('request.jwt.claims', json_build_object('sub',current_setting('dbc.test_alice'),'role','authenticated')::text, true);
insert into public.dbc_collection(killer_id,prestige) values ('legion',1);
insert into public.dbc_perk_unlocks(killer_id,perk_id,tier) values ('legion','enduring',3);
insert into public.dbc_preferences(style,compact) values ('chase',true);
insert into public.dbc_favorites(killer_id,name,style,perk_1,perk_2,perk_3,perk_4,catalog_version)
 values ('legion','Temporary RLS test','chase','enduring','discordance','corrupt','brutal','test');
do $$ begin
 if (select count(*) from public.dbc_killers)<>44 then raise exception 'Catalog read failed'; end if;
 begin
  update public.dbc_collection set user_id=current_setting('dbc.test_bob')::uuid;
  raise exception 'Ownership change was incorrectly accepted';
 exception when insufficient_privilege then null; end;
 begin
  insert into public.dbc_collection(user_id,killer_id) values (current_setting('dbc.test_bob')::uuid,'nurse');
  raise exception 'Foreign owner insert was incorrectly accepted';
 exception when insufficient_privilege then null; end;
 begin
  update public.dbc_config set version='unauthorized';
  raise exception 'Catalog write was incorrectly accepted';
 exception when insufficient_privilege then null; end;
 begin
  update public.dbc_favorites set perk_2=perk_1;
  raise exception 'Duplicate perks were incorrectly accepted';
 exception when check_violation then null; end;
end $$;
select set_config('request.jwt.claim.sub', current_setting('dbc.test_bob'), true);
select set_config('request.jwt.claims', json_build_object('sub',current_setting('dbc.test_bob'),'role','authenticated')::text, true);
do $$ declare t text; n integer; begin
 foreach t in array array['dbc_collection','dbc_perk_unlocks','dbc_preferences','dbc_favorites'] loop
  execute format('select count(*) from public.%I',t) into n;
  if n<>0 then raise exception 'Cross-user read in %',t; end if;
  execute format('delete from public.%I where user_id=$1',t) using current_setting('dbc.test_alice')::uuid;
  get diagnostics n = row_count;
  if n<>0 then raise exception 'Cross-user delete in %',t; end if;
 end loop;
 update public.dbc_collection set prestige=50 where user_id=current_setting('dbc.test_alice')::uuid;
 get diagnostics n = row_count;
 if n<>0 then raise exception 'Cross-user update'; end if;
end $$;
insert into public.dbc_collection(killer_id,prestige) values ('legion',0);
select set_config('request.jwt.claim.sub', current_setting('dbc.test_alice'), true);
select set_config('request.jwt.claims', json_build_object('sub',current_setting('dbc.test_alice'),'role','authenticated')::text, true);
do $$ begin
 if (select prestige from public.dbc_collection where killer_id='legion')<>1 then raise exception 'Own data changed'; end if;
 if (select count(*) from public.dbc_favorites)<>1 then raise exception 'Own favorite missing'; end if;
end $$;
update public.dbc_collection set prestige=2 where killer_id='legion';
delete from public.dbc_collection where killer_id='legion';
do $$ begin
 if (select count(*) from public.dbc_perk_unlocks)<>0 or (select count(*) from public.dbc_favorites)<>0 then raise exception 'Cascade did not remove own dependent rows'; end if;
end $$;
reset role;
set local role anon;
do $$ begin
 begin
  perform 1 from public.dbc_collection;
  raise exception 'Anonymous read was incorrectly accepted';
 exception when insufficient_privilege then null; end;
 begin
  perform 1 from public.dbc_config;
  raise exception 'Anonymous catalog read was incorrectly accepted';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
select 'PASS: remote RLS, ownership, CRUD, catalog permissions, favorite constraints, cascade and anonymous denial' as result;
-- Validate equivalent perk names on the live database.
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('dbc.test_bob'), true);
do $$ begin
 begin
  insert into public.dbc_favorites(killer_id,name,style,perk_1,perk_2,perk_3,perk_4,catalog_version)
   values ('legion','Equivalent test','balanced','deadlock','no-holds-barred','enduring','corrupt','test');
  raise exception 'Duplicate effect allowed';
 exception when check_violation then null; end;
end $$;
reset role;
rollback;
