import { Observable } from 'rx';
import Cycle from '@cycle/core';
import { h, makeDOMDriver } from '@cycle/dom';
import makeFirebaseDriver from 'cycle-firebase-driver';


function main(sources) {
  const { DOM, firebase } = sources;

  const messages$ = firebase.on('value')
    .map(betsDataSnapshot => betsDataSnapshot.val())
    .startWith({});

  const vtree$ = Observable.combineLatest(
    messages$,
    messages => {
      return h('div', [
        h('h1', '/messages'),
        h('pre', JSON.stringify(messages, null, 2)),
      ]);
    }
  );

  return {
    DOM: vtree$
  };
}


Cycle.run(main, {
  DOM: makeDOMDriver('#app'),
  firebase: makeFirebaseDriver('https://someapp.firebaseio.com/messages'),
});
