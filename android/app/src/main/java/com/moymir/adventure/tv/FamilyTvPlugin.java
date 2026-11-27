package com.moymir.adventure.tv;
import android.app.AlertDialog;
import android.content.SharedPreferences;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.JSObject;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

@CapacitorPlugin(name="FamilyTv")
public class FamilyTvPlugin extends Plugin {
    private final ExecutorService worker=Executors.newSingleThreadExecutor();
    private final AtomicBoolean busy=new AtomicBoolean();
    @PluginMethod public void execute(PluginCall call){
        String ip=call.getString("ip",""),cmd=call.getString("command","");
        if(!LegacyTvRemote.privateIpv4(ip)||!(cmd.equals("pair")||cmd.equals("off")||cmd.equals("source"))){call.reject("Неверный локальный адрес или команда");return;}
        if(!busy.compareAndSet(false,true)){call.reject("Дождись завершения команды");return;}
        getActivity().runOnUiThread(()->{
            String message=cmd.equals("pair")?"На телевизоре может появиться запрос на разрешение пульта My World TV. Подтверди его обычным пультом.":cmd.equals("off")?"Выключить телевизор? Убедись, что игра сохранена.":"Открыть меню источников телевизора?";
            AlertDialog dialog=new AlertDialog.Builder(getActivity()).setTitle("Семейный телевизор").setMessage(message)
            .setNegativeButton("Отмена",(d,w)->{busy.set(false);call.reject("Отменено");})
            .setPositiveButton("Продолжить",(d,w)->worker.execute(()->{
                try{
                    SharedPreferences p=getContext().getSharedPreferences("family_tv_remote",0);
                    String id=p.getString("id",null);if(id==null){id=UUID.randomUUID().toString();p.edit().putString("id",id).apply();}
                    LegacyTvRemote.run(ip,id,cmd);
                    JSObject r=new JSObject();r.put("accepted",true);call.resolve(r);
                }catch(Exception e){call.reject("Нет подтверждения от телевизора: "+e.getMessage());}
                finally{busy.set(false);}
            })).create();
            dialog.setOnCancelListener(d->{busy.set(false);call.reject("Отменено");});dialog.show();
        });
    }
}
