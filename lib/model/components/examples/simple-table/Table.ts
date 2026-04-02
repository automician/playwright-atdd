import type { Locator, Page } from '@playwright/test'

import { expect } from '@playwright/test'
import { Containee } from '../../../common/Containee.ts'
import { project } from '../../../../../project.config.js'
import { Table as FluentTable } from '../../misc/table.ts'
type LocatorAssertions = ReturnType<typeof expect<Locator>>
type ToContainTextExpected = Parameters<LocatorAssertions['toContainText']>[0]
type ToContainTextOptions = Parameters<LocatorAssertions['toContainText']>[1]
type LocatorFilterOptions = Parameters<Locator['filter']>[0]

/**
 * A simplified "flat" version of the Table component.
 * It does not have the "fluent" methods, but it is easier to use and understand.
 * For more complex use cases, use the {@link FluentTable} component.
 */
export class Table extends Containee {
  element = this.$('table')
  header = this.element.locator('thead')
  body = this.element.locator('tbody')
  rows = this.body.locator('tr')
  cols = this.header.locator('th')

  rowByIndex(index: number) {
    return this.rows.nth(index)
  }

  rowByText(text: string) {
    return this.rows.filter({ hasText: text })
  }

  row(indexOrFilter: number | LocatorFilterOptions) {
    return typeof indexOrFilter === 'number' ?
        this.rowByIndex(indexOrFilter)
      : this.rows.filter(indexOrFilter)
  }

  rowCells(indexOfFilter: number | LocatorFilterOptions) {
    return this.row(indexOfFilter).locator('td')
  }

  async expectRowCellsToContainExactTextsOrderWise({
    row,
    texts,
    options,
  }: {
    row: number | LocatorFilterOptions
    texts: ToContainTextExpected
    options?: ToContainTextOptions
  }) {
    await expect(this.rowCells(row)).toContainText(texts, options)
  }

  async expectRowCellsToHaveExactTexts({
    row,
    texts,
    options,
  }: {
    row: number | LocatorFilterOptions
    texts: ToContainTextExpected
    options?: ToContainTextOptions
  }) {
    await expect(this.rowCells(row)).toHaveText(texts, options)
  }

  async cell({
    row,
    col,
  }: {
    row: number | LocatorFilterOptions
    col: number | string | ((locator: Locator) => Promise<boolean>)
  }) {
    const rowCells = this.rowCells(row)
    if (typeof col === 'number') {
      return rowCells.nth(col)
    }
    const colPredicate =
      typeof col === 'function' ? col : (
        async (locator: Locator) => (await locator.textContent()) === col
      )
    let cell: Locator | undefined
    await expect(async () => {
      const colsArray = await rowCells.all()
      for (let i = 0; i < colsArray.length; i++) {
        if (await colPredicate(colsArray[i]!)) {
          cell = rowCells.nth(i)
          break
        }
      }
      if (!cell) {
        throw new Error(`Column ${col} not found`)
      }
    }).toPass({ timeout: project.config.expectTimeout }) // probably not needed this timeout re-pass
    return cell
  }

  async expectColsCount(number: number) {
    await expect(this.cols).toHaveCount(number)
  }

  async expectCols(titles: string[]) {
    await expect(this.cols).toHaveText(titles)
  }

  async expectRowsCount(number: number) {
    await expect(this.rows).toHaveCount(number)
  }
}
