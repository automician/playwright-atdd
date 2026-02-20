import { WithSteps } from '../support/playwright/reporting/steps.proxy.js'
import { Marker } from '../support/common/object-utils/its.js'
import { config } from '../../project.config.js'
import { PageContext } from './PageContext.ts'

/** Playwright doesn't export Page/Browser/etc. as runtime classes,
 *  so we detect them by constructor name instead of instanceof. */
const playwrightInfrastructure = new Set(['Page', 'Browser', 'BrowserContext'])

export default WithSteps({
  ignoreNonAsync: true,
  humanizeContext: config.humanizeContext,
  humanizeStepNames: config.humanizeStepNames,
  parsedOptions: {
    skip: ({ key, value }) => {
      if (key.startsWith('_')) return true
      if (value === Marker.inaccessible || value === Marker.circular) return true
      if (value instanceof PageContext) return true
      if (
        value !== null &&
        typeof value === 'object' &&
        playwrightInfrastructure.has(value.constructor?.name)
      )
        return true
      if (typeof value === 'function') return true
      if (
        value !== null &&
        typeof value === 'object' &&
        value.constructor?.name === 'Locator'
      )
        return 'toString'
      return false
    },
  },
})
