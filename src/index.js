import { Observable } from 'rx';
import Firebase from 'firebase';

import * as check from './check';


export default function makeFirebaseDriver(firebaseUrl) {
  check.isString(firebaseUrl, 'Firebase URL is required.');

  const firebase = new Firebase(firebaseUrl);
  const firebaseRef = firebase.toString();
  const firebaseRoot = firebase.root().toString().replace(/\/$/, '');


  firebase.child('iannnnn').set({ no: 'zzzzzzzzzz' });


  function getFirebase(ref) {
    if (check.isString(ref)) return new Firebase(firebaseRoot + ref);
    else return new Firebase(firebaseRef);
  }

  function getQuery(thisFirebase, query) {
    return query.reduce((previous, current) => {
      const [method, ...args] = current;
      return previous[method].apply(previous, args);
    }, thisFirebase);
  }


  return function firebaseDriver(action$) {

    console.log('wtf is this garbage');
    console.log(action$);

    action$
      .map(function() {
        console.log('action$', args);
        const thisFirebase = getFirebase(ref);
        //const [action, ...args] = actionAndArgs;
        thisFirebase[action].apply(thisFirebase, args);
      })
      .replay(null, 1);

    return {

      onAuth: function() {
        return Observable.fromEventPattern(
          h => firebase.onAuth(h),
          h => firebase.offAuth(h)
        );
      },

      once: function(eventType, { ref, query=[] }={}) {
        const thisFirebase = getFirebase(ref);
        const queryRef = getQuery(thisFirebase, query);
        return Observable.fromPromise(queryRef.once(eventType));
      },

      on: function(eventType, { ref, query=[] }={}) {
        const thisFirebase = getFirebase(ref);
        const queryRef = getQuery(thisFirebase, query);
        return Observable.fromEventPattern(
          h => queryRef.on(eventType, h),
          h => queryRef.off(eventType, h)
        );
      }

    };
  }
}
