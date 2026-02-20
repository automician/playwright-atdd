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

/**
 * @typedef {{
 *   key: string,
 *   value: any,
 *   depth: number,
 *   path: string[],
 * }} SkipContext
 */

/**
 * Return type for the `skip` predicate in {@link ParsedOptions}.
 *
 * - `true` — discard the property entirely (it won't appear in the tree)
 * - `'toString'` — record `String(value)` as a leaf instead of walking
 * - `false` / `undefined` — walk normally (the default)
 *
 * @typedef {boolean | 'toString'} SkipResult
 */

/**
 * Options for {@link parsed}.
 *
 * @typedef {{
 *   maxDepth?: number,
 *   maxLeaves?: number,
 *   skip?: (ctx: SkipContext) => SkipResult,
 * }} ParsedOptions
 */

/** Well-known marker strings recorded by {@link parsed}. */
export const Marker = /** @type {const} */ ({
  circular: '[Circular]',
  inaccessible: '[Inaccessible]',
  depthLimit: '[Depth limit]',
  truncated: '[... truncated]',
})

/**
 * Default skip predicate for the reporting use case:
 * skips function-valued properties (they are noise in reports).
 *
 * @example
 * // use as-is (this is the default for `parsed`)
 * its.parsed(obj)
 *
 * @example
 * // compose with additional filtering
 * its.parsed(obj, {
 *   skip: ({ key, value }) =>
 *     skipFunctions({ key, value, depth: 0, path: [] })
 *     || key.startsWith('_'),
 * })
 *
 * @type {(ctx: SkipContext) => SkipResult}
 */
export const skipFunctions = ({ value }) => typeof value === 'function'

// todo: consider making parsed lazy, and trigger parsing only when .tree is accessed
// todo: once lazy consider caching the tree
/**
 * Parses object into a tree of branches and leaves
 * in the shape of a Map of keys-array to corresponding leaf values.
 *
 * Walks the object recursively, collecting only primitive/null/undefined
 * leaf values with their full key paths. Objects and arrays are traversed
 * (not recorded as leaves) unless a limit is hit.
 *
 * Safe for complex objects: handles circular references, throwing getters,
 * symbol values, and deeply nested / wide structures via configurable limits.
 *
 * @example
 * // basic usage (smart defaults for reporting)
 * parsed({ a: { b: 42 } }).tree
 * // => Map { ['a', 'b'] => 42 }
 *
 * @example
 * // with custom limits
 * parsed(largeObj, { maxDepth: 5, maxLeaves: 50 })
 *
 * @example
 * // with custom skip predicate (skip private + functions)
 * parsed(obj, {
 *   skip: ({ key, value }) =>
 *     typeof value === 'function' || key.startsWith('_'),
 * })
 *
 * @example
 * // summarize complex objects instead of walking them
 * parsed(obj, {
 *   skip: ({ value }) =>
 *     value instanceof Page ? 'toString' : false,
 * })
 *
 * @param {any} obj object to parse
 * @param {ParsedOptions} [options] traversal options:
 *
 *   - **maxDepth** (default `10`) — maximum recursion depth.
 *     Nodes beyond this depth are recorded as {@link Marker.depthLimit}.
 *
 *   - **maxLeaves** (default `100`) — **total** leaf entries cap
 *     across the entire walk (not per level). Once reached, the walk
 *     stops and a final {@link Marker.truncated} entry is recorded.
 *     // todo: consider adding a per-level `maxBreadth` option in the future
 *
 *   - **skip** (default {@link skipFunctions}) — predicate called for
 *     each child property during the walk. Receives
 *     `{ key, value, depth, path }` — destructure only what you need.
 *     Return `true` to discard the entry, `'toString'` to record
 *     `String(value)` as a leaf, or `false` to walk normally.
 *
 * @returns {{tree: Map<string[], any>}} a Map of key-paths to leaf values
 */
