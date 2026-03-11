import { test } from '@playwright/test'
import its from '../../common/object-utils/its.js'

/**
 * @param {string} prefix
 * @returns {import('./gherkin-types.js').StepFn}
 */
function Step(prefix) {
  // TODO: make box configurable via project settings & dotenv
  return /** @type {import('./gherkin-types.js').StepFn} */ (
    (/** @type {any} */ titleOrBody, /** @type {any} */ bodyForTitle) =>
      // all steps are boxed below to render test lines in the report (here and below)
      titleOrBody === undefined ? test.step(prefix, () => undefined, { box: true })
      : titleOrBody instanceof Function ? test.step(prefix, titleOrBody, { box: true })
      : bodyForTitle instanceof Function ?
        test.step(prefix + titleOrBody, bodyForTitle, { box: false })
      : bodyForTitle === undefined ?
        test.step(prefix + its.description(titleOrBody), () => titleOrBody, {
          box: true,
        })
      : test.step(
          prefix + titleOrBody + ': ' + its.description(bodyForTitle),
          () => bodyForTitle,
          { box: true },
        )
  )
}

export const STEP = Step('')
export const GIVEN = Step('GIVEN ')
export const WHEN = Step('WHEN ')
export const THEN = Step('THEN ')
export const AND = Step('AND ')
