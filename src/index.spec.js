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
      fn (expectedI) {
        expect(i).toBe(expectedI)

        return Promise.resolve().then(() => {
          ++i
        })
      }
    }

    const t0 = new Test()
    const t1 = new Test()

    return Promise.all([
      t0.fn(0),
      t1.fn(0),
      t0.fn(2)
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
})

describe('synchronized functions with keys', () => {
  it('should synchronize async functions', async () => {
    const counters = []
    const fn = synchronized.withKey()(
      async (key, result) => {
        counters[key] = (counters[key] || 0) + 1
        return result
      }
    )

    const p0 = Promise.all([
      fn(0, 'foo'),
      fn(0, 'bar')
    ])
    const p1 = Promise.all([
      fn(1, 'baz'),
      fn(1, 'qux')
    ])

    expect(counters[0]).toBe(1)
    expect(counters[1]).toBe(1)

    expect(await p0).toEqual([ 'foo', 'bar' ])
    expect(await p1).toEqual([ 'baz', 'qux' ])

    expect(counters[0]).toBe(2)
    expect(counters[1]).toBe(2)
  })
})

describe('synchronized methods with keys', () => {
  it('should synchronize async methods', async () => {
    class Test {
      constructor () {
        this.counters = []
      }

      @synchronized.withKey()
      async fn (key, result) {
        this.counters[key] = (this.counters[key] || 0) + 1
        return result
      }
    }

    const t0 = new Test()
    const t1 = new Test()

    const p00 = Promise.all([
      t0.fn(0, 'foo'),
      t0.fn(0, 'bar')
    ])
    const p01 = Promise.all([
      t0.fn(1, 'baz'),
      t0.fn(1, 'qux')
    ])
    const p10 = Promise.all([
      t1.fn(0, 'quux'),
      t1.fn(0, 'quuz')
    ])

    expect(t0.counters[0]).toBe(1)
    expect(t0.counters[1]).toBe(1)
    expect(t1.counters[0]).toBe(1)

    expect(await p00).toEqual([ 'foo', 'bar' ])
    expect(await p01).toEqual([ 'baz', 'qux' ])
    expect(await p10).toEqual([ 'quux', 'quuz' ])

    expect(t0.counters[0]).toBe(2)
    expect(t0.counters[1]).toBe(2)
    expect(t1.counters[0]).toBe(2)
  })
})
