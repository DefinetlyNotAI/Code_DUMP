/**
 * Deep merges one or more source objects into a target object.
 * Recursively merges nested objects; later sources override earlier ones.
 * @param {object} target - The target object to merge into
 * @param {...object} sources - Source objects to merge
 * @returns {object} The merged target object
 */
function deepMerge(target, ...sources) {
  if (!sources.length) return target;

  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return deepMerge(target, ...sources);
}

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

module.exports = deepMerge;
