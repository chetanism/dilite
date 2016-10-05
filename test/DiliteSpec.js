import Dilite from '../src/Dilite';
import { expect } from 'chai';

class ServiceA {

}

class ServiceB {
  constructor(serviceA) {
    this.serviceA = serviceA;
  }
}

describe('Dilite', function () {
  it('works as a simple container', function () {
    const d1 = new Dilite;
    d1.service('config.name', 'dilite');
    d1.service('add', (a, b) => a + b);
    d1.service('serviceA', new ServiceA);

    d1.factory('serviceB', c => new ServiceB(c('serviceA')));
    d1.factory('simple', c => ({ sa: c('serviceA'), sb: c('serviceB') }));

    d1.provider('complex', () => {
      const rand = Math.random();
      return c => ({
        r: rand,
        s: c('simple'),
      });
    });

    function addAgain() {
      d1.service('simple', 1);
    }

    expect(addAgain).to.throw(Error);

    expect(d1).to.be.instanceof(Dilite);
    expect(d1.get('config.name')).to.be.equal('dilite');

    const add = d1.get('add');
    expect(add(6, 7)).to.be.equal(13);

    const serviceA = d1.get('serviceA');
    expect(serviceA).to.be.instanceof(ServiceA);

    const serviceB = d1.get('serviceB');
    expect(serviceB).to.be.instanceof(ServiceB);
    expect(serviceB.serviceA).to.be.instanceof(ServiceA);
    expect(serviceB.serviceA).to.be.equal(serviceA);

    const simple1 = d1.get('simple');
    const simple2 = d1.get('simple');
    expect(simple1).to.be.equal(simple2);
    expect(simple1.sa).to.be.equal(serviceA);
    expect(simple1.sb).to.be.equal(serviceB);
  });


  it('works in a tree of dilites', function () {

    function Dummy(id, name, c) {
      this.id = id;
      this.name = name;
      this.container = c;
      this.get = (n) => c(n);
    }

    let counter = 0;

    function addSomeServices(d, name) {
      d.service(`${name}.id`, ++counter);
      d.factory(`${name}.name`, () => name);
      d.factory(`${name}.dummy`, (c) => new Dummy(
        c(`${name}.id`), c(`${name}.id`)
      ));
    }

    const parent = new Dilite;
    const child1 = new Dilite;
    const child2 = new Dilite;
    const child3 = new Dilite;

    addSomeServices(parent, 'p');
    addSomeServices(child1, 'c1');
    parent.add(child1);
    addSomeServices(child2, 'c2');
    child2.add(child3);
    addSomeServices(child3, 'c3');
    parent.add(child2);
    child3.factory('c3.spl', (c) => ({
      p: c('p.name'),
      c1: c('c1.name'),
      c,
    }));

    expect(parent.get('p.id')).to.be.equal(1);
    expect(parent.get('c1.id')).to.be.equal(2);
    expect(parent.get('c2.id')).to.be.equal(3);
    expect(parent.get('c3.id')).to.be.equal(4);

    expect(child1.get('p.id')).to.be.equal(1);
    expect(child2.get('p.id')).to.be.equal(1);
    expect(child3.get('p.id')).to.be.equal(1);


    const pDummy = parent.get('p.dummy');
    expect(child1.get('p.dummy')).to.be.equal(pDummy);
    expect(child2.get('p.dummy')).to.be.equal(pDummy);
    expect(child3.get('p.dummy')).to.be.equal(pDummy);

    expect(pDummy.id).to.be.equal(child2.get('p.id'));

    const c3Spl = child1.get('c3.spl');
    expect(c3Spl.p).to.be.equal('p');
    expect(c3Spl.c1).to.be.equal('c1');
    expect(c3Spl.c('c2.id')).to.be.equal(3);
  });

  it('behaves as expected', function () {
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
    dilite.provider('d', () => () => foo());

    // counter = 9
    foo();

    // foo in returned factory gets called
    expect(dilite.get('d')).to.be.equal(10);
  });

  it('calls onCreate', function () {
    const d1 = new Dilite;
    d1.service('num1', 2);
    d1.service('num2', 10);

    d1.onCreate('num1', num1 => num1 * 2);
    d1.onCreate('num1', num1 => num1 + 2);

    const d2 = new Dilite;
    d2.onCreate('num1', num1 => num1 * 3);
    d2.onCreate('num1', num1 => num1 + 3);
    d1.add(d2);

    const d3 = new Dilite;
    d3.onCreate('num1', num1 => num1 * 4);
    d3.onCreate('num1', (num1, c) => num1 + c('num2'));
    d1.add(d3);

    const num1 = d1.get('num1');
    const num1Copy = d2.get('num1');

    expect(num1).to.be.equal(94);
    expect(num1Copy).to.be.equal(94);
  });

  it('can handle cyclic dependency', function () {
    const d1 = new Dilite;
    d1.service('a', { name: 'a' });
    d1.factory('b', () => ({ name: 'b' }));
    d1.service('d', { name: 'd' });

    /* eslint-disable no-param-reassign */
    d1.onCreate('a', (a, c) => {
      a.b = c('b');
    });

    d1.onCreate('b', (b, c) => {
      b.d = c('d');
    });

    d1.onCreate('d', (d, c) => {
      d.a = c('a');
    });
    /* eslint-enable no-param-reassign */

    const a = d1.get('a');
    const b = d1.get('b');
    const d = d1.get('d');

    expect(a.name).to.be.equal('a');
    expect(b.name).to.be.equal('b');
    expect(d.name).to.be.equal('d');

    expect(a.b).to.be.equal(b);
    expect(b.d).to.be.equal(d);
    expect(d.a).to.be.equal(a);
  });

});
