import { expect } from '@playwright/test'
import { MultiComponent } from '../../common/MultiComponent.ts'

export class SelectElement<Option extends string = string> extends MultiComponent {
  field = this.$('.MuiSelect-select')
  popup = this.page.locator('.MuiPopover-paper')
  listbox = this.popup.locator('[role="listbox"]')
  options = this.popup.locator('[role="option"]')

  async open() {
    await expect(this.popup).toBeHidden()
    await this.field.click()
  }

  async close() {
    await expect(this.popup).toBeVisible()
    await this.field.click()
  }

  /** Chooses the option by its text from already opened popup listbox
   * @param option - exact text to be matched (case-insensitive) in the option
   */
  async choose(option: Option) {
    await this.options.filter({ hasText: new RegExp(`^${option}$`, 'i') }).click()
  }

  /** Expects the opened popup listbox to contain the options by their text */
  async expectVisibleOptions(options: Option[]) {
    await expect(this.options).toHaveText(options)
  }

  /** Opens the popup and chooses the option by its text */
  async select(option: Option) {
    await this.open()
    await this.choose(option)
  }

  /** Expects the option to be selected by its text */
  async expectSelected(option: Option) {
    await expect(this.field).toHaveText(option)
  }

  /** Expects the field to be empty */
  async expectEmpty() {
    await expect(this.field).toHaveText('')
  }
}
