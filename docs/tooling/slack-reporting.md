# Slack reporting

## Package

[playwright-slack-report](https://github.com/ryanrosello-og/playwright-slack-report) --
sends test results to Slack channels after a Playwright test run.

## Setup

1. Create a Slack App at <https://api.slack.com/apps>
2. Add the following OAuth scopes: `chat:write`, `chat:write.public`
3. Install the app to your slack workspace and copy the Bot User OAuth Token
4. Invite the bot to your target channel(s)

## Environment variables

- **`slackOAuthToken`** (required) -- your Slack Bot User OAuth Token
  (starts with `xoxb-`)
- **`channelsString`** (optional) -- comma-separated list of channels
  to post to (default: `pw-tests`)
- **`CI_RUN_URL`** (optional) -- link to the CI run for reference
  in the Slack message (should be set automatically by gitlab based CI/CD pipeline)

Environment variables can be set via `.env` file or directly in the shell.

## Usage with explicitly set environment variables per run

```sh
slackOAuthToken=xoxb-... channelsString=pw-tests,ci pnpm exec playwright test
```

The reporter is conditionally enabled only when `slackOAuthToken` is set.

## How it's wired

In `playwright.config.js`, the Slack reporter is conditionally spread
into the `reporter` array:

```js
reporter: [
  ['list', { printSteps: false }],
  ['html', { open: 'always', noSnippets: true }],
  ...(project.config.slackOAuthToken
    ? [[
        './node_modules/playwright-slack-report/dist/src/SlackReporter.js',
        {
          channels: project.config.channels(),
          slackOAuthToken: project.config.slackOAuthToken,
          sendResults: 'always',
          maxNumberOfFailuresToShow: 10,
          showInThread: true,
          slackLogLevel: project.config.slackLogLevel,
          meta: [{ key: 'Run', value: process.env.CI_RUN_URL ?? 'Local run' }],
        },
      ]]
    : []),
],
```

When `slackOAuthToken` is empty (the default), the spread produces
an empty array, so no Slack reporter is registered.

## See also

- [Project configuration](../practices/project-configuration.md) --
  how `slackOAuthToken` and other settings are managed
