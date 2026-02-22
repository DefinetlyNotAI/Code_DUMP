package com.wesmun.nfc;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Inject a global JS variable into the WebView
        this.bridge.getWebView().evaluateJavascript("window.IS_ANDROID_APK = true;", null);
    }
}
