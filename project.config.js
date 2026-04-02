import withEnvOverrides from './lib/support/config/withEnvOverrides.js'
import findFileWalkingToRoot from './lib/support/config/findFileWalkingToRoot.js'
import dotenvx from '@dotenvx/dotenvx'

const defaults = {
  apiBaseURL: 'https://api.example.com',
  /* ⬇️ Model related⬇️ */
  locale: 'en-US',
  /* ⬇️ playwright ⬇️ */
  timeout: 60 * 1000,
  expectTimeout: 4 * 1000,
  expectToPassTimeout: 2 * 1000,
  expectToPassIntervals: [100, 250, 500, 750],
  actionTimeout: 4 * 1000,
  testDir: '__tests__/',
  testMatch: /.*(test|spec).(js|ts|mjs)/,
  headless: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  trace: 'on-first-retry', // "on-first-retry" | "off" | "on" | "retain-on-failure" | "on-all-retries" | "retain-on-first-failure"
  workers: process.env.CI ? 1 : undefined,
  reporterListPrintSteps: false,
  /* ⬇️ html report ⬇️ */
  /** @type {"on-failure" | "always" | "never" | undefined} */
  reporterOpen: 'on-failure',
  /* ⬇️ reporting steps ⬇️ */
  cancelWithSteps: false,
  enableMatcherSteps: true,
  humanizeContext: true,
  humanizeStepNames: true,
  /* ⬇️ slack reporting ⬇️ */
  slackOAuthToken: '',
  // TODO: consider renaming `channelsString` to `slackChannelsString` and `channels()`
  //       to `slackChannels()` in `project.config.js`
  //       (and environment variables correspondingly)
  channelsString: 'pw-tests', // comma-separated list of channels to post to
  channels() {
    return this.channelsString ? this.channelsString.split(',') : []
  },
  slackLogLevel: 'info', // "error", "warn", "info", "debug"
  /* ⬇️ just for example purposes (don't store locators in config on a real project❗️) ⬇️ */
  searchEngineUrl: '',
  searchEngineQuerySelector: '',
  searchEngineResultSelector: '',
  searchEngineResultHeaderSelector: '',
  searchEngineResultLinkSelector: '',
}

const shouldDebugDotenvx = process.env.DEBUG?.includes('dotenvx') ?? false

// load environment variables from .env file if exists
dotenvx.config({
  path: findFileWalkingToRoot('.env'),
  debug: shouldDebugDotenvx,
})

export const config = withEnvOverrides(
  defaults,
  // {
  //   ignore: ['someSettingToIgnore'],
  // },
)

/**
 * An alias for cases where there are other configs, like playwrightConfig,
 * so when used in same file it would be easier to distinguish between them
 */
export const project = {
  config,
}
