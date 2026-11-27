begin;
alter table public.moymir_miro_wardrobe add column visor text not null default 'visor-none', add column optics text not null default 'optics-default', add column armor text not null default 'armor-none', add column trim text not null default 'trim-default';
do $patch$ declare d text; m text;begin
select pg_get_functiondef('public.moymir_miro_equip(uuid,text,boolean)'::regprocedure) into d;
m:='when ''paint-blue'' then 1 else null end';
if strpos(d,m)=0 then raise exception 'Catalog changed';end if;
d:=replace(d,m,'when ''paint-blue'' then 1 when ''skin-atlas'' then 8 when ''skin-vector'' then 6 when ''skin-titan'' then 8 when ''skin-sentinel'' then 9 when ''visor-none'' then 0 when ''visor-pilot'' then 2 when ''visor-hex'' then 3 when ''visor-guard'' then 3 when ''visor-stealth'' then 4 when ''visor-scanner'' then 4 when ''optics-default'' then 0 when ''optics-cyan'' then 1 when ''optics-amber'' then 1 when ''optics-red'' then 1 when ''optics-green'' then 1 when ''optics-white'' then 1 when ''optics-dual'' then 3 when ''optics-mono'' then 3 when ''optics-tri'' then 4 when ''armor-none'' then 0 when ''armor-shoulder'' then 3 when ''armor-heavy'' then 5 when ''armor-tech'' then 4 when ''armor-ranger'' then 4 when ''armor-shield'' then 5 when ''trim-default'' then 0 when ''trim-black'' then 1 when ''trim-steel'' then 1 when ''trim-orange'' then 1 when ''trim-cyan'' then 1 when ''trim-gold'' then 2 when ''paint-graphite'' then 1 when ''paint-steel'' then 1 when ''paint-navy'' then 1 when ''paint-forest'' then 1 when ''paint-sand'' then 1 when ''paint-black'' then 1 when ''paint-white'' then 1 when ''paint-red'' then 1 when ''paint-orange'' then 1 when ''paint-cyan'' then 1 when ''paint-silver'' then 2 when ''paint-olive'' then 1 when ''paint-copper'' then 2 when ''paint-yellow'' then 1 when ''paint-purple'' then 1 when ''paint-ice'' then 1 when ''acc-radar'' then 3 when ''acc-jet'' then 4 when ''acc-solar'' then 3 when ''acc-toolkit'' then 3 when ''acc-beacon'' then 2 else null end');
m:='else w.paint:=p_item;end if;';
if strpos(d,m)=0 then raise exception 'Slot changed';end if;
d:=replace(d,m,'elsif p_item like ''visor-%'' then w.visor:=p_item;elsif p_item like ''optics-%'' then w.optics:=p_item;elsif p_item like ''armor-%'' then w.armor:=p_item;elsif p_item like ''trim-%'' then w.trim:=p_item;else w.paint:=p_item;end if;');
d:=replace(d,'paint=w.paint,owned=w.owned','paint=w.paint,visor=w.visor,optics=w.optics,armor=w.armor,trim=w.trim,owned=w.owned');
d:=replace(d,'''paint'',w.paint,''owned''','''paint'',w.paint,''visor'',w.visor,''optics'',w.optics,''armor'',w.armor,''trim'',w.trim,''owned''');
execute d;
end;$patch$;
commit;
