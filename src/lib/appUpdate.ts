/**
 * Ask for the update the moment the app opens.
 *
 * The problem this solves: a new version goes live on Play and most people
 * never find out. Android updates apps in the background only when it feels
 * like it — on Wi-Fi, on charge, when the app is not in use — so a school
 * ends up with parents, teachers and children on three different versions and
 * somebody has to tell each of them by hand.
 *
 * Google's In-App Updates API fixes that: Play itself knows a newer version
 * exists, and the app can put its update screen in front of the user on
 * launch. This uses the IMMEDIATE flow — a full-screen, Play-owned update
 * page. The person updates or they leave; there is no third version of the
 * app in the wild.
 *
 * Two things worth knowing before testing this:
 *
 *   1. It only works when the app was installed BY GOOGLE PLAY. A sideloaded
 *      APK reports UPDATE_NOT_AVAILABLE, which is why this cannot be tested
 *      from a file — it needs a Play track, internal testing included.
 *   2. Play caches what it knows about available versions, so a device can
 *      take a few hours after publishing to start reporting the new version.
 *
 * Emitted as a JS source string for the same reason firebaseConfigJS and the
 * back-button helpers are: it runs inside an inline script that cannot import
 * from this package.
 */

/**
 * Once per app launch, not once per page.
 *
 * Every screen in this app is a full page load, so a flag on `window` would be
 * gone by the next navigation and the check would run again on every tap.
 * sessionStorage survives navigation inside the WebView and is cleared when
 * Android kills the app, which is exactly the lifetime wanted.
 */
export const APP_UPDATE_SESSION_KEY = 'imaan_update_checked'

/** Mirrors AppUpdateAvailability in @capawesome/capacitor-app-update. */
export const UPDATE_AVAILABLE = 2

/** Mirrors AppUpdateResultCode.CANCELED — the user dismissed Play's screen. */
export const UPDATE_CANCELED = 1

export const appUpdateJS = `
  (function () {
    var SESSION_KEY = '${APP_UPDATE_SESSION_KEY}';
    var UPDATE_AVAILABLE = ${UPDATE_AVAILABLE};
    var UPDATE_CANCELED = ${UPDATE_CANCELED};

    function checkedThisLaunch() {
      try {
        if (sessionStorage.getItem(SESSION_KEY)) return true;
        sessionStorage.setItem(SESSION_KEY, '1');
        return false;
      } catch (e) {
        // Storage unavailable: check once and let the guard fall away rather
        // than looping the Play screen on every page.
        return false;
      }
    }

    // Shown only if someone backs out of Play's update screen. The update was
    // asked for, not forced on them — but the app does not carry on as though
    // nothing happened either, because the whole point is that everyone ends
    // up on one version.
    function showUpdateWall(plugin) {
      if (document.getElementById('iaUpdateWall')) return;
      var wall = document.createElement('div');
      wall.id = 'iaUpdateWall';
      wall.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:#FDF8F5;display:flex;align-items:center;justify-content:center;padding:24px;';
      wall.innerHTML =
        '<div style="max-width:340px;text-align:center;font-family:Nunito,system-ui,sans-serif;color:#1E2D5A;">' +
          '<div style="font-size:2.6rem;margin-bottom:14px;">\\u2b06\\ufe0f</div>' +
          '<h2 style="font-family:\\'Fredoka One\\',cursive;font-weight:400;font-size:1.25rem;margin:0 0 10px;">A new version is ready</h2>' +
          '<p style="font-size:.92rem;line-height:1.6;color:#6B7A94;font-weight:600;margin:0 0 22px;">' +
            'Please update to continue. It only takes a moment, and it keeps your school on the same version.</p>' +
          '<button id="iaUpdateRetry" style="width:100%;padding:15px;border:0;border-radius:15px;background:#D63678;color:#fff;font-family:inherit;font-weight:800;font-size:.95rem;cursor:pointer;">Update now</button>' +
        '</div>';
      document.body.appendChild(wall);
      document.getElementById('iaUpdateRetry').addEventListener('click', function () {
        plugin.performImmediateUpdate().catch(function () {});
      });
    }

    async function run() {
      if (checkedThisLaunch()) return;

      var plugin = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AppUpdate;
      if (!plugin) return;

      var info;
      try {
        info = await plugin.getAppUpdateInfo();
      } catch (e) {
        // No Play on this device, sideloaded build, offline — none of which
        // is a reason to stop someone using the app.
        return;
      }

      if (!info || info.updateAvailability !== UPDATE_AVAILABLE) return;

      // Play decides whether the immediate flow is allowed for this update.
      // When it is not, sending the person to the store listing is the most
      // this can honestly do.
      if (!info.immediateUpdateAllowed) {
        try { await plugin.openAppStore(); } catch (e) {}
        return;
      }

      var result;
      try {
        result = await plugin.performImmediateUpdate();
      } catch (e) {
        return;
      }

      if (result && result.code === UPDATE_CANCELED) showUpdateWall(plugin);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', run);
    } else {
      run();
    }
  })();
`
