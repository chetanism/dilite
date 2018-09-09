const Dilite = require('./Dilite')
const createPublicClass = require('public-class').createPublicClass

class Container {
  constructor(services) {
    this.dilite = new Dilite()
    this.items = {}
    this.loadServices(services || {})
  }

  get(name) {
    return this.dilite.get(name)
  }

  loadServices(services) {
    this.addServiceTree(this.items, null, services)
  }

  addServiceTree(root, rootName, services) {
    for (const name of Reflect.ownKeys(services)) {
      const descriptor = services[name]
      this.addDescriptorTo(root, rootName, name, descriptor)
    }
  }

  addDescriptorTo(root, rootName, name, descriptor) {
    if (Reflect.has(descriptor, 'children')) {
      this.addChildren(root, rootName, name, descriptor)
    } else {
      const fullName = getFullName(rootName, name)
      this.dilite.set(fullName, descriptor)
      this.addProperty(root, name, fullName)
    }
  }

  addChildren(root, rootName, name, descriptor) {
    const children = descriptor.children
    root[name] = {}
    const fullName = getFullName(rootName, name)
    this.addServiceTree(root[name], fullName, children)
  }

  addProperty(root, name, fullName) {
    Reflect.defineProperty(root, name, {
      enumerable: true,
      get: () => this.dilite.get(fullName),
      set: () => {
        throw new Error('Cannot override this property')
      }
    })
  }
}

const getFullName = (rootName, name) =>
  rootName === null ? name : `${rootName}.${name}`

module.exports = createPublicClass(Container, ['loadServices', 'items', 'get'])
