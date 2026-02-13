package com.shannu.mytdp;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

import com.google.firebase.messaging.FirebaseMessaging;

public class MainActivity extends AppCompatActivity {

    private WebView webView;
    private ValueCallback<Uri[]> filePathCallback;
    private static final int FILECHOOSER_RESULTCODE = 1;

    private String pendingPushJson = null;

    private static String escapeJs(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
    }

    private void capturePushFromIntent(Intent intent) {
        if (intent == null) return;
        try {
            String type = intent.getStringExtra("type");
            String scope = intent.getStringExtra("scope");
            String fromUserId = intent.getStringExtra("fromUserId");
            String toUserId = intent.getStringExtra("toUserId");
            String callId = intent.getStringExtra("callId");
            String kind = intent.getStringExtra("kind");
            String groupId = intent.getStringExtra("groupId");
            String messageId = intent.getStringExtra("messageId");
            String autoAnswer = intent.getStringExtra("autoAnswer");

            if (type == null && callId == null && fromUserId == null && messageId == null && groupId == null) {
                return;
            }

            pendingPushJson = "{" +
                    "\"type\":\"" + escapeJs(type) + "\"," +
                    "\"scope\":\"" + escapeJs(scope) + "\"," +
                    "\"fromUserId\":\"" + escapeJs(fromUserId) + "\"," +
                    "\"toUserId\":\"" + escapeJs(toUserId) + "\"," +
                    "\"callId\":\"" + escapeJs(callId) + "\"," +
                    "\"kind\":\"" + escapeJs(kind) + "\"," +
                    "\"groupId\":\"" + escapeJs(groupId) + "\"," +
                    "\"messageId\":\"" + escapeJs(messageId) + "\"," +
                    "\"autoAnswer\":\"" + escapeJs(autoAnswer) + "\"" +
                    "}";
        } catch (Exception ignored) {
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        capturePushFromIntent(getIntent());

        // ✅ Fullscreen
        getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_FULLSCREEN |
                        View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
                        View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
        );

        setContentView(R.layout.activity_main);

        // ✅ Runtime permissions (Android 6.0+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            requestPermissions(new String[]{
                    Manifest.permission.CAMERA,
                    Manifest.permission.READ_EXTERNAL_STORAGE,
                    Manifest.permission.WRITE_EXTERNAL_STORAGE
            }, 1001);
        }

        // ✅ Android 13+ notifications permission
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            requestPermissions(new String[]{
                    Manifest.permission.POST_NOTIFICATIONS
            }, 1002);
        }

        webView = findViewById(R.id.webview);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(false);

        // ✅ Enable cookies
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);

        // ✅ Load website in WebView + inject FCM token
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);

                FirebaseMessaging.getInstance().getToken().addOnCompleteListener(task -> {
                    if (!task.isSuccessful()) return;
                    String token = task.getResult();
                    if (token == null || token.trim().isEmpty()) return;

                    String safe = token.replace("'", "\\'");
                    webView.evaluateJavascript("window.setFcmToken('" + safe + "')", null);
                });

                if (pendingPushJson != null) {
                    String js = "(function(){try{if(window.handlePushOpen){window.handlePushOpen(" + pendingPushJson + ");}}catch(e){}})();";
                    webView.evaluateJavascript(js, null);
                    pendingPushJson = null;
                }
            }
        });

        // ✅ Enable file upload (camera/file)
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
                MainActivity.this.filePathCallback = filePathCallback;
                Intent intent = fileChooserParams.createIntent();
                try {
                    startActivityForResult(intent, FILECHOOSER_RESULTCODE);
                } catch (Exception e) {
                    MainActivity.this.filePathCallback = null;
                    return false;
                }
                return true;
            }
        });

        webView.loadUrl("https://tdp2-frontend.onrender.com/");
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        capturePushFromIntent(intent);
        if (webView != null) {
            webView.post(() -> {
                if (pendingPushJson == null) return;
                String js = "(function(){try{if(window.handlePushOpen){window.handlePushOpen(" + pendingPushJson + ");}}catch(e){}})();";
                webView.evaluateJavascript(js, null);
                pendingPushJson = null;
            });
        }
    }

    // ✅ Handle file chooser result
    @Override
    protected void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode == FILECHOOSER_RESULTCODE && filePathCallback != null) {
            Uri[] result = null;
            if (resultCode == Activity.RESULT_OK && data != null) {
                Uri dataUri = data.getData();
                if (dataUri != null) {
                    result = new Uri[]{dataUri};
                }
            }
            filePathCallback.onReceiveValue(result);
            filePathCallback = null;
        }
    }

    // ✅ WebView back button handling
    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
