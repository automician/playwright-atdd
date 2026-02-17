/**
 * Converts code identifiers (camelCase, PascalCase, snake_case, UPPER_SNAKE_CASE)
 * to human readable format.
 * Abbreviations of 2+ uppercase letters are preserved unless UPPER_SNAKE_CASE.
 *
 * @param {string | null | undefined} identifier - The identifier to humanize
 * @param {Object} [options] - Options
 * @param {boolean} [options.capitalize=true] - Whether to capitalize the first letter
 * @returns {string} Human readable string
 */
export default function humanizeIdentifier(identifier, { capitalize = true } = {}) {
  if (!identifier) {
    return ''
  }

  // Check if identifier is UPPER_SNAKE_CASE (all uppercase/digits with underscores, no lowercase)
  const isUpperSnakeCase = /^[A-Z][A-Z0-9_]*$/.test(identifier)

  const spaced = identifier
    // Insert space before uppercase letters in camelCase/PascalCase
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    // Insert space between consecutive uppercase and following lowercase (e.g., "XMLParser" -> "XML Parser")
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    // Replace underscores with spaces
    .replace(/_/g, ' ')
    // Normalize multiple spaces to single space
    .replace(/\s+/g, ' ')
    // Trim leading/trailing spaces
    .trim()

  // Process words: preserve abbreviations (2+ uppercase) unless UPPER_SNAKE_CASE
  const result = spaced
    .split(' ')
    .map(word => {
      // For UPPER_SNAKE_CASE, lowercase everything
      if (isUpperSnakeCase) {
        return word.toLowerCase()
      }
      // Preserve abbreviations: 2+ consecutive uppercase letters
      if (word.length >= 2 && /^[A-Z]+$/.test(word)) {
        return word
      }
      // Lowercase everything else
      return word.toLowerCase()
    })
    .join(' ')

  if (capitalize && result.length > 0) {
    return result.charAt(0).toUpperCase() + result.slice(1)
  }

  return result
}
