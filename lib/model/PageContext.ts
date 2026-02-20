import type { Page } from '@playwright/test'
import withAsyncAsSteps from './withAsyncAsSteps.ts'

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

  locator(...args: Parameters<Page['locator']>) {
    return this.page.locator(...args)
  }
}
