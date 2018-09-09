const Dilite = require('./Dilite')

describe('Dilite', () => {
  let dilite
  beforeEach(() => {
    dilite = new Dilite()
  })

  afterEach(() => {
    dilite = null
  })

  describe('Class', () => {
    it('Exists', function() {
      expect(Dilite).toBeInstanceOf(Function)
      expect(dilite).toBeInstanceOf(Dilite)
    })

    it('only exposes get, set methods', () => {
      expect(dilite.get).toBeInstanceOf(Function)
      expect(dilite.set).toBeInstanceOf(Function)

      expect(dilite.core).toBeDefined()
      expect(dilite.cache).toBeDefined()
      expect(dilite.getValue).toBeDefined()
      expect(dilite.setValue).toBeDefined()
      expect(dilite.setFactory).toBeDefined()
      expect(dilite.setCtor).toBeDefined()
    })
  })

  describe('Shared flag', () => {
    it('handles shared flag correctly', () => {
      dilite.set('shared', {
        factory: () => new Object()
      })

      dilite.set('notShared', {
        factory: () => new Object(),
        shared: false
      })

      const shared1 = dilite.get('shared')
      const shared2 = dilite.get('shared')

      expect(shared1).toBe(shared2)

      const notShared1 = dilite.get('notShared')
      const notShared2 = dilite.get('notShared')

      expect(notShared1).not.toBe(notShared2)
    })
  })

  describe('#get(\'container\')', () => {
    it('returns itself', () => {
      const self = dilite.get('container')
      expect(self).toBe(dilite)
    })
  })

  describe('random tests', () => {
    it('Works as expected', () => {
      const anObject = {}
      const Sq = function(anObject, number) {
        this.n = number
        this.o = anObject
      }

      dilite.set('number', { value: 10 })
      dilite.set('square', { value: x => x * x })

      dilite.set('anObject', { factory: () => anObject })

      dilite.set('number_square', {
        factory: (square, number) => square(number),
        inject: ['square', 'number']
      })

      dilite.set('obj', {
        ctor: Sq,
        inject: ['anObject', 'number']
      })

      expect(dilite.get('number')).toBe(10)
      expect(dilite.get('square')(20)).toBe(400)

      expect(dilite.get('anObject')).toBe(anObject)
      expect(dilite.get('number_square')).toBe(100)

      const o = dilite.get('obj')
      expect(o.n).toBe(10)
      expect(o.o).toBe(anObject)
    })
  })
})
