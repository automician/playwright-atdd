import type { Locator } from '@playwright/test'

import { expect } from '@playwright/test'
import { Containee } from '../../common/Containee.ts'
import { project } from '../../../../project.config.js'
import { Component } from '../../common/Component.ts'
type LocatorAssertions = ReturnType<typeof expect<Locator>>
type ToContainTextExpected = Parameters<LocatorAssertions['toContainText']>[0]
type ToContainTextOptions = Parameters<LocatorAssertions['toContainText']>[1]
type LocatorFilterOptions = Parameters<Locator['filter']>[0]

export class Table extends Containee {
  element = this.$('table')
  header = this.element.locator('thead')
  body = this.element.locator('tbody')
  rows = this.body.locator('tr')
  cols = this.header.locator('th') // '.MuiTableCell-head'

  rowByIndex(index: number) {
    return new TableRow(this.rows.nth(index))
  }

  rowBy(filter: LocatorFilterOptions) {
    return new TableRow(this.rows.filter(filter))
  }

  rowByText(text: string) {
    return this.rowBy({ hasText: text })
  }

  row(indexOrFilter: number | LocatorFilterOptions) {
    return typeof indexOrFilter === 'number' ?
        this.rowByIndex(indexOrFilter)
      : this.rowBy(indexOrFilter)
  }

  async cell({
    row,
    col,
  }: {
    row: number | LocatorFilterOptions
    col: number | string | ((locator: Locator) => Promise<boolean>)
  }) {
    const rowCells = this.row(row).cells
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

  async expectRowsCount(
    number: number,
    { filter = undefined }: { filter?: LocatorFilterOptions } = {},
  ) {
    const rows = filter ? this.rows.filter(filter) : this.rows
    await expect(rows).toHaveCount(number)
  }

  /**
   * @param rowsTexts - array of arrays of texts to be contained (order wise) in the rows
   * @param options - options to be passed to the toContainText playwright method
   *
   * TODO: if flaky, wrap in expect().toPass() like expectToContainRowsWithContained —
   *       the sequential expectRowsCount + per-row assertions can race with DOM updates
   */
  async expectToHaveRowsWithContained(
    rowsTexts: ToContainTextExpected[],
    options?: ToContainTextOptions,
  ) {
    await this.expectRowsCount(rowsTexts.length)
    for (let i = 0; i < rowsTexts.length; i++) {
      await this.row(i).expectToContain(rowsTexts[i]!, options)
    }
  }

  /**
   * @param rowsTexts - array of arrays of exact texts to match in the rows
   * @param options - options to be passed to the toHaveText playwright method
   *
   * TODO: if flaky, wrap in expect().toPass() like expectToContainRowsWithContained —
   *       the sequential expectRowsCount + per-row assertions can race with DOM updates
   */
  async expectToHaveRowsWithExact(
    rowsTexts: ToContainTextExpected[],
    options?: ToContainTextOptions,
  ) {
    await this.expectRowsCount(rowsTexts.length)
    for (let i = 0; i < rowsTexts.length; i++) {
      await this.row(i).expectToHave(rowsTexts[i]!, options)
    }
  }

  /** Alias for {@link expectToHaveRowsWithExact} */
  expectToHave = this.expectToHaveRowsWithExact

  async expectToBeEmpty() {
    await this.expectRowsCount(0)
  }

  /**
   * Sparse row matching: asserts that among actual rows there is a subsequence
   * of rows (in order) whose cells contain the specified texts.
   * Extra rows between matches are allowed.
   *
   * Example: if table has rows [A, B, C, D], passing [[textsForA], [textsForD]]
   * will pass — rows B and C are simply skipped.
   *
   * @param rowsTexts - array of arrays of texts to be contained in matched rows
   * @param options - options to be passed to the toContainText playwright method
   */
  async expectToContainRowsWithContained(
    rowsTexts: ToContainTextExpected[],
    options?: ToContainTextOptions,
  ) {
    await expect(async () => {
      const count = await this.rows.count()
      expect(count).toBeGreaterThanOrEqual(rowsTexts.length)

      let nextRowIndex = 0
      let lastMatchedIndex = -1
      for (const expectedTexts of rowsTexts) {
        let matched = false
        while (nextRowIndex < count) {
          try {
            // timeout: 0 to check instantly — the outer toPass() handles retries;
            // without this, each non-matching row would poll for the default
            // expect timeout, making the whole scan extremely slow
            await this.row(nextRowIndex).expectToContain(expectedTexts, {
              ...options,
              timeout: 0,
            })
            lastMatchedIndex = nextRowIndex
            nextRowIndex++
            matched = true
            break
          } catch {
            nextRowIndex++
          }
        }
        if (!matched) {
          const actualRowsTexts: string[][] = []
          for (let i = 0; i < count; i++) {
            actualRowsTexts.push(await this.row(i).cells.allTextContents())
          }
          const actualFormatted = actualRowsTexts
            .map(
              (cells, i) =>
                `  ${i === lastMatchedIndex ? '✓' : ' '} row ${i}: ${JSON.stringify(cells)}`,
            )
            .join('\n')
          throw new Error(
            `Could not find a row matching:\n` +
              `  ${JSON.stringify(expectedTexts)}\n` +
              `\nActual rows:\n${actualFormatted}\n` +
              (lastMatchedIndex >= 0 ?
                `\n(✓ = last matched row, searched from row ${lastMatchedIndex + 1} onwards)`
              : `\n(no rows matched at all)`),
          )
        }
      }
    }).toPass({ timeout: project.config.expectTimeout })
  }

  /** Alias for {@link expectToContainRowsWithContained} */
  expectToContain = this.expectToContainRowsWithContained
}

// TODO: should we move it to its own file?
// TODO: should we some how "slice" cells to omit columns like "actions"?
//       (by parameterized constructor)
export class TableRow extends Component {
  cells = this.$('td')
  actions = this.$('[aria-label="actions"]')
  // Do we also want something like: (need to make this a MultiComponent or Containee then)
  // actionsMenu = new PopoverMenu(this.page)
  // async do(action: string) {
  //   await this.actions.click()
  //   await this.actionsMenu.choose(action)
  // }

  cell(indexOrFilter: number | LocatorFilterOptions) {
    return typeof indexOrFilter === 'number' ?
        this.cells.nth(indexOrFilter)
      : this.cells.filter(indexOrFilter)
  }

  // TODO: currently, with ignoreCase: true, the assertions are case-insensitive
  //       later - let's remove such default

  /**
   * @param text - text to be contained (order wise) in the row
   * @param options - options to be passed to the toContainText playwright method
   */
  async expectToContain(
    text: ToContainTextExpected,
    options: ToContainTextOptions = { ignoreCase: true },
  ) {
    await expect(this.cells).toContainText(text, options)
  }

  async expectToHave(
    text: ToContainTextExpected,
    options: ToContainTextOptions = { ignoreCase: true },
  ) {
    await expect(this.cells).toHaveText(text, options)
  }

  async isVisible() {
    // TODO: do we need to catch here? will Playwright fail if no element in DOM at all?
    return this.container.isVisible().catch(() => false)
  }

  async expectToBeVisible() {
    await expect(this.container).toBeVisible()
  }

  async clickButtonOfCell(indexOrFilter: number | LocatorFilterOptions) {
    return this.cell(indexOrFilter).locator('button').filter({ visible: true }).click()
  }
}
