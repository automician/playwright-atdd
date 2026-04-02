import { expect } from '@playwright/test'
import { PageContext } from '../../common/PageContext.ts'

export class Toasters<Message extends string = string> extends PageContext {
  elements = this.$('[id*="_toaster"]')

  byText(value: Message) {
    return this.elements.getByText(value)
  }

  async expectVisible(text: Message) {
    await expect(this.byText(text)).toBeVisible()
  }

  async expectHidden(text: Message) {
    await expect(this.byText(text)).toBeHidden()
  }

  async expectShownThenHidden(text: Message) {
    await this.expectVisible(text)
    await this.expectHidden(text)
  }
}
