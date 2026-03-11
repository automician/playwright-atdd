# Project configuration

## Architecture

A single `project.config.js` at the project root defines all settings
with sensible defaults. Overrides are applied via a layered proxy chain --
no values are copied or merged; each layer intercepts property access
at read time.

## Override layers

Listed in reverse priority order (lowest wins):

### 1. Defaults

Defined in the `defaults` object at the top of `project.config.js`:

```js
const defaults = {
  apiBaseURL: 'https://api.example.com',
  // ...
}
```

### 2. Dotenv files

Loaded via [`@dotenvx/dotenvx`](https://www.npmjs.com/package/dotenvx)
before any other overrides run:

```js
import dotenvx from '@dotenvx/dotenvx'
dotenvx.config({ path: findFileWalkingToRoot('.env') })
```

`findFileWalkingToRoot('.env')` walks up the directory tree from the
calling file's location to find the nearest `.env` file. This makes
the config work both when the project is standalone and when it's a
sub-package in a monorepo.

> `lib/support/config/findFileWalkingToRoot.js`

### 3. Environment variables (`withEnvOverrides`)

> `lib/support/config/withEnvOverrides.js`

Wraps a config object so that each property is overridden by the
environment variable **of the same name**:

```js
export const config = withEnvOverrides({
  defaults,
})
```

Type coercion is automatic based on the default value's type: <!--TODO: refactor parsing to use Zod package-->

| Default type | Env var parsing                          |
| ------------ | ---------------------------------------- |
| `string`     | Used as-is                               |
| `boolean`    | `/true/.test(envValue)`                  |
| `number`     | `Number(envValue)`                       |
| `array`      | `envValue.split(',').map(s => s.trim())` |

Options:

- `ignore` -- array of property names or patterns to skip
- `interpolate` -- map for `${VAR}` substitution in string values. Usually not needed together with `dotenvx`, because the latter – already supports `${VAR}` substitution for all values in `.env` that are unwrapped or wrapped in double quotes (wrapping env var value into single quotes like `ENV_VAR='https://${SUBDOMAIN}.example.com'` will not trigger dotenvx interpolation).

Factory form: `WithEnvOverrides(options)` returns a reusable decorator.

## Override layers candidates

There is an additional overriding logic to be considered – `withYmlOverrides`. It and `withEnvOverrides` are not mutually exclusive. You can use both of them together, or one of them, or none of them.

### YAML file overrides (`withYmlOverrides`)

> `lib/support/config/withYmlOverrides.js`

Overrides properties from a YAML file. Useful, for example, when key settings per environment are stored in CI YAML files (e.g. `.gitlab-ci.yml`) for some reason (⚠️ usually this is not the best choice, usually extracting them to the corresponding `.env.<environment>` files would be a better choice).

```js
import withYmlOverrides from './lib/support/config/withYmlOverrides.js'

const config = withYmlOverrides(baseConfig, {
  file: 'settings.yml',
  path: 'environments.staging', // dot-notation path to nested object
  ignore: ['internalSetting'],
  interpolate: { BASE: process.env.BASE_URL },
})
```

Type validation ensures YAML values match the original default's type.

Factory form: `WithYmlOverrides.from(file, options)` returns an overriding decorator wired up to the specific YAML file, so you can structure your config as follows:

```js
import WithYmlOverrides from './lib/support/config/withYmlOverrides.js'

const withGitlabCiOverrides = WithYmlOverrides.from('gitlab-ci.yml', {
  path: 'environments.staging',
  ignore: ['internalSetting'],
  interpolate: { BASE: process.env.BASE_URL },
})

const defaultConfig = {
  apiBaseURL: 'https://api.example.com',
}

export const config = withGitlabCiOverrides(defaultConfig)
```

## Ubiquitous naming convention

Config keys use **camelCase**, and environment variables use
**the same camelCase name** -- not `UPPER_SNAKE_CASE`:

```sh
# correct
apiBaseURL=https://staging.example.com pnpm test

# not used in this project
API_BASE_URL=https://staging.example.com pnpm test
```

This follows the project principle of
[ubiquitous language](https://github.com/yashaka/playwright-app-manager-with-steps-demo-js/blob/main/CLAUDE.md#guiding-principles):
the same term for the same concept everywhere.

## Full example

Find a full example in `project.config.js`.

## See also

- [Debug logging](../tooling/debug.md) --
  `DEBUG` env var for development-time logging
- [Slack reporting](../tooling/slack-reporting.md) --
  `slackOAuthToken` and related config keys
