import { test } from '@playwright/test'
import * as proxy from '../../common/proxy.js'
import { config } from '../../../../project.config.js'
import its from '../../common/object-utils/its.js'
import { fileURLToPath } from 'url'
import humanizeIdentifier from '../../common/string-utils/humanizeIdentifier.js'
const __filename = fileURLToPath(import.meta.url)

/** So regex can be serialized (used in test steps reporting) */
Object.defineProperty(RegExp.prototype, 'toJSON', {
  value: RegExp.prototype.toString,
})

export function withLoggedSteps(obj) {
  return proxy.interceptMethodCalls(obj, function (prop, args) {
    // TODO: move this list to config;)
    const ignored = [
      // skip methods ...
      /^_/, // that are kind of "private" and are not considered to be used in tests as steps
      /^\$/, // as an additional prefix to be used to ignore step application to some method
      /^toString$/,
    ]
    if (!ignored.some(it => it.test(prop))) {
      const obj_string = obj.toString()
      const obj_description =
        obj_string === '[object Object]' ? obj.constructor.name : obj_string
      console.log(
        `>>> ${obj_description}: ${prop} >>> ${JSON.stringify(args, null, 2)}`,
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
 *   paramsInSubSteps: boolean,
 *   returnInSubSteps: boolean,
 *   humanizeStepNames: boolean,
 *   humanizeContext: boolean,
 * }>} options
 * @returns {T}
 */
export function withSteps(obj, options = {}) {
  // TODO: refactor to define defaults directly in function signature
  // TODO: consider: `if (matchesRequired('project.config.js', config => config?.disableObjectSteps)) return obj`'))
  const cancelable = options?.cancelable ?? true
  if (cancelable && config.cancelWithSteps) return obj
  // TODO: consider: making default to be configurable via config or env
  const ignoreNonAsync = options?.ignoreNonAsync ?? false
  const paramsInSubSteps = options?.paramsInSubSteps ?? true
  const returnInSubSteps = options?.returnInSubSteps ?? true
  const humanizeStepNames = options?.humanizeStepNames ?? false
  const humanizeContext = options?.humanizeContext ?? false

  return proxy.wrapMethodCalls(obj, function fn(prop, args, callback) {
    const ignored = [
      ...(options?.ignore ?? [
        // TODO: reflect this list of defaults in config;)
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
      ignored.some(it => (it instanceof RegExp ? it.test(prop) : it === prop)) ||
      (ignoreNonAsync &&
        !(
          obj[prop] instanceof AsyncFunction &&
          AsyncFunction !== Function &&
          AsyncFunction !== GeneratorFunction
        )) ||
      // ⬆️ explained at https://stackoverflow.com/a/38510353/1297371
      outOfTestExecution
    ) {
      return callback()
    }

    const get_context =
      options?.context === undefined
        ? () => {
            const objString = obj.toString()
            const objDescription =
              objString === '[object Object]' ? obj.constructor.name : objString
            if (!objDescription) return ''
            return `${
              humanizeContext ? humanizeIdentifier(objDescription) : objDescription
            }: `
          }
        : options.context instanceof Function
        ? options.context
        : () => options.context

    const propDescription = humanizeStepNames ? humanizeIdentifier(prop) : prop
    return test
      .step(
        `${get_context()}${propDescription}` +
          (args.length ? `: ${JSON.stringify(args, null, 2).slice(1, -1)}` : ''),

        paramsInSubSteps || returnInSubSteps
          ? async () => {
              // TODO: parametrize "stringify args factory"
              // TODO: consider option to skip "<params>" sub-step if params amount is less than X
              // TODO: - or change paramsInSubSteps option to something like "paramsInSubStepsIfAmountAtLeast"
              // TODO: consider skipping rendering params number if params is an object and number of params is exactly 1
              if (paramsInSubSteps && args.length)
                await test.step('﹤params﹥', async () => {
                  // TODO: should we log currently skipped undefined object fields?
                  for (const [keys, toValue] of its.parsed(args).tree) {
                    // TODO: should we count that some key might be method names? etc?
                    // eslint-disable-next-line playwright/no-nested-step
                    await test.step(
                      keys
                        .map(key =>
                          typeof key === 'number' ||
                          /* string contains only number */ /^\d+$/.test(key)
                            ? `[${key}]`
                            : `.${key}`,
                        )
                        .join('') + `: ${toValue}`,
                      () => undefined,
                    )
                  }
                })
              const result = await callback() // TODO: do we need await here? (just in case)
              if (returnInSubSteps && result !== undefined)
                // TODO: what will happen if result is value of "primitive" type?
                await test.step('﹤return﹥', async () => {
                  for (const [keys, toValue] of its.parsed(result).tree) {
                    // TODO: should we count that some key might be method names? etc?
                    // eslint-disable-next-line playwright/no-nested-step
                    await test.step(
                      keys
                        .map(key =>
                          typeof key === 'number' ||
                          /* string contains only number */ /^\d+$/.test(key)
                            ? `[${key}]`
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
        { box: options?.box ?? false }, // TODO: make it configurable via project settings & dotenv or not?
      )
      .then(
        result => result,
        error => {
          // TODO: consider reusing helpers from `lib/support/common/proxy.js` (refactored correspondingly)

          // clean stacktrace from this proxy code
          error.stack = error.stack
            .split('\n')
            .filter(line => !line.includes(__filename))
            .map(line =>
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
 * @param {Partial<{context: string | (() => string), ignore: (string | RegExp)[], ignoreAlso: (string | RegExp)[], ignoreNonAsync: boolean, box: boolean, cancelable: boolean, paramsInSubSteps: boolean, returnInSubSteps: boolean, humanizeContext: boolean, humanizeStepNames: boolean}>} options
 * @returns {<T>(obj: T) => T}
 */
export const WithSteps = options => obj => withSteps(obj, options)
