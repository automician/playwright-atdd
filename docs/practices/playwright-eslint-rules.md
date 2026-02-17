# Playwright ESLint rules — review and rationale

This document reviews every rule from `eslint-plugin-playwright`'s
`flat/recommended` config and records why each is kept, adjusted,
or turned off in this project. The decisions follow the project's
[guiding principles](../guiding-principles.md).

## Rules kept at recommended defaults

These rules catch real bugs or enforce uncontroversial best practices.
No overrides needed.

### Error severity

| Rule                          | What it catches                                                                                                                                                                                                 |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `missing-playwright-await`    | A missing `await` on `expect(locator).toBeVisible()` silently passes. The single most valuable rule in the plugin.                                                                                              |
| `no-focused-test`             | A `.only` left in CI silently skips the rest of the suite.                                                                                                                                                      |
| `no-standalone-expect`        | `expect()` outside a `test` block is always a mistake.                                                                                                                                                          |
| `no-wait-for-navigation`      | `page.waitForNavigation()` has inherent race conditions; `page.waitForURL()` or auto-waiting are strictly better.                                                                                               |
| `no-networkidle`              | `waitUntil: 'networkidle'` is unreliable and leads to flaky tests. Prefer waiting on specific UI elements.                                                                                                      |
| `no-unsafe-references`        | Prevents stale-closure bugs inside `page.evaluate()`.                                                                                                                                                           |
| `prefer-web-first-assertions` | Web-first assertions (`await expect(locator).toBeVisible()`) auto-retry; manual polling (`expect(await locator.isVisible()).toBe(true)`) does not. End-to-end UI is dynamic — assertions must be waiting-aware. |
| `valid-expect`                | Catches `expect()` with no matcher, `expect().toBe` with no call, etc.                                                                                                                                          |
| `valid-expect-in-promise`     | Catches assertions inside `.then()` chains that are never awaited — silent failures.                                                                                                                            |
| `valid-title`                 | Forbids empty test titles or accidental template-literal misuse.                                                                                                                                                |
| `valid-test-tags`             | Catches typos in tags (e.g. missing `@` prefix).                                                                                                                                                                |
| `valid-describe-callback`     | Ensures `test.describe()` callbacks are not async, have no parameters, and do not return values.                                                                                                                |

### Warning severity

| Rule                                | What it catches                                                                                                 |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `no-page-pause`                     | `page.pause()` left in code means someone forgot to remove a debug breakpoint.                                  |
| `no-conditional-expect`             | An `expect` inside an `if` can silently not run.                                                                |
| `no-useless-not`                    | Prefers `toBeHidden()` over `not.toBeVisible()` — clearer intent.                                               |
| `no-useless-await`                  | Flags `await` on synchronous Playwright methods — noise reduction.                                              |
| `no-skipped-test`                   | `.skip()` is fine during development, but the warning serves as a reminder to either unskip or remove the test. |
| `consistent-spacing-between-blocks` | Enforces blank lines between `test`/`describe` blocks. Cosmetic, but consistent with Prettier-formatted code.   |

## Rules kept at warn — with extended rationale

These rules are kept at their recommended `warn` severity.
They are listed here (rather than in the "kept at defaults" table above)
because the rationale deserves more than a one-liner.

### `no-force-option` — kept at **warn**

Flags `{ force: true }` on click/fill/etc.

By default `force: true` should not appear in test code — it bypasses
Playwright's actionability checks, which exist for good reason.
The warning forces consciousness: if someone genuinely needs it,
they must disable the rule per line and document why. That inline
disable then serves as a signal during code review.

### `no-wait-for-timeout` — kept at **warn**

Flags `page.waitForTimeout(ms)`.

Hard sleeps are one of the most common sources of flaky and slow tests.
With more freedom, engineers tend to sprinkle hard waits across the
project instead of finding proper waiting strategies. The warning
forces them to think twice and, if truly needed, disable per line —
making each hard wait visible and reviewable.

## Rules with custom severity

### `no-wait-for-selector` — upgraded to **error**

Flags `page.waitForSelector()`.

`page.waitForSelector()` breaks "only one way" — locators are the
canonical way to reference elements, and mixing in the old
selector-based API is inconsistent.

#### Deeper concern: explicit waiting breaks abstraction levels

