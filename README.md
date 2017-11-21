# decorator-synchronized [![Build Status](https://travis-ci.org/JsCommunity/decorator-synchronized.png?branch=master)](https://travis-ci.org/JsCommunity/decorator-synchronized)

> Function decorator which ensures that calls do not run simultaneously.

Requires *WeakMap*, it your system does not have it, use a [polyfill](https://github.com/medikoo/es6-weak-map).

## Install

Installation of the [npm package](https://npmjs.org/package/decorator-synchronized):

```
> npm install --save decorator-synchronized
```

## Usage

```js
import synchronized from 'decorator-synchronized'

let i = 0

const fn = synchronized(() => {
  console.log(i)
  return Promise.resolve().then(() => {
    i++
  })
})

Promise.all([ fn(), fn() ])
// => Prints 0 then 1

// Create a dedicated synchronizer which will be shared amongst
// multiple functions.
//
// Useful when functions work on the same resource.
const counterSynchronized = synchronized()

const increment = counterSynchronized(async () => {
  const i = 1 + await db.getCounter()
  await db.setCounter(i)
  return i
})

const decrement = counterSynchronized(async () => {
  const i = -1 + await db.getCounter()
  await db.setCounter(i)
  return i
})

increment().then(console.log) // prints 1
decrement().then(console.log) // prints 0
```

### `withKey`

```js
import synchronized from 'decorator-synchronized'

const updateUser = synchronized.withKey()((userId, props) => {
  const user = await db.getUser(userId)
  await db.setUser(userId, { ...user, ...props })
})

// will correctly update the user without race conditions
updaterUser('wq1567e', { foo: 3.14 })
updaterUser('wq1567e', { bar: 42 })

// different users are still updated in parallel
updateUser('ct356tv', { baz: 2.72 })
```

The key is deduced from the first argument, if you need something
else, just provide a key function:

```js
const fn = synchronized.withKey(
  (_, secondArg) => secondArg
)((firstArg, secondArg) => {
  // TODO
})
```

## Development

```
# Install dependencies
> npm install

# Run the tests
> npm test

# Continuously compile
> npm run dev

# Continuously run the tests
> npm run dev-test

# Build for production (automatically called by npm install)
> npm run build
```

## Contributions

Contributions are *very* welcomed, either on the documentation or on
the code.

You may:

- report any [issue](https://github.com/JsCommunity/decorator-synchronized/issues)
  you've encountered;
- fork and create a pull request.

## License

ISC © [Pierre Donias](https://github.com/pdonias)
