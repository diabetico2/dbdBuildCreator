begin;
alter table public.dbc_killers add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.dbc_perks add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.dbc_preferences add column if not exists only_available boolean not null default true;
alter table public.dbc_preferences add column if not exists sidebar_collapsed boolean not null default false;
alter table public.dbc_favorites add column if not exists notes text not null default '' check(char_length(notes)<=2000);
create table if not exists public.dbc_assets (
 id text primary key, kind text not null check(kind in ('portrait','perk')), entity_id text not null,
 source_url text not null, storage_path text, status text not null check(status in ('ready','license_pending','pending_upload','missing','broken')),
 license_url text not null, license_note text not null, checked_at timestamptz, error text
);
alter table public.dbc_assets enable row level security;
revoke all on public.dbc_assets from public,anon,authenticated;
grant select on public.dbc_assets to authenticated;
create policy catalog_read on public.dbc_assets for select to authenticated using (true);
-- Six legacy names share effects. Never equip two names of the same effect.
create or replace function public.dbc_check_favorite_families() returns trigger
language plpgsql security invoker set search_path=public as $$
begin
 if (select count(distinct coalesce(metadata->>'equivalent_id',id)) from public.dbc_perks
     where id in (new.perk_1,new.perk_2,new.perk_3,new.perk_4)) <> 4 then
  raise exception 'A build precisa de quatro efeitos de vantagens diferentes.' using errcode='23514';
 end if;
 return new;
end $$;
revoke execute on function public.dbc_check_favorite_families() from public,anon;
grant execute on function public.dbc_check_favorite_families() to authenticated;
create trigger dbc_favorites_distinct_families before insert or update on public.dbc_favorites
for each row execute function public.dbc_check_favorite_families();
commit;
