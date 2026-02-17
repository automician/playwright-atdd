import * as playwright from '@playwright/test'
import { matchers } from './matchers.js'
import { config } from '../../../project.config.js'
import * as expectations from './expectations.js'
export { default as request } from './request.js'
export { expectToPass } from './expectations.js'

const extendedExpect = playwright.expect.extend(matchers)

/** @type {playwright.Expect} */
export const expect =
  config.enableMatcherSteps ?
    expectations.withMatchersAsSteps(extendedExpect)
  : extendedExpect
