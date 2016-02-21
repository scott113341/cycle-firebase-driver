import Cycle from '@cycle/core';
import { div, h1, pre, ul, li, makeDOMDriver } from '@cycle/dom';
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



  const clickPre$ = DOM.select('pre').events('click');
  const setBet1$ = clickPre$.map(() => {
    return {
      action: ['set', { no: `ian${Date.now()}` }],
      ref: `/bets/ian${Date.now()}`
    };
  });

  const clickH1$ = DOM.select('h1').events('click');
  const setBet2_ = () => ({
    action: ['set', { no: `wtfian${Date.now()}` }],
    ref: `/bets2/ian`
  });
  const setBet2$ = clickH1$
    .map(() => setBet2_())
    .startWith(false);


  const firebase$ = Observable.merge(
    setBet1$,
    setBet2$
  );


  console.log('wtf homie');
  console.log(firebase);


  const vtree$ = Observable.combineLatest(
    bets1$,
    bets2$,
    bets3$,
    bets4$,
    setBet2$,
    (bets1, bets2, bets3, bets4, setBet2) => {
      return div([
        h1('setBet2'),
        ul(
          setBet2 ? li(preme(setBet2)) : null
        ),

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
    firebase: firebase$,
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
