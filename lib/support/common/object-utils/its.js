// TODO: add examples to JSDocs

/**
 * @param {any} obj
 * @returns {String}
 */
export const describe = obj => {
  const objString = obj?.toString()
  const objDescription =
    objString === '[object Object]'
      ? obj.constructor.name !== 'Object'
        ? obj.constructor.name
        : JSON.stringify(obj)
      : objString
  return !!objDescription ? `${objDescription}: ` : ''
}

/**
 * Function that finds the key in an object by its value.
 * @type {<T>(value: T) => (obj: Record<string, T>) => string | undefined}
 */
export const keyByValue = value => obj =>
  Object.keys(obj).find(key => obj[key] === value)

/**
 * @param {Object} obj
 * @param {Array<String | Number>} path keys to get the value of obj
 * @returns {any}
 */
export const get = (obj, path) =>
  // TODO: should we simplify it to:
  // path.reduce((acc, key) => acc && acc[key], obj)
  path.reduce((acc, key) => (acc === undefined ? acc : acc[key]), obj)

/**
 * @param {Object} obj
 * @param {Array<String | Number>} path keys to get the value of obj
 * @returns {Boolean}
 */
export const has = (obj, path) =>
  // path.reduce((acc, key) => acc && acc[key], obj)
  get(obj, path) !== undefined

/**
 * @param {Object} obj
 * @param {Array<String | Number>} path keys to get the value of obj
 * @returns {any}
 */
export const set = (obj, path, value) => {
  path.slice(0, -1).reduce((acc, key) => acc[key], obj)[path.slice(-1)[0]] = value
}

export const at = {
  path: keys => ({
    on: obj => get(obj, keys),
    set: value => ({ on: obj => set(obj, keys, value) }),
  }),
}

const path = keys => ({
  from: obj => get(obj, keys),
  in: obj => has(obj, keys),
  value: newValue => ({ set: onObject => set(onObject, keys, newValue) }),
  set: (value, onObject) => set(onObject, keys, value),
})

export default {
  description(obj) {
    return describe(obj)
  },
  /**
   * Parses object into a tree of branches and leaves
   * in the shape of a Map of  keys array to corresponding object values
   *
   * @param {Object} obj object to parse
   * @returns {{tree: Map<Array<String | Number>, any>}} a Map of keys to corresponding object values
   */
  parsed(obj) {
    // TODO: for better performance, consider parsing from scratch, not using JSON as workardound
    let tree = new Map()
    let lastThis = null
    JSON.parse(JSON.stringify(obj, null), function (key, value) {
      if (lastThis === null) {
        lastThis = this
      }
      if (this !== lastThis && value === lastThis) {
        tree = new Map(
          [...tree].map(([branch, [leaf, _this]]) =>
            _this === value
              ? [
                  [key, ...branch],
                  [leaf, this],
                ]
              : [branch, [leaf, _this]],
          ),
        )
      } else {
        tree.set([key], [value, this])
      }

      lastThis = this
      return value
    })
    return {
      tree: new Map(
        [...tree].map(([[_first, ...pathTo], [leaf, _this]]) => [pathTo, leaf]),
      ),
    }
  },
  primitiveClone(obj) {
    return JSON.parse(JSON.stringify(obj))
  },
  path,
}
