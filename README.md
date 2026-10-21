# Ferro Fitness — Web App

This folder is the complete Ferro Fitness web app. Host it anywhere that serves
static files over **https** and every member can use it from a link — and
install it to their home screen so it looks and launches like a native app.

It is the exact same app as the Android APK build: same features, same code.

## Put it online (pick one)

**Option A — Netlify (fastest, ~2 minutes)**
1. Go to https://app.netlify.com/drop
2. Drag this whole folder onto the page.
3. You get a live link like `https://ferro-fitness.netlify.app` — that's your app.

**Option B — Firebase Hosting (everything in one console)**
Good choice because sync (below) uses Firebase anyway.
```bash
npm install -g firebase-tools
firebase login
firebase init hosting     # public directory: .   single-page app: No
firebase deploy
```

**Option C — any static host** (Vercel, GitHub Pages, your own server):
upload the folder as-is. No build step needed.

> Don't open `index.html` by double-clicking it — several browser features
> (installing, service worker) only work when it's served from a real https URL.

## Turn on sync between everyone's devices

Out of the box the app runs in **single-device demo mode** — each browser keeps
its own data. For the real thing (trainer's phone, client's phone, and the web
all sharing one database):

1. Open `firebase-config.js` and follow the steps written inside
   (~5 minutes: free Firebase project → Firestore in test mode → paste config).
2. Re-upload / redeploy the folder.

**Important:** use the *same* Firebase config here and in the Android APK
project — then the website and the installed Android app read and write the
same live database. A trainer on the web and a client on the APK stay in sync.

## Install to home screen

- **Android (Chrome):** open the link → ⋮ menu → *Add to Home screen* (or the
  *Install app* prompt). Launches full-screen with the Ferro icon.
- **iPhone (Safari):** open the link → Share button → *Add to Home Screen*.

## Before real member data

Firestore "test mode" is open to anyone who has your config and expires after
30 days. Fine for trialing with your own gym; before launch, tighten the
Firestore rules and move login onto Firebase Authentication (see the Android
project's README, "Locking it down" — same advice applies here).

## What's inside

```
index.html            app shell + home-screen install metadata
app.js                the compiled app (React, all features)
styles.css            styling
storage-adapter.js    routes data: device-local vs shared cloud
firebase-config.js    paste your Firebase config here for sync
manifest.webmanifest  name/icons/colors for "Add to Home screen"
sw.js                 service worker: opens offline, updates when online
icon-*.png            app icons generated from the Ferro logo
```
