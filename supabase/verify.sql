-- Consultas somente leitura para verificar o projeto após aplicar schema e seed.
select relname as tabela, relrowsecurity as rls_ativa
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and relname like 'dbc_%' and relkind='r'
order by relname;
select tablename, policyname, roles, cmd, qual, with_check
from pg_policies where schemaname='public' and tablename like 'dbc_%'
order by tablename,policyname;
select 'assassinos' as tipo,count(*) from public.dbc_killers
union all select 'vantagens',count(*) from public.dbc_perks
union all select 'sinergias',count(*) from public.dbc_synergies;
select id,version,reviewed_at from public.dbc_config;
