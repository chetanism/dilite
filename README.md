# Dilite
An extremely light weight DI container. The goal is to keep `Dilite` light enough that it seems logical to have multiple instances of `Dilite` wired up together in a single application.

## Installation
```shell
npm install [--save] dilite
```

## Usage

```javascript
// Import
import Dilite from 'dilite';

// Create an instance
const dilite = new Dilite;
```

### #service
```javascript
// #service(<name>, <value>)

dilite.service('a_number', 2);
dilite.service('a_string', 'string');
dilite.service('a_function', x => x * x);
dilite.service('an_instance', new SomeClass());
```
Dilite#service is just a wrapper for Dilite#factory. Following two calls are essentially same
```javascript
dilite.service('some', 'service');
dilite.factory('some', () => 'service');
```

### #factory
Specifies a function that is invoked only once to prepare and return a service when it is requested the first time. When invoked the function will be passed the dilite#get method that can be used to fetch any dependencies from the container.
```javascript
// #factory(<name>, <(get) => 'returns some value/service'>)

dilite.factory('my_fancy_service', c => 
    new MyFancyService(
        c('a_number'),
        c('a_function')
    );  
);

dilite.factory('another_service', c => {
    const fancyService = c('my_fancy_service');
    const fancyObject = fancyService.doFancyStuff();
    return {
        fancy: fancyService,
        stuff: fancyObject
    };
});

dilite.factory('some_service', c => {
    const someService = new SomeService;
    someService.setAnotherService(c('another_service'));
    return someService;
});
```

### #provider
Dilite#provider is another wrapper for Dilite#factory. It is invoked immediately and allows to configure returned `factory` method easily.
```javascript
// #provider(<name>, <() => c => 'return a factory that returns service/value')

dilite.provider('provides_a_factory', () => {
    const someThing = doWhateverFancyThings();
    
    return c => {
        // just return a factory function
        // that returns the service/value to be held by the dilite container
        return new OneMoreService(someThing, c('some_service'));
    };
});

dilite.factory('factory_as_provider', (() => {
    // this is a self invoking function that returns a factory function
    // that's what #provider() does.
    const someThing = doWhateverFancyThings();
    
    return c => {
        // just return a factory function
        // that returns the service/value to be held by dilite container
        return 'abc';
    };
})());
 
```

### #get
Gets a service/value from the container.
```javascript
dilite.service('a_value', 34);
dilite.get('a_value'); //=> 34

dilite.factory('a_service', c => {
    return new AService(c(a_value));
});
dilite.get('a_service'); //=> AService instance

dilite.provider('mailer', () => {
    if (ENV == 'test') {
        return () => new TestMailer();
    }
    
    return (c) => {
        return new Mailer(
            c('config.mailer.username'),
            c('config.mailer.password')
        );
    }
});
dilite.get('mailer'); //=> TestMailer or Mailer instance
```

### #add
Let's you add Dilite instances as child. You can build up a whole tree of Dilite instances. Invoking a `get` on any of them will fetch you services defined anywhere in the tree.
Useful to build independent modules with their own `Dilite` instances and then wire them up all together at the main app level.
```javascript
// Each instance would normally be created in it's own module
const parent = new Dilite;
const child1 = new Dilite;
const child2 = new Dilite;
const child3 = new Dilite;

// A service declared in module `child3`
child3.service('c3.some.service', new SomeC3Service);

// Each module will expose their Dilite instance that get added to the parent module
parent.add(child1);
child2.add(child3);
parent.add(child2);
    
// You can fetch the service from any of the dilite instance i.e. all services from all modules are available to each module.
c3Service = parent.get('c3.some.service');
c3Service === child1.get('c3.some.service');
c3Service === child2.get('c3.some.service');
c3Service === child3.get('c3.some.service');
```

### When to use #service and #provider
The #service and #provider methods are just a wrapper around #factory. However, you should take care that arguments in `service` call will be evaluated immediately, while any code in `factory` will be executed when the service/value is requested the first time.
The following code highlights the difference.
```javascript
const dilite = new Dilite;
let counter = 1;

// each foo call increments and returns counter
function foo() {
  return ++counter;
}

dilite.service('a', foo());
expect(dilite.get('a')).to.be.equal(2);

// counter = 3;
foo();

// foo() not yet invoked
dilite.factory('b', () => foo());

// counter = 4;
foo();

// foo() in factory `b` invoked now; counter = 5
expect(dilite.get('b')).to.be.equal(5);

// foo is not invoked anymore for factory `b`
expect(dilite.get('b')).to.be.equal(5);

// counter = 6
foo();

// foo() in provider function is invoked immediately
// v = counter = 7
dilite.provider('c', () => {
  const v = foo();
  return () => v;
});
expect(dilite.get('c')).to.be.equal(7);

// counter = 8
foo();

// foo() not called in provider, will be called from factory when requested first time
dilite.provider('d', () => {
  return () => foo();
});

// counter = 9
foo();

// foo in returned factory gets called
expect(dilite.get('d')).to.be.equal(10);
```

### License

Copyright © 2015-2016 Chetan Verma, LLC. This source code is licensed under the MIT license found in
the [LICENSE.txt](https://github.com/chetanism/dilite/blob/master/LICENSE.txt) file.
license.
