import * as fs from 'fs'
// @ts-ignore — js-yaml has no bundled types; @types/js-yaml is not needed at runtime
import * as yaml from 'js-yaml'
import * as proxy from '../common/proxy.js'

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
 * @param {Array<string | number> | string | number} path
 * @returns {Array<string | number>}
 */
const toKeys = path =>
  typeof path === 'string' ? parsePath(path)
  : typeof path === 'number' ? [path]
  : path

// We could reuse the get function from its.js,
// but let's keep less dependencies for easier copy&paste style of code reuse
/**
 * @param {Array<string | number> | string | number} path keys to get the value of obj, either as array or dot-notation path like 'a.b.[0].c'
 * @param {any} obj - object to get nested value from
 * @returns {any}
 */
export const get = (path, obj) => {
  if (!path) return obj
  return toKeys(path).reduce((/** @type {any} */ acc, key) => acc?.[key], obj)
}

// todo: consider some way to customize parsing in validation logic,
//       like consider comma-separated string as array, etc.
// todo: refactor to move prop out of this func impl.
/**
 * @param {any} yamlValue
 * @param {any} originalValue
 * @param {string} prop
 */
const validateType = (yamlValue, originalValue, prop) => {
  const yamlType = Array.isArray(yamlValue) ? 'array' : typeof yamlValue
  const originalType = Array.isArray(originalValue) ? 'array' : typeof originalValue

  if (yamlType !== originalType) {
    throw new TypeError(
      `Type mismatch for property "${prop}": ` +
        `expected ${originalType}, got ${yamlType} from YAML`,
    )
  }
}

// todo: consider moving to its own module under common/string-utils/ folder
/**
 * Interpolates variables in a string using ${VAR_NAME} syntax.
 * @param {string} str - string to interpolate
 * @param {Record<string, string>} vars - variables to substitute
 * @returns {string}
 */
const interpolateString = (str, vars) => {
  return str.replace(/\$\{([^}]+)\}/g, (match, /** @type {string} */ varName) => {
    return varName in vars ? (vars[varName] ?? match) : match
  })
}

// todo: consider interpolateStringStrategy option to support different interpolation strategies
//       where default is current interpolateString implementation
// todo: consider supporting string[] in path, to combine multiple paths
/**
 * Factory to create a YAML overrides wrapper.
 * @param {string} file - path to YAML file
 * @param {object} [options={}] - options
 * @param {string | Array<string | number> | number} [options.path=''] - dot-notation path to nested object in YAML
 * @param {(string | RegExp)[]} [options.ignore=[]] - properties to ignore
 * @param {Record<string, string>} [options.interpolate={}] - variables to interpolate in string values
 * @returns {<T>(obj: T) => T}
 */
const from = (file, { path = '', ignore = [], interpolate = {} } = {}) => {
  /** @type {Record<string, any> | null} */
  let yamlData = null // cache to avoid loading YAML multiple times

  const loadYaml = () => {
    if (yamlData === null) {
      const content = fs.readFileSync(file, 'utf8')
      const parsed = yaml.load(content)
      yamlData = get(path, parsed) ?? {}
    }
    return yamlData
  }

  return obj =>
    proxy.wrapProperties(obj, (prop, getValue) => {
      const originalValue = getValue()
      const propStr = String(prop)

      if (
        ignore.some(it => (it instanceof RegExp ? it.test(propStr) : it === propStr))
      ) {
        return originalValue
      }

      // Only override properties that exist in both original object and YAML
      if (!(prop in /** @type {object} */ (obj))) {
        return originalValue
      }

      const overrides = loadYaml()

      if (!overrides || !(propStr in overrides)) {
        return originalValue
      }

      const yamlValue = overrides[propStr]
      validateType(yamlValue, originalValue, propStr)

      if (typeof yamlValue === 'string' && Object.keys(interpolate).length > 0) {
        return interpolateString(yamlValue, interpolate)
      }

      return yamlValue
    })
}

/**
 * @template T
 * @param {T} obj
 * @param {{
 *   file: string,
 *   path?: string | Array<string | number> | number,
 *   ignore?: (string | RegExp)[],
 *   interpolate?: Record<string, string>,
 * }} options
 * @returns {T}
 */
const withYmlOverrides = (obj, options) => {
  const { file, path = '', ignore = [], interpolate = {} } = options
  return from(file, { path, ignore, interpolate })(obj)
}

export const WithYmlOverrides = { from }
export default withYmlOverrides
