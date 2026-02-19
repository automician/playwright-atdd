/**
 * Wrappers around `test.fixme` / `test.describe.fixme` for "to-do" tests —
 * placeholders for tests that are planned but not yet implemented.
 *
 * Playwright has no `test.todo()` (upstream request:
 * https://github.com/microsoft/playwright/issues/10918),
 * so `test.fixme` is the closest built-in.
 * These wrappers exist to:
 * - give correct **semantics** ("todo", not "fixme / broken")
 * - avoid false-positive ESLint warnings from
 *   `playwright/expect-expect` and `playwright/no-skipped-test`
 *   (the plugin only recognizes hardcoded `test.*` / `describe.*` chains)
 *
 * @example
 *   import { describeTodo, testTodo } from '../../support/playwright/todo-test.js'
 *
 *   testTodo('User uploads file via drag-and-drop @manual')
 *
 *   describeTodo('Search entries on Chart review tab @manual')
 */

import { test } from '@playwright/test'

/** Mark a single test as "to be implemented". */
export function testTodo(/** @type {string} */ title) {
  test.fixme(title, async () => {})
}

/** Mark a describe group as "to be implemented". */
export function describeTodo(/** @type {string} */ title) {
  test.describe.fixme(title, () => {})
}
