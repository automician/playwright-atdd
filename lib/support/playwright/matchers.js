import * as playwright from '@playwright/test'
import { config } from '../../../project.config.js'
import its from '../common/object-utils/its.js'

// todo: consider breaking mathcers into groups per entity (Locator, APIResponce, etc.)
export const matchers = {
  // though some matchers can be non-async, we have to make them async and use await on each expect
  // because we wrap all expects into test.step that is always async :'(

  // todo: consider refactoring for DRY the potential logic to reuse among matchers below

  /* ⬇️ APIResponse matchers */

  /**
   * @param {playwright.APIResponse} response
   * @param {number | string | { code: number, text: string }} expected
   */
  async toHaveStatus(response, expected) {
    const name = 'toHaveStatus'
    /** @type {boolean} */
    let pass
    /** @type {number | string} */
    let actual

    // todo: consider refactoring the logic below (it's correct but not KISS)
    actual = typeof expected === 'string' ? response.statusText() : response.status()
    pass = actual === (typeof expected === 'object' ? expected.code : expected)
    const responseHeaders = JSON.stringify(await response.headers(), null, 2)
    const responseBody = await response.text()

    const expactationString = `Status of response from url: ${response.url()}\n`
    // todo: no reason to break down message into 2 branches, refactor to style as in toHaveJsonFields matcher
    const message = pass
      ? () =>
          this.utils.matcherHint(name, undefined, undefined, {
            isNot: this.isNot,
          }) +
          '\n\n' +
          expactationString +
          `Expected: ${this.isNot ? 'not' : ''}${this.utils.printExpected(
            expected,
          )}\n` +
          `Received: ${this.utils.printReceived({
            code: response.status(),
            text: response.statusText(),
          })}` +
          '\n' +
          `\nHeaders: ${responseHeaders}` +
          `\nBody: ${responseBody}`
      : () =>
          this.utils.matcherHint(name, undefined, undefined, {
            isNot: this.isNot,
          }) +
          '\n\n' +
          expactationString +
          `Expected: ${this.utils.printExpected(expected)}\n` +
          `Received: ${this.utils.printReceived({
            code: response.status(),
            text: response.statusText(),
          })}` +
          '\n' +
          `\nHeaders: ${responseHeaders}` +
          `\nBody: ${responseBody}`

    return {
      message,
      pass,
      name,
      expected,
      actual,
    }
  },
  /*
   * Unfortunately neither
  async toHaveStatusOK(response) {
    return this.toHaveStatus(response, 'OK')
  },
   * or
  async toHaveStatusOK(response) {
    return matchers.toHaveStatus(response, 'OK')
  },
   * is possible :'(... shitty playwright&jest matchers ...
   */

  /**
   * @param {playwright.APIResponse} response
   * @param {Record<string, unknown>} expectedSample
   */
  async toHaveJsonFields(response, expectedSample) {
    const name = 'toHaveJsonFields'
    /** @type {boolean} */
    let pass
    /** @type {Object} */
    let actual
    let matcherResult

    actual = await response.json()
    try {
      playwright
        .expect(actual)
        .toEqual(playwright.expect.objectContaining(expectedSample))
      pass = true
    } catch (error) {
      pass = false
      matcherResult = error.matcherResult
    }

    const actualTree = its.parsed(actual).tree
    const actualToDiff = its.primitiveClone(actual)
    for (const [keys, toValue] of actualTree) {
      const path = its.path(keys)
      if (path.in(expectedSample)) {
        if (
          path.from(expectedSample)?.sample === playwright.expect.any(String).sample &&
          typeof toValue === 'string'
        ) {
          path.on(actualToDiff).set(playwright.expect.any(String))
        }
        if (
          path.from(expectedSample)?.sample === playwright.expect.any(Number).sample &&
          typeof toValue === 'number'
        ) {
          path.on(actualToDiff).set(playwright.expect.any(Number))
        }
        if (
          path.from(expectedSample)?.sample === playwright.expect.any(Boolean).sample &&
          typeof toValue === 'boolean'
        ) {
          path.on(actualToDiff).set(playwright.expect.any(Boolean))
        }
      }
    }

    return {
      message: () =>
        this.utils.matcherHint(name, undefined, undefined, {
          isNot: this.isNot,
        }) +
        '\n\n' +
        `JSON body of response from url: ${response.url()}\n` +
        `Expected: ${this.isNot ? 'not ' : ''}${this.utils.printExpected(
          expectedSample,
        )}\n` +
        `Received: ${this.utils.printReceived(actual)}\n\n` +
        `Received diff:\n${this.utils.diff(expectedSample, actualToDiff)}`,
      pass,
      name,
      expected: expectedSample,
      actual,
    }
  },

  /* ⬇️ Locator matchers */

  /**
   * @param {playwright.Locator} locator
   * @param {number} expected
   * @param {{ timeout?: number }} options
   */
  async toHaveCountGreaterThanOrEqual(locator, expected, options = {}) {
    const name = 'toHaveCountGreaterThanOrEqual'
    /** @type {boolean} */
    let pass
    /** @type {number} */
    let actual

    try {
      /*
       * Below we are particulary interested in "expect with retries unless timeout reached".
       * There are two ways to do it via: expect.poll(function) and expect(function).toPass().
       * The `poll` option is not versatile, because, once called after "page context reload",
       * like "some action leading to changing page url", can lead to Error:
       *   * `Execution context was destroyed, most likely because of a navigation`
       * That, as explained in https://github.com/microsoft/playwright/issues/27406,
       * is "as expected":).
       * It would be great if we can customize "IgnoredExceptions" in context of "retries"...
       * Unfortunately, the Playwright API, unlike Selenium WebDriver API, does not provide
       * such functionality:'(.
       * The `toPass` option has not shown any simillar issues during our experiments.
       * So it is used below. Yet being not ideal, because leads to "double-logging" of its step
       * in the report.
       * There is a third option in playwright "to wait", it's `waitForFunction`,
       * // todo: but we are not sure we can use `waitForFunction` with locator as 2nd arg,
       *          so it can be `resolved` on the client side, and so retried if failed.
       *          Let's do the corresponding investigation and figure this out.
       */
      // todo: unfortunately expect below will not be nested into outer one
      //       that calls this condition... can we fix that (in logging/report)?
      await playwright
        .expect(async () => {
          const pollingMessage = `expect(${locator['_selector']}).${name}(${expected})`
          actual = await locator.count()
          pass = actual >= expected
          playwright.expect(pass, pollingMessage).toBeTruthy()
        })
        // todo: give access to playwright config via project config
        .toPass({
          // Though toPass has its own config under playwrightConfig.expect.toPass section
          // Here we actually use it in context of a common UI expect...
          // Thus we reuse the corresponding timeout:
          timeout: options.timeout ?? config.playwright.expect?.timeout ?? 4 * 1000,
        })
    } catch (e) {
      pass = false
    }

    // todo: should we reuse somehow catched error (e), for example, to log it as reason... ?
    //       and should we customize IgnoredErrors?
    const message = pass
      ? () =>
          this.utils.matcherHint(name, undefined, undefined, {
            isNot: this.isNot,
          }) +
          '\n\n' +
          `Locator: ${locator}\n` +
          `Expected: ${this.isNot ? 'not' : ''}${this.utils.printExpected(
            expected,
          )}\n` +
          `Received: ${this.utils.printReceived(actual)}`
      : () =>
          this.utils.matcherHint(name, undefined, undefined, {
            isNot: this.isNot,
          }) +
          '\n\n' +
          `Locator: ${locator}\n` +
          `Expected: ${this.utils.printExpected(expected)}\n` +
          `Received: ${this.utils.printReceived(actual)}`

    return {
      message,
      pass,
      name,
      expected,
      actual,
    }
  },
}
