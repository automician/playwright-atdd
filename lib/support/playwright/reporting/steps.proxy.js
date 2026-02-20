import { test } from '@playwright/test'
import * as proxy from '../../common/proxy.js'
import { config } from '../../../../project.config.js'
import its from '../../common/object-utils/its.js'
import { fileURLToPath } from 'url'
import humanizeIdentifier from '../../common/string-utils/humanizeIdentifier.js'
const __filename = fileURLToPath(import.meta.url)

/** @typedef {import('../../common/object-utils/its.js').ParsedOptions} ParsedOptions */

/** So regex can be serialized (used in test steps reporting) */
Object.defineProperty(RegExp.prototype, 'toJSON', {
  value: RegExp.prototype.toString,
})

/** @param {any} obj */
export function withLoggedSteps(obj) {
  return proxy.interceptMethodCalls(obj, function (prop, args) {
    // todo: move this list to config;)
    const ignored = [
      // skip methods ...
      /^_/, // that are kind of "private" and are not considered to be used in tests as steps
      /^\$/, // as an additional prefix to be used to ignore step application to some method
      /^toString$/,
    ]
    const propStr = String(prop)
    if (!ignored.some(it => it.test(propStr))) {
      const obj_string = obj.toString()
      const obj_description =
        obj_string === '[object Object]' ? obj.constructor.name : obj_string
      console.log(
        `>>> ${obj_description}: ${propStr} >>> ${JSON.stringify(args, null, 2)}`,
      )
    }
  })
}

/**
 * @template T
 * @param {T} obj
 * @param {Partial<{
 *   context: string | (() => string),
 *   ignore: (string | RegExp)[],
 *   ignoreAlso: (string | RegExp)[],
 *   ignoreNonAsync: boolean,
 *   box: boolean,
 *   cancelable: boolean,
 *   parsedOptions: ParsedOptions,
 *   paramsInSubSteps: boolean | ParsedOptions,
 *   returnInSubSteps: boolean | ParsedOptions,
 *   humanizeStepNames: boolean,
 *   humanizeContext: boolean,
 * }>} options
 * @returns {T}
 */
