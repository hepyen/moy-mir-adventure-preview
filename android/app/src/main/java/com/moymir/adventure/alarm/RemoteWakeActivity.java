package com.moymir.adventure.alarm;
import android.app.Activity;
import android.os.*;
import android.content.Intent;
import android.view.*;
import android.widget.*;
import android.graphics.Color;
public class RemoteWakeActivity extends Activity{
 private final Handler h=new Handler(Looper.getMainLooper());
 @Override public void onCreate(Bundle b){super.onCreate(b);if(Build.VERSION.SDK_INT>=27){setShowWhenLocked(true);setTurnScreenOn(true);}else getWindow().addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED|WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON);getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
 LinearLayout l=new LinearLayout(this);l.setOrientation(1);l.setGravity(Gravity.CENTER);l.setPadding(40,40,40,40);l.setBackgroundColor(0xffffe4a0);
 TextView t=new TextView(this);t.setText("☀\nИлья, пора вставать!\n\nРодители отправили сигнал пробуждения");t.setTextSize(27);t.setGravity(Gravity.CENTER);t.setTextColor(0xff573719);l.addView(t);
 Button a=new Button(this);a.setText("Я проснулся!");a.setTextSize(22);a.setOnClickListener(v->{startService(new Intent(this,RemoteWakeService.class).setAction(RemoteWakeService.ACTION_AWAKE));finish();});l.addView(a);setContentView(l);
 h.postDelayed(new Runnable(){public void run(){if(!RemoteWakeService.ringing){finish();return;}h.postDelayed(this,1000);}},2000);
 }
 @Override protected void onDestroy(){h.removeCallbacksAndMessages(null);super.onDestroy();}
}
