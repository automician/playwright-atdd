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
  return objDescription ? `${objDescription}: ` : ''
}

/**
 * Function that finds the key in an object by its value.
 * @type {<T>(value: T) => (obj: Record<string, T>) => string | undefined}
 */
export const keyByValue = value => obj =>
  Object.keys(obj).find(key => obj[key] === value)

/**
 * Parses a string path like 'a.b.[0].c' into an array of keys ['a', 'b', 0, 'c']
 * @param {String} path
 * @returns {Array<String | Number>}
 */
const parsePath = path =>
  path.split(/\.(?![^[]*\])/).flatMap(part => {
    const match = part.match(/^\[(\d+)\]$/)
    return match ? parseInt(match[1], 10) : part
  })

/**
 * @param {Array<String | Number> | String | Number} path
 * @returns {Array<String | Number>}
 */
const toKeys = path =>
  typeof path === 'string' ? parsePath(path) : typeof path === 'number' ? [path] : path

/**
 * @param {Array<String | Number> | String | Number} path keys to get the value of obj, either as array or dot-notation path like 'a.b.[0].c'
 * @param {Object} obj - object to get nested value from
 * @returns {any}
 */
export const get = (path, obj) => {
  if (!path) return obj
  return toKeys(path).reduce((acc, key) => acc?.[key], obj)
}

/** @type {<T>(path: Array<String | Number> | String | Number) => (obj: T) => T} */
export const Get = path => obj => get(path, obj)

/**
 * @param {Array<String | Number> | String | Number} path keys to get the value of obj
 * @param {Object} obj
 * @returns {Boolean}
 */
export const has = (path, obj) =>
  // path.reduce((acc, key) => acc && acc[key], obj)
  get(obj, path) !== undefined

/** @type {<T>(path: Array<String | Number> | String | Number) => (obj: T) => Boolean} */
export const Has = path => obj => has(path, obj)

/**
 * @template T
 * @param {any} value
 * @param {Array<String | Number> | String | Number} path keys to get the value of obj
 * @param {T} obj
 * @returns {T}
 */
export const set = (path, value, obj) => {
  const keys = toKeys(path)
  keys.slice(0, -1).reduce((acc, key) => acc[key], obj)[keys.slice(-1)[0]] = value
  return obj
}

/** @type {<T>(path: Array<String | Number> | String | Number, value: any) => (obj: T) => T} */
export const Set = (path, value) => obj => set(path, value, obj)

export const at = {
  path: keys => ({
    from: obj => get(keys, obj),
    set: value => ({ on: obj => set(keys, value, obj) }),
  }),
}

/**
 * @param {Array<String | Number> | String | Number} keys
 */
const path = keys => ({
  from: obj => get(keys, obj),
  in: obj => has(keys, obj),
  /** @type {<T>(newValue: any) => { set: (onObject: T) => T }} */
  value: newValue => ({ set: onObject => set(keys, newValue, onObject) }),
  /** @type {<T>(onObject: T) => { get: () => any; set: (value: any) => T; with: (value: any) => T }} */
  on: obj => ({
    get: () => get(keys, obj),
    set: value => set(keys, value, obj),
    with: value => set(keys, value, { ...obj }), // TODO: consider smarter deep cloning
  }),
  /** @type {<T>(value: T, onObject: T) => T} */
  set: (value, onObject) => set(keys, value, onObject),
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
    // TODO: for better performance, consider parsing from scratch, not using JSON as workaround
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
