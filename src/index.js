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

  const app = firebase.initializeApp(config, `yolo${Date.now()}`);
  const db = app.database();

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
      on: (refPath) => {
        const $ = xs.create();
        db.ref(refPath).on('value', ss => $.shamefullySendNext(ss));
        return $;
      },
      once: (refPath) => {
        const promise = db.ref(refPath).once('value');
        return xs.fromPromise(promise);
      }
    };
  };
}
