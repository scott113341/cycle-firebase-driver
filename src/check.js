export function isString(string, message) {
  var isString = typeof string === 'string';
  return performCheck(isString, message);
}

export function isArray(array, message) {
  var isArray = Array.isArray(array);
  return performCheck(isArray, message);
}

export function isDefined(thing) {
  return thing !== undefined;
}


function performCheck(passed, message) {
  if (passed) return true;
  if (message) throw new Error(message);
  return false;
}
