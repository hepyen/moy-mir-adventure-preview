package com.moymir.adventure.alarm;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import androidx.core.content.ContextCompat;

public class MiroAlarmReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context context,Intent intent) {
        String action=intent==null?"":intent.getAction();
        if(Intent.ACTION_BOOT_COMPLETED.equals(action)||Intent.ACTION_TIME_CHANGED.equals(action)||
          Intent.ACTION_TIMEZONE_CHANGED.equals(action)||Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)||
          "android.app.action.SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED".equals(action)){
            if(MiroAlarmScheduler.canSchedule(context))MiroAlarmScheduler.scheduleDaily(context);
            return;
        }
        if(MiroAlarmScheduler.ACTION_DISMISS.equals(action)){
            MiroAlarmScheduler.cancelSnooze(context);
            context.stopService(new Intent(context,MiroAlarmService.class));
            return;
        }
        if(MiroAlarmScheduler.ACTION_SNOOZE.equals(action)){
            try {MiroAlarmScheduler.snooze(context);}catch(SecurityException ignored){}
            context.stopService(new Intent(context,MiroAlarmService.class));
            return;
        }
        if(MiroAlarmScheduler.ACTION_RING.equals(action)){
            MiroAlarmScheduler.scheduleDaily(context);
        }else if(MiroAlarmScheduler.ACTION_SNOOZE_RING.equals(action)){
            if(!MiroAlarmScheduler.prefs(context).getBoolean("enabled",false))return;
        }else return;
        if(!MiroAlarmScheduler.prefs(context).getBoolean("enabled",false))return;
        Intent service=new Intent(context,MiroAlarmService.class);
        try { ContextCompat.startForegroundService(context,service); }
        catch(RuntimeException e) {
            android.util.Log.e("MiroAlarm","Cannot start ringing service",e);
        }
    }
}
