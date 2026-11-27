package com.moymir.adventure.alarm;
import android.app.*;
import android.content.*;
import android.media.*;
import android.os.*;
import androidx.core.app.NotificationCompat;
import com.moymir.adventure.R;
import java.net.*;
import java.nio.charset.StandardCharsets;
import org.json.JSONObject;
import java.util.concurrent.Executors;
import java.util.concurrent.ExecutorService;

public class RemoteWakeService extends Service {
 static final String CHANNEL="remote_wake_alarm_v2",ACTION_AWAKE="com.moymir.adventure.remote.AWAKE";
 static final int NOTIFY=7412;
 private static final ExecutorService network=Executors.newSingleThreadExecutor();
 private final Handler handler=new Handler(Looper.getMainLooper());
 private MediaPlayer player;private Vibrator vibrator;private String id,key;
 public static boolean ringing=false;
 public static void event(String id,String key,String event){
  if(id==null||key==null)return;
  network.execute(()->{try{
   HttpURLConnection c=(HttpURLConnection)new URL("https://ueqtitxbvsnqmbudwxwu.supabase.co/rest/v1/rpc/moymir_wake_native_event").openConnection();
   c.setConnectTimeout(5000);c.setReadTimeout(5000);c.setRequestMethod("POST");c.setDoOutput(true);
   c.setRequestProperty("apikey","sb_publishable_qWop6aV_TzUgWwn_0YCCzg_QzstXqKQ");c.setRequestProperty("Content-Type","application/json");
   byte[] body=new JSONObject().put("p_id",id).put("p_key",key).put("p_event",event).toString().getBytes(StandardCharsets.UTF_8);
   try(java.io.OutputStream out=c.getOutputStream()){out.write(body);} c.getResponseCode();c.disconnect();
  }catch(Exception ignored){}});
 }
 @Override public int onStartCommand(Intent i,int flags,int startId){
  if(i==null){stopSelf();return START_NOT_STICKY;}
  if(ACTION_AWAKE.equals(i.getAction())){if(ringing){event(id,key,"awake");stopSelf();}else stopSelf();return START_NOT_STICKY;}
  if(ringing)return START_NOT_STICKY;
  id=i.getStringExtra("id");key=i.getStringExtra("key");if(id==null||key==null){stopSelf();return START_NOT_STICKY;}
  NotificationManager nm=getSystemService(NotificationManager.class);
  if(Build.VERSION.SDK_INT>=26){NotificationChannel ch=new NotificationChannel(CHANNEL,"Удалённый будильник Миро",NotificationManager.IMPORTANCE_HIGH);ch.setSound(null,null);ch.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);nm.createNotificationChannel(ch);}
  PendingIntent open=PendingIntent.getActivity(this,7412,new Intent(this,RemoteWakeActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_SINGLE_TOP),PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
  PendingIntent awake=PendingIntent.getService(this,7414,new Intent(this,RemoteWakeService.class).setAction(ACTION_AWAKE),PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
  Notification n=new NotificationCompat.Builder(this,CHANNEL).setSmallIcon(R.mipmap.ic_launcher).setContentTitle("☀ Илья, пора вставать!").setContentText("Родители отправили сигнал пробуждения").setCategory(NotificationCompat.CATEGORY_ALARM).setPriority(NotificationCompat.PRIORITY_MAX).setVisibility(NotificationCompat.VISIBILITY_PUBLIC).setOngoing(true).setContentIntent(open).setFullScreenIntent(open,true).addAction(android.R.drawable.ic_menu_close_clear_cancel,"Я проснулся",awake).build();
  try{if(Build.VERSION.SDK_INT>=29)startForeground(NOTIFY,n,android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);else startForeground(NOTIFY,n);}catch(Exception e){stopSelf();return START_NOT_STICKY;}
  ringing=true;
  try{player=new MediaPlayer();player.setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).setContentType(AudioAttributes.CONTENT_TYPE_MUSIC).build());
   player.setWakeMode(this,PowerManager.PARTIAL_WAKE_LOCK);try(android.content.res.AssetFileDescriptor fd=getResources().openRawResourceFd(R.raw.miro_alarm_sunrise)){player.setDataSource(fd.getFileDescriptor(),fd.getStartOffset(),fd.getLength());}player.setLooping(true);player.setVolume(.8f,.8f);player.prepare();player.start();
  }catch(Exception ignored){}
  try{vibrator=(Vibrator)getSystemService(VIBRATOR_SERVICE);if(vibrator!=null&&vibrator.hasVibrator()){long[] pattern={0,300,350,300,1500};if(Build.VERSION.SDK_INT>=26)vibrator.vibrate(VibrationEffect.createWaveform(pattern,0));else vibrator.vibrate(pattern,0);}}catch(Exception ignored){}
  event(id,key,"received");handler.postDelayed(()->stopSelf(),45000);return START_NOT_STICKY;
 }
 @Override public void onDestroy(){ringing=false;handler.removeCallbacksAndMessages(null);if(vibrator!=null)vibrator.cancel();if(player!=null){try{player.stop();}catch(Exception ignored){}player.release();}super.onDestroy();}
 @Override public IBinder onBind(Intent i){return null;}
}
