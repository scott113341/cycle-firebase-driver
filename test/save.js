import Cycle from '@cycle/core';
import { ul, li, button, h2, div, p, img, pre, makeDOMDriver } from '@cycle/dom';
import { Observable } from 'rx';

import makeFirebaseDriver from '../src';


function main(sources) {
  const { DOM, firebase } = sources;

  const loginClick$ = DOM.select('.login').events('click');
  const logoutClick$ = DOM.select('.logout').events('click');

  const loginRequest$ = loginClick$.map(() => ['authWithOAuthPopup', 'google']);
  const logoutRequest$ = logoutClick$.map(() => ['unauth']);


  const firebase$ = Observable.merge(
    loginRequest$,
    logoutRequest$
  );


  const auth$ = firebase.filter((res$) => {
    console.log();
  });


  /*
  //const usersValue$ = firebase.query('orderBy', 'height').on('value').map(data => data.val()).startWith({});
  //const usersValue$ = firebase.on('value').map(data => data.val()).startWith({});
  const auth$ = firebase.onAuth().startWith(null);

  const something$ = firebase.ref('/bets');

  const writeUserData$ = firebase.child().set();

  const firebase$ = Observable.merge(
    loginRequest$,
    logoutRequest$,
    getUserData$
  );
  */

  const vtree$ = Observable.combineLatest(
    auth$,
    getUserData$,
    (auth, usersValue) => {
      const userInfo = getUserInfo(auth);

      return div([
        auth ? null : button('.login', 'Login'),
        auth ? button('.logout', 'Logout') : null,
        p(`Auth: ${JSON.stringify(auth)}`),

        h2('/users'),
        pre(JSON.stringify(usersValue, null, 2)),

        auth ? div([
          p(`Hello ${userInfo.name}!`),
          img({ src: userInfo.imageUrl }),
        ]) : null
      ]);
    }
  );

  const log$ = makeLogStream({
    firebase,
    firebase$,
    //getUserData$,
    //auth$,
  });

  return {
    firebase: firebase$,
    DOM: vtree$,
    log: log$,
  };
}


Cycle.run(main, {
  firebase: makeFirebaseDriver('https://scratchie.firebaseio.com/users'),
  DOM: makeDOMDriver('#app'),
  log: makeLogDriver(),
});



function getUserInfo(auth) {
  if (!auth) return undefined;
  const g = auth.google;
  return {
    name: g.displayName,
    imageUrl: g.profileImageURL,
  };
}


function makeLogDriver(seconds=true) {
  const start = Date.now();
  const divisor = seconds ? 1000 : 1;

  return function(stream$) {
    stream$.subscribe(s => {
      const secondsSinceStart = (Date.now() - start) / divisor;
      console.log(secondsSinceStart, s.name, s.message)
    });
  };
}


function makeLogStream(streams) {
  return Observable.merge(
    ...Object.keys(streams)
      .map(name => {
        const stream = streams[name];
        return stream.map(message => {
          return {
            name,
            message,
          }
        });
      })
  );
}
