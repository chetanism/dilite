const DiliteCore = require('./DiliteCore')

describe('DiliteCore', () => {
  let container
  beforeEach(() => {
    container = new DiliteCore()
  })

  afterEach(() => {
    container = null
  })

  it('Exists', function() {
    expect(DiliteCore).toBeInstanceOf(Function)
  })

  describe('statics', () => {
    describe('.create', () => {
      it('creates a DiliteCore instance', () => {
        const dilite = DiliteCore.create()
        expect(dilite).toBeInstanceOf(DiliteCore)
      })
    })

    describe('.isDiliteCore', () => {
      it('checks for DiliteCore instances', () => {
        expect(DiliteCore.isDiliteCore(container)).toBeTruthy()
        expect(DiliteCore.isDiliteCore({})).toBeFalsy()
        expect(DiliteCore.isDiliteCore(-1)).toBeFalsy()
      })
    })
  })

  describe('Utilities', () => {
    describe('#isDefined', () => {
      it('checks if value or factory is already defined', () => {
        container.setValue('value1', 1)
        container.setFactory('value2', () => 3)

        expect(container.isDefined('value1')).toBeTruthy()
        expect(container.isDefined('value2')).toBeTruthy()
      })
    })
  })

  describe('Values', () => {
    describe('#setValue', () => {
      it('can set values', () => {
        const ret = container.setValue('someValue', -1)
        expect(ret).toBe(container)

        expect(container.values['someValue']).toBe(-1)
      })

      it("doesn't accepts undefined values", () => {
        expect(() => container.setValue('name')).toThrow()
        expect(() => container.setValue('value', undefined)).toThrow()
      })

      it("doesn't redefines stuff", () => {
        container.setValue('value1', 1)
        container.setFactory('value2', () => 2)

        expect(() => container.setValue('value1', 3)).toThrow()
        expect(() => container.setValue('value2', 3)).toThrow()
      })
    })

    describe('#hasValue', () => {
      it('checks if a value is present', () => {
        container.setValue('value', 'a')
        expect(container.hasValue('value')).toBeTruthy()
      })
    })
  })

  describe('Factory', () => {
    describe('#setFactory', () => {
      it('Sets the factory function', () => {
        const factory = () => 0 - 1
        const ret = container.setFactory('valueFactory', factory)

        expect(ret).toBe(container)
        expect(container.factories['valueFactory']).toBe(factory)
      })

      it('accepts only functions', () => {
        expect(() => container.setFactory('null', null)).toThrow()
        expect(() => container.setFactory('number', 1)).toThrow()
        expect(() => container.setFactory('string', 'string')).toThrow()
        expect(() => container.setFactory('boolean', true)).toThrow()
        expect(() => container.setFactory('objects', {})).toThrow()
        expect(() => container.setFactory('undefined', undefined)).toThrow()
        expect(() =>
          container.setFactory('symbol', Symbol('some symbol'))
        ).toThrow()
        expect(() => container.setFactory('function', () => 1)).not.toThrow()
      })

      it("doesn't redefines stuff", () => {
        container.setValue('value1', 1)
        container.setFactory('value2', () => 2)

        expect(() => container.setFactory('value1', () => 3)).toThrow()
        expect(() => container.setValue('value2', () => 3)).toThrow()
      })
    })

    describe('#createFromFactory', () => {
      it('creates values using factory functions', () => {
        container.setFactory('value', () => 0 - 1)
        const value = container.createFromFactory('value')
        expect(value).toBe(-1)
      })
    })

    describe('#hasFactory', () => {
      it('checks if a factory is present', () => {
        container.setFactory('value', () => {})
        expect(container.hasFactory('value')).toBeTruthy()
      })
    })
  })

  describe('Getter', () => {
    describe('#getValue', () => {
      it('Returns the expected value', () => {
        container.setValue('value', -1)

        const value = container.getValue('value')
        expect(value).toBe(-1)
      })
    })
  })
})
