# Keep the JavaScript bridge (TtsBridge) when minification is turned on
-keepclassmembers class pl.tpaciorek.naukaszkola.TtsBridge {
    @android.webkit.JavascriptInterface <methods>;
}
