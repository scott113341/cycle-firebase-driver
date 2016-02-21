import Cycle from '@cycle/core';
import { div, h1, pre, makeDOMDriver } from '@cycle/dom';
import { Observable } from 'rx';

import makeFirebaseDriver from '../src';


function main(sources) {
  const { DOM, firebase } = sources;

  const bets1$ = firebase
    .on('value')
    .map(data => data.val())
    .startWith({});

  const bets2$ = firebase
    .on('value', { ref: '/bets2' })
    .map(data => data.val())
    .startWith({});

  const bets3$ = firebase
    .on('child_added', {
      query: [
        ['orderByChild', 'no'],
        ['limitToFirst', 3],
        //['startAt', 'r'],
      ]
    })
    .scan((acc, data) => acc.concat({ [data.key()]: data.val() }), [])
    .startWith([]);

  const bets4$ = firebase
    .once('value', { ref: '/bets2' })
    .map(data => data.val())
    .startWith({});



  const click$ = DOM.select('pre').events('click');
  const setBet$ = click$.map(() => {
    console.log('click');
    //return { action:['set', { no: `ian${Date.now()}` }], options: { ref: `/bets/ian${Date.now()}` }};
    return [1,2,3];
  });

  /*
  const setBet$ = Observable
    .interval(1000)
    .map(() => {
      console.log('wtf');
      return { action:['set', { no: `ian${Date.now()}` }], options: { ref: `/bets/ian${Date.now()}` }};
    });
  */


  //const firebase$ = Observable.merge(setBet$);


  const vtree$ = Observable.combineLatest(
    bets1$,
    bets2$,
    bets3$,
    bets4$,
    (bets1, bets2, bets3, bets4) => {
      return div([
        h1('bets1'),
        preme(bets1),
        h1('bets2'),
        preme(bets2),
        h1('bets3'),
        preme(bets3),
        h1('bets4'),
        preme(bets4),
      ]);
    }
  );

  return {
    firebase: setBet$,
    DOM: vtree$,
  };
}


Cycle.run(main, {
  firebase: makeFirebaseDriver('https://scratchie.firebaseio.com/bets'),
  DOM: makeDOMDriver('#app'),
});



function preme(obj) {
  return pre(JSON.stringify(obj, null, 2));
}
