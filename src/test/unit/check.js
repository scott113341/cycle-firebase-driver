import test from 'tape';

import { checkType, isString } from '../../check.js';


test('checkType pass', t => {
  t.equal(checkType(true, 'pass'), true);
  t.end();
});

test('checkType fail', t => {
  t.throws(checkType.bind(null, false, 'fail'), /fail/);
  t.end();
});

test('isString pass', t => {
  t.equal(isString('yee', 'pass'), true);
  t.equal(isString('', 'pass'), true);
  t.end();
});

test('isString fail', t => {
  const message = 'fail';
  const match = 'fail';
  t.throws(isString.bind(null, false, message), match);
  t.throws(isString.bind(null, 123, message), match);
  t.throws(isString.bind(null, [], message), match);
  t.throws(isString.bind(null, {}, message), match);
  t.end();
});
