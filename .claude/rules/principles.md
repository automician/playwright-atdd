# Guiding principles – extended reference

The terse list in CLAUDE.md is the actionable version.
This file provides deeper context and inspirational sources.

## Inspirations

- [The Zen of Python (PEP 20)](https://peps.python.org/pep-0020/) –
  many of its aphorisms apply directly:
  "Explicit is better than implicit",
  "Flat is better than nested",
  "In the face of ambiguity, refuse the temptation to guess",
  "Special cases aren't special enough to break the rules.
  Although practicality beats purity",
  "There should be one – and preferably only one – obvious way to do it".
- [Most valuable software development principles – Enterprise Craftsmanship](https://enterprisecraftsmanship.com/posts/most-valuable-software-development-principles/) –
  SRP, composition, coupling/cohesion, YAGNI, and more.
- [Simple Made Easy – Rich Hickey](https://www.infoq.com/presentations/Simple-Made-Easy/) –
  the distinction between "simple" (few interleaved concerns) and "easy"
  (close at hand / familiar). Prefer simple; make it easy through good design.

## Principle details

### KISS & "Simple Made Easy"

Keep solutions as simple as the problem allows.
"Simple" ≠ "easy": a familiar but tangled approach is easy, not simple.
Favour designs with fewer interleaved concerns.

### Explicit is better than implicit

Avoid magic. If behaviour depends on a convention or side effect,
make it visible at the call site or in the signature.

### Flat is better than nested

Prefer flat module structures and shallow call chains where possible.
Deep nesting obscures intent and increases coupling.

### Self-Documented Code

Code should read as closely to prose as the language allows.
When a name or structure is ambiguous, refactor for clarity
rather than adding a comment.
"In the face of ambiguity, refuse the temptation to guess."

### Ubiquitous Language

Use the same term for the same concept everywhere – code, tests, docs, env vars.
This extends to casing: a camelCase config key stays camelCase even as an
environment variable (`process.env.mySetting`, not `process.env.MY_SETTING`).

### Loose coupling, high cohesion & colocation

Modules that change together should live together.
Modules that don't need each other should not know about each other.

### Abstractions before DRY

Create abstractions first for self-documentation and composition.
Apply DRY only where there is a high probability of co-change –
premature DRY creates accidental coupling.

### YAGNI

Do not build what is not needed yet.
Speculative abstraction is worse than a little duplication.

### "Only one way" where possible

Strive for one canonical way to do something, but accept that
this project serves multiple clients with different needs,
so some helpers exist in alternative flavours.

### Single Responsibility Principle

Each module / function / class should have one reason to change.

### Functional style

Prefer functional programming style over imperative where possible.
Seek referential transparency: given the same inputs, a function
should always return the same output without observable side effects.

### Composition over inheritance

Always use composition for has-a relationships.
Consider inheritance for is-a only when the practical win is large.
"Special cases aren't special enough to break the rules.
Although practicality beats purity."

### Unit testing – classical (Detroit) school

A "unit" is a functionally useful chunk of code, not necessarily
a single function or method.
Keep in-process collaborators real.
For out-of-process dependencies, distinguish
**managed** (fully controlled by the app, e.g. its own database) from
**unmanaged** (not controlled, e.g. third-party APIs, SMTP, message buses).
Use real instances of managed dependencies; replace only unmanaged ones
with test doubles.
See [When to Mock](https://enterprisecraftsmanship.com/posts/when-to-mock/)
for the full rationale.