export function withSteps(obj, options = {}) {
  // todo: refactor to define defaults directly in function signature
  // todo: consider: `if (matchesRequired('project.config.js', config => config?.disableObjectSteps)) return obj`'))
  const cancelable = options?.cancelable ?? true
  if (cancelable && config.cancelWithSteps) return obj
  // todo: consider: making default to be configurable via config or env
  const ignoreNonAsync = options?.ignoreNonAsync ?? false
  const baseParsedOptions = options?.parsedOptions ?? {}
  const paramsInSubSteps = options?.paramsInSubSteps ?? true
  const returnInSubSteps = options?.returnInSubSteps ?? true
  const showParams = paramsInSubSteps !== false
  const showReturn = returnInSubSteps !== false
  const paramsParsedOptions =
    typeof paramsInSubSteps === 'object' ? paramsInSubSteps : baseParsedOptions
  const returnParsedOptions =
    typeof returnInSubSteps === 'object' ? returnInSubSteps : baseParsedOptions
  const humanizeStepNames = options?.humanizeStepNames ?? false
  const humanizeContext = options?.humanizeContext ?? false

  return proxy.wrapMethodCalls(obj, function fn(prop, args, callback) {
    const propStr = String(prop)
    const ignored = [
      ...(options?.ignore ?? [
        // todo: reflect this list of defaults in config;)
        // skip methods ...
        /^_/, // that are kind of "private" and are not considered to be used in tests as steps
        /^\$/, // as an additional prefix to be used to ignore step application to some method
        'toString',
      ]),
      ...(options?.ignoreAlso ?? []),
    ]
    const AsyncFunction = (async () => {}).constructor
    const GeneratorFunction = function* () {}.constructor
    const outOfTestExecution = (() => {
      try {
        test.info()
        return false
      } catch (error) {
        return true
      }
    })()
    if (
      ignored.some(it => (it instanceof RegExp ? it.test(propStr) : it === propStr)) ||
      (ignoreNonAsync &&
        !(
          /** @type {any} */ (
            /** @type {any} */ (obj)[propStr] instanceof AsyncFunction &&
              AsyncFunction !== Function &&
              AsyncFunction !== GeneratorFunction
          )
        )) ||
      // ⬆️ explained at https://stackoverflow.com/a/38510353/1297371
      outOfTestExecution
    ) {
      return callback()
    }

    const get_context =
      options?.context === undefined ?
        () => {
          const objString = /** @type {any} */ (obj).toString()
          const objDescription =
            objString === '[object Object]' ?
              /** @type {any} */ (obj).constructor.name
            : objString
          if (!objDescription) return ''
          return `${
            humanizeContext ? humanizeIdentifier(objDescription) : objDescription
          }: `
        }
      : options.context instanceof Function ? options.context
      : () => options.context

    const propDescription = humanizeStepNames ? humanizeIdentifier(propStr) : propStr
    return test
      .step(
        `${get_context()}${propDescription}` +
          (args.length ? `: ${JSON.stringify(args, null, 2).slice(1, -1)}` : ''),

        showParams || showReturn ?
          async () => {
            // todo: parametrize "stringify args factory"
            // todo: consider option to skip "<params>" sub-step if params amount is less than X
            // todo: - or change paramsInSubSteps option to something like "paramsInSubStepsIfAmountAtLeast"
            // todo: consider skipping rendering params number if params is an object and number of params is exactly 1
            if (showParams && args.length)
              await test.step('﹤params﹥', async () => {
                // todo: should we log currently skipped undefined object fields?
                for (const [keys, toValue] of its.parsed(args, paramsParsedOptions)
                  .tree) {
                  // todo: should we count that some key might be method names? etc?
                  await test.step(
                    keys
                      .map(key =>
                        (
                          typeof key === 'number' ||
                          /* string contains only number */ /^\d+$/.test(String(key))
                        ) ?
                          `[${key}]`
                        : `.${key}`,
                      )
                      .join('') + `: ${toValue}`,
                    () => undefined,
                  )
                }
              })
            const result = await callback() // todo: do we need await here? (just in case)
            if (showReturn && result !== undefined)
              // todo: what will happen if result is value of "primitive" type?
              await test.step('﹤return﹥', async () => {
                for (const [keys, toValue] of its.parsed(result, returnParsedOptions)
                  .tree) {
                  // todo: should we count that some key might be method names? etc?
                  await test.step(
                    keys
                      .map(key =>
                        (
                          typeof key === 'number' ||
                          /* string contains only number */ /^\d+$/.test(String(key))
                        ) ?
                          `[${key}]`
                        : `.${key}`,
                      )
                      .join('') + `: ${toValue}`,
                    () => undefined,
                  )
                }
              })
            return result
          }
        : callback,
        { box: options?.box ?? false }, // todo: make it configurable via project settings & dotenv or not?
      )
      .then(
        result => result,
        (/** @type {any} */ error) => {
          // todo: consider reusing helpers from `lib/support/common/proxy.js` (refactored correspondingly)

          // clean stacktrace from this proxy code
          error.stack = error.stack
            .split('\n')
            .filter(/** @param {string} line */ line => !line.includes(__filename))
            .map(
              /** @param {string} line */ line =>
                line.replace(/^(.*)Proxy\.(apply|get|construct) \((.*)\)$/, '$1$3'),
            )
            .join('\n')

          throw error
        },
      )
  })
}

/**
 * @template T
 * @param {Partial<{context: string | (() => string), ignore: (string | RegExp)[], ignoreAlso: (string | RegExp)[], ignoreNonAsync: boolean, box: boolean, cancelable: boolean, parsedOptions: ParsedOptions, paramsInSubSteps: boolean | ParsedOptions, returnInSubSteps: boolean | ParsedOptions, humanizeContext: boolean, humanizeStepNames: boolean}>} options
 * @returns {<T>(obj: T) => T}
 */
export const WithSteps = options => obj => withSteps(obj, options)
