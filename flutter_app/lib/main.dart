import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'app.dart';
import 'screens/entry_screens.dart' show launchLogo;
import 'app_theme.dart';
import 'data/app_repository.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: appTheme(),
      home: Scaffold(
        backgroundColor: Colors.white,
        body: SafeArea(
          child: Center(
            child: Image.asset(
              launchLogo,
              width: 300,
              height: 280,
              fit: BoxFit.contain,
              cacheWidth: 600,
              semanticLabel: 'Imaan and Akhlaq',
            ),
          ),
        ),
      ),
    ),
  );

  try {
    const apiKey = String.fromEnvironment('FIREBASE_API_KEY');
    const projectId = String.fromEnvironment('FIREBASE_PROJECT_ID');
    const appId = kIsWeb
        ? String.fromEnvironment('FIREBASE_WEB_APP_ID')
        : String.fromEnvironment('FIREBASE_ANDROID_APP_ID');
    if (apiKey.isEmpty || projectId.isEmpty || appId.isEmpty) {
      throw StateError(
        'Firebase configuration is missing. See the Flutter README for setup.',
      );
    }
    await Firebase.initializeApp(
      options: const FirebaseOptions(
        apiKey: apiKey,
        appId: appId,
        messagingSenderId: String.fromEnvironment(
          'FIREBASE_MESSAGING_SENDER_ID',
        ),
        projectId: projectId,
        authDomain: String.fromEnvironment('FIREBASE_AUTH_DOMAIN'),
        storageBucket: String.fromEnvironment('FIREBASE_STORAGE_BUCKET'),
      ),
    );
    // Emulator routing is an explicit development opt-in. No production writes
    // are made on startup. Release builds refuse emulator mode.
    const host = String.fromEnvironment('FIREBASE_EMULATOR_HOST');
    if (host.isNotEmpty) {
      if (kReleaseMode) {
        throw StateError(
          'Emulator configuration cannot be used in a release build.',
        );
      }
      await FirebaseAuth.instance.useAuthEmulator(host, 9099);
      FirebaseFirestore.instance.useFirestoreEmulator(host, 8080);
      FirebaseFunctions.instance.useFunctionsEmulator(host, 5001);
    }
    runApp(
      ImaanApp(
        repository: FirebaseRepository(
          FirebaseAuth.instance,
          FirebaseFirestore.instance,
          FirebaseFunctions.instance,
        ),
      ),
    );
  } catch (error) {
    runApp(
      MaterialApp(
        theme: appTheme(),
        home: Scaffold(
          body: MessageView(
            title: 'Unable to start',
            message: error is StateError
                ? error.message
                : 'The app could not connect to its services. Please restart and try again.',
          ),
        ),
      ),
    );
  }
}
