// Shows the weekly habits report while the app is closed.
//
// Registered by the app (lib/data/report_notifications.dart) from this
// folder, so its scope is /app/fcm/ and it never replaces the app's own
// service worker. The public Firebase settings arrive in its address.
const params = new URL(self.location.href).searchParams;

importScripts(
  'https://www.gstatic.com/firebasejs/13.1.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/13.1.0/firebase-messaging-compat.js'
);

firebase.initializeApp({
  apiKey: params.get('apiKey'),
  projectId: params.get('projectId'),
  messagingSenderId: params.get('messagingSenderId'),
  appId: params.get('appId'),
});

// Notification messages are shown by the SDK itself; nothing else to do.
firebase.messaging();
