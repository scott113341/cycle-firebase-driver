import { Observable } from 'rx';

import * as check from './check';


export default function makeTrashDriver(whatTrash) {

  return function trashDriver(trash$) {





    const response$$ = trash$
      .map(trash => {
        const trashy = `trashhhhh: ${whatTrash}, ${trash}`;

        console.log('trash', trash, trashy);

        const p = new Promise(r => {
          console.log('wtf ian');
          setTimeout(() => {
            console.log('done');
            r(trashy);
          }, 1000)
        });

        const response$ = Observable.fromPromise(p).share();

        return response$;
      }).share();





    Object.assign(response$$, {

      junkEvery: function(interval) {
        return Observable
          .timer(0, interval)
          .timeInterval()
          .map(x => `Junk ${x.value}`);
      }

    });

    return response$$;
  }
}
