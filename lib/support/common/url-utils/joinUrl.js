/**
 * Safely joins a base URL with a path segment, preserving query params and hash.
 * Handles trailing/leading slashes automatically.
 *
 * @param {string} base - The base URL (may include query params and hash)
 * @param {string} path - The path segment to append
 * @param {Record<string, string>} [params] - Optional query params to add (undefined and '' values are skipped)
 * @returns {string} The joined URL
 *
 * @example
 * joinUrl('https://example.com/app', 'login')
 * // → 'https://example.com/app/login'
 *
 * @example
 * joinUrl('https://example.com/app?token=abc', '/login')
 * // → 'https://example.com/app/login?token=abc'
 *
 * @example
 * joinUrl('https://example.com/app', 'login', { foo: 'bar' })
 * // → 'https://example.com/app/login?foo=bar'
 */
// TODO: consider also accepting path as array of segments
export default function joinUrl(base, path, params) {
  const url = new URL(base)

  const basePath = url.pathname.endsWith('/') ? url.pathname : url.pathname + '/'
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path
  url.pathname = basePath + normalizedPath

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === '') continue
      url.searchParams.set(key, value)
    }
  }

  return url.href
}
