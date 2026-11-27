begin;
create function moymir_private.calendar_notify_child() returns trigger language plpgsql security definer set search_path='' as $f$
declare recipient uuid;
begin
 if tg_op='UPDATE' then if new.revision=old.revision then return new; end if; end if;
 if new.event_date<(now() at time zone 'Europe/Madrid')::date then return new;end if;
 for recipient in select user_id from public.family_members where family_id=new.family_id and role='child' loop
 perform public.emit_family_notification(new.family_id,recipient,'calendar_event','Семейный календарь','Запланировано или изменено семейное событие. Открой «Мой мир» и подтверди прочтение.',new.id);
 end loop;
 return new;
end;$f$;
revoke all on function moymir_private.calendar_notify_child() from public,anon,authenticated;
create trigger calendar_notify_child after insert or update on public.moymir_family_calendar for each row execute function moymir_private.calendar_notify_child();
commit;
