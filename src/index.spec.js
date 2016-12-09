/* eslint-env jest */

import synchronized from './'

describe('synchronized functions', () => {
  it('should synchronize async functions', () => {
    let i = 0
    const fn = synchronized((expectedI, result) => {
      expect(expectedI).toBe(i)

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
    ])
  })

  it('should synchronize async rejected functions', () => {
    let i = 0
    const fn = synchronized((expectedI, result) => {
      expect(expectedI).toBe(i)
      return Promise.resolve().then(() => {
        i++
        return Promise.reject('reason')
      })
    })

    return Promise.all([
      fn(0, 'foo'),
      fn(1, 'bar')
    ]).catch(error => {
      expect(i).toBe(1)
      expect(error).toBe('reason')
    })
  })
})

describe('synchronized methods', () => {
  it('should synchronize async methods', () => {
    let i = 0
    class Test {
      @synchronized
      fn (expectedI, result) {
        expect(expectedI).toBe(i)

        return Promise.resolve().then(() => {
          i++
          return result
        })
      }
    }

    const t = new Test()

    return Promise.all([
      t.fn(0, 'foo').then(result => {
        expect(result).toBe('foo')
      }),
      t.fn(1, 'bar').then(result => {
        expect(result).toBe('bar')
      })
    ]).then(() => {
      expect(i).toBe(2)
    })
  })

  it('should synchronize async static methods', () => {
    let i = 0
    class Test {
      @synchronized
      static fn (expectedI, result) {
        expect(expectedI).toBe(i)

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

  it('should forward setter', () => {
    class Test {
      @synchronized
      fn () {
        return 0
      }
    }

    const t = new Test()

    function newFn () {
      return 1
    }
    t.fn = newFn

    expect(t.fn).toBe(newFn)
  })
})
