const DiliteError = require('./DiliteError')

class DiliteCore {
  constructor() {
    this.values = {}
    this.factories = {}
  }

  isDefined(name) {
    return this.hasValue(name) || this.hasFactory(name)
  }

  checkAlreadyDefined(name) {
    if (this.isDefined(name)) {
      throw new DiliteError(`${name} is already defined.`)
    }
  }

  getValue(name) {
    return this.values[name]
  }

  setValue(name, value) {
    this.checkAlreadyDefined(name)
    checkIsNotUndefined(value)

    this.values[name] = value
    return this
  }

  hasValue(name) {
    return this.values[name] !== undefined
  }

  setFactory(name, factory) {
    this.checkAlreadyDefined(name)
    checkIsFunction(factory)

    this.factories[name] = factory
    return this
  }

  hasFactory(name) {
    return this.factories[name] !== undefined
  }

  createFromFactory(name) {
    const factory = this.factories[name]
    return factory(this)
  }
}

DiliteCore.isDiliteCore = function(dilite) {
  return dilite instanceof DiliteCore
}

DiliteCore.create = function() {
  return new DiliteCore()
}

function checkIsNotUndefined(value) {
  if (value === undefined) {
    throw new DiliteError("Value can't be undefined.")
  }
}

function checkIsFunction(value) {
  if (value instanceof Function) {
    return
  }

  throw new DiliteError('Provide a valid function.')
}

module.exports = DiliteCore
