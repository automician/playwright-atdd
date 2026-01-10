import * as fs from 'fs'
import * as yaml from 'js-yaml'
import * as proxy from '../common/proxy.js'

/**
 * Parses a string path like 'a.b.[0].c' into an array of keys ['a', 'b', 0, 'c']
 * @param {String} path
 * @returns {Array<String | Number>}
 */
const parsePath = path =>
  path.split(/\.(?![^\[]*\])/).flatMap(part => {
    const match = part.match(/^\[(\d+)\]$/)
    return match ? parseInt(match[1], 10) : part
  })

/**
 * @param {Array<String | Number> | String | Number} path
 * @returns {Array<String | Number>}
 */
const toKeys = path =>
  typeof path === 'string' ? parsePath(path) : typeof path === 'number' ? [path] : path

// We could reuse the get function from its.js,
// but let's keep less dependencies for easier copy&paste style of code reuse
/**
 * @param {Array<String | Number> | String | Number} path keys to get the value of obj, either as array or dot-notation path like 'a.b.[0].c'
 * @param {Object} obj - object to get nested value from
 * @returns {any}
 */
export const get = (path, obj) => {
  if (!path) return obj
  return toKeys(path).reduce((acc, key) => acc?.[key], obj)
}

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

// TODO: consider supporting string[] in path, to combine multiple paths
/**
 * Factory to create a YAML overrides wrapper.
 * @param {string} file - path to YAML file
 * @param {object} [options={}] - options
 * @param {string | Array<String | Number> | Number} [options.path=''] - dot-notation path to nested object in YAML
 * @param {(string | RegExp)[]} [options.ignore=[]] - properties to ignore
 * @returns {<T>(obj: T) => T}
 */
const from = (file, { path = '', ignore = [] } = {}) => {
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

      if (ignore.some(it => (it instanceof RegExp ? it.test(prop) : it === prop))) {
        return originalValue
      }

      // Only override properties that exist in both original object and YAML
      if (!(prop in /** @type {object} */ (obj))) {
        return originalValue
      }

      const overrides = loadYaml()

      if (!(prop in overrides)) {
        return originalValue
      }

      const yamlValue = overrides[prop]
      validateType(yamlValue, originalValue, prop)

      return yamlValue
    })
}

/**
 * @template T
 * @param {T} obj
 * @param {{
 *   file: string,
 *   path?: string | Array<String | Number> | Number,
 *   ignore?: (string | RegExp)[],
 * }} options
 * @returns {T}
 */
const withYmlOverrides = (obj, options) => {
  const { file, path = '', ignore = [] } = options
  return from(file, { path, ignore })(obj)
}

export const WithYmlOverrides = { from }
export default withYmlOverrides
