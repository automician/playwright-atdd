import { expect } from '@playwright/test'
import { Google } from './pages/google.js'
import { DuckDuckGo } from './pages/duckduckgo.js'
import { withSteps } from '../support/playwright/reporting/steps.proxy.js'

class App {
  /**
   * @param { import('@playwright/test').Page } page
   */
  constructor(page) {
    this.page = page
    this.google = new Google(page)
    this.duckduckgo = new DuckDuckGo(page)

    return withSteps(this)
  }

  /**
   * @param { string | RegExp }titleOrRegExp  Expected title or RegExp.
   * @param { { timeout?: number } } options
   */
  async shouldHavePageTitle(titleOrRegExp, options = {}) {
    await expect(this.page).toHaveTitle(titleOrRegExp, options)
  }
}

/** @type { import('@playwright/test').Fixtures<{app: App}> }*/
export const AppManagerFixture = /** @type { unknown } */ ({
  app: async ({ page }, use) => {
    await use(new App(page))
  },
})
