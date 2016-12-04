import { ok as assert } from 'assert';
import _ from 'lodash';
import firebase from 'firebase';
import xs from 'xstream';

/**
 * Makes a Firebase driver.
 * @param {object} config
 * @returns {function}
 */
export function makeFirebaseDriver(config) {
  assert(_.isObject(config), 'You must specify a valid Firebase configuration object.');

  const app = firebase.initializeApp(config);
  const auth = app.auth();
  const db = app.database();

  const onSubs = {};

  return (message$) => {
    message$.addListener({
      next: message => {
        console.log('message', message);
      },
      error: () => {},
      complete: () => {
        console.log('done');
        app.delete();
      }
    });

    return {
      app,
      firebase,

      database: {
        set: (refPath, value) => xs.fromPromise(db.ref(refPath).set(value))
      },

      on: refPath => {
        if (!onSubs[refPath]) {
          const $ = xs.createWithMemory();
          db.ref(refPath).on('value', ss => $.shamefullySendNext(ss));
          onSubs[refPath] = $;
        }
        return onSubs[refPath];
      },
      once: refPath => {
        const promise = db.ref(refPath).once('value');
        return xs.fromPromise(promise);
      },

      auth: {
        onAuthStateChanged: () => {
          const $ = xs.create();
          auth.onAuthStateChanged(user => {
            $.shamefullySendNext(user);
          });
          return $;
        },
        signInWithPopup: provider => xs.fromPromise(auth.signInWithPopup(provider)),
        signOut: () => xs.fromPromise(auth.signOut())
      }
    };
  };
}
