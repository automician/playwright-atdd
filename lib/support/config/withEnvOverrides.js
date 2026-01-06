import * as proxy from '../common/proxy.js'

/**
 * @template T
 * @param {T} obj
 * @param {Partial<{
 *   ignore: (string | RegExp)[],
 * }>} options
 * @returns {T}
 */
export default (obj, options = {}) =>
  proxy.wrapProperties(obj, (prop, getValue) => {
    const value = getValue()
    // TODO: consider moving "ignored" logic to wrapProperties and other similar proxy helpers
    const ignored = options?.ignore ?? []
    return ignored.some(it => (it instanceof RegExp ? it.test(prop) : it === prop))
      ? value
      : typeof value === 'string'
      ? process.env[prop] ?? value
      : typeof value === 'boolean'
      ? process.env[prop] === undefined
        ? value
        : /true/.test(process.env[prop])
      : typeof value === 'number'
      ? Number(process.env[prop] ?? value)
      : Array.isArray(value)
      ? process.env[prop]?.split(',')?.map(it => it.trim()) ?? value
      : value
  })
