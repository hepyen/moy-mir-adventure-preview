package com.moymir.adventure;

import android.content.SharedPreferences;
import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.plugin.WebView;
import com.moymir.adventure.alarm.MiroAlarmPlugin;

public class MainActivity extends BridgeActivity {
    private static final String RECOVERY_TOKEN = "moymir_recovery_3_8_5_done";

    /**
     * Runs before Capacitor Bridge creates the WebView.
     * The bad 3.8.3 OTA could leave a previous bundle path active even after an APK
     * replacement. Restore ONLY updater routing, not app storage or user progress.
     */
    private void recoverWebBundleBeforeBridge() {
        SharedPreferences prefs = getSharedPreferences(WebView.WEBVIEW_PREFS_NAME, MODE_PRIVATE);
        if (prefs.getBoolean(RECOVERY_TOKEN, false)) return;

        boolean written = prefs.edit()
            .putString(WebView.CAP_SERVER_PATH, "public")
            .remove("pastVersion")
            .remove("nextVersion")
            .remove("previewFallbackVersion")
            .putBoolean(RECOVERY_TOKEN, true)
            .commit();
        Log.i("MoyMirRecovery", "Native web bundle recovery applied=" + written);
    }

    @Override public void onCreate(Bundle savedInstanceState) {
        recoverWebBundleBeforeBridge();
        registerPlugin(MiroAlarmPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
