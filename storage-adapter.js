/* Ferro Fitness — storage adapter
   Provides window.storage with the API the app was built against:
     get(key, shared)    -> { key, value, shared } | null
     set(key, value, shared)
     delete(key, shared)
     list(prefix, shared)
     transaction(keys, updater)   (shared keys only)
       updater(values) receives the parsed current values and returns { key: newValue }.
       With Firestore configured it runs inside a Firestore transaction: if any key changes
       before commit, Firestore re-runs the updater on fresh data, so two people approving
       overlapping sessions at the same moment cannot both succeed. Without Firestore it
       runs as one synchronous read-modify-write on this device.

   Two data scopes, routed differently ON PURPOSE:
   - shared=false (my-identity, ann-seen:*): ALWAYS device-local. If these went
     to the cloud, every phone would share one login session.
   - shared=true (clients, plans, sessions, announcements, ...): goes to Firestore when a
     config is present in firebase-config.js, so all phones sync. Without a config it
     falls back to this device's localStorage = single-device demo.
*/
(function () {
  "use strict";

  var LOCAL_PREFIX = "ferro:";

  function parse(raw) {
    if (raw === null || raw === undefined) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  /* ---------- device-local backend ---------- */
  var localBackend = {
    get: function (key) {
      var v = localStorage.getItem(LOCAL_PREFIX + key);
      return Promise.resolve(v === null ? null : v);
    },
    set: function (key, value) {
      localStorage.setItem(LOCAL_PREFIX + key, value);
      return Promise.resolve(true);
    },
    del: function (key) {
      localStorage.removeItem(LOCAL_PREFIX + key);
      return Promise.resolve(true);
    },
  };

  // One synchronous read-modify-write: nothing can interleave on this device.
  function localTransaction(keys, updater) {
    return new Promise(function (resolve) {
      var vals = {};
      keys.forEach(function (k) {
        vals[k] = parse(localStorage.getItem(LOCAL_PREFIX + k));
      });
      var writes = updater(vals) || {};
      Object.keys(writes).forEach(function (k) {
        localStorage.setItem(LOCAL_PREFIX + k, JSON.stringify(writes[k]));
      });
      resolve(writes);
    });
  }

  /* ---------- optional Firestore backend for shared data ---------- */
  var sharedBackend = localBackend; // default: demo mode
  var sharedTransaction = localTransaction;
  var ready = Promise.resolve();

  var cfg = window.FERRO_FIREBASE_CONFIG;
  if (cfg && cfg.projectId) {
    ready = Promise.all([
      import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"),
    ])
      .then(function (mods) {
        var appMod = mods[0];
        var fs = mods[1];
        var app = appMod.initializeApp(cfg);
        var db = fs.getFirestore(app);
        function ref(key) {
          return fs.doc(db, "kv", key);
        }
        sharedBackend = {
          get: function (key) {
            return fs.getDoc(ref(key)).then(function (snap) {
              return snap.exists() ? snap.data().value : null;
            });
          },
          set: function (key, value) {
            return fs.setDoc(ref(key), { value: value, updatedAt: Date.now() }).then(function () {
              return true;
            });
          },
          del: function (key) {
            return fs.deleteDoc(ref(key)).then(function () {
              return true;
            });
          },
        };
        // Every key is read inside the transaction before anything is written; a concurrent
        // change to any of them makes Firestore retry the updater with the latest values.
        sharedTransaction = function (keys, updater) {
          return fs.runTransaction(db, function (tx) {
            return Promise.all(
              keys.map(function (k) {
                return tx.get(ref(k));
              })
            ).then(function (snaps) {
              var vals = {};
              snaps.forEach(function (snap, i) {
                vals[keys[i]] = snap.exists() ? parse(snap.data().value) : null;
              });
              var writes = updater(vals) || {};
              Object.keys(writes).forEach(function (k) {
                tx.set(ref(k), { value: JSON.stringify(writes[k]), updatedAt: Date.now() });
              });
              return writes;
            });
          });
        };
        console.log("[ferro] Firestore sync enabled:", cfg.projectId);
      })
      .catch(function (err) {
        console.error("[ferro] Firebase init failed — falling back to device-only storage.", err);
      });
  } else {
    console.log("[ferro] No Firebase config — running in single-device demo mode.");
  }

  function pick(shared) {
    return shared ? sharedBackend : localBackend;
  }

  window.storage = {
    get: function (key, shared) {
      return ready.then(function () {
        return pick(shared).get(key).then(function (v) {
          return v === null ? null : { key: key, value: v, shared: !!shared };
        });
      });
    },
    set: function (key, value, shared) {
      return ready.then(function () {
        return pick(shared).set(key, value).then(function () {
          return { key: key, value: value, shared: !!shared };
        });
      });
    },
    delete: function (key, shared) {
      return ready.then(function () {
        return pick(shared).del(key).then(function () {
          return { key: key, deleted: true, shared: !!shared };
        });
      });
    },
    list: function (prefix, shared) {
      // Not used by the app; provided for API completeness (local scope only).
      var keys = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf(LOCAL_PREFIX + (prefix || "")) === 0) {
          keys.push(k.slice(LOCAL_PREFIX.length));
        }
      }
      return Promise.resolve({ keys: keys, prefix: prefix, shared: !!shared });
    },
    transaction: function (keys, updater) {
      return ready.then(function () {
        return sharedTransaction(keys, updater);
      });
    },
  };
})();
