import * as playwright from '@playwright/test'
import { withSteps } from './reporting/steps.proxy.js'
import * as proxy from '../common/proxy.js'

/* See https://stackoverflow.com/questions/56505560/how-to-fix-ts2322-could-be-instantiated-with-a-different-subtype-of-constraint
 * on why the following will not work:
 *
 * @template T
 * @type {(expect: T) => T}
 *
 * as a JSDoc comment for the following function.
 */

// todo: find a way to log arguments in more details
//       (currently they are cut off by length of reported steps length max)
//       maybe log each arg as a nested pseudo-step?
export const withMatchersAsSteps = expect =>
  proxy.wrapCallable(expect, (expectation, args) =>
    withSteps(expectation, {
      context:
        'expect' +
        (!!args.length ?
          (() => {
            const actual = args[0]
            const actualString = actual.toString()
            const actualDescription =
              actualString === '[object Object]' ?
                actual.constructor.name
              : actualString
            return ` ${actualDescription}: `
          })()
        : ': '),
      box: false,
      cancelable: false,
      ignoreNonAsync: false, // ensured false for logging non-async expects
    }),
  )

/**
 * @param {Function} callback to poll untill passed
 * @param {{ timeout?: number, intervals?: number[] }} options to configure polling
 *   Defaults can be overriden in the standard playwright config
 * @returns {Promise<void>}
 */
export async function expectToPass(callback, options = {}) {
  // Here we use pure playwright expect to avoid double logging in the report.
  // Here we are completely OK with a standard playwright expect logging.
  // todo: make it return callback result
  return playwright
    .expect(callback)
    .toPass(options)
    .then(
      result => result,
      error => {
        // todo: consider reusing helpers from `lib/support/utils/proxy.js` (refactored correspondingly)

        // clean stacktrace from this proxy code
        error.stack = error.stack
          .split('\n')
          .filter(line => !line.includes(__filename))
          .join('\n')

        throw error
      },
    )
}
