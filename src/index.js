const toDecorator = (wrapFn, wrapMd = wrapFn) =>
  (target, key, descriptor) => key === undefined
    ? wrapFn(target)
    : {
      ...descriptor,
      value: (typeof target === 'function' ? wrapFn : wrapMd)(descriptor.value)
    }

// ===================================================================

const synchronizedFn = fn => {
  let queue = Promise.resolve()

  return function () {
    const makeCall = () => fn.apply(this, arguments)

    return (queue = queue.then(makeCall, makeCall))
  }
}
const synchronizedMd = method => {
  const s = Symbol('@synchronized')

  return function () {
    const makeCall = () => method.apply(this, arguments)

    return (this[s] = (this[s] || Promise.resolve()).then(makeCall, makeCall))
  }
}

export default toDecorator(synchronizedFn, synchronizedMd)
