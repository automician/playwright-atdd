import type { Locator, Page, Response } from '@playwright/test'
import withAsyncAsSteps from './withAsyncAsSteps.ts'

// TODO: use actual Playwright types over Record<string, unknown>

/**
 * Thin base class for page objects and page-scoped controls.
 *
 * Provides:
 * - `page` property (via constructor parameter property)
 * - `locator(...)` shorthand for `this.page.locator(...)`
 * - automatic `withAsyncAsSteps` wrapping (inherited by subclasses)
 *
 * ## Why inheritance here?
 *
 * This trades a bit of "flat is better than nested" for a large reduction
 * in per-class boilerplate (no constructor, no field type declarations,
 * no manual `withAsyncAsSteps` call in every subclass).
 * The relationship is a genuine is-a: every page object *is* a page context.
 * See the "Practicality beats purity" guiding principle.
 *
 * ## Guidelines
 *
 * Keep this class **minimal**. It should only hold what every page object
 * and page-scoped control needs: access to `page` and its locators,
 * plus the step-wrapping proxy. Do **not** add domain logic, shared
 * assertions, or helper methods here — that path leads to a "god class"
 * and breaks composition over inheritance.
 *
 * Not every control needs `PageContext`. Simple controls that only wrap
 * a single `Locator` (e.g. `TextInput`) can manage their own constructor
 * without inheriting from a base class.
 */
export class PageContext {
  constructor(public page: Page) {
    return withAsyncAsSteps(this)
  }

  // TODO: consider something like a this.new(ComponentClass, ...args) factory,
  // that would allow using `Role = this.new(SelectElement, this.$('[data-testid="addRoleSelect"]'))`
  // instead of `Role = new SelectElement(this.page, this.$('[data-testid="addRoleSelect"]'))`
  // In order to make it bulletproof, consider having a separate interface
  // for components to implement, so they can be used in this factory.

  locator(...args: Parameters<Page['locator']>) {
    return this.page.locator(...args)
  }

  /**
   * More concise alias for locator
   */
  $(selector: string, options: Record<string, unknown> = {}): Locator {
    return this.locator(selector, options)
  }

  // TODO: consider finding better place for this method. It seems to break a bit
  // the "PageContext" abstraction, because it is not really a page CONTEXT,
  // in regards to "locating context"
  /**
   * Register a response listener, execute an action that triggers the request,
   * then await the response — in the correct order.
   *
   * Encapsulates the register-before-act pattern: setting up the listener after
   * the action risks missing a fast response that arrives before the listener
   * is registered.
   *
   * @param predicate - URL substring to match (shorthand for the common case),
   *   or a full predicate function for richer matching (e.g. also checking the
   *   search term in the URL to skip unrelated background re-fetches).
   */
  async waitForActionResponse<T>(
    predicate: string | ((resp: Response) => boolean),
    action: () => Promise<T>,
  ): Promise<T> {
    const matches =
      typeof predicate === 'string' ?
        (resp: Response) => resp.url().includes(predicate) && resp.status() === 200
      : predicate
    const responsePromise = this.page.waitForResponse(matches)
    const result = await action()
    await responsePromise
    return result
  }
}
