# Demo of applying App Manager pattern and Steps proxy to playwright-based PageObjects

Patterns & Techniques covered:

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

The proxy application to report each step-method of a PageObject will be documented later in more details, stay tuned;).

## Other TODOs

- add example of api test to highlight how <return> sub-step is rendered (for the method-step that makes request and returns response)
- refactor for project root based imports
- add installation instructions to README
- add project settings with dotenv overrides to allow customize steps behavior (like prefixes to ignore, etc.)
- model one more page (like playwright docs, etc.)
- document main examples of code + reports in README (with screenshots, like in [python-web-test project template README](https://github.com/yashaka/python-web-test?tab=readme-ov-file#details))
- add "human readable" rendering of steps, similar to [_full_description_for helper implementation from Selene](https://github.com/yashaka/selene/blob/master/selene/common/_typing_functions.py#L119) that utilizes threading "macros" implementation in python (consider implementing similar in js)
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

## Parked TODOs

- implement custom dotenv support
  - looks like dotenvx is enough
