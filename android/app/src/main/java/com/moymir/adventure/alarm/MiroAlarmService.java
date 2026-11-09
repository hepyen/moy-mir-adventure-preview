package com.moymir.adventure.alarm;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.res.AssetFileDescriptor;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.content.pm.ServiceInfo;
import androidx.core.app.NotificationCompat;
import com.moymir.adventure.R;

public class MiroAlarmService extends Service {
    private static final String CHANNEL="miro_wake_up_v1";
    private static final int NOTIFICATION=7410;
    private final Handler handler=new Handler(Looper.getMainLooper());
    private MediaPlayer player, greeting;
    private Vibrator vibrator;
    private long begun;
    private boolean gradual;
    private boolean speaking=false;
    private final Runnable ramp=new Runnable(){
        @Override public void run(){
            if(player==null)return;
            float progress=Math.min(1f,(System.currentTimeMillis()-begun)/30000f);
            float volume=gradual?0.15f+0.65f*progress:0.8f;
            player.setVolume(speaking?Math.min(volume,0.24f):volume,speaking?Math.min(volume,0.24f):volume);
            handler.postDelayed(this,900);
        }
    };

    @Override public void onCreate(){super.onCreate();createChannel();}
    @Override public int onStartCommand(Intent intent,int flags,int startId){
        if(player!=null)return START_NOT_STICKY;
        Notification n=notification();
        if(Build.VERSION.SDK_INT>=29)startForeground(NOTIFICATION,n,ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        else startForeground(NOTIFICATION,n);
        android.content.SharedPreferences p=MiroAlarmScheduler.prefs(this);
        gradual=p.getBoolean("gradual",true);
        begun=System.currentTimeMillis();
        int resource=R.raw.miro_alarm_sunrise;
        String tone=p.getString("tone","sunrise");
        if("robot".equals(tone))resource=R.raw.miro_alarm_robot;
        if("meadow".equals(tone))resource=R.raw.miro_alarm_meadow;
        try {
            player=makePlayer(resource,true);
            player.setVolume(gradual?0.15f:0.8f,gradual?0.15f:0.8f);
            player.start();
            handler.post(ramp);
        }catch(Exception e){android.util.Log.e("MiroAlarm","Audio player failed",e);}
        if(p.getBoolean("voice",true)){
            handler.postDelayed(()->{
                if(player==null)return;
                try {
                    greeting=makePlayer(R.raw.miro_alarm_greeting,false);
                    speaking=true;player.setVolume(0.24f,0.24f);
                    greeting.start();
                    greeting.setOnCompletionListener(mp->{mp.release();if(greeting==mp)greeting=null;speaking=false;});
                }catch(Exception e){android.util.Log.w("MiroAlarm","Greeting unavailable",e);speaking=false;}
            },10500);
        }
        if(p.getBoolean("vibrate",true)){
            vibrator=(Vibrator)getSystemService(Context.VIBRATOR_SERVICE);
            if(vibrator!=null && vibrator.hasVibrator()){
                long[] pattern={0,180,480,180,2200};
                if(Build.VERSION.SDK_INT>=26)vibrator.vibrate(VibrationEffect.createWaveform(pattern,0));
                else vibrator.vibrate(pattern,0);
            }
        }
        return START_NOT_STICKY;
    }
    private MediaPlayer makePlayer(int raw,boolean loop) throws Exception{
        AssetFileDescriptor fd=getResources().openRawResourceFd(raw);
        MediaPlayer p=new MediaPlayer();
        p.setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).setContentType(AudioAttributes.CONTENT_TYPE_MUSIC).build());
        try {p.setDataSource(fd.getFileDescriptor(),fd.getStartOffset(),fd.getLength());}
        finally {fd.close();}
        p.setLooping(loop);p.prepare();return p;
    }
    private void createChannel(){
        NotificationManager nm=(NotificationManager)getSystemService(NOTIFICATION_SERVICE);
        NotificationChannel ch=new NotificationChannel(CHANNEL,"Миро · Утренний будильник",NotificationManager.IMPORTANCE_HIGH);
        ch.setDescription("Пробуждение Миро в назначенное время");
        ch.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        ch.setSound(null,null);
        ch.enableVibration(false);
        nm.createNotificationChannel(ch);
    }
    private PendingIntent action(String action,int id){
        Intent i=new Intent(this,MiroAlarmReceiver.class).setAction(action);
        return PendingIntent.getBroadcast(this,id,i,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
    }
    private Notification notification(){
        NotificationCompat.Builder b=new NotificationCompat.Builder(this,CHANNEL)
          .setSmallIcon(R.mipmap.ic_launcher)
          .setContentTitle("☀️ Миро будит Илью")
          .setContentText("Доброе утро, Илья! Пора просыпаться.")
          .setCategory(NotificationCompat.CATEGORY_ALARM)
          .setPriority(NotificationCompat.PRIORITY_MAX)
          .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
          .setOngoing(true).setAutoCancel(false).setSilent(true)
          .setContentIntent(MiroAlarmScheduler.open(this))
          .setFullScreenIntent(MiroAlarmScheduler.open(this),true);
        if(MiroAlarmScheduler.prefs(this).getInt("snooze",5)>0)
            b.addAction(android.R.drawable.ic_media_pause,"Ещё "+MiroAlarmScheduler.prefs(this).getInt("snooze",5)+" минут",action(MiroAlarmScheduler.ACTION_SNOOZE,4105));
        b.addAction(android.R.drawable.ic_menu_close_clear_cancel,"Я проснулся",action(MiroAlarmScheduler.ACTION_DISMISS,4106));
        return b.build();
    }
    @Override public void onDestroy(){
        handler.removeCallbacksAndMessages(null);
        if(vibrator!=null)vibrator.cancel();
        if(greeting!=null){try{greeting.stop();}catch(Exception ignored){}greeting.release();greeting=null;}
        if(player!=null){try{player.stop();}catch(Exception ignored){}player.release();player=null;}
        super.onDestroy();
    }
    @Override public IBinder onBind(Intent intent){return null;}
}
