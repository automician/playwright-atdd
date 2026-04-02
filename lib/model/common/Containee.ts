import type { Locator, Page } from '@playwright/test'

import withAsyncAsSteps from './withAsyncAsSteps.ts'

type PageLocatorOptions = Parameters<Page['locator']>[1]

export class Containee {
  constructor(
    public page: Page,
    public container?: Locator,
  ) {
    return withAsyncAsSteps(this)
  }

  locator(selector: string, options: PageLocatorOptions = {}): Locator {
    return (this.container ?? this.page).locator(selector, options)
  }

  /**
   * More concise alias for locator
   */
  $(selector: string, options: PageLocatorOptions = {}): Locator {
    return this.locator(selector, options)
  }
}