The concern goes beyond API consistency. Even `locator.waitFor()` is
rarely needed. Playwright's
[auto-waiting](https://playwright.dev/docs/actionability#introduction)
means most actions already wait for the element to be actionable.

Explicit `.waitFor()` violates the
[single level of abstraction](https://www.principles-wiki.net/principles:single_level_of_abstraction)
principle (SLAP): test code should express _user intent_, not
_technical plumbing_. A user does not "wait for a selector" — they
perform actions and observe outcomes. Because we test user behavior,
our tests should model that behavior: actions and assertions, not
waits. When a user genuinely waits for something (e.g. a loading bar
to disappear), that maps to an assertion (`expect`), not a `waitFor`.

Any necessary low-level waiting should be
[encapsulated](https://enterprisecraftsmanship.com/posts/encapsulation-revisited/)
inside page-object methods or custom locator wrappers — hidden from
the test, which stays at the user-intent level. This is what the
[PageObject pattern](./page-object-pattern.md) is fundamentally about:
making test code "easy to use correctly and hard to use incorrectly".

This rule only flags `page.waitForSelector()`, not
`locator.waitFor()` — so it does not go far enough on its own.

<!-- todo: consider a custom rule or wrapper that discourages
     locator.waitFor() in test files, pushing all explicit waits
     into page-object / helper code -->

### `no-element-handle` — upgraded to **error**

Flags `page.$()`, `page.$$()`, and element handles.

Locators are lazy and dynamic — they re-query the DOM on every action,
which is essential for dynamic UI under test. Element handles are
snapshots that go stale. There is no practical reason to prefer handles;
the "optimization" argument would break YAGNI — modern UI is slow enough that
the difference is negligible.

### `no-eval` — upgraded to **error**

Flags `page.$eval()` and `page.$$eval()`.

Superseded by `locator.evaluate()`. The old `$eval` API is more
error-prone and inconsistent with the locator-based style.

### `no-conditional-in-test` — upgraded to **error**

Forbids any `if`/`switch`/ternary inside a `test` block.

Tests must be linear and obvious — this is a direct consequence of
"KISS trumps DRY in tests" and "flat is better than nested".
Branching in a test body is a design smell: the test is either doing
too much, or the branching belongs one layer down.

The correct approach to platform/configuration differences:

1. **Hide branching in page-object or steps-object steps.** A single
   high-level step (e.g. `submitForm()`) can branch internally per
   platform while the test stays linear.
2. **Use helper wrappers** for platform-specific blocks when the
   business flow itself differs (e.g. `onMobile(() => { ... })`).
3. **Write separate tests** when business scenarios diverge significantly
   per platform. More duplication, but more clarity on scale —
   "simple made easy".

### `no-nested-step` — upgraded to **error**

Forbids `test.step()` inside another `test.step()`.

Tests should stay flat — "flat is better than nested". This project
does use nested steps, but the nesting happens entirely under the hood
via the [steps proxy](./steps-proxy.md) (method arguments and return
values are rendered as nested sub-steps for readability). ESLint performs
static analysis on the source AST, so it never sees the proxy-generated
nesting. The rule only fires on literal `test.step()` calls written
directly inside another `test.step()` in test code — which is exactly
what we want to prevent.

### `no-unused-locators` — downgraded to **warn**

Flags locator variables that are defined but never used.

An error would be too aggressive during active development, but the
warning has value: in an agentic testing workflow, where agents generate
tests from feature specifications, flagging unused locators keeps the
generated code focused on what is actually needed.

## Rules with custom configuration

### `expect-expect` — warn, `assertFunctionPatterns: ['^should']`

This project uses `should`-prefixed methods on page objects as assertion
steps (`shouldHaveResult`, `shouldBeEmpty`, etc.). The plugin's default
only recognizes `expect()` calls. The `assertFunctionPatterns` option
teaches it to recognize any method starting with `should` as a valid
assertion.

The `should` prefix follows a BDD naming convention where test assertions
read as behavioral expectations: "search engine _should have_ results".
See Dan North's
[Introducing BDD](https://dannorth.net/blog/introducing-bdd/#a-simple-sentence-template-keeps-test-methods-focused)
for background on this sentence-template approach.

💡 Alternative conventions include `expect`-prefixed methods
(e.g. `expectResult`, `expectEmpty`), which are more idiomatic in
JS/TS testing culture. Choose whichever reads more naturally for your
team — just update `assertFunctionPatterns` accordingly.

### `max-nested-describe` — warn, `max: 1`

Following "flat is better than nested". The recommended default of 5
is far too permissive. One level of `describe` grouping is enough —
if you need sub-groups inside sub-groups, the test file is doing
too much and should be split.

## See also

- [docs/tooling/eslint.md](../tooling/eslint.md) — ESLint configuration overview
- [Page-object pattern](./page-object-pattern.md) — the `should`-prefixed
  assertion convention
- [Steps proxy](./steps-proxy.md) — why nested steps happen under the hood
