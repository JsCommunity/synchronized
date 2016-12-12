const toDecorator = wrap => (target, key, descriptor) => {
  // function
  if (key === undefined) {
    return wrap(target)
  }

  return {
    ...descriptor,
    value: wrap(descriptor.value, typeof target !== 'function')
  }
}

// ===================================================================

const synchronized = (fn, isMethod) => {
  const { get, set } = (() => {
    if (isMethod) {
      const s = Symbol()
      return {
        get () {
          return this[s]
        },
        set (value) {
          this[s] = value
        }
      }
    }

    let current
    return {
      get: () => current,
      set: value => {
        current = value
      }
    }
  })()

  return function () {
    const makeCall = () => {
      const promise = new Promise(resolve => resolve(fn.apply(this, arguments)))

      const free = () => set.call(this, null)
      set.call(this, promise.then(free, free))

      return promise
    }

    const current = get.call(this)

    return current
      ? current.then(makeCall)
      : makeCall()
  }
}

export default toDecorator(synchronized)
