const Dlite = require('./Dlite')

const { Container, ctor, factory, value } = Dlite

describe('Dlite', () => {
  describe('ctor', () => {})

  describe('factory', () => {})

  describe('value', () => {})

  describe('Container', () => {
    it('works as expected', () => {
      class X {
        constructor(tt) {
          this.tt = tt
        }
        doSomething(x) {
          return this.tt(x)
        }
      }

      const container = new Container({
        num1: value(3),
        num2: value(10),

        fun: {
          doubler: value(x => x + x),
          square: value(x => x * x)
        },

        moreFun: {
          tenTimes: factory(x => y => x * y, ['num2']),

          xx: ctor(X, ['moreFun.tenTimes'])
        }
      })

      expect(container.get('num1')).toBe(3)
      expect(container.get('num2')).toBe(10)

      expect(container.get('fun').doubler(21)).toBe(42)
      expect(container.get('fun.square')(2)).toBe(4)

      const x = container.get('moreFun.xx')
      expect(x.doSomething(10)).toBe(100)

      container.loadServices({
        num3: value(33),

        fun2: {
          doubler: value(x => x + x),
          square: value(x => x * x)
        },

        fun: {
          nested: {
            fun: value(34)
          }
        }
      })

      expect(container.cache['fun']).toBeUndefined()
      expect(container.cache['fun.doubler']).toBeDefined()

      expect(container.get('num3')).toBe(33)
      expect(container.get('fun2').doubler(21)).toBe(42)
      expect(container.get('fun2.square')(2)).toBe(4)
      expect(container.get('fun').doubler(21)).toBe(42)
      expect(container.get('fun.nested').fun).toBe(34)

      expect(() => container.loadServices({ num1: 1 })).toThrow()

      expect(container.get('').num3).toBe(33)

      expect(() => container.get('alpha')).toThrow()
    })
  })
})
