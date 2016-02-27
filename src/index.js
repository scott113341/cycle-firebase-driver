import { Observable } from 'rx';
import Firebase from 'firebase';

import * as check from './check';


// firebase method implementations
const callbackMethods = [
  ['set', (thisFirebase, args) => {
    const value = args[0];
    return thisFirebase.set(value);
  }],
];


export function makeFirebaseDriver(firebaseUrl) {
  check.isString(firebaseUrl, 'Firebase URL is required.');


  // define default firebase refs
  const firebaseRef = firebaseUrl;
  const firebaseRoot = (new Firebase(firebaseUrl)).root().toString().replace(/\/$/, '');


  // function that returns a firebase ref
  // returns this driver's default ref if unspecified
  function getFirebase(ref) {
    if (check.isString(ref)) return new Firebase(firebaseRoot + ref);
    else return new Firebase(firebaseRef);
  }


  // function that builds and returns a firebase query object
  // operations are applied left to right
  function getQuery(thisFirebase, query) {
    return query.reduce((previous, current) => {
      const [method, ...args] = current;
      return previous[method].apply(previous, args);
    }, thisFirebase);
  }


  // function that creates a response$ for an incoming request
  function createResponse$(ref, method, args, request) {
    const response$ = Observable.create(observer => {
      const thisFirebase = getFirebase(ref);
      const response = { request };

      try {
        const callbackMethod = callbackMethods.find(m => m[0] === method);
        const getPromise = () => callbackMethod[1](thisFirebase, args);
        const getValue = () => thisFirebase[method].apply(thisFirebase, args);
        const getPromiseOrValue = callbackMethod ? getPromise : getValue;

        Promise
          .resolve()
          .then(getPromiseOrValue)
          .then(result => {
            response.error = null;
            response.result = result;
            observer.onNext(response);
            observer.onCompleted();
          })
          .catch(error => {
            response.error = error;
            response.result = null;
            observer.onNext(response);
            observer.onCompleted();
          });
      }

      catch (error) {
        response.error = error;
        response.result = null;
        observer.onNext(response);
        observer.onCompleted();
      }
    });
    return response$.share();
  }


  // return driver function, which takes a request$
  return function firebaseDriver(request$) {

    const response$$ = request$
      .map(request => {
        if (!request) return;

        var method, args, ref;
        if (Array.isArray(request)) {
          [method, ...args] = request;
        }
        else {
          ref = request.ref;
          [method, ...args] = request.action;
        }
        return createResponse$(ref, method, args, request);
      });


    const queryMethods = {

      /**
       * Firebase.getAuth()
       * https://www.firebase.com/docs/web/api/firebase/getauth.html
       * @returns {*}
       */
      getAuth: () => {
        const thisFirebase = getFirebase();
        return Observable.just(thisFirebase.getAuth());
      },

      /**
       * Firebase.onAuth()
       * https://www.firebase.com/docs/web/api/firebase/onauth.html
       * @returns {*}
       */
      onAuth: () => {
        const thisFirebase = getFirebase();
        return Observable.fromEventPattern(
          h => thisFirebase.onAuth(h),
          h => thisFirebase.offAuth(h)
        );
      },

      /**
       * Firebase.unauth()
       * https://www.firebase.com/docs/web/api/firebase/unauth.html
       * @returns {*}
       */
      unauth: () => {
        const thisFirebase = getFirebase();
        return Observable.just(thisFirebase.unauth());
      },

      /**
       * Firebase.once()
       * https://www.firebase.com/docs/web/api/query/once.html
       * @param eventType
       * @param ref
       * @param query
       * @returns {*}
       */
      once: (eventType, { ref, query=[] }={}) => {
        const thisFirebase = getFirebase(ref);
        const queryRef = getQuery(thisFirebase, query);
        return Observable.fromPromise(queryRef.once(eventType));
      },

      /**
       * Firebase.on()
       * https://www.firebase.com/docs/web/api/query/on.html
       * @param eventType
       * @param ref
       * @param query
       */
      on: (eventType, { ref, query=[] }={}) => {
        const thisFirebase = getFirebase(ref);
        const queryRef = getQuery(thisFirebase, query);
        return Observable.fromEventPattern(
          h => queryRef.on(eventType, h),
          h => queryRef.off(eventType, h)
        );
      },

    };

    Object.assign(response$$, queryMethods, { response$$ }, { ServerValue: Firebase.ServerValue });
    return response$$;
  }
}
