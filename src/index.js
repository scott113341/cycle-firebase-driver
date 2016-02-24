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
    ['set', (args, thisFirebase) => {
      const value = args[0];
      return thisFirebase.set(value);
    }],
  ];
  function createResponse$(ref, action, args, actionConfig) {

    console.log('createResponse$', ref, action, args, actionConfig);

    const response$ = Observable.create(observer => {
      const thisFirebase = getFirebase(ref);

      try {
        const callbackMethod = callbackMethods.find(m => m[0] === action);
        if (callbackMethod) {
          console.log('action', action, 'is special!!!!');
          console.log('doing callback magic');

          const promise = callbackMethod[1](args, thisFirebase);

          promise
            .then((...result) => {
              console.log('wtf this is done???????????????');
              console.log(result);
              const response = {
                result,
                request: actionConfig,
              };
              console.log(response);
              observer.onNext(response);
              observer.onCompleted();
            })
            .catch((...error) => {
              console.log('no diceeeeeeeee');
              console.log(error);
              const response = {
                error,
                request: actionConfig,
              };
              console.log(response);
              observer.onError(response);
            })
        }
        else {
          console.log('action', action, 'is NOT special');
          const result = thisFirebase[action].apply(thisFirebase, args);
          observer.onNext(result);
          observer.onCompleted();
        }
      }

      catch (err) {
        observer.onError(err);
      }
    });

    response$.request = '';
    return response$;
  }








  return function firebaseDriver(action$) {

    console.log('first time');
    console.log(action$);

    const response$$ = action$
      .map(actionConfig => {
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

        return createResponse$(ref, action, args, actionConfig);
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

    response$$.response$$ = response$$;
    return response$$;
  }
}
