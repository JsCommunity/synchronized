/* eslint-env jest */

import synchronized from './'

describe('synchronized functions', () => {
  it('should synchronize async functions', () => {
    let i = 0
    const fn = synchronized((expectedI, result) => {
      expect(i).toBe(expectedI)

      return Promise.resolve().then(() => {
        i++
        return result
      })
    })

    return Promise.all([
      fn(0, 'foo').then(result => {
        expect(result).toBe('foo')
      }),
      fn(1, 'bar').then(result => {
        expect(result).toBe('bar')
      })
    ]).then(() => expect(i).toBe(2))
  })

  it('should synchronize async rejected functions', () => {
    let i = 0
    const fn = synchronized((expectedI, error) => {
      expect(i).toBe(expectedI)
      return Promise.resolve().then(() => {
        i++
        return Promise.reject(error)
      })
    })

    return Promise.all([
      fn(0, 'foo').then(() => {
        expect(true).toBe(false)
      }).catch(error => {
        expect(error).toBe('foo')
      }),
      fn(1, 'bar').then(() => {
        expect(true).toBe(false)
      }).catch(error => {
        expect(error).toBe('bar')
      })
    ]).then(() => {
      expect(i).toBe(2)
    })
  })
})

describe('synchronized methods', () => {
  it('should not synchronize between instances', () => {
    let i = 0
    class Test {
      @synchronized
      fn (expectedI, result) {
        expect(i).toBe(expectedI)
        return Promise.resolve().then(() => {
          i++
          return result
        })
      }
    }

    const t1 = new Test()
    const t2 = new Test()

    return Promise.all([
      t1.fn(0, 'foo').then(result => {
        expect(result).toBe('foo')
      }),
      t1.fn(2, 'bar').then(result => {
        expect(result).toBe('bar')
      }),
      t2.fn(1, 'baz').then(result => {
        expect(result).toBe('baz')
      })
    ]).then(() => {
      expect(i).toBe(3)
    })
  })

  it('should synchronize async static methods', () => {
    let i = 0
    class Test {
      @synchronized
      static fn (expectedI, result) {
        expect(i).toBe(expectedI)

        return Promise.resolve().then(() => {
          i++
          return result
        })
      }
    }

    const { fn } = Test

    return Promise.all([
      fn(0, 'foo').then(result => {
        expect(result).toBe('foo')
      }),
      fn(1, 'bar').then(result => {
        expect(result).toBe('bar')
      })
    ]).then(() => {
      expect(i).toBe(2)
    })
  })

  it('should behave like a normal property', () => {
    class Test {
      @synchronized
      fn () {
        return 0
      }
    }

    const t = new Test()
    t.fn = 42

    expect(Object.getOwnPropertyDescriptor(t, 'fn')).toEqual({
      value: 42,
      writable: true,
      enumerable: true,
      configurable: true
    })
  })
})
