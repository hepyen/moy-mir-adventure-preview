package com.moymir.adventure.alarm;

import android.content.Context;
import com.moymir.adventure.R;
import org.json.JSONArray;
import org.json.JSONObject;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
import java.util.Locale;

/** Offline, date-specific schedule from the actual saved school timetable. */
public final class MiroAlarmMessages {
    private MiroAlarmMessages(){}
    private static int weekday(){return Calendar.getInstance().get(Calendar.DAY_OF_WEEK)-1;}
    public static List<String> subjects(Context ctx){
        List<String> found=new ArrayList<>();
        try{
            String saved=MiroAlarmScheduler.prefs(ctx).getString("lessons_week","{}");
            JSONArray arr=new JSONObject(saved).optJSONArray(Integer.toString(weekday()));
            if(arr!=null)for(int i=0;i<arr.length()&&i<12;i++){
                String s=arr.optString(i,"").trim();
                if(!s.isEmpty())found.add(s);
            }
        }catch(Exception e){android.util.Log.w("MiroAlarm","Schedule cache invalid",e);}
        return found;
    }
    public static String lessonSummary(Context ctx){
        List<String> lessons=subjects(ctx);
        if(lessons.isEmpty())return weekday()==0||weekday()==6
            ?"На сегодня школьных уроков в расписании нет."
            :"На сегодня уроки пока не записаны. Проверь расписание в разделе «Учёба».";
        return "Сегодня у тебя уроки: "+String.join(", ",lessons)+".";
    }
    public static String[] displayMessages(Context ctx){
        return new String[]{
            "Илья, вставай! Пора просыпаться. Новый день уже начался!",
            lessonSummary(ctx),
            "Илья, почисти зубы и заправь кровать!",
            "Илья, вставай! Пора просыпаться.",
            "Проверь школьный рюкзак и приготовься к новому дню."
        };
    }
    private static String soundKey(String input){
        String s=Normalizer.normalize(input,Normalizer.Form.NFD).replaceAll("\\p{M}","").toLowerCase(Locale.ROOT);
        if(s.contains("matemat")||s.contains("алгебр")||s.contains("математ"))return "math";
        if(s.contains("educacion fisica")||s.equals("ef")||s.contains("физкультур"))return "pe";
        if(s.contains("biolog")||s.contains("geolog")||s.contains("биолог"))return "biology";
        if(s.contains("geograf")||s.contains("histori")||s.contains("истор"))return "history";
        if(s.contains("ingles")||s.contains("english")||s.contains("англий"))return "english";
        if(s.contains("frances")||s.contains("french")||s.contains("француз"))return "french";
        if(s.contains("aleman")||s.contains("german")||s.contains("немец"))return "german";
        if(s.contains("lengua")||s.contains("castellan")||s.contains("espanol")||s.contains("литератур"))return "spanish";
        if(s.contains("tecnolog")||s.contains("технолог"))return "technology";
        if(s.contains("informat")||s.contains("comput")||s.contains("digital")||s.contains("информат"))return "computing";
        if(s.contains("musica")||s.contains("музык"))return "music";
        if(s.contains("plastica")||s.contains("artist")||s.contains("dibujo")||s.contains("рисован"))return "art";
        if(s.contains("tutoria")||s.contains("tutor")||s.contains("классный час"))return "tutor";
        if(s.contains("religion")||s.contains("религи"))return "religion";
        if(s.contains("valores")||s.contains("etica")||s.contains("этик"))return "values";
        if(s.contains("fisica y quimica")||s.contains("quimica")||s.contains("хими"))return "physics";
        if(s.contains("naturale"))return "nature";
        if(s.contains("sociale")||s.contains("обществ"))return "social";
        if(s.contains("latin")||s.contains("латин"))return "latin";
        if(s.contains("econom")||s.contains("эконом"))return "economics";
        if(s.contains("danza")||s.contains("bail")||s.contains("танц"))return "dance";
        if(s.contains("lectura")||s.contains("чтен"))return "reading";
        if(s.contains("ciencia")||s.contains("наука"))return "science";
        return "";
    }
    public static List<Integer> voiceSequence(Context ctx,int turn){
        List<Integer> clips=new ArrayList<>();
        switch(turn%5){
            case 0:case 2: clips.add(R.raw.miro_voice_wake);break;
            case 1:
                List<String> subjects=subjects(ctx);
                if(subjects.isEmpty()){
                    clips.add(weekday()==0||weekday()==6?R.raw.miro_voice_weekend:R.raw.miro_voice_no_schedule);
                    break;
                }
                clips.add(R.raw.miro_voice_lessons_intro);
                boolean other=false;
                for(String subject:subjects){
                    String key=soundKey(subject);
                    if(key.isEmpty()){other=true;continue;}
                    int id=ctx.getResources().getIdentifier("miro_voice_subject_"+key,"raw",ctx.getPackageName());
                    if(id!=0)clips.add(id);else other=true;
                }
                if(other)clips.add(R.raw.miro_voice_other_subject);
                break;
            case 3: clips.add(R.raw.miro_voice_chores);break;
            default:clips.add(R.raw.miro_voice_bag);break;
        }
        return clips;
    }
}
