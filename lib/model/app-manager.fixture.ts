import type {
  Fixtures,
  PlaywrightTestArgs,
  PlaywrightTestOptions,
  PlaywrightWorkerArgs,
  PlaywrightWorkerOptions,
} from '@playwright/test'
import { expect } from '@playwright/test'
import { Google } from './pages/google.ts'
import { DuckDuckGo } from './pages/duckduckgo.ts'
import { AnySearchEngine } from './pages/any-search-engine.ts'
import { PageContext } from './common/PageContext.ts'

class App extends PageContext {
  google = new Google(this.page)
  duckduckgo = new DuckDuckGo(this.page)
  searchEngine = new AnySearchEngine(this.page)

  async shouldHavePageTitle(
    valueOrPattern: string | RegExp,
    options: { timeout?: number } = {},
  ) {
    await expect(this.page).toHaveTitle(valueOrPattern, options)
  }
}

export const AppManagerFixture: Fixtures<
  { app: App },
  {},
  PlaywrightTestArgs & PlaywrightTestOptions,
  PlaywrightWorkerArgs & PlaywrightWorkerOptions
> = {
  app: async ({ page }, use) => {
    await use(new App(page))
  },
}
