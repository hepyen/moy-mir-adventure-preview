package com.moymir.adventure.tv;
import android.app.*;
import android.content.*;
import android.os.Build;

public final class FamilyTvTimerReceiver extends BroadcastReceiver {
 @Override public void onReceive(Context c,Intent i){
  if(!FamilyTvTimer.ACTION.equals(i.getAction()))return;
  String id=i.getStringExtra("session");String[] connection=FamilyTvTimer.claim(c,id);if(connection==null)return;
  PendingResult pending=goAsync();
  new Thread(()->{boolean ok=false;String msg;
   try{LegacyTvRemote.runTimed(connection[0],connection[1],"off",1800,3500);ok=true;msg="Телевизор принял команду выключения. Проверь экран.";}
   catch(Exception e){msg="Не получено подтверждение выключения. Проверь телевизор и Wi-Fi.";}
   try{FamilyTvTimer.complete(c,id,ok,msg);NotificationManager nm=(NotificationManager)c.getSystemService(Context.NOTIFICATION_SERVICE);String channel="family_tv_timer";if(Build.VERSION.SDK_INT>=26)nm.createNotificationChannel(new NotificationChannel(channel,"Игровое время ТВ",NotificationManager.IMPORTANCE_DEFAULT));Notification.Builder b=Build.VERSION.SDK_INT>=26?new Notification.Builder(c,channel):new Notification.Builder(c);nm.notify(32722,b.setSmallIcon(android.R.drawable.ic_lock_power_off).setContentTitle("Игровое время закончилось").setContentText(msg).setAutoCancel(true).build());}catch(Exception ignored){}finally{pending.finish();}
  },"family-tv-timer").start();
 }
}
