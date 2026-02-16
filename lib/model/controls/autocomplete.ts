import type { Locator, Page } from '@playwright/test'
import { expect } from '../../support/playwright/test.js'
import { PageContext } from '../PageContext.ts'

export class Autocomplete extends PageContext {
  get input() {
    return this.root.getByRole('combobox')
  }
  dropdown = this.locator('[role="listbox"]')

  constructor(
    public root: Locator,
    page: Page,
  ) {
    super(page)
  }

  toString() {
    return `Autocomplete(${this.root})`
  }

  option(text: string) {
    return this.dropdown.getByRole('option', { name: text })
  }

  async fill(text: string) {
    await this.input.fill(text)
  }

  async select(text: string) {
    await this.fill(text)
    await this.option(text).click()
  }

  async shouldHaveSelected(text: string) {
    await expect(this.input).toHaveValue(text)
  }

  async shouldHaveOption(text: string) {
    await expect(this.option(text)).toBeVisible()
  }

  async shouldHaveOptionsCount(count: number) {
    await expect(this.dropdown.getByRole('option')).toHaveCount(count)
  }
}