export const parsed = (obj, options = {}) => {
  const maxDepth = options.maxDepth ?? 10
  const maxLeaves = options.maxLeaves ?? 100
  const skip = options.skip ?? skipFunctions

  // todo: one day, consider more functional over imperative implementation
  //       i.e. reduce-like, when we path all "current accumulators" to next step,
  //       not store them in local variables
  /** @type {Map<string[], any>} */
  const tree = new Map()
  /** @type {WeakSet<object>} */
  const visited = new WeakSet()
  let leafCount = 0

  /**
   * @param {any} value
   * @param {string[]} path
   * @param {number} depth
   * @returns {boolean} true if maxLeaves was reached (signals caller to stop)
   */
  const walk = (value, path, depth) => {
    if (leafCount >= maxLeaves) return true

    // --- symbol: convert to string leaf ---
    if (typeof value === 'symbol') {
      tree.set(path, value.toString())
      leafCount++
      return leafCount >= maxLeaves
    }

    // --- function: record placeholder leaf (never recurse into functions) ---
    if (typeof value === 'function') {
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- name is '' for anonymous functions
      tree.set(path, `[Function: ${value.name || 'anonymous'}]`)
      leafCount++
      return leafCount >= maxLeaves
    }

    // --- object/array: recurse ---
    if (value !== null && typeof value === 'object') {
      visited.add(value)

      if (depth >= maxDepth) {
        tree.set(path, Marker.depthLimit)
        leafCount++
        return leafCount >= maxLeaves
      }

      /** @type {string[]} */
      let keys
      try {
        keys = Object.keys(value)
      } catch {
        tree.set(path, String(value))
        leafCount++
        return leafCount >= maxLeaves
      }

      for (let i = 0; i < keys.length; i++) {
        const key = /** @type {string} */ (keys[i])

        if (leafCount >= maxLeaves) {
          tree.set([...path, '...'], Marker.truncated)
          return true
        }

        /** @type {any} */
        let childValue
        let inaccessible = false
        try {
          childValue = value[key]
        } catch {
          childValue = Marker.inaccessible
          inaccessible = true
        }

        const childPath = [...path, key]

        // resolve circular before consulting skip,
        // so skip can filter on value === Marker.circular
        const circular =
          !inaccessible &&
          childValue !== null &&
          typeof childValue === 'object' &&
          visited.has(childValue)
        if (circular) {
          childValue = Marker.circular
        }

        const skipResult = skip({
          key,
          value: childValue,
          depth: depth + 1,
          path: childPath,
        })
        if (skipResult === true) {
          continue
        }

        if (skipResult === 'toString' || inaccessible || circular) {
          tree.set(
            childPath,
            skipResult === 'toString' ? String(childValue) : childValue,
          )
          leafCount++
          if (leafCount >= maxLeaves && i + 1 < keys.length) {
            tree.set([...path, '...'], Marker.truncated)
            return true
          }
          continue
        }

        if (walk(childValue, childPath, depth + 1)) {
          // budget exhausted inside child walk — check if there are remaining keys
          if (i + 1 < keys.length) {
            tree.set([...path, '...'], Marker.truncated)
          }
          return true
        }
      }
    } else {
      // --- leaf: primitive, null, undefined ---
      tree.set(path, value)
      leafCount++
    }
    return leafCount >= maxLeaves
  }

  walk(obj, [], 0)
  return { tree }
}

/**
 * Curried version of {@link parsed}: pre-configures options, returns
 * a function that accepts the object to parse.
 *
 * @example
 * const parseForReport = Parsed({ maxDepth: 5, maxLeaves: 50 })
 * parseForReport(obj).tree
 *
 * @param {ParsedOptions} [options]
 * @returns {(obj: any) => {tree: Map<string[], any>}}
 */
export const Parsed =
  (options = {}) =>
  obj =>
    parsed(obj, options)

export default {
  /** @param {any} obj */
  description(obj) {
    return describe(obj)
  },
  parsed,
  Parsed,
  /** @param {Record<string, any>} obj */
  primitiveClone(obj) {
    return JSON.parse(JSON.stringify(obj))
  },
  Path,
}
