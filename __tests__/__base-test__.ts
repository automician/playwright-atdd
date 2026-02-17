import * as base from '@playwright/test'
import { AppManagerFixture } from '../lib/model/app-manager.fixture.ts'

export const test = base.test.extend(AppManagerFixture)
export { expect, expectToPass, request } from '../lib/support/playwright/test.js'
export {
  GIVEN,
  WHEN,
  THEN,
  AND,
  STEP,
} from '../lib/support/playwright/reporting/gherkin.js'
