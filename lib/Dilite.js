'use strict';

const DiliteError = require('./DiliteError');

function factory(factory, inject, singleton = true) {
  return { type: 'factory', factory, inject, singleton };
}

function value(value) {
  return { type: 'value', value };
}

function ctor(ctor, inject) {
  return { type: 'ctor', ctor, inject };
}

function setKeyValue(obj, keyParts, value) {
  const key = keyParts[0];

  if (keyParts.length === 1) {
    obj[key] = value;
    return;
  }

  if (obj[key] === undefined) {
    obj[key] = {};
  }

  setKeyValue(obj[key], keyParts.slice(1), value);
}

function getKeyValue(obj, keyParts) {
  const key = keyParts[0];

  if (keyParts.length === 1) {
    return key === '' ? obj : obj[key];
  }

  if (obj[key] === undefined) {
    return undefined;
  }

  return getKeyValue(obj[key], keyParts.slice(1));
}

class Container {
  constructor(initializers = {}) {
    this.values = {};
    this.cache = {
      container: this
    };
    this.initializers = initializers;
  }

  loadServices(initializers) {
    this.initializers = this.mergeInitializers(this.initializers, initializers, []);
  }

  mergeInitializers(obj1, obj2, path) {
    const obj = {};
    const allKeys = new Set([...Reflect.ownKeys(obj1), ...Reflect.ownKeys(obj2)]);

    for (const key of allKeys) {
      const nextPath = [...path, key];

      if (typeof obj1[key] === 'object' && typeof obj2[key] === 'object') {
        obj[key] = this.mergeInitializers(obj1[key], obj2[key], nextPath);
        this.cache[nextPath.join('.')] = undefined;
      } else if (typeof obj1[key] !== 'undefined' && typeof obj2[key] !== 'undefined') {
        throw new DiliteError(`Key '${nextPath.join('.')}' already exists`);
      } else {
        obj[key] = obj2[key] || obj1[key];
      }
    }

    return obj;
  }

  get(key) {
    const cachedValue = this.cache[key];
    if (cachedValue !== undefined) {
      return cachedValue;
    }

    const setValue = (key, value) => {
      setKeyValue(this.values, key.split('.'), value);
      this.cache[key] = value;
      return value;
    };

    const getValue = key => getKeyValue(this.values, key.split('.'));

    const value = getValue(key);
    if (value !== undefined) {
      this.cache[key] = value;
      return value;
    }

    const initializer = getKeyValue(this.initializers, key.split('.'));

    if (!initializer) {
      throw new DiliteError(`Unknown item '${key}' requested`);
    }

    if (initializer.type === undefined) {
      Reflect.ownKeys(initializer).forEach(child => this.get(`${key}.${child}`));
      const value = getValue(key);
      this.cache[key] = value;
      return value;
    }

    if (initializer.type === 'value') {
      return setValue(key, initializer.value);
    }

    const inject = initializer.inject || [];
    const deps = inject.map(key => this.get(key));

    if (initializer.type === 'ctor') {
      const value = new initializer.ctor(...deps);
      return setValue(key, value);
    }

    if (initializer.type === 'factory') {
      const value = initializer.factory(...deps);
      if (initializer.singleton !== false) {
        return setValue(key, value);
      } else {
        return value;
      }
    }
  }
}

module.exports = {
  Container,
  default: Container,

  ctor,
  factory,
  value
};