import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)

/*
 * The implementation below is inspired by
 * - https://javascript.plainenglish.io/javascript-how-to-intercept-function-and-method-calls-b9fd6507ff02
 * - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy
 * TODO: Ensure works with #-marked private props
 */

/**
 * @template T
 * @param {T} obj
 * @param {(prop: string | symbol, args: any[]) => void} fn
 * @returns {T}
 */
export function interceptMethodCalls(obj, fn) {
  const target = /** @type {Record<string | symbol, any>} */ (obj)
  return /** @type {T} */ (
    new Proxy(target, {
      get(target, prop) {
        if (typeof target[prop] === 'function') {
          return new Proxy(target[prop], {
            apply: (target, thisArg, argumentsList) => {
              fn(prop, argumentsList)
              return Reflect.apply(target, thisArg, argumentsList)
            },
          })
        } else {
          return Reflect.get(target, prop)
        }
      },
    })
  )
}

// TODO: consider moving to stack utils, being configurable via config/env
//       so it can be reused in other places, where we utilize proxies, etc.
/** @param {string} stack */
const filteredStackFromThisFileCode = stack =>
  stack
    .split('\n')
    .filter(/** @param {string} line */ line => !line.includes(__filename))
    .join('\n')

/** @param {any} error */
const reThrowWithFilteredStackFromThisFileCode = error => {
  error.stack = filteredStackFromThisFileCode(error.stack)
  // TODO: apply also transformation `Proxy.apply (...)` => `...`
  throw error
}

/**
 * @template T
 * @param {T} obj
 * @param {(prop: string | symbol, args: any[], callback: () => any) => any} fn
 * @returns {T}
 */
export function wrapMethodCalls(obj, fn) {
  const target = /** @type {Record<string | symbol, any>} */ (obj)
  return /** @type {T} */ (
    new Proxy(target, {
      get(target, prop) {
        if (typeof target[prop] === 'function') {
          return new Proxy(target[prop], {
            apply: (target, thisArg, argumentsList) => {
              const callback = () => {
                try {
                  const res = Reflect.apply(target, thisArg, argumentsList)
                  return res instanceof Promise ?
                      res.then(
                        result => result,
                        reThrowWithFilteredStackFromThisFileCode,
                      )
                    : res
                } catch (error) {
                  reThrowWithFilteredStackFromThisFileCode(error)
                }
              }
              return fn(prop, argumentsList, callback)
            },
          })
        } else {
          return Reflect.get(target, prop)
        }
      },
    })
  )
}

/**
 * @template T
 * @param {T} obj
 * @param {(prop: string | symbol, valueGetter: () => any) => any} propAndGetterCallback decorator
 * @returns {T}
 */
export function wrapProperties(obj, propAndGetterCallback) {
  const target = /** @type {Record<string | symbol, any>} */ (obj)
  return /** @type {T} */ (
    new Proxy(target, {
      get(target, prop) {
        if (typeof target[prop] === 'function') {
          return target[prop]
        } else {
          const getter = () => target[prop]
          return propAndGetterCallback(prop, getter)
        }
      },
    })
  )
}

/**
 * @template T
 * @param {T} obj callable
 * @param {(callableResult: any, callableArgs: any[]) => any} resultCallback decorator
 * @returns {T}
 */
export function wrapCallable(obj, resultCallback) {
  return /** @type {T} */ (
    new Proxy(/** @type {Function} */ (obj), {
      apply: (target, thisArg, argumentsList) => {
        return resultCallback(
          Reflect.apply(target, thisArg, argumentsList),
          argumentsList,
        )
      },
    })
  )
}
