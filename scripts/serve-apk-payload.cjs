// Serves the exact files that ship inside the APK
// (android/app/src/main/assets/public) over plain HTTP, so the packaged build
// can be opened in a browser and debugged. The Capacitor route guard only fires
// on a native platform, so pages render here the same way they would in the app
// minus the guard.
//
// Debug aid only — nothing in the build chain depends on it.

const express = require('express');
const path = require('path');

const root = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'assets', 'public');
const port = Number(process.env.PORT) || 4180;

const app = express();
app.use(express.static(root, { extensions: ['html'] }));

app.listen(port, '127.0.0.1', () => {
  console.log('APK payload served from ' + root);
  console.log('http://127.0.0.1:' + port + '/admin-dashboard.html');
});
