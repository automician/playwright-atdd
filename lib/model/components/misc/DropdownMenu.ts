import { expect, type Locator, type Page } from '@playwright/test'
import { Containee } from '../../common/Containee.ts'
import {
  PopoverMenu,
  type ChooseItemStrategy as PopoverChooseItemStrategy,
} from '../mui/PopoverMenu.ts'

/**
 * How to open and select an item from the dropdown.
 *
 * - `'click'`        — standard open() + native click on item
 * - `'dispatchEvent'`— standard open() + dispatchEvent('click') on item (no mouse movement,
 *                      avoids closing hover-triggered buttons)
 * - `'retryOpen'`    — wraps open+choose in expect().toPass(); re-opens the menu if it closed
 *                      mid-interaction (e.g. due to a background table refetch); uses
 *                      dispatchEvent for the item click
 */
export type ChooseItemStrategy = PopoverChooseItemStrategy | 'retryOpen'

export class DropdownMenu<Item extends string = string> extends Containee {
  trigger: Locator
  menu: PopoverMenu<Item>
  _chooseItemStrategy: ChooseItemStrategy

  constructor(
    page: Page,
    container: Locator,
    {
      trigger,
      chooseItemStrategy = 'retryOpen',
    }: {
      trigger?: string | Locator | ((locate: Page['locator']) => Locator)
      chooseItemStrategy?: ChooseItemStrategy
    } = {},
  ) {
    super(page, container)
    this._chooseItemStrategy = chooseItemStrategy
    // retryOpen uses dispatchEvent for the actual item click
    const popoverStrategy: PopoverChooseItemStrategy =
      chooseItemStrategy === 'click' ? 'click' : 'dispatchEvent'
    // TODO: `undefined` below is pretty not self-documenting,
    // find a better way to pass containers
    this.menu = new PopoverMenu<Item>(this.page, undefined, {
      chooseItemStrategy: popoverStrategy,
    })
    const triggerOpt =
      trigger ??
      ((locate: Page['locator']) => locate('button').filter({ visible: true }))
    this.trigger =
      typeof triggerOpt === 'string' ? this.$(triggerOpt)
      : typeof triggerOpt === 'function' ? triggerOpt((s, o) => this.locator(s, o))
      : triggerOpt
  }

  async open() {
    await expect(this.menu.body).toBeHidden()
    await this.trigger.click()
    await expect(this.menu.body).toBeVisible()
    // Animation wait is handled in PopoverMenu.choose() via waitFor({ state: 'visible' })
    // on the specific item — do NOT use evaluate(getAnimations) here, as CDP execution
    // can interfere with base-ui's focus-outside detection and cause the menu to close.
  }

  async close() {
    await expect(this.menu.body).toBeVisible()
    await this.trigger.click()
    await expect(this.menu.body).toBeHidden()
  }

  async select(item: Item) {
    if (this._chooseItemStrategy === 'retryOpen') {
      // TODO: consider logging each retry, or even mark test as flaky if it retries even once
      // after menu was opened but closed mid-interaction (e.g. background table refetch).

      // Re-opens the menu if it closed mid-interaction (e.g. background table refetch).
      // Inner timeouts are 0 so toPass() retries immediately on failure.
      await expect(async () => {
        if (!(await this.menu.body.isVisible())) await this.trigger.click()
        await this.menu.body.waitFor({ timeout: 0 })
        await this.menu.choose(item, { timeout: 0 })
      }).toPass()
    } else {
      await this.open()
      await this.choose(item)
    }
  }

  async choose(item: Item) {
    await this.menu.choose(item)
  }

  async expectToHave(items: Item[]) {
    await this.menu.expectToHave(items)
  }

  async expectToContain(items: Item[]) {
    await this.menu.expectToContain(items)
  }
}
