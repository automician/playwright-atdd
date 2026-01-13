import { execSync } from 'node:child_process'

/**
 * Returns the current branch or tag name (equivalent to GitLab's CI_COMMIT_REF_NAME).
 * @returns {string} The branch or tag name
 */
export default function commitRefName() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', {
      encoding: 'utf-8',
    }).trim()
  } catch {
    return ''
  }
}
