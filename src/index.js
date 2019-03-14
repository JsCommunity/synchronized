const toDecorator = (wrapFn, wrapMd = wrapFn) => (...args) => {
  const wrapFn_ = wrapFn()
  const wrapMd_ = wrapMd()
  const decorator = (target, key, descriptor) => key === undefined
    ? wrapFn_(target)
    : {
      ...descriptor,
      value: (typeof target === 'function' ? wrapFn_ : wrapMd_)(descriptor.value),
    }

  return args.length === 0
    ? decorator
    : decorator(...args) // for now, we tolerate raw calls to the decorator
}

// ===================================================================

const synchronize = toDecorator(
  () => {
    let queue = Promise.resolve()
    return fn => function () {
      const makeCall = () => fn.apply(this, arguments)

      return (queue = queue.then(makeCall, makeCall))
    }
  },
  () => {
    const queues = new WeakMap()
    return method => function () {
      const makeCall = () => method.apply(this, arguments)

      let queue = queues.get(this)
      queues.set(
        this,
        queue = queue === undefined ? makeCall() : queue.then(makeCall, makeCall)
      )
      return queue
    }
  }
)

export { synchronize as default }

// -------------------------------------------------------------------

const DEFAULT_KEY_FUNCTION = arg => arg

synchronize.withKey = toDecorator(
  (keyFunction = DEFAULT_KEY_FUNCTION) => {
    const queues = new Map()
    return fn => function () {
      const key = keyFunction.apply(this, arguments)
      const makeCall = () => fn.apply(this, arguments)
      let queue = queues.get(key)
      queues.set(
        key,
        queue = queue === undefined ? makeCall() : queue.then(makeCall, makeCall)
      )
      const clean = () => {
        if (queues.get(key) === queue) {
          queues.delete(key)
        }
      }
      queue.then(clean, clean)
      return queue
    }
  },
  (keyFunction = DEFAULT_KEY_FUNCTION) => {
    const instancesQueues = new WeakMap()
    return method => function () {
      const key = keyFunction.apply(this, arguments)
      let queues = instancesQueues.get(this)
      if (queues === undefined) {
        instancesQueues.set(this, queues = new Map())
      }
      const makeCall = () => method.apply(this, arguments)
      let queue = queues.get(key)
      queues.set(
        key,
        queue = queue === undefined ? makeCall() : queue.then(makeCall, makeCall)
      )
      const clean = () => {
        if (queues.get(key) === queue) {
          queues.delete(key)
        }
      }
      queue.then(clean, clean)
      return queue
    }
  }
)
