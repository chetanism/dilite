function factory(factory, inject) {
  return { type: 'factory', factory, inject }
}

function value(value) {
  return { type: 'value', value }
}

function ctor(ctor, inject) {
  return { type: 'ctor', ctor, inject }
}

function setKeyValue(obj, keyParts, value) {
  const key = keyParts[0]

  if (keyParts.length === 1) {
    obj[key] = value
    return
  }

  if (obj[key] === undefined) {
    obj[key] = {}
  }

  setKeyValue(obj[key], keyParts.slice(1), value)
}

function deepMerge(obj1, obj2) {
  const obj = {}
  const allKeys = new Set([...Reflect.ownKeys(obj1), ...Reflect.ownKeys(obj2)])

  for (const key of allKeys) {
    if (typeof obj1[key] === 'object' && typeof obj2[key] === 'object') {
      obj[key] = deepMerge(obj1[key], obj2[key])
    } else if (
      typeof obj1[key] !== 'undefined' &&
      typeof obj2[key] !== 'undefined'
    ) {
      throw new Error('Key already exists')
    } else {
      obj[key] = obj2[key] || obj1[key]
    }
  }

  return obj
}

function getKeyValue(obj, keyParts) {
  const key = keyParts[0]

  if (keyParts.length === 1) {
    return key === '' ? obj : obj[key]
  }

  if (obj[key] === undefined) {
    return undefined
  }

  return getKeyValue(obj[key], keyParts.slice(1))
}

class Container {
  constructor(initializers = {}) {
    this.values = {}
    this.cache = {
      container: this
    }
    this.initializers = initializers
  }

  loadServices(initializers) {
    this.initializers = deepMerge(this.initializers, initializers)
    this.cache = {}
  }

  get(key) {
    const cachedValue = this.cache[key]
    if (cachedValue !== undefined) {
      return cachedValue
    }

    const setValue = (key, value) => {
      setKeyValue(this.values, key.split('.'), value)
      this.cache[key] = value
      return value
    }

    const getValue = key => getKeyValue(this.values, key.split('.'))

    const value = getValue(key)
    if (value !== undefined) {
      this.cache[key] = value
      return value
    }

    const initializer = getKeyValue(this.initializers, key.split('.'))

    if (!initializer) {
      throw new Error(`Unknown item ${key} requested`)
    }

    if (initializer.type === undefined) {
      Reflect.ownKeys(initializer).forEach(child => this.get(`${key}.${child}`))
      const value = getValue(key)
      this.cache[key] = value
      return value
    }

    if (initializer.type === 'value') {
      return setValue(key, initializer.value)
    }

    const inject = initializer.inject || []
    const deps = inject.map(key => this.get(key))

    if (initializer.type === 'ctor') {
      const value = new initializer.ctor(...deps)
      return setValue(key, value)
    }

    if (initializer.type === 'factory') {
      const value = initializer.factory(...deps)
      return setValue(key, value)
    }
  }
}

module.exports = {
  Container,
  default: Container,

  ctor,
  factory,
  value
}
