const Container = require('./Container')

describe('Container', () => {
  let container

  beforeEach(() => {
    container = new Container()
  })

  afterEach(() => {
    container = null
  })

  describe('Container', () => {
    it('Exists', () => {
      expect(Container).toBeInstanceOf(Function)
      expect(container).toBeInstanceOf(Container)
    })

    it('Exposes only items', () => {
      expect(container.items).toBeDefined()
      expect(container.loadServices).not.toBeDefined()
    })
  })

  describe('Functional Test', () => {
    it('Works as expected', () => {
      function ctor(x) {
        this.sqx = x * x
      }

      const descriptors = {
        x: { value: 1 },
        y: { factory: b => 3 * b, inject: ['a.b'] },
        a: {
          children: {
            b: { value: 4 },
            c: { ctor: ctor, inject: ['y'] },
            d: {
              children: {
                e: { value: 32 }
              }
            }
          }
        }
      }

      const container = new Container(descriptors)

      expect(container.items.x).toBe(1)
      expect(() => (container.items.x = 2)).toThrow()

      expect(container.items.y).toBe(12)
      expect(container.items.a).toBeInstanceOf(Object)

      expect(container.items.a.b).toBe(4)
      expect(container.items.a.c).toBeInstanceOf(ctor)
      expect(container.items.a.c.sqx).toBe(144)

      expect(container.get('a.c').sqx).toBe(144)

      expect(container.items.a.d.e).toBe(32)
      expect(container.get('a.d.e')).toBe(32)
    })
  })
})
