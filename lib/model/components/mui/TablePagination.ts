import type { Locator, Page } from '@playwright/test'

import { expect } from '@playwright/test'
import { Containee } from '../../common/Containee.ts'

export class TablePagination extends Containee {
  element = this.$('.MuiTablePagination-root')

  RowsPerPageSelect = this.element.locator('.MuiTablePagination-select')
  RowsPerPageItems = this.element.locator('.MuiTablePagination-menuItem')
  displayedRows = this.element.locator('.MuiTablePagination-displayedRows')
  firstPageIcon = this.element.locator('[data-testid="FirstPageIcon"]')
  previousPageIcon = this.element.locator('[data-testid="KeyboardArrowLeftIcon"]')
  nextPageIcon = this.element.locator('[data-testid="KeyboardArrowRightIcon"]')
  lastPageIcon = this.element.locator('[data-testid="LastPageIcon"]')

  async expectDisplayedRowsText(value: string | RegExp) {
    await expect(this.displayedRows).toHaveText(value)
  }

  async expectPagesNumber(value: number) {
    await expect(this.displayedRows).toHaveText(new RegExp(`\\d+-\\d+ of ${value}`))
  }
}
