const toDecorator = (wrapFn, wrapMd = wrapFn) => (...args) => {
  const wrapFn_ = wrapFn()
  const wrapMd_ = wrapMd()
  const decorator = (target, key, descriptor) => key === undefined
    ? wrapFn_(target)
    : {
      ...descriptor,
      value: (typeof target === 'function' ? wrapFn_ : wrapMd_)(descriptor.value)
    }

  return args.length === 0
    ? decorator
    : decorator(...args) // for now, we tolerate raw calls to the decorator
}

// ===================================================================

export default toDecorator(
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
