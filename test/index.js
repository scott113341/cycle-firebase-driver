import { Observable } from 'rx';
import Cycle from '@cycle/core';
import { div, button, table, tr, th, td, makeDOMDriver } from '@cycle/dom';
import { makeHTTPDriver } from '@cycle/http';
import csjs from 'csjs-inject';


const POST_URL = 'http://jsonplaceholder.typicode.com/posts';

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


function main(sources) {
  const { DOM, HTTP } = sources;

  // stream of clicks on the .load button
  console.log(styles.button);
  const clickLoadButton$ = DOM.select(styles.button.selector).events('click');

  // stream of request objects for HTTP driver
  const request$ = clickLoadButton$
    .map(() => {
      const postId = Math.ceil(Math.random() * 100);
      return { url: `${POST_URL}/${postId}` };
    })
    .share();

  // accumulated array of request objects
  const accRequests$ = collate(request$);

  // accumulated array of response objects
  const responses$ = HTTP.mergeAll();
  const accResponses$ = collate(responses$);


  // DOM sink
  const vtree$ = Observable.combineLatest(
    accRequests$,
    accResponses$,
    (accRequests, accResponses) => {

      // mapped
      const reqResPairs = accRequests.map(request => {
        const requestText = JSON.stringify(request);
        const response = accResponses.find(res => res.request === request);
        const responseText = response ? JSON.stringify(response.body) : 'loading....';
        return [requestText, responseText];
      });

      return div([
        button(styles.button, 'Load Next Post'),
        table(styles.table, [
          tr([
            th('Request'),
            th('Response'),
          ]),
          reqResPairs.map(([requestText, responseText]) => (
            tr([
              td(requestText),
              td(responseText),
            ])
          )),
        ])
      ]);
    }
  );

  return {
    DOM: vtree$,
    HTTP: request$,
    //log: request$,
  };
}


Cycle.run(main, {
  DOM: makeDOMDriver('#app'),
  HTTP: makeHTTPDriver(),
  //log: m$ => m$.subscribe(m => console.log('log', m)),
});
