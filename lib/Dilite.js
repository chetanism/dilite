'use strict';

const DiliteCore = require('./DiliteCore');
const DiliteError = require('./DiliteError');
// const createPublicClass = require('public-class').createPublicClass

class Dilite {
  constructor() {
    this.cache = {};
    this.notShared = {};
    this.core = new DiliteCore();
    this.set('container', { value: this });
  }

  get(name) {
    if (Reflect.has(this.cache, name)) {
      return this.cache[name];
    }

    const value = this.getValue(name);
    if (!Reflect.has(this.notShared, name)) {
      this.cache[name] = value;
    }

    return value;
  }

  set(name, descriptor) {
    if (Reflect.has(descriptor, 'value')) {
      this.setValue(name, descriptor);
    } else if (Reflect.has(descriptor, 'factory')) {
      this.setFactory(name, descriptor);
    } else if (descriptor.ctor !== undefined) {
      this.setCtor(name, descriptor);
    }

    if (Reflect.get(descriptor, 'shared') === false) {
      this.notShared[name] = true;
    }
  }

  getValue(name) {
    if (this.core.hasValue(name)) return this.core.getValue(name);
    if (this.core.hasFactory(name)) {
      return this.core.createFromFactory(name);
    }

    throw new DiliteError(`Invalid request: ${name}`);
  }

  setValue(name, descriptor) {
    this.core.setValue(name, descriptor.value);
  }

  setFactory(name, descriptor) {
    this.core.setFactory(name, () => {
      const inject = descriptor.inject || [];
      const dependencies = inject.map(i => this.get(i));
      return descriptor.factory(...dependencies);
    });
  }

  setCtor(name, descriptor) {
    return this.core.setFactory(name, () => {
      const inject = descriptor.inject || [];
      const dependencies = inject.map(i => this.get(i));
      return new descriptor.ctor(...dependencies);
    });
  }
}

module.exports = Dilite;
// module.exports = createPublicClass(Dilite, ['get', 'set'])