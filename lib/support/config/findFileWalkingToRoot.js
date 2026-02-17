import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
// @ts-ignore — debug has no bundled types
import Debug from 'debug'

/**
 * Search in increasingly higher folders for the given file
 * Returns path to the file if found, or an empty string otherwise
 * @param {string} filename
 * @param {{ raiseErrorIfNotFound?: boolean, useCwd?: boolean }} [options]
 * @returns {string}
 */
export default function findFileWalkingToRoot(
  filename,
  { raiseErrorIfNotFound = false, useCwd = false } = {},
) {
  const debug = Debug(`support: ${findFileWalkingToRoot.name}`)

  /** @param {string} currentPath @returns {Generator<string>} */
  function* walkToRoot(currentPath) {
    yield currentPath
    const parentPath = path.dirname(currentPath)
    if (parentPath !== currentPath) {
      yield* walkToRoot(parentPath)
    }
  }

  /** @param {string} filePath */
  function isFileOrFifo(filePath) {
    try {
      const stats = fs.statSync(filePath)
      return stats.isFile() || stats.isFIFO()
    } catch {
      return false
    }
  }

  let startPath
  if (useCwd) {
    startPath = process.cwd()
  } else {
    // Get the directory of the calling module
    // In ES modules, we use import.meta.url equivalent via stack trace
    const originalPrepareStackTrace = Error.prepareStackTrace
    Error.prepareStackTrace = (_, stack) => stack
    const stack = new Error().stack
    Error.prepareStackTrace = originalPrepareStackTrace

    // Find the first caller that is not this file
    const thisFile = fileURLToPath(import.meta.url)
    let callerFile = thisFile
    for (const callSite of /** @type {NodeJS.CallSite[]} */ (
      /** @type {unknown} */ (stack)
    )) {
      const fileName = callSite.getFileName()
      if (fileName && fileName !== thisFile && !fileName.startsWith('node:')) {
        callerFile = fileName
        break
      }
    }

    // Handle file:// URLs
    if (callerFile.startsWith('file://')) {
      callerFile = fileURLToPath(callerFile)
    }

    startPath = path.dirname(path.resolve(callerFile))
  }

  debug(
    `filename: ${filename}, useCwd: ${useCwd}, raiseErrorIfNotFound: ${raiseErrorIfNotFound}`,
  )
  debug(`Starting search from ${startPath}`)
  for (const dirname of walkToRoot(startPath)) {
    const checkPath = path.join(dirname, filename)
    debug(`Checking ${checkPath}`)
    if (isFileOrFifo(checkPath)) {
      debug(`Found ${checkPath}`)
      return checkPath
    }
  }

  if (raiseErrorIfNotFound) {
    throw new Error('File not found')
  }

  debug('File not found')
  return ''
}
