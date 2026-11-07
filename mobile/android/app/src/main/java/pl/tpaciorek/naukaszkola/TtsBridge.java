package pl.tpaciorek.naukaszkola;

import android.content.Context;
import android.media.AudioAttributes;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Locale;

/**
 * Most między stroną a systemowym lektorem Androida (TextToSpeech).
 * WebView nie ma speechSynthesis, więc skrypt assets/tts-polyfill.js
 * udaje je w przeglądarce i przekazuje tekst tutaj (obiekt AndroidTTS).
 */
final class TtsBridge {
    private static final String[][] LANGS = {
            {"pl-PL", "Google polski (Android)"},
            {"en-GB", "Google UK English (Android)"},
            {"en-US", "Google US English (Android)"}
    };
    private static final int MAX_TEXT = 4000;

    private final WebView webView;
    private final Handler main = new Handler(Looper.getMainLooper());
    private final TextToSpeech tts;
    private volatile boolean ready;
    private volatile String voicesJson = "[]";

    TtsBridge(Context context, WebView webView) {
        this.webView = webView;
        tts = new TextToSpeech(context.getApplicationContext(), status -> {
            if (status != TextToSpeech.SUCCESS) return;
            ready = true;
            voicesJson = buildVoices();
            pushVoices();
        });
        tts.setAudioAttributes(new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                .build());
        tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
            @Override public void onStart(String id) { send(id, "start"); }
            @Override public void onDone(String id) { send(id, "end"); }
            @Override @Deprecated public void onError(String id) { send(id, "error"); }
            @Override public void onError(String id, int code) { send(id, "error"); }
            @Override public void onStop(String id, boolean interrupted) { send(id, "error"); }
        });
    }

    private String buildVoices() {
        JSONArray list = new JSONArray();
        for (String[] l : LANGS) {
            try {
                if (tts.isLanguageAvailable(Locale.forLanguageTag(l[0])) >= TextToSpeech.LANG_AVAILABLE) {
                    JSONObject v = new JSONObject();
                    v.put("name", l[1]);
                    v.put("lang", l[0]);
                    v.put("def", "pl-PL".equals(l[0]));
                    list.put(v);
                }
            } catch (Exception ignored) {
            }
        }
        return list.toString();
    }

    /** Po każdym wczytaniu strony – przekaż jej listę głosów (lektor mógł się włączyć później). */
    void pushVoices() {
        if (!ready) return;
        String js = "window.__androidTtsVoices&&window.__androidTtsVoices(" + voicesJson + ")";
        main.post(() -> webView.evaluateJavascript(js, null));
    }

    private void send(String id, String type) {
        if (id == null || !id.matches("\\d{1,12}")) return;
        String js = "window.__androidTtsEvent&&window.__androidTtsEvent('" + id + "','" + type + "')";
        main.post(() -> webView.evaluateJavascript(js, null));
    }

    @JavascriptInterface
    public String voices() {
        return voicesJson;
    }

    @JavascriptInterface
    public boolean speak(String id, String text, String lang, double rate, double pitch) {
        if (!ready || id == null || !id.matches("\\d{1,12}") || text == null) return false;
        if (text.length() > MAX_TEXT) text = text.substring(0, MAX_TEXT);
        synchronized (tts) {
            Locale locale = Locale.forLanguageTag(lang == null || lang.isEmpty() ? "pl-PL" : lang.replace('_', '-'));
            if (tts.isLanguageAvailable(locale) < TextToSpeech.LANG_AVAILABLE) locale = Locale.forLanguageTag("pl-PL");
            tts.setLanguage(locale);
            tts.setSpeechRate((float) Math.max(0.1, Math.min(rate, 4.0)));
            tts.setPitch((float) Math.max(0.1, Math.min(pitch, 2.0)));
            Bundle params = new Bundle();
            return tts.speak(text, TextToSpeech.QUEUE_FLUSH, params, id) == TextToSpeech.SUCCESS;
        }
    }

    @JavascriptInterface
    public void stop() {
        if (ready) tts.stop();
    }

    void shutdown() {
        ready = false;
        tts.stop();
        tts.shutdown();
    }
}
