// todo: add examples to JSDocs

/**
 * @param {any} obj
 * @returns {string}
 */
export const describe = obj => {
  const maybeObjString = obj?.toString()
  const description =
    maybeObjString === '[object Object]' ?
      obj.constructor.name !== 'Object' ?
        obj.constructor.name
      : JSON.stringify(obj)
    : maybeObjString
  return description ? `${description}: ` : ''
}

/**
 * Function that finds the key in an object by its value.
 * @type {<T>(value: T) => (obj: Record<string, T>) => (string | undefined)}
 */
export const KeyByValue = value => obj =>
  Object.keys(obj).find(key => obj[key] === value)

/**
 * Parses a string path like 'a.b.[0].c' into an array of keys ['a', 'b', 0, 'c']
 * @param {string} path
 * @returns {Array<string | number>}
 */
const parsePath = path =>
  path.split(/\.(?![^[]*\])/).flatMap(part => {
    const match = /^\[(\d+)\]$/.exec(part)
    return match ? parseInt(/** @type {string} */ (match[1]), 10) : part
  })

/**
 * Ensures the path is an array of keys
 * @param {Array<string | number> | string | number} path
 * @returns {Array<string | number>}
 */
const toKeys = path =>
  typeof path === 'string' ? parsePath(path)
  : typeof path === 'number' ? [path]
  : path

/**
 * @param {Array<string | number> | string | number} path keys to get the value of obj, either as array or dot-notation path like 'a.b.[0].c'
 * @param {any} obj - object to get nested value from
 * @returns {any} the value at the path, or undefined if the path is not found
 */
export const get = (path, obj) => {
  if (!path) return obj
  return toKeys(path).reduce((acc, key) => acc?.[key], obj)
}

/** @type {<T>(path: Array<string | number> | string | number) => (obj: T) => T} */
export const Get = path => obj => get(path, obj)

/**
 * @param {Array<string | number> | string | number} path keys to get the value of obj
 * @param {any} obj
 * @returns {boolean}
 */
export const has = (path, obj) =>
  // path.reduce((acc, key) => acc && acc[key], obj)
  get(path, obj) !== undefined

/** @type {<T>(path: Array<string | number> | string | number) => (obj: T) => boolean} */
export const Has = path => obj => has(path, obj)

/**
 * @template T
 * @param {any} value
 * @param {Array<string | number> | string | number} path keys to get the value of obj
 * @param {T} obj
 * @returns {T}
 */
export const set = (path, value, obj) => {
  const keys = toKeys(path)
  const parent = keys
    .slice(0, -1)
    .reduce((/** @type {any} */ acc, key) => acc[key], obj)
  const lastKey = /** @type {string | number} */ (keys.slice(-1)[0])
  parent[lastKey] = value
  return obj
}

/** @type {<T>(path: Array<string | number> | string | number, value: any) => (obj: T) => T} */
export const Set = (path, value) => obj => set(path, value, obj)

export const at = {
  /** @param {Array<string | number> | string | number} keys */
  path: keys => ({
    /** @param {Record<string, any>} obj */
    from: obj => get(keys, obj),
    /** @param {any} value */
    set: value => ({
      /** @template T @param {T} obj @returns {T} */
      on: obj => set(keys, value, obj),
    }),
  }),
}

/**
 * @param {Array<string | number> | string | number} keys
 */
const Path = keys => ({
  /** @param {any} obj */
  from: obj => get(keys, obj),
  /** @param {any} obj */
  in: obj => has(keys, obj),
  /** @type {<T>(newValue: any) => { set: (onObject: T) => T }} */
  value: newValue => ({ set: onObject => set(keys, newValue, onObject) }),
  /** @type {<T>(onObject: T) => { get: () => any; set: (value: any) => T; with: (value: any) => T }} */
  on: obj => ({
    get: () => get(keys, obj),
    set: value => set(keys, value, obj),
    with: value => set(keys, value, { ...obj }), // todo: consider smarter deep cloning
  }),
  /** @type {<T>(value: T, onObject: T) => T} */
  set: (value, onObject) => set(keys, value, onObject),
})

export default {
  /** @param {any} obj */
  description(obj) {
    return describe(obj)
  },
  /**
   * Parses object into a tree of branches and leaves
   * in the shape of a Map of  keys array to corresponding object values
   *
   * @param {Record<string, any>} obj object to parse
   * @returns {{tree: Map<Array<string | number>, any>}} a Map of keys to corresponding object values
   */
  parsed(obj) {
    // todo: for better performance, consider parsing from scratch, not using JSON as workaround
    /** @type {Map<string[], [any, any]>} */
    let tree = new Map()
    /** @type {any} */
    let lastThis = null
    JSON.parse(JSON.stringify(obj, null), function (key, value) {
      if (lastThis === null) {
        lastThis = this
      }
      if (this !== lastThis && value === lastThis) {
        tree = new Map(
          [...tree].map(([branch, [leaf, _this]]) =>
            _this === value ?
              [
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
  /** @param {Record<string, any>} obj */
  primitiveClone(obj) {
    return JSON.parse(JSON.stringify(obj))
  },
  Path,
}
