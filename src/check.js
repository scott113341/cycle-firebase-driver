import _isString from 'lodash.isstring';


export function checkType(passed, message) {
  if (passed) return true;
  if (message) throw new Error(message);
  return false;
}


export function isString(string, message) {
  return checkType(_isString(string), message);
}
