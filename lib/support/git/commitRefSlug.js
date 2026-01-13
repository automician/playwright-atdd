import commitRefName from './commitRefName.js'

/**
 * Returns CI_COMMIT_REF_NAME in lowercase, shortened to 63 bytes,
 * with everything except 0-9 and a-z replaced with -.
 * No leading/trailing -.
 * (equivalent to GitLab's CI_COMMIT_REF_SLUG)
 * @param {string} [refName] - Optional ref name to slugify (defaults to current branch)
 * @returns {string} The slugified ref name
 */
export default function commitRefSlug(refName) {
  const name = refName ?? commitRefName()

  if (!name) {
    return ''
  }

  return name
    .toLowerCase()
    .replace(/[^0-9a-z]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 63)
    .replace(/-$/, '')
}
