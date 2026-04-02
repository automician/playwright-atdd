import type { Locator, Page } from '@playwright/test'

import withAsyncAsSteps from './withAsyncAsSteps.ts'

/**
 * MultiComponent is a "ComponentOnThePageObject" that owns elements not just
 * in its own "container" root element, but also elsewhere on the page.
 * E.g. a SelectElement in a form is a MultiComponent, because it has its own
 * field locator inside its container, but also a popup locator on the page level.
 *
 * MultiComponent differs from {@link Containee} in that it always should have its
 * own container locator. The Component's container is the actual root element
 * of the component, while the Containee's container is any ancestor
 * of the containee. In most cases, the difference is not important.
 * Feel free to use {@link Containee} instead if the difference
 * is not important for you.
 */
export class MultiComponent {
  constructor(
    public page: Page,
    public container: Locator,
  ) {
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
