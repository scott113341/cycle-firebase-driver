# cycle-firebase-driver


## Firebase API v2.4.1


### Basic Example

The following example shows how to:

* Create a Firebase driver for https://dinosaur-facts.firebaseio.com/dinosaurs using `makeFirebaseDriver()`
* Subscribe to `value` changes
* Log those changes using `console.log()`

```javascript

import Cycle from '@cycle/core';
import { makeFirebaseDriver } from 'cycle-firebase-driver';

function main(sources) {
  const { firebase } = sources;

  const dinosaurs$ = firebase
    .on('value')
    .map(dinosaursDataSnapshot => dinosaursDataSnapshot.val());

  return {
    log: dinosaurs$,
  };
}

Cycle.run(main, {
  firebase: makeFirebaseDriver('https://dinosaur-facts.firebaseio.com/dinosaurs'),
  log: msg$ => msg$.subscribe(msg => console.log(msg)),
});

// console output:
/*
{
  bruhathkayosaurus: {
    appeared: -70000000,
    height: 25,
    length: 44,
    order: saurischia,
    vanished: -70000000,
    weight: 135000
  },
  ...
}
*/
```



### Firebase Methods
#### new Firebase()
#### onAuth()
#### set()
#### update()
#### remove()
#### push()


### Query Methods
#### on()
#### once()
#### orderByChild()
#### orderByKey()
#### orderByValue()
#### orderByPriority()
#### startAt()
#### endAt()
#### equalTo()
#### limitToFirst()
#### limitToLast()
