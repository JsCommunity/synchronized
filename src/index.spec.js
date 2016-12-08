/* eslint-env jest */

import synchronized from './'

describe('synchronized()', () => {
  it('should synchronize async functions', () => {
    let i = 0
    const fn = synchronized((expectedI, result) => {
      expect(expectedI).toBe(i++)

      return Promise.resolve().then(() => {
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

  it('should synchronize async delayed functions', () => {
    let i = 0
    const fn = synchronized((expectedI, result) => {
      return new Promise((resolve, reject) => {
        const tmp = i
        expect(expectedI).toBe(tmp)

        setTimeout(() => {
          i = tmp + 1
          resolve(result)
        }, 100)
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

  it('should synchronize async delayed functions with one rejected promise', () => {
    let i = 0
    const fn = synchronized((expectedI, result) => {
      return new Promise((resolve, reject) => {
        const tmp = i
        expect(expectedI).toBe(tmp)

        setTimeout(() => {
          i = tmp + 1
          if (i > 1) {
            reject('reason')
          } else {
            resolve('ok')
          }
        }, 100)
      })
    })

    return Promise.all([
      fn(0, 'foo'),
      fn(1, 'bar')
    ]).catch(error => {
      expect(i).toBe(2)
      expect(error).toBe('reason')
    })
  })

  it('should synchronize async methods', () => {
    let i = 0
    class Test {
      @synchronized
      fn (expectedI, result) {
        return new Promise((resolve, reject) => {
          const tmp = i
          expect(tmp).toBe(expectedI)

          setTimeout(() => {
            i = tmp + 1
            resolve(result)
          }, 100)
        })
      }
    }

    const t = new Test()
    const t2 = new Test()

    t2.fn = function () {}

    return Promise.all([
      t.fn(0, 'foo').then(result => {
        expect(result).toBe('foo')
      }),
      t.fn(1, 'bar').then(result => {
        expect(result).toBe('bar')
      }),
      t2.fn(0, 'baz').then(result => {
        expect(result).toBe('baz')
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
        return new Promise((resolve, reject) => {
          const tmp = i
          expect(tmp).toBe(expectedI)

          setTimeout(() => {
            i = tmp + 1
            resolve(result)
          }, 100)
        })
      }
    }

    return Promise.all([
      Test.fn(0, 'foo').then(result => {
        expect(result).toBe('foo')
      }),
      Test.fn(1, 'bar').then(result => {
        expect(result).toBe('bar')
      })
    ]).then(() => {
      expect(i).toBe(2)
    })
  })
})
