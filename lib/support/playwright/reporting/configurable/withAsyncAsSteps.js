import { WithSteps } from '../steps.proxy.js'
import { config } from '../../../../../project.config.js'

export default WithSteps({
  ignoreNonAsync: true,
  humanizeContext: config.humanizeContext,
  humanizeStepNames: config.humanizeStepNames,
})
