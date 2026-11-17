package com.imaanakhlaq

import android.view.WindowManager
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        // While a book is open the app asks for FLAG_SECURE: screenshots and
        // screen recordings come out black, and recent-apps shows no preview.
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, "imaan/screen_guard")
            .setMethodCallHandler { call, result ->
                if (call.method == "secure") {
                    val on = call.arguments as? Boolean ?: false
                    runOnUiThread {
                        if (on) {
                            window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
                        } else {
                            window.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
                        }
                        result.success(null)
                    }
                } else {
                    result.notImplemented()
                }
            }
    }
}
