package com.moymir.adventure.alarm;

import android.Manifest;
import android.app.NotificationManager;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.util.Calendar;

@CapacitorPlugin(name="MiroAlarm",permissions={@Permission(alias="notifications",strings={Manifest.permission.POST_NOTIFICATIONS})})
public class MiroAlarmPlugin extends Plugin {
    private JSObject status(){
        android.content.SharedPreferences p=MiroAlarmScheduler.prefs(getContext());
        JSObject s=new JSObject();
        s.put("enabled",p.getBoolean("enabled",false));
        s.put("hour",p.getInt("hour",7));s.put("minute",p.getInt("minute",0));
        s.put("days",p.getInt("days",31));s.put("tone",p.getString("tone","sunrise"));
        s.put("voice",p.getBoolean("voice",true));
        s.put("vibrate",p.getBoolean("vibrate",true));s.put("gradual",p.getBoolean("gradual",true));
        s.put("snooze",p.getInt("snooze",5));
        s.put("exactAllowed",MiroAlarmScheduler.canSchedule(getContext()));
        s.put("nextAt",MiroAlarmScheduler.nextTime(getContext()));
        s.put("notificationsAllowed",Build.VERSION.SDK_INT<33||ContextCompat.checkSelfPermission(getContext(),Manifest.permission.POST_NOTIFICATIONS)==PackageManager.PERMISSION_GRANTED);
        NotificationManager manager=(NotificationManager)getContext().getSystemService(android.content.Context.NOTIFICATION_SERVICE);
        s.put("fullScreenAllowed",Build.VERSION.SDK_INT<34||manager.canUseFullScreenIntent());
        return s;
    }
    @PluginMethod public void getState(PluginCall call){call.resolve(status());}
    @PluginMethod public void save(PluginCall call){
        int hour=call.getInt("hour",7),minute=call.getInt("minute",0);
        int days=call.getInt("days",31),snooze=call.getInt("snooze",5);
        String tone=call.getString("tone","sunrise");
        if(hour<0||hour>23||minute<0||minute>59||days<0||days>127||snooze<0||snooze>10||
            !("sunrise".equals(tone)||"robot".equals(tone)||"meadow".equals(tone))){
            call.reject("Некорректные настройки будильника");return;
        }
        boolean enabled=Boolean.TRUE.equals(call.getBoolean("enabled",false));
        if(enabled&&days==0){call.reject("Выберите хотя бы один день недели");return;}
        if(enabled&&!MiroAlarmScheduler.canSchedule(getContext())){call.reject("Разрешите точные будильники в Android, затем сохраните ещё раз");return;}
        MiroAlarmScheduler.prefs(getContext()).edit().putBoolean("enabled",enabled)
          .putInt("hour",hour).putInt("minute",minute).putInt("days",days)
          .putInt("snooze",snooze).putString("tone",tone)
          .putBoolean("voice",Boolean.TRUE.equals(call.getBoolean("voice",true)))
          .putBoolean("vibrate",Boolean.TRUE.equals(call.getBoolean("vibrate",true)))
          .putBoolean("gradual",Boolean.TRUE.equals(call.getBoolean("gradual",true))).apply();
        if(enabled)MiroAlarmScheduler.scheduleDaily(getContext());else MiroAlarmScheduler.disable(getContext());
        call.resolve(status());
    }
    @PluginMethod public void requestExactAlarm(PluginCall call){
        if(Build.VERSION.SDK_INT>=31&&!MiroAlarmScheduler.canSchedule(getContext())){
            Intent i=new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM,Uri.parse("package:"+getContext().getPackageName()));
            getActivity().startActivity(i);
        }
        call.resolve(status());
    }
    @PluginMethod public void requestFullScreen(PluginCall call){
        if(Build.VERSION.SDK_INT>=34){
            NotificationManager m=(NotificationManager)getContext().getSystemService(android.content.Context.NOTIFICATION_SERVICE);
            if(!m.canUseFullScreenIntent()){
                Intent i=new Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT,Uri.parse("package:"+getContext().getPackageName()));
                getActivity().startActivity(i);
            }
        }
        call.resolve(status());
    }
    @PluginMethod public void requestNotifications(PluginCall call){
        if(Build.VERSION.SDK_INT>=33&&ContextCompat.checkSelfPermission(getContext(),Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED){
            requestPermissionForAlias("notifications",call,"notificationResult");
        }else call.resolve(status());
    }
    @PermissionCallback private void notificationResult(PluginCall call){call.resolve(status());}
    @PluginMethod public void test(PluginCall call){
        if(!MiroAlarmScheduler.canSchedule(getContext())){call.reject("Сначала разрешите точные будильники");return;}
        // Test runs only if enabled; it does not alter the weekly recurring schedule.
        if(!MiroAlarmScheduler.prefs(getContext()).getBoolean("enabled",false)){call.reject("Включите и сохраните будильник");return;}
        MiroAlarmScheduler.test(getContext());call.resolve();
    }
    @Override protected void handleOnResume(){
        super.handleOnResume();
        if(MiroAlarmScheduler.canSchedule(getContext()))MiroAlarmScheduler.scheduleDaily(getContext());
    }
}
