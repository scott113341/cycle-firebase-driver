import Cycle from '@cycle/core';
import { button, div, h1, pre, ul, li, makeDOMDriver } from '@cycle/dom';
import { makeHTTPDriver } from '@cycle/http';
import { Observable } from 'rx';

import makeTrashDriver from '../src/trash';


function main(sources) {
  const { DOM, HTTP, trash } = sources;


  const clickTrash$ = DOM.select('.trash').events('click').startWith('');
  const newTrashReq$ = clickTrash$.map(t => `ian turner ${Date.now()}`);


  const newTrashResponse$ = Observable
    .zip(
      newTrashReq$,
      trash
    )
    .map(trashZip => {
      const [trashReq, trashRes$] = trashZip;
      console.log({ trashReq, trashRes$ });

      trashRes$.map(a => {
        console.log('asdofijasodifjoiasdfj', a);
        return a;
      });

      return trashRes$;

      /*
       return trashRes$.scan((accRes, res) => {
       console.log('hereeeeeeeeeeeee', accRes, res);
       return Object.assign({}, accRes, res);
       }, { trashReq });
       */
    })
    .map(a => {
      console.log('wtfasdofjasoidfjasidjfsa', a);
      return a;
    })
    .scan((trashes, trash) => {
      return trashes.concat([trash]);
    }, [])
    .startWith([]);




  const trash$ = Observable.merge(
    newTrashReq$
  );



  //const junk$ = trash.junkEvery(10000);

  const vtree$ = Observable.combineLatest(
    //junk$,
    newTrashResponse$,
    (newTrashResponses) => {

      console.log('vtree', newTrashResponses);

      return div([
        button('.trash', 'Trash'),
        newTrashResponses ? (

          newTrashResponses.map(r => (
            div([
              h1('a' + r.name),
            ])
          ))

        ) : h1('nope'),
      ]);
    }
  );

  return {
    trash: trash$,
    DOM: vtree$,
  };
}


Cycle.run(main, {
  trash: makeTrashDriver('maketrashdriverwith ian'),
  DOM: makeDOMDriver('#app'),
  HTTP: makeHTTPDriver(),
});



function preme(obj) {
  return pre(JSON.stringify(obj, null, 2));
}
