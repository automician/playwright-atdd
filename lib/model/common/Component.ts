import type { Locator, Page } from '@playwright/test'

import withAsyncAsSteps from './withAsyncAsSteps.ts'

/**
 * Component is a "ComponentOnThePageObject" that owns elements only in its own
 * "container" root element.
 */
export class Component {
  constructor(public container: Locator) {
    return withAsyncAsSteps(this)
  }

  locator(
    selectorOrLocator: string | Locator,
    options: Record<string, unknown> = {},
  ): Locator {
    return this.container.locator(selectorOrLocator, options)
  }

  /**
   * More concise alias for locator
   */
  $(
    selectorOrLocator: string | Locator,
    options: Record<string, unknown> = {},
  ): Locator {
    return this.locator(selectorOrLocator, options)
  }
}
