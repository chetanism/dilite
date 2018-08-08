# dilite
A lightweight javascript DI container that's delightful to work with!

## Installation
`npm i dilite --save`

## Usage
You can work with this library in two ways:
 - Using a `Dilite` class object
 - Using a `Container` class object
 
`Container` class is built on top of `Dilite` class.

### Working with `Dilite`

```ecmascript 6
const Dilite = require('dilite').Dilite

const container = new Dilite()

container.set('a_number', { value: 42 })
container.get('a_number') // => 42

container.set('doubler', { value: x => 2 * x })
container.get('doubler')(21) // => 42

container.set('someService', { factory: () => new SomeService() })
container.get('someService') // => a SomeService instance

container.set('anotherService', { 
  factory: (someService, a_number) => new AnotherService(someService, a_number),
  inject: ['someService', 'a_number']
})
container.get('anotherService') // => AnotherService instance

// same as previous example
container.set('anotherService2', {
  ctor: AnotherService,
  inject: ['someService', 'a_number']
})
container.get('anotherService2') // => AnotherService instance

container.set('nonSingleton', { ctor: NonSingleton, shared: false })
const ns1 = container.get('nonSingleton') // NonSingleton instance
const ns2 = container.get('nonSingleton') // NonSingleton instance

ns1 === ns2 // => false


container.set('nonSingleton2', { factory: () => {}, shared: false })
const ns21 = container.get('nonSingleton2') // an empty object
const ns22 = container.get('nonSingleton2') // an empty object

ns21 === ns22 // => false

```

### Working with `Container`
```ecmascript 6
const Container = require('dilite').Container

const container = new Container({
  a_number: { value: 42 },
  
  doubler: { value: x => 2 * x },
  
  someService: { factory: () => new SomeService() },
  
  someGroup: {
    children: {
      anotherService: { 
        factory: (someService, a_number) => new AnotherService(someService, a_number),
        inject: ['someService', 'a_number']
      },
      
      anotherService2: {
        ctor: AnotherService,
        inject: ['someService', 'a_number']
      },
      
      subGroup: {
        children: {
          x: { value: 21 },
          y: { 
            factory: (doubler, x) => doubler(x), 
            inject: ['doubler', 'someGroup.subGroup.x']
          }
        }
      } 
    }
  }
})

container.items.a_number // => 42
container.get('a_number') // => 42

container.items.doubler // => Function: doubler
container.get('doubler') //=> Function: doubler

container.items.someGroup.subGroup.y // => 42
container.get('someGroup.subGroup.y') //=> 42
```


