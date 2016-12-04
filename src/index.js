import { ok as assert } from 'assert';
import isObject from 'lodash/isObject';
import firebase from 'firebase';
import xs from 'xstream';

/**
 * Makes a Firebase driver.
 * @param {object} config
 * @returns {function}
 */
export function makeFirebaseDriver(config) {
  assert(isObject(config), 'You must specify a valid Firebase configuration object.');

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
        push: (refPath, value) => {
          if (value !== undefined) return xs.fromPromise(db.ref(refPath).push(value));
          else return xs.of(db.ref(refPath).push());
        },
        set: (refPath, value) => xs.fromPromise(db.ref(refPath).set(value))
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
