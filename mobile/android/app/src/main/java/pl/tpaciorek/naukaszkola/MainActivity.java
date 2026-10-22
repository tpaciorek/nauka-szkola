package pl.tpaciorek.naukaszkola;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.Bundle;
import android.util.Base64;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONObject;

import java.nio.charset.StandardCharsets;
import java.util.Iterator;

public final class MainActivity extends Activity {
    private static final String HOME_URL = "https://tpaciorek.github.io/nauka-szkola/";
    private static final String TRANSFER_URL = HOME_URL + "?transfer=1";
    private static final String ALLOWED_HOST = "tpaciorek.github.io";
    private static final String PREFS_NAME = "nauka_szkola_settings";
    private static final String PREF_TRANSFER_DECIDED = "progress_transfer_decided";
    private static final int MAX_TRANSFER_BYTES = 512 * 1024;

    private WebView webView;
    private ProgressBar progressBar;
    private LinearLayout errorView;
    private String pendingImportJson;
    private boolean transferPromptDisplayedThisSession;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(239, 246, 255));

        webView = new WebView(this);
        webView.setId(View.generateViewId());
        configureWebView(webView);
        root.addView(webView, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));

        progressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progressBar.setMax(100);
        FrameLayout.LayoutParams progressParams = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                dp(4)
        );
        progressParams.gravity = Gravity.TOP;
        root.addView(progressBar, progressParams);

        errorView = createErrorView();
        errorView.setVisibility(View.GONE);
        root.addView(errorView, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));

        setContentView(root);

        prepareProgressImport(getIntent());

        if (pendingImportJson != null) {
            webView.loadUrl(HOME_URL);
        } else if (savedInstanceState == null || webView.restoreState(savedInstanceState) == null) {
            webView.loadUrl(HOME_URL);
        }
    }

    private void configureWebView(WebView view) {
        WebSettings settings = view.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);

        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(view, false);

        view.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView webView, int progress) {
                progressBar.setProgress(progress);
                progressBar.setVisibility(progress < 100 ? View.VISIBLE : View.GONE);
            }
        });

        view.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if ("https".equals(uri.getScheme()) && ALLOWED_HOST.equals(uri.getHost())) {
                    return false;
                }
                startActivity(new Intent(Intent.ACTION_VIEW, uri));
                return true;
            }

            @Override
            public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
                errorView.setVisibility(View.GONE);
                view.setVisibility(View.VISIBLE);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                if (pendingImportJson != null && url.startsWith(HOME_URL)) {
                    applyPendingProgress(view);
                    return;
                }

                if (HOME_URL.equals(url)) {
                    offerChromeTransferWhenNeeded(view);
                }
            }

            @Override
            public void onReceivedError(
                    WebView view,
                    WebResourceRequest request,
                    WebResourceError error
            ) {
                if (request.isForMainFrame()) {
                    view.setVisibility(View.GONE);
                    errorView.setVisibility(View.VISIBLE);
                }
            }
        });
    }

    private void offerChromeTransferWhenNeeded(WebView view) {
        SharedPreferences preferences = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        if (transferPromptDisplayedThisSession
                || preferences.getBoolean(PREF_TRANSFER_DECIDED, false)) {
            return;
        }

        view.evaluateJavascript(
                "Object.keys(localStorage).some(function(key){return key.indexOf('nauka-')===0;})",
                result -> {
                    if ("true".equals(result)) {
                        preferences.edit().putBoolean(PREF_TRANSFER_DECIDED, true).apply();
                        return;
                    }

                    if (!"false".equals(result) || isFinishing()) {
                        return;
                    }

                    transferPromptDisplayedThisSession = true;
                    new AlertDialog.Builder(this)
                            .setTitle(R.string.transfer_title)
                            .setMessage(R.string.transfer_message)
                            .setPositiveButton(R.string.transfer_open_chrome, (dialog, which) -> openTransferInChrome())
                            .setNegativeButton(R.string.transfer_skip, (dialog, which) -> preferences
                                    .edit()
                                    .putBoolean(PREF_TRANSFER_DECIDED, true)
                                    .apply())
                            .show();
                }
        );
    }

    private void openTransferInChrome() {
        Intent chromeIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(TRANSFER_URL));
        chromeIntent.setPackage("com.android.chrome");
        try {
            startActivity(chromeIntent);
        } catch (ActivityNotFoundException exception) {
            startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(TRANSFER_URL)));
        }
    }

    private void prepareProgressImport(Intent intent) {
        Uri uri = intent != null ? intent.getData() : null;
        if (uri == null
                || !"naukaszkola".equals(uri.getScheme())
                || !"import".equals(uri.getHost())) {
            return;
        }

        String payload = uri.getFragment();
        if (payload == null || payload.isEmpty() || payload.length() > MAX_TRANSFER_BYTES * 2) {
            Toast.makeText(this, R.string.transfer_invalid, Toast.LENGTH_LONG).show();
            return;
        }

        try {
            byte[] decoded = Base64.decode(
                    payload,
                    Base64.URL_SAFE | Base64.NO_WRAP | Base64.NO_PADDING
            );
            if (decoded.length > MAX_TRANSFER_BYTES) {
                throw new IllegalArgumentException("Transfer payload is too large");
            }

            JSONObject source = new JSONObject(new String(decoded, StandardCharsets.UTF_8));
            JSONObject safeProgress = new JSONObject();
            Iterator<String> keys = source.keys();
            int importedBytes = 0;

            while (keys.hasNext()) {
                String key = keys.next();
                Object rawValue = source.opt(key);
                if (!key.startsWith("nauka-") || key.length() > 128 || !(rawValue instanceof String)) {
                    continue;
                }

                String value = (String) rawValue;
                importedBytes += value.getBytes(StandardCharsets.UTF_8).length;
                if (importedBytes > MAX_TRANSFER_BYTES) {
                    throw new IllegalArgumentException("Transfer payload is too large");
                }
                safeProgress.put(key, value);
            }

            if (safeProgress.length() == 0) {
                Toast.makeText(this, R.string.transfer_empty, Toast.LENGTH_LONG).show();
                return;
            }

            pendingImportJson = safeProgress.toString();
        } catch (Exception exception) {
            pendingImportJson = null;
            Toast.makeText(this, R.string.transfer_invalid, Toast.LENGTH_LONG).show();
        }
    }

    private void applyPendingProgress(WebView view) {
        String progressJson = pendingImportJson;
        pendingImportJson = null;
        String script = "(function(){var data=JSON.parse(" + JSONObject.quote(progressJson) + ");"
                + "Object.keys(data).forEach(function(key){localStorage.setItem(key,data[key]);});"
                + "return Object.keys(data).length;})()";

        view.evaluateJavascript(script, result -> {
            getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
                    .edit()
                    .putBoolean(PREF_TRANSFER_DECIDED, true)
                    .apply();
            Toast.makeText(this, R.string.transfer_success, Toast.LENGTH_LONG).show();
            view.loadUrl(HOME_URL);
        });
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        prepareProgressImport(intent);
        if (pendingImportJson != null) {
            webView.loadUrl(HOME_URL);
        }
    }

    private LinearLayout createErrorView() {
        LinearLayout container = new LinearLayout(this);
        container.setOrientation(LinearLayout.VERTICAL);
        container.setGravity(Gravity.CENTER);
        container.setPadding(dp(32), dp(32), dp(32), dp(32));
        container.setBackgroundColor(Color.rgb(239, 246, 255));

        TextView icon = new TextView(this);
        icon.setText("📚");
        icon.setTextSize(52);
        icon.setGravity(Gravity.CENTER);
        container.addView(icon);

        TextView title = new TextView(this);
        title.setText(R.string.offline_title);
        title.setTextSize(24);
        title.setTextColor(Color.rgb(15, 23, 42));
        title.setGravity(Gravity.CENTER);
        title.setPadding(0, dp(16), 0, dp(8));
        container.addView(title);

        TextView message = new TextView(this);
        message.setText(R.string.offline_message);
        message.setTextSize(16);
        message.setTextColor(Color.rgb(71, 85, 105));
        message.setGravity(Gravity.CENTER);
        container.addView(message);

        Button retry = new Button(this);
        retry.setText(R.string.retry);
        retry.setTextSize(17);
        retry.setAllCaps(false);
        retry.setOnClickListener(v -> {
            errorView.setVisibility(View.GONE);
            webView.setVisibility(View.VISIBLE);
            if (hasNetwork()) {
                webView.reload();
            } else {
                webView.getSettings().setCacheMode(WebSettings.LOAD_CACHE_ELSE_NETWORK);
                webView.loadUrl(webView.getUrl() != null ? webView.getUrl() : HOME_URL);
            }
        });
        LinearLayout.LayoutParams buttonParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        buttonParams.topMargin = dp(24);
        container.addView(retry, buttonParams);

        return container;
    }

    private boolean hasNetwork() {
        ConnectivityManager manager = getSystemService(ConnectivityManager.class);
        Network network = manager.getActiveNetwork();
        if (network == null) {
            return false;
        }
        NetworkCapabilities capabilities = manager.getNetworkCapabilities(network);
        return capabilities != null && capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET);
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        webView.saveState(outState);
        super.onSaveInstanceState(outState);
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        webView.stopLoading();
        webView.destroy();
        super.onDestroy();
    }
}
