# Debug logging

## Package

[debug](https://www.npmjs.com/package/debug) -- lightweight, namespace-based
debug logging for Node.js.

## Usage in this project

Debug logging currently is used in infrastructure helpers (not in page objects or tests).

The current namespace pattern is `support:[ <moduleName>:][ <functionName>:]`:

```js
import Debug from 'debug'

const debug = Debug(`support: ${findFileWalkingToRoot.name}`)

// later:
debug(`filename: ${filename}, useCwd: ${useCwd}...`)
```

> See `lib/support/config/findFileWalkingToRoot.js` for a concrete example.

## Running with debug output

Enable all support-namespaced logs:

```sh
DEBUG=support:* pnpm test
```

Or narrow to a specific namespace:

```sh
DEBUG="support: findFileWalkingToRoot" pnpm test
```

Or use more than one namespace, e.g. with additional playwright namespace:

```sh
DEBUG="pw,support:*" pnpm test
```

Though dotenvx does not use debug package, this project has a workaround for it at `project.config.js`:

```js
shouldDebugDotenvx = process.env.DEBUG?.includes('dotenvx') ?? false

// so then...

dotenvx.config({ path: findFileWalkingToRoot('.env'), debug: shouldDebugDotenvx })
```

Thus, you can use it with dotenvx as follows (nested namespaces not supported, just use top-level `dotenvx`):

```sh
DEBUG="dotenvx,support:*" pnpm test
```

## When to add debug logging

Use it for operations that are hard to observe at runtime:

- File resolution and discovery
- Config loading and override application
- Other infrastructure concerns

Page objects and test files should not need debug logging --
the [Steps proxy](../practices/steps-proxy.md) and Playwright's
own reporting handle visibility there.
