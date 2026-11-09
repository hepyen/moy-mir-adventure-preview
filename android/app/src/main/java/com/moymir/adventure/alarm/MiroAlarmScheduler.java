package com.moymir.adventure.alarm;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.provider.Settings;
import java.util.Calendar;

public final class MiroAlarmScheduler {
    public static final String PREFS = "miro_morning_alarm_v1";
    public static final String ACTION_RING = "com.moymir.adventure.alarm.RING";
    public static final String ACTION_SNOOZE_RING = "com.moymir.adventure.alarm.SNOOZE_RING";
    public static final String ACTION_DISMISS = "com.moymir.adventure.alarm.DISMISS";
    public static final String ACTION_SNOOZE = "com.moymir.adventure.alarm.SNOOZE";
    private static final int REQ_DAILY = 4101, REQ_SNOOZE = 4102, REQ_TEST = 4103;
    private MiroAlarmScheduler(){}

    public static SharedPreferences prefs(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }
    public static boolean canSchedule(Context context) {
        AlarmManager manager=(AlarmManager)context.getSystemService(Context.ALARM_SERVICE);
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.S || manager.canScheduleExactAlarms();
    }
    public static long nextTime(Context context) {
        SharedPreferences p=prefs(context);
        if(!p.getBoolean("enabled",false))return 0L;
        int days=p.getInt("days",31);
        int hour=p.getInt("hour",7),minute=p.getInt("minute",0);
        Calendar now=Calendar.getInstance();
        for(int offset=0;offset<=7;offset++){
            Calendar c=(Calendar)now.clone();
            c.add(Calendar.DAY_OF_YEAR,offset);
            int mondayFirst=(c.get(Calendar.DAY_OF_WEEK)+5)%7;
            if((days&(1<<mondayFirst))==0)continue;
            c.set(Calendar.HOUR_OF_DAY,hour);
            c.set(Calendar.MINUTE,minute);
            c.set(Calendar.SECOND,0);
            c.set(Calendar.MILLISECOND,0);
            if(c.getTimeInMillis()>System.currentTimeMillis()+1000)return c.getTimeInMillis();
        }
        return 0L;
    }
    private static PendingIntent pending(Context context,String action,int code,int flags){
        Intent intent=new Intent(context,MiroAlarmReceiver.class).setAction(action);
        return PendingIntent.getBroadcast(context,code,intent,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE|flags);
    }
    public static PendingIntent open(Context context){
        Intent i=new Intent(context,MiroAlarmActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_SINGLE_TOP|Intent.FLAG_ACTIVITY_CLEAR_TOP);
        return PendingIntent.getActivity(context,4104,i,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
    }
    private static void at(Context context,long time,String action,int requestCode){
        if(!canSchedule(context))throw new SecurityException("Разрешите точные будильники в настройках Android");
        AlarmManager m=(AlarmManager)context.getSystemService(Context.ALARM_SERVICE);
        m.setAlarmClock(new AlarmManager.AlarmClockInfo(time,open(context)),pending(context,action,requestCode,0));
    }
    private static void cancel(Context context,String action,int requestCode){
        AlarmManager m=(AlarmManager)context.getSystemService(Context.ALARM_SERVICE);
        m.cancel(pending(context,action,requestCode,0));
    }
    public static void scheduleDaily(Context context) {
        cancel(context,ACTION_RING,REQ_DAILY);
        long next=nextTime(context);
        if(next>0 && canSchedule(context))at(context,next,ACTION_RING,REQ_DAILY);
    }
    public static void cancelSnooze(Context context){
        cancel(context,ACTION_SNOOZE_RING,REQ_SNOOZE);
    }
    public static void snooze(Context context){
        int min=prefs(context).getInt("snooze",5);
        if(min<=0)return;
        cancelSnooze(context);
        at(context,System.currentTimeMillis()+min*60000L,ACTION_SNOOZE_RING,REQ_SNOOZE);
    }
    public static void test(Context context){
        at(context,System.currentTimeMillis()+4000L,ACTION_SNOOZE_RING,REQ_TEST);
    }
    public static void cancelTest(Context context){
        cancel(context,ACTION_SNOOZE_RING,REQ_TEST);
    }
    public static void disable(Context context) {
        prefs(context).edit().putBoolean("enabled",false).apply();
        cancel(context,ACTION_RING,REQ_DAILY);
        cancelSnooze(context);
        cancelTest(context);
    }
}
