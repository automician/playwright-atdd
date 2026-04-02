// @ts-check
import { defineConfig, devices } from '@playwright/test'
import { project } from './project.config.js'

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: project.config.testDir,
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: project.config.retries,
  /* Opt out of parallel tests on CI. */
  workers: project.config.workers,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['list', { printSteps: project.config.reporterListPrintSteps }],
    [
      'html',
      {
        open: project.config.reporterOpen,
        port: 9324,
        // an important option for "withSteps" behavior,
        // to remove boilerplate code from the report
        noSnippets: true,
      },
    ],
    ...(project.config.slackOAuthToken ?
      /** @type {import('@playwright/test').ReporterDescription[]} */ ([
        [
          './node_modules/playwright-slack-report/dist/src/SlackReporter.js',
          {
            channels: project.config.channels(),
            slackOAuthToken: project.config.slackOAuthToken,
            sendResults: 'always', // "always" , "on-failure", "off"
            maxNumberOfFailuresToShow: 10,
            showInThread: true,
            slackLogLevel: project.config.slackLogLevel,
            meta: [
              {
                key: 'Run',
                value: process.env.CI_RUN_URL ?? 'Local run',
              },
            ],
          },
        ],
      ])
    : []),
  ],

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    // baseURL: 'http://127.0.0.1:3000',
    headless: project.config.headless,
    actionTimeout: project.config.actionTimeout,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    // trace: 'on-first-retry',
    trace: {
      mode: 'retain-on-failure',
    },
    video: {
      mode: 'retain-on-failure',
    },
  },
  expect: {
    timeout: project.config.expectTimeout,
    toPass: {
      timeout: project.config.expectToPassTimeout, // mostly used for API tests polling, that's why it's less than the timeout above
      // defines the actual polling intervals in the exact amount specified in the array:
      intervals: project.config.expectToPassIntervals,
    },
  },
  timeout: project.config.timeout,

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://127.0.0.1:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
})
