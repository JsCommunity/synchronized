const bind = (fn, thisArg) => function () {
  return fn.apply(this, arguments)
}

const makeValueSetter = key => function (value) {
  Object.defineProperty(this, key, {
    configurable: true,
    enumerable: true,
    value,
    writable: true
  })
}

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
    const wrappedMethod = wrap(
      bind(value, this) // this method is linked to this instance, it is bound to avoid issues
    )

    const descriptor = Object.getOwnPropertyDescriptor(target, key)
    descriptor.get = () => wrappedMethod
    if ('set' in descriptor) {
      descriptor.set = makeValueSetter(key)
    }
    Object.defineProperty(this, key, descriptor)

    return wrappedMethod
  }
  if (writable) {
    newDescriptor.set = makeValueSetter(key)
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
