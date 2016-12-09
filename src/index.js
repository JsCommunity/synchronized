const toDecorator = wrap => (target, key, descriptor) => {
  // function
  if (key === undefined) {
    return wrap(target)
  }

  // static method
  if (typeof target === 'function') {
    return {
      ...descriptor,
      value: wrap(descriptor.value)
    }
  }

  // instance method

  const { value, writable, ...newDescriptor } = descriptor
  newDescriptor.get = function () {
    const wrappedMethod = wrap(value)

    const descriptor = Object.getOwnPropertyDescriptor(target, key)
    delete descriptor.get
    descriptor.value = wrappedMethod
    if ('set' in descriptor) {
      delete descriptor.set
      descriptor.writable = true
    }
    Object.defineProperty(this, key, descriptor)

    return wrappedMethod
  }
  if (writable) {
    newDescriptor.set = function (value) {
      Object.defineProperty(this, key, {
        configurable: true,
        enumerable: true,
        value,
        writable: true
      })
    }
  }

  return newDescriptor
}

// ===================================================================

const synchronized = fn => {
  let current
  const free = () => {
    current = null
  }

  return function () {
    const makeCall = () => {
      const promise = fn.apply(this, arguments)

      current = promise.then(free, free)

      return promise
    }

    return current
      ? current.then(makeCall)
      : makeCall()
  }
}

export default toDecorator(synchronized)
