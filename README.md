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
    .map(data => console.log(data.val()))
    .subscribe();

  return {};
}

Cycle.run(main, {
  firebase: makeFirebaseDriver('https://dinosaur-facts.firebaseio.com/dinosaurs')
});

// => Object {bruhathkayosaurus: Object, lambeosaurus: Object, linhenykus: Object...}
```
