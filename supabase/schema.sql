-- Executar uma vez em um projeto Supabase dedicado. Nenhuma tabela existente é removida.
begin;
create table public.dbc_killers (
 id text primary key, name text not null, tags text[] not null default '{}',
 description text not null, source_url text not null
);
create table public.dbc_perks (
 id text primary key, name text not null, owner_id text references public.dbc_killers(id),
 category text not null check(category in ('chase','information','control','utility')),
 strength numeric not null check(strength between 0 and 10), effect text not null,
 affinities jsonb not null default '{}' check(jsonb_typeof(affinities)='object'), source_url text not null
);
create index dbc_perks_owner_idx on public.dbc_perks(owner_id);
create table public.dbc_synergies (
 perk_a text not null references public.dbc_perks(id), perk_b text not null references public.dbc_perks(id),
 value numeric not null check(value between -10 and 10), reason text not null,
 primary key(perk_a,perk_b), check(perk_a < perk_b)
);
create index dbc_synergies_b_idx on public.dbc_synergies(perk_b);
create table public.dbc_config (
 id integer primary key check(id=1), version text not null, reviewed_at date not null,
 notice text not null, weights jsonb not null check(jsonb_typeof(weights)='object')
);
create table public.dbc_collection (
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 killer_id text not null references public.dbc_killers(id),
 prestige integer not null default 0 check(prestige between 0 and 100),
 primary key(user_id,killer_id)
);
create index dbc_collection_killer_idx on public.dbc_collection(killer_id);
create table public.dbc_perk_unlocks (
 user_id uuid not null default auth.uid(), killer_id text not null,
 perk_id text not null references public.dbc_perks(id), tier integer not null check(tier between 0 and 3),
 primary key(user_id,killer_id,perk_id),
 foreign key(user_id,killer_id) references public.dbc_collection(user_id,killer_id) on delete cascade
);
create index dbc_perk_unlocks_perk_idx on public.dbc_perk_unlocks(perk_id);
create table public.dbc_preferences (
 user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
 style text not null default 'balanced' check(style in ('balanced','chase','information','control')),
 selected_killer text references public.dbc_killers(id) on delete set null,
 weights jsonb not null default '{}' check(jsonb_typeof(weights)='object' and octet_length(weights::text)<1024),
 compact boolean not null default false
);
create index dbc_preferences_killer_idx on public.dbc_preferences(selected_killer);
create table public.dbc_favorites (
 id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(),
 killer_id text not null, name text not null check(char_length(name) between 1 and 80),
 style text not null check(style in ('balanced','chase','information','control')),
 perk_1 text not null references public.dbc_perks(id), perk_2 text not null references public.dbc_perks(id),
 perk_3 text not null references public.dbc_perks(id), perk_4 text not null references public.dbc_perks(id),
 catalog_version text not null, created_at timestamptz not null default now(),
 foreign key(user_id,killer_id) references public.dbc_collection(user_id,killer_id) on delete cascade,
 check(perk_1<>perk_2 and perk_1<>perk_3 and perk_1<>perk_4 and perk_2<>perk_3 and perk_2<>perk_4 and perk_3<>perk_4)
);
create index dbc_favorites_user_killer_idx on public.dbc_favorites(user_id,killer_id);
create index dbc_favorites_p1_idx on public.dbc_favorites(perk_1);
create index dbc_favorites_p2_idx on public.dbc_favorites(perk_2);
create index dbc_favorites_p3_idx on public.dbc_favorites(perk_3);
create index dbc_favorites_p4_idx on public.dbc_favorites(perk_4);

-- Catálogo: leitura por usuários autenticados, edição apenas pela administração.
do $$ declare t text; begin
 foreach t in array array['dbc_killers','dbc_perks','dbc_synergies','dbc_config'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from public, anon, authenticated',t);
  execute format('grant select on public.%I to authenticated',t);
  execute format('create policy catalog_read on public.%I for select to authenticated using (true)',t);
 end loop;
 -- Dados pessoais: dono no SELECT, INSERT, UPDATE (antes/depois) e DELETE.
 foreach t in array array['dbc_collection','dbc_perk_unlocks','dbc_preferences','dbc_favorites'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from public, anon, authenticated',t);
  execute format('grant select, insert, update, delete on public.%I to authenticated',t);
  execute format('create policy own_select on public.%I for select to authenticated using ((select auth.uid())=user_id)',t);
  execute format('create policy own_insert on public.%I for insert to authenticated with check ((select auth.uid())=user_id)',t);
  execute format('create policy own_update on public.%I for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id)',t);
  execute format('create policy own_delete on public.%I for delete to authenticated using ((select auth.uid())=user_id)',t);
 end loop;
end $$;
grant usage on schema public to authenticated;
commit;
