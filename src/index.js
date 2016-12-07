const toDecorator = wrap => (target, key, descriptor) => {
  if (key === undefined) {
    return wrap(target)
  }

  return {
    ...descriptor,
    value: wrap(descriptor.value)
  }
}

// ===================================================================

const synchronized = fn => function () {
  throw new Error('not implemented')
}

export default toDecorator(synchronized)
