import withEnvOverrides from './lib/support/config/withEnvOverrides.js'
import findFileWalkingToRoot from './lib/support/config/findFileWalkingToRoot.js'
import dotenvx from '@dotenvx/dotenvx'

// load environment variables from .env file if exists
dotenvx.config({ path: findFileWalkingToRoot('.env') })

export const config = withEnvOverrides(
  {
    apiBaseURL: 'https://api.example.com',
    /* ⬇️ reporting ⬇️ */
    cancelWithSteps: false,
    enableMatcherSteps: true,
    humanizeContext: true,
    humanizeStepNames: true,
    /* ⬇️ just for example purposes (don't store locators in config on a real project❗️) ⬇️ */
    searchEngineUrl: '',
    searchEngineQuerySelector: '',
    searchEngineResultSelector: '',
    searchEngineResultHeaderSelector: '',
    searchEngineResultLinkSelector: '',
    /* ⬇️ reporting ⬇️ */
    slackOAuthToken: '',
    channelsString: 'pw-tests', // comma-separated list of channels to post to
    channels() {
      return this.channelsString ? this.channelsString.split(',') : []
    },
    slackLogLevel: 'info', // "error", "warn", "info", "debug"
  },
  // {
  //   ignore: ['someSettingToIgnore'],
  // },
)
