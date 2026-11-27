package com.moymir.adventure.alarm;
import android.content.Intent;
import android.content.SharedPreferences;
import android.app.NotificationManager;
import android.app.NotificationChannel;
import androidx.core.content.ContextCompat;
import androidx.core.app.NotificationCompat;
import androidx.annotation.NonNull;
import com.google.firebase.messaging.RemoteMessage;
import com.capacitorjs.plugins.pushnotifications.MessagingService;
import java.util.Map;

public class RemoteWakeMessaging extends MessagingService {
 @Override public void onMessageReceived(@NonNull RemoteMessage message){
  Map<String,String> d=message.getData();
  if(!"remote_wake".equals(d.get("kind"))){super.onMessageReceived(message);return;}
  SharedPreferences p=getSharedPreferences("remote_wake",MODE_PRIVATE);
  String id=d.get("request_id"),key=d.get("request_key");
  if(id==null||key==null||!id.matches("[a-fA-F0-9-]{36}")||!key.matches("[a-fA-F0-9-]{36}")||id.equals(p.getString("last",""))||!p.getString("child","").equals(d.get("child_id"))||!p.getString("device","").equals(d.get("device_id")))return;
  try{if(Long.parseLong(d.get("expires_at"))<=System.currentTimeMillis())return;}catch(Exception e){return;}
  Intent i=new Intent(this,RemoteWakeService.class).putExtra("id",id).putExtra("key",key);
  try{ContextCompat.startForegroundService(this,i);p.edit().putString("last",id).apply();}
  catch(RuntimeException e){
   NotificationManager nm=getSystemService(NotificationManager.class);
   if(android.os.Build.VERSION.SDK_INT>=26)nm.createNotificationChannel(new NotificationChannel("remote_wake_fallback","Сигнал от родителей",NotificationManager.IMPORTANCE_HIGH));
   nm.notify(7413,new NotificationCompat.Builder(this,"remote_wake_fallback").setSmallIcon(com.moymir.adventure.R.mipmap.ic_launcher).setContentTitle("Илья, пора вставать!").setContentText("Родители отправили сигнал пробуждения").setPriority(NotificationCompat.PRIORITY_HIGH).setAutoCancel(true).build());
  }
 }
}
