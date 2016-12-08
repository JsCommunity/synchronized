const toDecorator = wrap => (target, key, descriptor) => {
  if (key === undefined) {
    return wrap(target)
  }

  const { value, writable, ...newDescriptor } = descriptor
  newDescriptor.get = function () {
    const wrappedMethod = wrap(value, true)

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
      const descriptor = Object.getOwnPropertyDescriptor(target, key)
      delete descriptor.set
      Object.defineProperty(this, key, descriptor)
    }
  }

  return newDescriptor
}

// ===================================================================

const synchronized = fn => {
  const queue = []
  const dequeue = () => queue.splice(0, 1)

  return function (...params) {
    const makeCall = () => {
      const promise = fn.call(this, ...params)
      queue.push(promise)
      promise.then(dequeue, dequeue)
      return promise
    }

    if (queue.length === 0) {
      return makeCall()
    } else {
      return queue[queue.length - 1].then(makeCall, makeCall)
    }
  }
}

export default toDecorator(synchronized)
