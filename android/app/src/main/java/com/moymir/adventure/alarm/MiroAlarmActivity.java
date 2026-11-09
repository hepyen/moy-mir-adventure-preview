package com.moymir.adventure.alarm;

import android.app.Activity;
import android.animation.ObjectAnimator;
import android.animation.ValueAnimator;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import com.moymir.adventure.R;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class MiroAlarmActivity extends Activity {
    private Handler handler=new Handler(Looper.getMainLooper());
    private TextView speech;
    private ObjectAnimator floatAnimation;
    private boolean responded=false;
    private int px(float dp){return (int)(dp*getResources().getDisplayMetrics().density+0.5f);}
    private GradientDrawable rounded(int color,int radius){
        GradientDrawable d=new GradientDrawable();d.setColor(color);d.setCornerRadius(px(radius));return d;
    }
    private TextView text(String value,int size,int color,boolean bold){
        TextView t=new TextView(this);
        t.setText(value);t.setTextSize(size);t.setTextColor(color);
        t.setGravity(Gravity.CENTER);
        if(bold)t.setTypeface(Typeface.DEFAULT,Typeface.BOLD);
        return t;
    }
    @Override protected void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        if(Build.VERSION.SDK_INT>=27){setShowWhenLocked(true);setTurnScreenOn(true);}
        else getWindow().addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED|WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        getWindow().setStatusBarColor(Color.rgb(18,57,86));
        getWindow().setNavigationBarColor(Color.rgb(25,71,95));
        FrameLayout backdrop=new FrameLayout(this);
        GradientDrawable sky=new GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM,new int[]{0xff19567d,0xff73bdd1,0xffffe1a6});
        backdrop.setBackground(sky);
        ScrollView scroll=new ScrollView(this);scroll.setFillViewport(true);
        backdrop.addView(scroll,new FrameLayout.LayoutParams(-1,-1));
        LinearLayout content=new LinearLayout(this);
        content.setOrientation(LinearLayout.VERTICAL);content.setGravity(Gravity.CENTER_HORIZONTAL);
        content.setPadding(px(24),px(38),px(24),px(32));
        scroll.addView(content);
        TextView logo=text("✦ МОЙ МИР · БУДИЛЬНИК",13,0xffe5f5ff,true);
        content.addView(logo,lp(-1,px(35)));
        TextView clock=text(new SimpleDateFormat("HH:mm",Locale.getDefault()).format(new Date()),67,Color.WHITE,true);
        content.addView(clock,lp(-1,px(105)));
        TextView sunrise=text("☀",68,0xffffd774,false);
        content.addView(sunrise,lp(-1,px(78)));
        ImageView robot=new ImageView(this);
        robot.setImageResource(R.drawable.miro_alarm_robot);
        robot.setScaleType(ImageView.ScaleType.FIT_CENTER);
        content.addView(robot,lp(-1,px(215)));
        floatAnimation=ObjectAnimator.ofFloat(robot,"translationY",0,-px(14),0);
        floatAnimation.setDuration(2200);floatAnimation.setRepeatCount(ValueAnimator.INFINITE);floatAnimation.start();
        TextView greeting=text("Доброе утро, Илья!",25,0xff133c55,true);
        content.addView(greeting,lp(-1,px(52)));
        final String[] morningMessages=MiroAlarmMessages.displayMessages(this);
        speech=text(morningMessages[0],16,0xff264a59,false);
        speech.setPadding(px(14),px(8),px(14),px(14));
        content.addView(speech,lp(-1,px(135)));
        handler.postDelayed(new Runnable(){
            int phrase=0;
            @Override public void run(){
                if(responded)return;
                phrase=(phrase+1)%morningMessages.length;
                speech.setText(morningMessages[phrase]);
                handler.postDelayed(this,12500);
            }
        },12500);
        int snooze=MiroAlarmScheduler.prefs(this).getInt("snooze",5);
        if(snooze>0){
            Button later=button("💤  Ещё "+snooze+" минут",0xffedf9ff,0xff1f5b7c);
            later.setOnClickListener(v->answer(MiroAlarmScheduler.ACTION_SNOOZE));
            content.addView(later,lp(-1,px(55)));
        }
        Button awake=button("☀  Я проснулся!",0xff1b9c83,Color.WHITE);
        LinearLayout.LayoutParams yes=lp(-1,px(60));yes.topMargin=px(12);
        content.addView(awake,yes);
        awake.setOnClickListener(v->answer(MiroAlarmScheduler.ACTION_DISMISS));
        TextView subtitle=text("Миро ждёт тебя в «Моём мире»",12,0xff3b6574,false);
        content.addView(subtitle,lp(-1,px(40)));
        setContentView(backdrop);
    }
    private LinearLayout.LayoutParams lp(int w,int h){LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(w,h);return lp;}
    private Button button(String text,int bg,int fg){
        Button b=new Button(this);
        b.setText(text);b.setAllCaps(false);b.setTextSize(17);b.setTextColor(fg);b.setTypeface(Typeface.DEFAULT,Typeface.BOLD);
        b.setBackground(rounded(bg,22));return b;
    }
    private void answer(String action){
        if(responded)return;
        responded=true;
        sendBroadcast(new Intent(this,MiroAlarmReceiver.class).setAction(action));
        if(MiroAlarmScheduler.ACTION_DISMISS.equals(action)){
            // Open the existing world after a deliberate awake confirmation.
            Intent main=new Intent(this,com.moymir.adventure.MainActivity.class);
            main.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP|Intent.FLAG_ACTIVITY_SINGLE_TOP);
            startActivity(main);
        }
        finish();
    }
    @Override protected void onNewIntent(Intent intent){super.onNewIntent(intent);setIntent(intent);}
    @Override protected void onDestroy(){
        handler.removeCallbacksAndMessages(null);
        if(floatAnimation!=null)floatAnimation.cancel();
        super.onDestroy();
    }
}
