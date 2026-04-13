import { expect, type Page } from '@playwright/test'
import joinUrl from '../../support/common/url-utils/joinUrl.js'
import withAsyncAsSteps from './withAsyncAsSteps.ts'

/**
 * Route is a class that represents a route on the page and provides handy
 * methods to navigate to the route, check and assert if it is loaded.
 * One would typically put "reusable methods" like `load`, `isLoaded`,
 * `givenLoaded`, `expectLoaded` to the `BasePageObject` kind of a class,
 * but this class provides a more "decoupled" approach, following the
 * "Composition over Inheritance" principle. If you need those methods in your
 * PageObject, simply "compose a route attribute" into it, e.g.:
 *
 * ```ts
 * class ExamplePageObject {
 *   // allows to navigate from test by `await examplePage.route.load()`
 *   // or ensure navigated from a test precondition by `await examplePage.route.givenLoaded()`
 *   route = new Route(this.page, 'https://example.com')
 *
 *   // allows to build "sub-routes" loading methods, e.g.:
 *   async loadProfile(subPath: string = '') {
 *     await this.route.segment('profile').segment(subPath).load() // navigate to https://example.com/profile/subPath
 *   }
 *
 *   // and so on...
 *   async loadProfileSettings() {
 *     await this.loadProfile('settings') // navigate to https://example.com/profile/settings
 *   }
 *
 *   async loadProfileNotifications() {
 *     await this.loadProfile('notifications') // navigate to https://example.com/profile/notifications
 *   }
 * }
 * ```
 */
export class Route<NextSegment extends string = string> {
  constructor(
    public page: Page,
    public baseUrl: string,
  ) {
    return withAsyncAsSteps(this)
  }

  async goto(path: string) {
    await this.page.goto(joinUrl(this.baseUrl, path))
  }

  async load() {
    await this.page.goto(this.baseUrl)
  }

  isLoaded() {
    return this.page.url().includes(this.baseUrl)
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(this.baseUrl)
  }

  async givenLoaded() {
    if (this.isLoaded()) return
    await this.goto(this.baseUrl)
    // TODO: do we need to call `expectLoaded` here?
  }

  segment<AfterNextSegment extends string = string>(name: NextSegment) {
    if (name === '') return this
    return new Route<AfterNextSegment>(this.page, joinUrl(this.baseUrl, name))
  }
}
