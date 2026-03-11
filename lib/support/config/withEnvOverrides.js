import * as proxy from '../common/proxy.js'

// TODO: consider moving to its own module under common/string-utils/ folder
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

/**
 * @template T
 * @param {T} obj
 * @param {Partial<{
 *   ignore: (string | RegExp)[],
 *   interpolate: Record<string, string>,
 * }>} options
 * @returns {T}
 */
const withEnvOverrides = (obj, options = {}) => {
  const ignored = options?.ignore ?? []
  const interpolate = options?.interpolate ?? {}

  return proxy.wrapProperties(obj, (prop, getValue) => {
    const originalValue = getValue()
    const propStr = String(prop)
    // TODO: consider moving "ignored" logic to wrapProperties and other similar proxy helpers
    if (
      ignored.some(it => (it instanceof RegExp ? it.test(propStr) : it === propStr))
    ) {
      return originalValue
    }

    /** @param {any} value */
    const maybeInterpolate = value =>
      typeof value === 'string' && Object.keys(interpolate).length > 0 ?
        interpolateString(value, interpolate)
      : value

    if (typeof originalValue === 'string') {
      return maybeInterpolate(process.env[propStr] ?? originalValue)
    }

    if (typeof originalValue === 'boolean') {
      return process.env[propStr] === undefined ?
          originalValue
        : (process.env[propStr] ?? '').toLowerCase() === 'true'
    }

    if (typeof originalValue === 'number') {
      return Number(process.env[propStr] ?? originalValue)
    }

    if (Array.isArray(originalValue)) {
      return process.env[propStr]?.split(',')?.map(it => it.trim()) ?? originalValue
    }

    return originalValue
  })
}

/**
 * @param {Partial<{ ignore: (string | RegExp)[], interpolate: Record<string, string> }>} options
 * @returns {<T>(obj: T) => T}
 */
export const WithEnvOverrides =
  (options = {}) =>
  obj =>
    withEnvOverrides(obj, options)

export default withEnvOverrides
