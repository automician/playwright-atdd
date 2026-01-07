import * as proxy from '../common/proxy.js'

/**
 * @template T
 * @param {T} obj
 * @param {Partial<{
 *   ignore: (string | RegExp)[],
 * }>} options
 * @returns {T}
 */
const withEnvOverrides = (obj, options = {}) =>
  proxy.wrapProperties(obj, (prop, getValue) => {
    const originalValue = getValue()
    // TODO: consider moving "ignored" logic to wrapProperties and other similar proxy helpers
    const ignored = options?.ignore ?? []
    return ignored.some(it => (it instanceof RegExp ? it.test(prop) : it === prop))
      ? originalValue
      : typeof originalValue === 'string'
      ? process.env[prop] ?? originalValue
      : typeof originalValue === 'boolean'
      ? process.env[prop] === undefined
        ? originalValue
        : /true/.test(process.env[prop])
      : typeof originalValue === 'number'
      ? Number(process.env[prop] ?? originalValue)
      : Array.isArray(originalValue)
      ? process.env[prop]?.split(',')?.map(it => it.trim()) ?? originalValue
      : originalValue
  })

/**
 * @template T
 * @param {Partial<{ ignore: (string | RegExp)[] }>} options
 * @returns {(obj: T) => T}
 */
export const WithEnvOverrides =
  (options = {}) =>
  obj =>
    withEnvOverrides(obj, options)

export default withEnvOverrides
