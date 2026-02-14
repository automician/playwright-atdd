# Demo of applying App Manager pattern and Steps proxy to playwright-based PageObjects

## TODOs

- [ ] ensure markdown formatting is counted

## Patterns & Techniques covered

- PageObject implementation...
  - more or less standard in context of technical implementation
    - based on page locators defined in the constructor
  - where methods are considered to be a higher-level user-steps
    - hence also covering "assertion-steps" (i.e. it's not an assertion-free PageObject)
    - what makes such implementation to look more like a StepsObject than PageObject :D
  - applied to both pages and controls (like TextInput)
- An ApplicationManager as one entry point to "pages" PageObjects (find it explained in [«Selenides for PageObjects Tutorial»](https://autotest.how/selenides-for-page-objects-tutorial-md))
  - with a corresponding playwright fixture to simplify reuse in tests
- Proxy-based wrapper around playwright test.step – to be applied on an object level to log all its methods calls (excluding `toString` and the methods named with `_` or `$` prefix, and non-async methods on `{ignoreNonAsync: true}` options arg set)
  - allowing to report the corresponding PageObject steps
  - with actual application as `return withSteps(this)` last line in the PageObject constructor
  - supporting "humanized step names" (words separated with spaces instead of camelCase)
- AAA pattern of BDD style reported steps – GIVEN/WHEN/THEN over Arrange/Act/Assert
- debug logging with [debug](https://www.npmjs.com/package/debug) package
  - Prefix your calls with `DEBUG=support:*` to show debug logs for all "support:"-prefixed logs when running from shell
- project configuration with smart overrides:
  - from environment variables via custom [withEnvOverrides](lib/support/config/withEnvOverrides.js) implementation
  - dotenv files support via [dotenvx](https://www.npmjs.com/package/dotenvx)
  - from YAML files support via [js-yaml](https://www.npmjs.com/package/js-yaml) + custom [withYmlOverrides](lib/support/config/withYmlOverrides.js) implementation
    - might be useful if key settings per environment are stored directly in CI yaml files like `gitlab-ci.yml`, though if possible I would prefer to use dotenv files only, that are also reused on CI if needed.
- basic reporting to slack via [playwright-slack-report](https://www.npmjs.com/package/playwright-slack-report)

Designed to work both as a standalone project and as a sub-package in a monorepo — the recommended way to set up a test automation framework in a modern agentic software development workflow. See [`docs/monorepo-setup.md`](docs/monorepo-setup.md) for a step-by-step integration guide.

The proxy application to report each step-method of a PageObject will be documented later in more details, stay tuned;).

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [pnpm](https://pnpm.io/installation) (`npm install -g pnpm` or via [Corepack](https://nodejs.org/api/corepack.html): `corepack enable`\*\*\*\*)

### Setup

```sh
pnpm install
pnpm install:playwright
```

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

## Other TODOs

- consider [zod](https://zod.dev/) for config schema validation
- add example of api test to highlight how <return> sub-step is rendered (for the method-step that makes request and returns response)
- refactor for project root based imports
- add project settings with dotenv overrides to allow customize steps behavior (like prefixes to ignore, etc.)
- model one more page (like playwright docs, etc.)
- document main examples of code + reports in README (with screenshots, like in [python-web-test project template README](https://github.com/yashaka/python-web-test?tab=readme-ov-file#details))
- add "human readable" rendering of steps, similar to [\_full_description_for helper implementation from Selene](https://github.com/yashaka/selene/blob/master/selene/common/_typing_functions.py#L119) that utilizes threading "macros" implementation in python (consider implementing similar in js)
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

- add API tests examples based on implemented helpers
- add `docs/fullstack-app-setup.md` guide for using this project in a standalone full-stack app (inspired by [epic-stack](https://github.com/epicweb-dev/epic-stack)'s `/tests` convention)
- restructure `lib/` for easier monorepo integration: move `lib/support/*` to separate `packages/` candidates, keeping `tooling/test-e2e` focused on test specs and page objects

## Slack Reporting

The project supports sending test results to Slack via [playwright-slack-report](https://github.com/ryanrosello-og/playwright-slack-report).

### Setup

1. Create a Slack App at <https://api.slack.com/apps>
2. Add the following OAuth scopes: `chat:write`, `chat:write.public`
3. Install the app to your workspace and copy the Bot User OAuth Token
4. Invite the bot to your target channel(s)

### Environment Variables

- **`slackOAuthToken`** (required) - Your Slack Bot User OAuth Token (starts with `xoxb-`)
- **`SLACK_CHANNELS`** (optional) - Comma-separated list of channels to post to (default: `pw-tests`)
- **`CI_RUN_URL`** (optional) - Link to the CI run for reference in the Slack message

### Usage

```bash
# Run tests with Slack reporting
slackOAuthToken=xoxb-... SLACK_CHANNELS=pw-tests,ci pnpm exec playwright test
```

The reporter is conditionally enabled only when `slackOAuthToken` is set.

## FAQ

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

## Using npm instead of pnpm

This project uses [pnpm](https://pnpm.io/) for stricter dependency resolution and faster installs. If you prefer npm:

1. `rm pnpm-lock.yaml && npm install`
2. In `package.json` scripts, replace `pnpm exec` with `npx` and `pnpm dlx` with `npx`

Or ask your AI assistant: _"Migrate this project from pnpm to npm"_

## Parked TODOs

- implement custom dotenv support
  - looks like dotenvx is enough
