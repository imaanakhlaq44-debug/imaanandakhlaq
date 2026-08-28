/**
 * Point a page's Firebase services at the local emulators.
 *
 * Every dashboard in this app talks to the real project through inline
 * <script type="module"> blocks, which means there is no bundler step where a
 * developer could swap the endpoints. Without this, "run it locally" means
 * running against production data — or, while a feature's rules and functions
 * are still unmerged, against a project where none of them exist yet.
 *
 * The guard is a BUILD-TIME constant, not a runtime check. `import.meta.env.DEV`
 * is substituted by Vite when the component renders, so `npm run build` emits
 * the string 'false' and the connect calls are dead code the moment they ship.
 * A runtime hostname check would still put the code in the production page,
 * one typo away from pointing a school's dashboard at nothing.
 *
 * Ports match the emulators block in firebase.json.
 */
const DEV = import.meta.env.DEV === true

/**
 * Emit inside a <script type="module">, then call it with the page's OWN
 * service objects and its OWN connect functions:
 *
 *   import { getFirestore, connectFirestoreEmulator } from ".../firebase-firestore.js";
 *   ...
 *   ${raw(emulatorConnectJS)}
 *   connectEmulators({ db, connectFirestoreEmulator });
 *
 * The connect functions are passed in rather than imported here, and that is
 * not ceremony: the pages are pinned to different SDK builds (auth.html is on
 * 10.8.0, the dashboards on 10.11.0). A connector that imported its own copy
 * got a second module instance and failed with "Expected type 'Firestore$1',
 * but it was: a custom Firestore object" — which reads like a bug in the page,
 * not a version mismatch in a dev helper.
 *
 * Every pair is optional; pass only what the page actually built.
 */
export const emulatorConnectJS = `
  const USE_EMULATORS = ${DEV ? 'true' : 'false'};

  function connectEmulators(s) {
    if (!USE_EMULATORS) return;
    try {
      if (s.auth && s.connectAuthEmulator) {
        s.connectAuthEmulator(s.auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      }
      if (s.db && s.connectFirestoreEmulator) {
        s.connectFirestoreEmulator(s.db, '127.0.0.1', 8080);
      }
      if (s.functions && s.connectFunctionsEmulator) {
        s.connectFunctionsEmulator(s.functions, '127.0.0.1', 5001);
      }
      if (s.storage && s.connectStorageEmulator) {
        s.connectStorageEmulator(s.storage, '127.0.0.1', 9199);
      }
      console.info('[dev] Firebase is pointed at the local emulators.');
    } catch (err) {
      // Loud on purpose. Failing quietly here means the next thing the
      // developer does lands in the real project.
      console.error('[dev] Could not reach the emulators. STOP — this page may be talking to production.', err);
    }
  }
`
