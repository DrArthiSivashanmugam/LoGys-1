/* Ferro Fitness — Firebase configuration
 *
 * WITHOUT this filled in, the app runs in SINGLE-DEVICE DEMO MODE:
 * everything works, but data stays on each phone and nothing syncs.
 *
 * To turn on real sync between trainer and client phones:
 *   1. Go to https://console.firebase.google.com and create a project
 *      (call it ferro-fitness, disable Analytics — not needed).
 *   2. In the project: Build -> Firestore Database -> Create database ->
 *      Start in test mode -> pick a region near you.
 *   3. Project Overview -> click the </> (Web) icon -> register app ->
 *      copy the firebaseConfig object it shows you.
 *   4. Paste it below, replacing null, so it reads:
 *        window.FERRO_FIREBASE_CONFIG = { apiKey: "...", projectId: "...", ... };
 *   5. Rebuild/resync the app (npx cap sync) and reinstall.
 *
 * NOTE: "test mode" rules expire after 30 days and are open to anyone who
 * has your config. Fine for trying it out with your own gym — before real
 * rollout, tighten the Firestore rules (see README, "Locking it down").
 */

window.FERRO_FIREBASE_CONFIG = null;
