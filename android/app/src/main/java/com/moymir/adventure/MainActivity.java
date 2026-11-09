package com.moymir.adventure;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.moymir.adventure.alarm.MiroAlarmPlugin;

public class MainActivity extends BridgeActivity {
    @Override public void onCreate(Bundle savedInstanceState) {
        registerPlugin(MiroAlarmPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
