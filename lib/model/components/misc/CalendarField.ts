import type { Locator, Page } from '@playwright/test'

import { expect } from '@playwright/test'
import { PageContext } from '../../common/PageContext.ts'
import { project } from '../../../../project.config.js'

/**
 * Control object for the CalendarField (date picker popover) component.
 *
 * DOM structure:
 *   FieldWrapper > PopoverTrigger[data-testid] > span (display) + CalendarDays icon
 *   PopoverContent > Calendar[data-testid=Calendar] > DayPicker (react-day-picker)
 *                   > footer: Reset + Apply buttons
 *
 * Calendar uses captionLayout="dropdown" by default,
 * so month/year are <select> dropdowns inside the caption.
 */
export class CalendarField extends PageContext {
  constructor(
    public field: Locator,
    page: Page,
  ) {
    super(page)
  }

  toString() {
    return `CalendarField(${this.field})`
  }

  popover = this.$('[data-slot="popover-content"]')

  async open() {
    await expect(this.popover).toBeHidden()
    await this.field.click()
    await expect(this.popover).toBeVisible()
  }

  async close() {
    await expect(this.popover).toBeVisible()
    await this.field.click()
    await expect(this.popover).toBeHidden()
  }

  calendar = this.popover.locator('[data-testid="Calendar"]')
  monthDropdown = this.calendar.locator('.rdp-months_dropdown')
  yearDropdown = this.calendar.locator('.rdp-years_dropdown')
  dayButton(date: Date): Locator {
    return this.calendar.locator(
      `[data-day="${date.toLocaleDateString(project.config.locale)}"]`,
    )
  }

  applyButton = this.popover.locator('[data-testid="calendarApplyButton"]')
  resetButton = this.popover.locator('[data-testid="calendarResetButton"]')

  async pickDate(value: Date | string) {
    const date = typeof value === 'string' ? new Date(value) : value

    await this.open()

    await this.monthDropdown.selectOption(String(date.getMonth()))
    await this.yearDropdown.selectOption(String(date.getFullYear()))
    await this.dayButton(date).click()

    await this.applyButton.click()
  }

  /**
   * Set a date via the calendar picker.
   *
   * Alias for pickDate — both click through the calendar UI
   * since CalendarField has no text input.
   *
   * @param date - Date to set (Date object or ISO string like '1997-09-04')
   */
  async set(date: Date | string) {
    await this.pickDate(date)
  }

  async reset() {
    await this.open()
    await this.resetButton.click()
  }

  async expectText(value: string) {
    await expect(this.field.locator('span').first()).toContainText(value)
  }

  async expectDate(value: Date) {
    await expect(this.field.locator('span').first()).toContainText(
      value.toLocaleDateString(project.config.locale),
    )
  }

  async expectEmpty() {
    await expect(this.field).toHaveAttribute('data-empty', 'true')
  }

  async expectWithValue() {
    await expect(this.field).toHaveAttribute('data-empty', 'false')
  }
}
