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
  return description ?? ''
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
  if (path === undefined || path === null) return undefined
  if (path === '') return obj
  return toKeys(path).reduce((acc, key) => acc?.[key], obj)
}

/** @type {<T>(path: Array<string | number> | string | number) => (obj: T) => T} */
export const Get = path => obj => get(path, obj)

/**
 * @param {Array<string | number> | string | number} path keys to get the value of obj
 * @param {any} obj
 * @returns {boolean}
 */
export const has = (path, obj) => {
  if (path === undefined || path === null) return /** @type {*} */ (undefined)
  if (path === '') return true
  const keys = toKeys(path)
  if (keys.length === 0) return true
  const parent = keys.slice(0, -1).reduce((acc, key) => acc?.[key], obj)
  const lastKey = /** @type {string | number} */ (keys[keys.length - 1])
  return parent != null && typeof parent === 'object' && lastKey in parent
}

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

// todo: rename to something else to not conflict with global Set
/**
 * @param {Array<string | number> | string | number} path
 * @param {any} value
 * @returns {<T>(obj: T) => T}
 */
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
  // todo: consider making parsed lazy, and trigger parsing only when .tree is accessed
  // todo: once lazy consider caching the tree
  /**
   * Parses object into a tree of branches and leaves
   * in the shape of a Map of  keys array to corresponding object values
   *
   * @param {Record<string, any>} obj object to parse
   * @returns {{tree: Map<Array<string | number>, any>}} a Map of keys to corresponding object values
   */
  parsed(obj) {
    /** @type {Map<string[], any>} */
    const tree = new Map()

    /**
     * @param {any} value
     * @param {string[]} path
     */
    const walk = (value, path) => {
      if (value !== null && typeof value === 'object') {
        const keys = Object.keys(value)
        for (const key of keys) {
          walk(value[key], [...path, key])
        }
      } else {
        tree.set(path, value)
      }
    }

    walk(obj, [])
    return { tree }
  },
  /** @param {Record<string, any>} obj */
  primitiveClone(obj) {
    return JSON.parse(JSON.stringify(obj))
  },
  Path,
}
