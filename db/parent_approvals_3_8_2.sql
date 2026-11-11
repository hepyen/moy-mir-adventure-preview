do $$
begin
 if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='moymir_playtime_sessions') then
  alter publication supabase_realtime add table public.moymir_playtime_sessions;
 end if;
 if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='moymir_health_meal_requests') then
  alter publication supabase_realtime add table public.moymir_health_meal_requests;
 end if;
end $$;
