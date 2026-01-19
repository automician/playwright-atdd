import { execSync } from 'node:child_process'

/**
 * Returns the current Git user name from config.
 * @returns {string} The Git user name
 */
export default function gitUserName() {
  try {
    return execSync('git config user.name', {
      encoding: 'utf-8',
    }).trim()
  } catch {
    return ''
  }
}
