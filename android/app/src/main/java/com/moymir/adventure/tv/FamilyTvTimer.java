package com.moymir.adventure.tv;

import android.app.*;
import android.content.*;
import android.os.Build;
import android.os.SystemClock;
import com.getcapacitor.JSObject;

/** Explicitly armed local TV timer. No remote commands, no network monitoring. */
final class FamilyTvTimer {
 static final String PREFS="family_tv_remote", ACTION="com.moymir.adventure.TV_TIMER_END";
 static final int REQUEST=32722;
 static SharedPreferences prefs(Context c){return c.getSharedPreferences(PREFS,0);}
 static AlarmManager manager(Context c){return (AlarmManager)c.getSystemService(Context.ALARM_SERVICE);}
 static boolean allowed(Context c){return Build.VERSION.SDK_INT<31||manager(c).canScheduleExactAlarms();}
 static PendingIntent intent(Context c,String id){return PendingIntent.getBroadcast(c,REQUEST,new Intent(c,FamilyTvTimerReceiver.class).setAction(ACTION).putExtra("session",id),PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);}
 static synchronized JSObject status(Context c){
  SharedPreferences p=prefs(c);String state=p.getString("timer_state","idle");
  long end=p.getLong("timer_end",0),elapsed=p.getLong("timer_elapsed",0);
  if(state.equals("armed")&&(System.currentTimeMillis()>end+90_000||SystemClock.elapsedRealtime()>elapsed+90_000||elapsed-SystemClock.elapsedRealtime()>3_660_000)){
   state="expired";p.edit().putString("timer_state",state).commit();
  }
  JSObject o=new JSObject();o.put("pairedIp",p.getString("paired_ip",""));o.put("exactAllowed",allowed(c));o.put("state",state);o.put("session",p.getString("timer_session",""));o.put("end",end);o.put("message",p.getString("timer_message",""));return o;
 }
 static synchronized void arm(Context c,String id,String ip,long end)throws Exception{
  if(!allowed(c))throw new Exception("Разреши точные будильники в настройках Android");
  SharedPreferences p=prefs(c);if(!LegacyTvRemote.privateIpv4(ip)||!ip.equals(p.getString("paired_ip","")))throw new Exception("Сначала подтверди сопряжение телевизора");
  if(id==null||!id.matches("[A-Za-z0-9-]{1,80}"))throw new Exception("Некорректный сеанс");
  long delay=end-System.currentTimeMillis();if(delay<1500||delay>3_660_000)throw new Exception("Некорректное время окончания");
  String state=status(c).getString("state","");if(state.equals("armed")||state.equals("sending"))throw new Exception("Уже есть ТВ-таймер");
  long elapsed=SystemClock.elapsedRealtime()+delay;
  if(!p.edit().putString("timer_session",id).putString("timer_ip",ip).putLong("timer_end",end).putLong("timer_elapsed",elapsed).putString("timer_state","armed").putString("timer_message","").commit())throw new Exception("Не удалось сохранить таймер");
  try{manager(c).setExactAndAllowWhileIdle(AlarmManager.ELAPSED_REALTIME_WAKEUP,elapsed,intent(c,id));}
  catch(Exception e){p.edit().putString("timer_state","failed").putString("timer_message","Не удалось запланировать выключение").commit();throw e;}
 }
 static synchronized void cancel(Context c,String id)throws Exception{
  SharedPreferences p=prefs(c);if(!id.equals(p.getString("timer_session","")))throw new Exception("Таймер другого сеанса");
  if(p.getString("timer_state","").equals("sending"))throw new Exception("Команда уже отправляется");
  manager(c).cancel(intent(c,id));p.edit().putString("timer_state","cancelled").putString("timer_message","Выключение отменено родителем").commit();
 }
 static synchronized String[] claim(Context c,String id){
  SharedPreferences p=prefs(c);if(id==null||!id.equals(p.getString("timer_session",""))||!"armed".equals(p.getString("timer_state","")))return null;
  long delta=SystemClock.elapsedRealtime()-p.getLong("timer_elapsed",0);if(delta< -1000||delta>90_000){p.edit().putString("timer_state","expired").commit();return null;}
  String ip=p.getString("timer_ip",""),remote=p.getString("id","");
  if(!ip.equals(p.getString("paired_ip",""))||remote.isEmpty()){p.edit().putString("timer_state","failed").commit();return null;}
  p.edit().putString("timer_state","sending").commit();return new String[]{ip,remote};
 }
 static synchronized void complete(Context c,String id,boolean ok,String message){SharedPreferences p=prefs(c);if(id.equals(p.getString("timer_session","")))p.edit().putString("timer_state",ok?"accepted":"failed").putString("timer_message",message).commit();}
}
