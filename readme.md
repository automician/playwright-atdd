# Playwright-based End-to-End Testing Framework for Agentic AI Driven Web Development

An open-source showcase of how an End-to-End tests framework with Playwright may look,
doubling as a reusable "snippets" collection for Playwright-based test automation projects. Designed to work both as a standalone project and as a sub-package
in a monorepo — the recommended way to set up a test automation framework
in a modern agentic software development workflow. See [`docs/monorepo-setup.md`](docs/monorepo-setup.md) for a step-by-step integration guide.

## Patterns & Techniques covered

- **[PageObject pattern](docs/practices/page-object-pattern.md)** —
  locator-based page objects with methods as user-steps (including assertion-steps),
  applied to both pages and controls
- **[Application Manager pattern](docs/practices/application-manager-pattern.md)** —
  single entry point to page objects via a Playwright fixture
- **[Steps proxy](docs/practices/steps-proxy.md)** —
  Proxy-based automatic `test.step()` wrapping for all page object methods
- **Optional [BDD-style steps](docs/practices/bdd-style-steps.md)** —
  GIVEN / WHEN / THEN over Arrange / Act / Assert
- **[Project configuration](docs/practices/project-configuration.md)** —
  layered overrides from env vars, dotenv, and YAML files
- **[Debug logging](docs/tooling/debug.md)** —
  structured debug output via the `debug` package
- **[Slack reporting](docs/tooling/slack-reporting.md)** —
  test results to Slack via `playwright-slack-report`

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [pnpm](https://pnpm.io/installation) (`npm install -g pnpm` or via [Corepack](https://nodejs.org/api/corepack.html): `corepack enable`)

### Setup

```sh
pnpm install
pnpm install:playwright
```

### Slack Reporting Setup

See [`docs/tooling/slack-reporting.md`](docs/tooling/slack-reporting.md) for setup instructions.

### Running tests

```sh
# Run all Playwright tests
pnpm test

# Run a specific test file
pnpm test __tests__/duckduckgo.test.js

# Run unit tests colocated with helpers (uses node:test, not Playwright)
pnpm test:unit

# Show HTML report
pnpm exec playwright show-report
```

See [`docs/tooling/`](docs/tooling/) for rationale behind tooling choices (pnpm, Prettier, etc.).

## FAQ

### Can I use npm over pnpm and how?

This project uses [pnpm](https://pnpm.io/) for stricter dependency resolution and faster installs. If you prefer npm:

1. `rm pnpm-lock.yaml && npm install`
2. In `package.json` scripts, replace `pnpm exec` with `npx` and `pnpm dlx` with `npx` where appropriate

Or ask your AI assistant: _"Migrate this project from pnpm to npm"_

### I used this project as a template for my e2e tests package in a monorepo, but running from the monorepo root doesn't pick up the Playwright config. What's wrong?

Using this project as a monorepo sub-package is the intended setup for agentic software development workflows, where your test automation framework lives alongside the app code. The problem is likely with using `npx --prefix <your-e2e-package> playwright test` style of running tests from the monorepo root — Playwright may not find its config file this way. Try using idiomatic pnpm filtering instead:

```sh
pnpm -F '<your-e2e-package>' exec playwright test
```

Or add a convenience alias to your monorepo root `package.json`:

```json
"scripts": {
  "test:e2e": "pnpm -F '<your-e2e-package>' exec playwright test"
}
```

See [`docs/monorepo-setup.md`](docs/monorepo-setup.md) for the full integration guide and other common pitfalls.

## Project todos

- consider [zod](https://zod.dev/) for config schema validation
- add example of api test to highlight how <return> sub-step is rendered (for the method-step that makes request and returns response)
- refactor for project root based imports
- add project settings with dotenv overrides to allow customize steps behavior (like prefixes to ignore, etc.)
- model one more page (like playwright docs, etc.)
- add screenshots to [Steps Proxy](./docs/practices/steps-proxy.md) (with screenshots, like in [python-web-test project template README](https://github.com/yashaka/python-web-test?tab=readme-ov-file#details))
- consider implementing threading "macros" implementation to be then utilized in humanization logic of steps proxy
  - in python the implementation looks like

  ```python
  thread_last(
    full_name,
    (re.sub, r'([a-z0-9])([A-Z])', r'\1 \2'),
    (re.sub, r'(\w)\.(\w)', r'\1 \2'),
    (re.sub, r'(^_+|_+$)', ''),
    (re.sub, r'_+', ' '),
    (re.sub, r'(\s)+', r'\1'),
    str.lower,
  )
  ```

  - if ported straightforward to js it would look like:

  ```js
  threadLast(
    fullName,
    [String.prototype.replace, /([a-z0-9])([A-Z])/g, '$1 $2'],
    [String.prototype.replace, /(\w)\.(\w)/g, '$1 $2'],
    [String.prototype.replace, /(^_+|_+$)/g, ''],
    [String.prototype.replace, /_+/g, ' '],
    [String.prototype.replace, /(\s)+/g, '$1'],
    String.prototype.toLowerCase,
  )
  ```

  – that does not look concise enough:) so let's think on it a bit more...

- ensure Claude updates docs when code changes
- update the convention for exports in modules in regards of when function and it's Factory version is exported (the function should be exported as default, the factory as an export const)
- add API tests examples based on implemented helpers
- add `docs/fullstack-app-setup.md` guide for using this project in a standalone full-stack app (inspired by [epic-stack](https://github.com/epicweb-dev/epic-stack)'s `/tests` convention)
- restructure `lib/` for easier monorepo integration: move `lib/support/*` to separate `packages/` candidates, keeping `tooling/test-e2e` focused on test specs and page objects
- close gaps in docs (e.g. document custom matchers implementation)
- add more custom matchers (port latest selene matchers)
- consider implementing literate programming approach for the project, collocating docs even closer to the code – exactly in the code files. Then, the majority of `docs/*` won't be needed at all.
  - though some docs might be transformed directly to documented skills
