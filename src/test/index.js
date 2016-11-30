import 'source-map-support/register';

import firebase from 'firebase';
import test from 'tape';
import xs from 'xstream';

import { makeFirebaseDriver } from '../index.js';
const _exports = require('../index.js');

const TEST = Date.now().toString();
const REF = `/test${TEST}`;
const CONFIG = {
  apiKey: "AIzaSyDPxz1MEMRnlKe3al3yKNn2H3oCLfvYHp8",
  authDomain: "cycle-firebase-driver.firebaseapp.com",
  databaseURL: "https://cycle-firebase-driver.firebaseio.com",
  storageBucket: "cycle-firebase-driver.appspot.com",
  messagingSenderId: "1074271303086"
};

test('seed', t => {
  const app = firebase.initializeApp(CONFIG);
  app.database()
    .ref(REF)
    .set({
      testOnce: 'yee',
      testOn: 'beans'
    })
    .then(() => {
      app.delete();
      t.end();
    })
    .catch(err => { throw err });
});

test('exports', t => {
  t.deepEqual(_exports, {
    makeFirebaseDriver
  });
  t.end();
});

test('makeFirebaseDriver is a function', t => {
  t.equal(typeof makeFirebaseDriver, 'function');
  t.end();
});

test('makeFirebaseDriver requires a config', t => {
  t.throws(() => makeFirebaseDriver());
  t.end();
});

test('driver.once', t => {
  t.plan(2);
  const firebase$ = xs.create();
  const driver$ = makeFirebaseDriver(CONFIG)(firebase$);
  const $ = driver$.once(REF + '/testOnce');
  $.addListener({
    next: ss => t.equal(ss.val(), 'yee', 'correct value'),
    error: err => { throw err },
    complete: () => {
      t.ok(true, 'stream completes');
      driver$.app.delete();
      t.end();
    }
  });
});

test('driver.on', t => {
  t.plan(4);
  const firebase$ = xs.create();
  const driver$ = makeFirebaseDriver(CONFIG)(firebase$);
  const $ = driver$.on(REF + '/testOn');
  let i = 0;
  $.addListener({
    next: ss => {
      i++;
      if (i === 1) t.equal(ss.val(), 'yolo', 'correct value #1');
      if (i === 2) t.equal(ss.val(), 'swag', 'correct value #2');
      if (i === 3) t.equal(ss.val(), 'meow', 'correct value #3');
    },
    error: err => { throw err },
    complete: () => {
      t.ok(true, 'stream completes');
      driver$.app.delete();
      t.end();
    }
  });
  setTimeout(() => driver$.app.database().ref(REF + '/testOn').set('yolo'), 10);
  setTimeout(() => driver$.app.database().ref(REF + '/testOn').set('swag'), 20);
  setTimeout(() => driver$.app.database().ref(REF + '/testOn').set('meow'), 30);
  setTimeout(() => $.shamefullySendComplete(), 40);
});
