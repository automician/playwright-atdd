import { expect } from '@playwright/test'
import { Component } from '../../common/Component.ts'

export class Checkbox extends Component {
  input = this.$('[type="checkbox"]')

  // TODO: handover options too
  async expectChecked() {
    await expect(this.input).toBeChecked()
  }

  // TODO: handover options too
  async expectUnchecked() {
    await expect(this.input).not.toBeChecked()
  }

  async check() {
    await this.expectUnchecked()
    await this.input.check()
  }

  async uncheck() {
    await this.expectChecked()
    await this.input.uncheck()
  }
}
