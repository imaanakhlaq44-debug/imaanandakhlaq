package com.imaanakhlaq.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.view.KeyEvent;
import android.webkit.WebView;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final int PERM_REQ = 4321;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestNeededPermissions();
        tweakWebViewSettings();
    }

    /**
     * Hardware/system BACK button:
     *   - If WebView has navigation history → go back one page (like a browser)
     *   - Otherwise → fall through to default (which finishes the activity / exits)
     */
    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK) {
            try {
                WebView webView = this.bridge != null ? this.bridge.getWebView() : null;
                if (webView != null && webView.canGoBack()) {
                    webView.goBack();
                    return true;
                }
            } catch (Throwable t) {
                t.printStackTrace();
            }
        }
        return super.onKeyDown(keyCode, event);
    }

    private void requestNeededPermissions() {
        String[] perms = new String[] {
            Manifest.permission.CAMERA,
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION
        };
        java.util.ArrayList<String> need = new java.util.ArrayList<>();
        for (String p : perms) {
            if (ContextCompat.checkSelfPermission(this, p) != PackageManager.PERMISSION_GRANTED) {
                need.add(p);
            }
        }
        if (!need.isEmpty()) {
            ActivityCompat.requestPermissions(this, need.toArray(new String[0]), PERM_REQ);
        }
    }

    /**
     * Capacitor's BridgeWebChromeClient already handles onGeolocationPermissionsShowPrompt
     * and onPermissionRequest correctly. Do NOT replace the WebChromeClient (it would break
     * the JS bridge: onJsAlert, onJsConfirm, plugin permission launcher integration).
     *
     * We only adjust two WebSettings here:
     *  - setGeolocationEnabled(true): enable HTML5 geolocation in the WebView
     *  - setMediaPlaybackRequiresUserGesture(false): allow the AR camera <video> to autoplay
     */
    private void tweakWebViewSettings() {
        try {
            WebView webView = this.bridge.getWebView();
            if (webView == null) return;
            webView.getSettings().setGeolocationEnabled(true);
            webView.getSettings().setMediaPlaybackRequiresUserGesture(false);
        } catch (Throwable t) {
            t.printStackTrace();
        }
    }
}


