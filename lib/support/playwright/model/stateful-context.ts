import * as fs from 'fs'
import type { Page, Browser, BrowserContext } from '@playwright/test'
import Debug from 'debug'

const debug = Debug('stateful-context')

export class StatefulContext {
  private constructor(public readonly context: BrowserContext) {}

  static async create({
    browser,
    storageState,
    initState = () => Promise.resolve(),
  }: {
    browser: Browser
    storageState: string
    initState?: (context: BrowserContext) => Promise<void>
  }): Promise<StatefulContext> {
    const wasStateExpired = isStateFileExpired(storageState)
    const context =
      wasStateExpired ?
        await browser.newContext()
      : await browser.newContext({ storageState })

    if (wasStateExpired) {
      debug('Initializing state...')
      await initState(context)
      debug('Storing new state to storage state file: ', storageState)
      await context.storageState({ path: storageState })
    }

    return new StatefulContext(context)
  }

  static async createWithApp<T>({
    browser,
    storageState,
    initApp,
    initState = () => Promise.resolve(),
  }: {
    browser: Browser
    storageState: string
    initApp: (context: BrowserContext) => Promise<T>
    initState?: (app: T) => Promise<void>
  }): Promise<{ context: StatefulContext; app: T }> {
    const wasStateExpired = isStateFileExpired(storageState)
    const browserContext =
      wasStateExpired ?
        await browser.newContext()
      : await browser.newContext({ storageState })

    const app = await initApp(browserContext)

    if (wasStateExpired) {
      debug('Initializing state...')
      await initState(app)
      debug('Storing new state to storage state file: ', storageState)
      await browserContext.storageState({ path: storageState })
    }

    return { context: new StatefulContext(browserContext), app }
  }

  get pages() {
    return this.context.pages()
  }

  async newPage(): Promise<Page> {
    return await this.context.newPage()
  }

  async close() {
    await this.context.close()
  }
}

function isStateFileExpired(filePath: string): boolean {
  debug('Checking if state file is expired: ', filePath)

  if (!fs.existsSync(filePath)) {
    debug('State file does not exist: ', filePath)
    return true
  }

  const stats = fs.statSync(filePath)
  const now = new Date()
  const fileTime = new Date(stats.mtime)
  // TODO: refactor to be parametrized and configurable
  const ONE_WEEK = 1 * 24 * 60 * 60 * 1000
  const diff = now.getTime() - fileTime.getTime()

  const isExpired = diff > ONE_WEEK

  debug(`State file is ${isExpired ? '' : 'not '}expired`)

  return isExpired
}
