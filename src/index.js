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

const synchronizedFn = () => {
  let queue = Promise.resolve()
  return fn => function () {
    const makeCall = () => fn.apply(this, arguments)

    return (queue = queue.then(makeCall, makeCall))
  }
}
const synchronizedMd = () => {
  const s = Symbol('@synchronized')
  return method => function () {
    const makeCall = () => method.apply(this, arguments)

    return (this[s] = (this[s] || Promise.resolve()).then(makeCall, makeCall))
  }
}

export default toDecorator(synchronizedFn, synchronizedMd)
