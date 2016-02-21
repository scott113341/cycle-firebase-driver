import { Observable } from 'rx';
import Firebase from 'firebase';

import * as check from './check';


export default function makeFirebaseDriver(firebaseUrl) {
  check.isString(firebaseUrl, 'Firebase URL is required.');

  const firebaseRef = firebaseUrl;
  const firebaseRoot = (new Firebase(firebaseUrl)).root().toString().replace(/\/$/, '');

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


  function isolateSink(action$, scope) {

  }

  function isolateSource(response$$, scope) {
    const isolatedResponse$$ = response$$.filter(res$ =>
      Array.isArray(res$.request._namespace) &&
      res$.request._namespace.indexOf(scope) !== -1
    )
  }


  return function firebaseDriver(action$) {

    const response$$ = action$
      .subscribe(actionConfig => {
        if (!actionConfig) return;

        var action, args, ref;
        if (Array.isArray(actionConfig)) {
          [action, ...args] = actionConfig;
        }
        else {
          ref = actionConfig.ref;
          [action, ...args] = actionConfig.action;
        }
        const thisFirebase = getFirebase(ref);
        console.log('action$', ref, action + '()', ...args);

        if (['set'].indexOf(action) >= 0) {
          console.log('action', action, 'is special!!!!');
        }

        thisFirebase[action].apply(thisFirebase, args);
      });

    Object.assign(response$$, { isolateSink, isolateSource }, {

      onAuth: function() {
        const thisFirebase = getFirebase();
        return Observable.fromEventPattern(
          h => thisFirebase.onAuth(h),
          h => thisFirebase.offAuth(h)
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

    });

    return response$$;
  }
}
