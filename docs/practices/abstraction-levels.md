# Abstraction levels in e2e testing

End-to-end test automation involves several distinct levels of
abstraction. Recognizing them helps decide where each piece of logic
belongs and how many layers to introduce.

## The four levels

| Level                    | What it describes                              | Typical pattern                       | Example                                                   |
| ------------------------ | ---------------------------------------------- | ------------------------------------- | --------------------------------------------------------- |
| **User goals**           | Business outcomes the user achieves            | StepsObject                           | _registers_, _signs in_, _sends email_                    |
| **User actions**         | Things the user does on a page to reach a goal | PageObject (page)                     | _opens compose form_, _fills recipient_, _submits_        |
| **Element interactions** | How individual controls are operated           | PageObject (control/component/widget) | _types into input_, _selects from dropdown_, _picks date_ |
| **Browser mechanics**    | Low-level browser / DOM plumbing               | Framework (Playwright API)            | _queries DOM_, _waits for selector_, _intercepts network_ |

⚠️ In reality, the levels are not always perfectly distinct,
and the boundaries are not always clear.

### User goals

A goal is a complete business workflow: "user sends an email",
"user enables MFA". At this level the test reads almost like a
requirements document.

Mapping to code: a **StepsObject** — a class whose methods are
named after goals, each orchestrating several user actions.

### User actions

An action is something the user does on a specific page or screen:
"opens compose form", "fills the subject field", "clicks Send".
This is the natural level for **page-level PageObjects**.

For "simpler" actions is often one-to-one with element interactions
with difference in "naming" – user actions are named after the user's
intent, while element interactions are named after the element's interaction
nature (e.g. "user sets birthday date" vs "DatePicker selects date").

### Element interactions

For simple elements (a text input, a button) this level is often
one-to-one with user actions — "fill field" maps directly to a single
Playwright `fill()` call. But for complex controls — Autocomplete,
DatePicker, Table, multi-step dialogs — the relationship is
many-to-one: a single user action ("select an option") involves
multiple element interactions (type text, wait for dropdown, click
option).

Mapping to code: **control / component / widget PageObjects** (`TextInput`,
`Autocomplete`, `DatePicker`). Each encapsulates the element-level
choreography behind a user-action-level method.

### Browser mechanics

The lowest level: DOM queries, explicit waits, network interception,
JavaScript evaluation. Ideally this level is fully hidden inside the
framework (Playwright handles it via auto-waiting, locator
auto-retries, etc.). In practice, Playwright's API exposes some
low-level details (`waitFor()`, `.evaluate()`, element handles) that
leak browser mechanics into test code if used directly.

Mapping to code: the **framework layer** — Playwright itself, plus
any custom wrappers around `Locator` or `Page` that smooth over
Playwright's SLAP violations.

## SLAP vs KISS — the pragmatic tension

Strict adherence to the
[single level of abstraction](https://www.principles-wiki.net/principles:single_level_of_abstraction)
principle (SLAP) would demand four separate layers with clean
boundaries. In practice, this creates too many indirections and breaks
KISS and "flat is better than nested" principles.

This project deliberately merges some levels for pragmatism:

**What we merge.** Page-level PageObjects in this project combine
_user actions_ and _user goals_ in the same class: `DuckDuckGo` has
both action methods (`search`, `open`) and more goal-level assertion-steps
(`shouldHaveResult`, `shouldHaveResultsAtLeast`). This is documented
in the [PageObject pattern](./page-object-pattern.md) as the
"StepsObject" flavour — assertion-steps are included, making the
implementation closer to a StepsObject than a classic PageObject.

⚠️ The `DuckDuckGo` example is still very primitive and does not fully
represent such idea of "mixing levels" in practice. <!-- todo: add more examples -->

**Why.** Introducing a separate StepsObject layer for every page adds
indirection with little payoff in most projects. The merged approach
keeps tests more flat and the framework small.

**What we keep separate.** Control-level PageObjects (`TextInput`,
`Autocomplete`) remain distinct from page-level ones. Complex controls
have their own interaction choreography that does not belong inside a
page-level method.

**Where Playwright breaks SLAP.** Playwright's API is mostly
well-abstracted (locators, auto-waiting, web-first assertions), but
some parts expose browser mechanics: `locator.evaluate()`, element handles, and
the occasional need for explicit `locator.waitFor()` on actions that
lack built-in waiting. This project's conventions push these details into
the control/framework layer, keeping tests and page-level PageObjects clean.

<!-- todo: consider creating a custom Locator wrapper (similar to
     Selenide's SelenideElement / SeleneElement) that adds built-in
     waiting to all actions, fully encapsulating browser mechanics -->

## Choosing the right depth — audience matters

How many layers to introduce depends on who writes and maintains the
tests, and on the complexity of the application under test.

| Audience                                               | Recommended layers                                                         | Rationale                                                                                                                                                                                             |
| ------------------------------------------------------ | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Manual QAs / Junior AQAs** with complex scenarios    | Up to all four: StepsObjects + PageObjects + Controls + Framework wrappers | Maximum readability; tests read like requirements; complexity is fully hidden.                                                                                                                        |
| **SDETs** (typical case)                               | Three: combined Steps-PageObjects + Controls + Framework                   | The default for this project. Merging goals and actions into one class keeps things flat without losing expressiveness.                                                                               |
| **SDETs** with heavy combinatorial testing on controls | Two: Controls + Framework (used directly in tests)                         | When the number of action combinations is large, a Steps-PageObject per combination becomes unwieldy. Using Controls directly in tests sacrifices some readability but avoids a bloated middle layer. |
| **Developers** writing atomic tests                    | One or two: raw Playwright or Controls at most                             | Developers work close to HTML and are fluent in the low-level API. Extra abstraction layers can feel like overhead and slow them down.                                                                |
| **AI agents**                                          | See below                                                                  |                                                                                                                                                                                                       |

### A note on agents

<!-- todo: revisit as agentic workflows mature -->

AI agents are a new and rapidly evolving audience. Some observations:

- Agents benefit from **"easy to use correctly, hard to use
  incorrectly"** more than any human audience. A well-designed
  PageObject API with a small surface area guides the agent toward
  correct test code; a wide-open low-level API invites hallucinated
  selectors and fragile patterns.
- Agents handle repetition well (generating similar tests is cheap),
  so the DRY argument for deep abstraction layers is weaker.
  But _consistency_ matters more — agents produce better results when
  the framework has one canonical way to do things.
- Agents can generate both test code _and_ PageObject code, so the
  cost of maintaining a PageObject layer is lower than for human-only
  teams.
- The **combined Steps-PageObject + Controls** approach (this
  project's default) seems like a reasonable starting point: it
  provides enough structure to guide the agent without so many layers
  that the agent gets confused about which layer to put code in.

The right answer likely depends on the agent's capabilities, the
project's maturity, and the team needs. Start with the project's default layering and
adjust based on observed agent behavior.

Consider answering the following questions to decide on the right layering for your project:

- Who triggers the agentic pipeline that includes test code generation?
- Who reviews the generated test code?

For example if main audience are developers, you may want to simply end with what they prefer.

## See also

- [PageObject pattern](./page-object-pattern.md) — how this project
  applies these levels in practice
- [Guiding principles](../guiding-principles.md) — SLAP, encapsulation,
  KISS, and "easy to use correctly"
- [Playwright ESLint rules](./playwright-eslint-rules.md) — how lint
  rules enforce level boundaries
