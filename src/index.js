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
  if (isMethod) {
    const s = Symbol()
    const free = () => {
      this[s] = null
    }

    return function __synchronized__ () {
      const makeCall = () => {
        const promise = new Promise(resolve => resolve(fn.apply(this, arguments)))

        this[s] = promise.then(free, free)

        return promise
      }

      const current = this[s]

      return current
        ? current.then(makeCall)
        : makeCall()
    }
  }

  let current
  const free = () => {
    current = null
  }
  return function __synchronized__ () {
    const makeCall = () => {
      const promise = new Promise(resolve => resolve(fn.apply(this, arguments)))

      current = promise.then(free, free)

      return promise
    }

    return current
      ? current.then(makeCall)
      : makeCall()
  }
}

export default toDecorator(synchronized)
