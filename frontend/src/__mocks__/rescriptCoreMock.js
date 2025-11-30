// Mock for @rescript/core to handle ESM import issues in Jest

// Mock Core__JSON module
export const Decode = {
  object: (json) => {
    if (typeof json === 'object' && json !== null && !Array.isArray(json)) {
      return json;
    }
    return undefined;
  },
  array: (json) => {
    if (Array.isArray(json)) {
      return json;
    }
    return undefined;
  },
  string: (json) => {
    if (typeof json === 'string') {
      return json;
    }
    return undefined;
  },
  int: (json) => {
    if (typeof json === 'number' && Number.isInteger(json)) {
      return json;
    }
    return undefined;
  },
  float: (json) => {
    if (typeof json === 'number') {
      return json;
    }
    return undefined;
  },
  bool: (json) => {
    if (typeof json === 'boolean') {
      return json;
    }
    return undefined;
  },
};

// Mock Core__Array module
export const filterMap = (arr, fn) => {
  const result = [];
  for (const item of arr) {
    const mapped = fn(item);
    if (mapped !== undefined) {
      result.push(mapped);
    }
  }
  return result;
};

export const map = (arr, fn) => arr.map(fn);
export const forEach = (arr, fn) => arr.forEach(fn);
export const filter = (arr, fn) => arr.filter(fn);

// Default export
export default {
  Decode,
  filterMap,
  map,
  forEach,
  filter,
};
