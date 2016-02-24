import { Observable } from 'rx';
import Cycle from '@cycle/core';
import { div, h1, button, table, tr, th, td, pre, makeDOMDriver } from '@cycle/dom';
import makeFirebaseDriver from '../';
import csjs from 'csjs-inject';


const styles = csjs`

  .button {
    margin-bottom: 10px;
  }

  .table {
    border-collapse: collapse;
    border-spacing: 10px;
  }

  .table th, .table td {
    border: 1px solid black;
  }

`;

function collate(stream) {
  return stream
    .scan((accumulator, current) => {
      return accumulator.concat(current);
    }, [])
    .startWith([]);
}

function associate(accRequests$, accResponses$, propertyName) {
  return Observable.combineLatest(
    accRequests$,
    accResponses$,
    (accRequests, accResponses) => {
      return accRequests.map(request => {
        const response = accResponses.find(res => res[propertyName] === request);
        console.log('response is ', response);
        return [request, response];
      });
    }
  );
}


function main(sources) {
  const { DOM, firebase } = sources;

  // stream of clicks on the .load button
  console.log(styles.button);
  const clickLoadButton$ = DOM.select(styles.button.selector).events('click');

  // stream of request objects for firebase driver
  const request$ = clickLoadButton$
    .map(() => {
      const rand = Math.ceil(Math.random() * 100);
      return {
        ref: `/bets/wtf`,
        action: ['set', { no: `money ${rand}` }],
      };
    })
    .share();

  // accumulated$ of request/response/req-res objects
  const accRequests$ = collate(request$);
  const accResponses$ = collate(firebase.response$$.mergeAll());
  const accReqRes$ = associate(accRequests$, accResponses$, 'request');

  // stream of /bets
  const bets$ = firebase
    .on('value')
    .map(betsDataSnapshot => betsDataSnapshot.val())
    .startWith({});


  // DOM sink
  const vtree$ = Observable.combineLatest(
    bets$,
    accReqRes$,
    (bets, accReqRes) => {

      console.log('render');
      console.log(accReqRes);

      return div([
        h1('/bets'),
        pre(JSON.stringify(bets, null, 2)),

        h1('/bets/wtf Mutations'),
        button(styles.button, 'Mutate /bets/wtf'),
        table(styles.table, [
          tr([
            th('Request'),
            th('Response'),
          ]),
          accReqRes.map(([request, response]) => (
            tr([
              td(JSON.stringify(request)),
              td(JSON.stringify(response ? JSON.stringify(response.response) : 'loading...')),
            ])
          )),
        ]),
      ]);
    }
  );

  return {
    DOM: vtree$,
    firebase: request$,
  };
}


Cycle.run(main, {
  DOM: makeDOMDriver('#app'),
  firebase: makeFirebaseDriver('https://scratchie.firebaseio.com/bets'),
});
