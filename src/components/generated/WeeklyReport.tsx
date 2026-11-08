import type {WeeklyOverview} from '../../lib/useFamilyCloud';
import './WeeklyReport.css';
export function WeeklyReport({stats,role}:{stats:WeeklyOverview;role:'parent'|'child'|null}){
 const categories=[['✅','Подтверждённые дела',stats.tasks7+stats.daily7],['📚','Домашние задания',stats.homework7],['🌾','Духовный рост',stats.spiritual7]] as const;
 return <details className="mw-panel weekly-progress" open={role==='parent'}>
  <summary>📅 {role==='parent'?'Семейный отчёт за семь дней':'Моя неделя'}</summary>
  <p>{role==='parent'?'Здесь видны реальные результаты за неделю. Задания и награды подтверждаются по прежним правилам.':'Посмотри, сколько ты сделал за последние семь дней.'}</p>
  <div className="weekly-progress-stats">{categories.map(([icon,label,value])=><div key={label}><span>{icon}</span><strong>{value}</strong><small>{label}</small></div>)}</div>
  <p className="weekly-progress-note">{role==='parent'?'Сохранённые дела и духовные занятия считаются на сервере. Баллы не смешиваются между магазином и духовным ростом.':'Маленькие шаги тоже считаются. Можно продолжать спокойно, в своём темпе.'}</p>
 </details>;
}
