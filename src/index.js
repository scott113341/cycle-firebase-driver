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
    console.log('isolateSink');

    return action$.map(action => {
      if (typeof action === `string`) {
        return {url: action, _namespace: [scope]}
      }
      action._namespace = action._namespace || [];
      action._namespace.push(scope);
      return action
    });
  }

  function isolateSource(response$$, scope) {
    console.log('isolateSource');

    const isolatedResponse$$ = response$$.filter(res$ =>
      Array.isArray(res$.request._namespace) &&
      res$.request._namespace.indexOf(scope) !== -1
    );
    isolatedResponse$$.isolateSink = isolateSink;
    isolatedResponse$$.isolateSource = isolateSource;
    return isolatedResponse$$;
  }

  const callbackMethods = [
    'set',
  ];
  function createResponse$(ref, action, args) {

    console.log('createResponse$', ref, action, args);

    return Observable.create(observer => {
      const thisFirebase = getFirebase(ref);

      try {
        if (callbackMethods.indexOf(action) >= 0) {
          console.log('action', action, 'is special!!!!');
          console.log('doing callback magic');

          const promise = thisFirebase[action].apply(action, args);
          promise
            .then(result => {
              console.log('wtf this is done???????????????');
              observer.onNext(result);
              observer.onCompleted();
            })
            .catch(err => {
              console.log('no diceeeeeeeee');
              observer.onError(err);
            })
        }
        else {
          console.log('action', action, 'is NOT special');
          observer.onNext(thisFirebase[action].apply(action, args));
          observer.onCompleted();


          // observer.onError(err)
        }
      }

      catch (err) {
        observer.onError(err);
      }
    })
  }








  return function firebaseDriver(action$) {

    console.log('first time');
    console.log(action$);

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
