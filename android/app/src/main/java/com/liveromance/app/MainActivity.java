package com.liveromance.app;

import android.os.Bundle;
import android.Manifest;
import android.content.pm.PackageManager;
import android.webkit.GeolocationPermissions;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final int PERMISSION_REQUEST_CODE = 100;

    // Ye saari permissions app start hote hi maangi jayengi
    private static final String[] REQUIRED_PERMISSIONS = {
        Manifest.permission.CAMERA,
        Manifest.permission.RECORD_AUDIO,
        Manifest.permission.MODIFY_AUDIO_SETTINGS,
        Manifest.permission.ACCESS_FINE_LOCATION,
        Manifest.permission.ACCESS_COARSE_LOCATION
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // App open hote hi permissions maango
        requestAllPermissions();
    }

    @Override
    protected void onResume() {
        super.onResume();

        // ✅ SABSE IMPORTANT FIX:
        // WebView ka WebChromeClient override karo
        // Bina iske camera/mic kabhi kaam nahi karega APK mein
        WebView webView = getBridge().getWebView();
        webView.setWebChromeClient(new WebChromeClient() {

            // 📸🎤 Camera + Mic permission (WebRTC ke liye)
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(() -> {
                    request.grant(request.getResources());
                });
            }

            // 📍 Location permission (Ads + Map ke liye)
            @Override
            public void onGeolocationPermissionsShowPrompt(
                String origin,
                GeolocationPermissions.Callback callback
            ) {
                callback.invoke(origin, true, false);
            }
        });
    }

    // ----------------------------------------
    // Native Android Permissions Request
    // ----------------------------------------
    private void requestAllPermissions() {
        boolean needsRequest = false;

        for (String permission : REQUIRED_PERMISSIONS) {
            if (ContextCompat.checkSelfPermission(this, permission)
                    != PackageManager.PERMISSION_GRANTED) {
                needsRequest = true;
                break;
            }
        }

        if (needsRequest) {
            ActivityCompat.requestPermissions(
                this,
                REQUIRED_PERMISSIONS,
                PERMISSION_REQUEST_CODE
            );
        }
    }

    // ----------------------------------------
    // Permission Result Handle Karo
    // ----------------------------------------
    @Override
    public void onRequestPermissionsResult(
        int requestCode,
        String[] permissions,
        int[] grantResults
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);

        if (requestCode == PERMISSION_REQUEST_CODE) {
            boolean allGranted = true;
            for (int result : grantResults) {
                if (result != PackageManager.PERMISSION_GRANTED) {
                    allGranted = false;
                    break;
                }
            }

            if (!allGranted) {
                // Agar koi permission deny ho gayi toh dobara maango
                requestAllPermissions();
            }
        }
    }
}