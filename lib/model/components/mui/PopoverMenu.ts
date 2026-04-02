import type { Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { Containee } from '../../common/Containee.ts'

/**
 * Covers:
 * - '@mui/material/Menu'
 * - '@mui/material/MenuItem'
 */

/** How to click an item once the menu is open. */
export type ChooseItemStrategy = 'click' | 'dispatchEvent'

export class PopoverMenu<Item extends string = string> extends Containee {
  /* TODO: In Some versions of such Menus, it may be handy to path as container
   * same element as the body below... Maybe we need to transform body attribute
   * to the getter that will check whether it's same element as container...
   * but this will slow down the element location process...
   */
  body = this.$('[role="menu"]')
  items = this.$('[role="menuitem"]')
  _chooseItemStrategy: ChooseItemStrategy

  constructor(
    page: Page,
    container?: Locator,
    { chooseItemStrategy = 'click' }: { chooseItemStrategy?: ChooseItemStrategy } = {},
  ) {
    super(page, container)
    this.body = this.$('[role="menu"]')
    this.items = this.$('[role="menuitem"]')
    this._chooseItemStrategy = chooseItemStrategy
  }

  item(text: Item, { ignoreCase = true }: { ignoreCase?: boolean } = {}) {
    return this.items.filter({
      hasText: new RegExp(`^${text}$`, ignoreCase ? 'i' : ''),
    })
  }

  /** @param item - exact text to be matched (case-insensitive) in the item */
  async choose(item: Item, { timeout }: { timeout?: number } = {}) {
    const itemLocator = this.item(item)
    if (this._chooseItemStrategy === 'dispatchEvent') {
      // Wait for the item to be visible — the menu container animates open (fade/zoom),
      // and items inside may be opacity-0 until the animation completes.
      await itemLocator.waitFor({
        state: 'visible',
        ...(timeout !== undefined ? { timeout } : {}),
      })
      // Dispatch pointer + click events without moving the mouse — mouse movement would
      // leave the row hover area, hiding the trigger and causing base-ui to close the menu.
      // Full pointer event sequence is needed because base-ui may listen on pointerdown/up
      // rather than click alone.
      await itemLocator.dispatchEvent('pointerdown')
      await itemLocator.dispatchEvent('pointerup')
      await itemLocator.dispatchEvent('click')
    } else {
      await itemLocator.click({ ...(timeout !== undefined ? { timeout } : {}) })
    }
  }

  async expectToHave(items: Item[]) {
    await expect(this.items).toHaveText(items)
  }

  async expectToContain(items: Item[]) {
    await expect(this.items).toContainText(items)
  }
}
