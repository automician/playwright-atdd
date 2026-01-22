import { test, beforeEach } from 'node:test'
import assert from 'node:assert'
import withEnvOverrides, { WithEnvOverrides } from './withEnvOverrides.js'

beforeEach(() => {
  delete process.env.foo
  delete process.env.bool_prop
  delete process.env.array_prop
  delete process.env.baseUrl
})

// todo: break down into smaller tests and make cleaner
test('should work', () => {
  process.env.foo = 'not-bar'
  assert.deepStrictEqual(withEnvOverrides({ foo: 'bar' }, { ignore: ['foo'] }), {
    foo: 'bar',
  })
  assert.deepStrictEqual(withEnvOverrides({ foo: 'bar' }), { foo: 'not-bar' })

  process.env.bool_prop = 'true'
  assert.deepStrictEqual(withEnvOverrides({ bool_prop: false }), { bool_prop: true })

  process.env.bool_prop = 'false'
  assert.deepStrictEqual(withEnvOverrides({ bool_prop: true }), { bool_prop: false })

  process.env.array_prop = '1,2,3'
  assert.deepStrictEqual(withEnvOverrides({ array_prop: [] }), {
    array_prop: ['1', '2', '3'],
  })
})

test('interpolates variables in string values from env', () => {
  process.env.baseUrl = 'https://feature-${CI_COMMIT_REF_SLUG}.example.com'

  const config = withEnvOverrides(
    { baseUrl: 'https://localhost' },
    { interpolate: { CI_COMMIT_REF_SLUG: 'example-feat-999' } },
  )

  assert.strictEqual(config.baseUrl, 'https://feature-example-feat-999.example.com')
})

// todo: kind of a "side effect" feature, but it is not useful much, no? maybe remove it?
test('interpolates variables in original string value when no env override', () => {
  const config = withEnvOverrides(
    { baseUrl: 'https://feature-${CI_COMMIT_REF_SLUG}.example.com' },
    { interpolate: { CI_COMMIT_REF_SLUG: 'example-feat-999' } },
  )

  assert.strictEqual(config.baseUrl, 'https://feature-example-feat-999.example.com')
})

test('interpolates multiple variables in string values', () => {
  process.env.baseUrl = 'https://${SUBDOMAIN}.${DOMAIN}.com'

  const config = withEnvOverrides(
    { baseUrl: 'https://localhost' },
    { interpolate: { SUBDOMAIN: 'api', DOMAIN: 'example' } },
  )

  assert.strictEqual(config.baseUrl, 'https://api.example.com')
})

test('leaves unmatched variables unchanged', () => {
  process.env.baseUrl = 'https://${KNOWN}.${UNKNOWN}.com'

  const config = withEnvOverrides(
    { baseUrl: 'https://localhost' },
    { interpolate: { KNOWN: 'api' } },
  )

  assert.strictEqual(config.baseUrl, 'https://api.${UNKNOWN}.com')
})

test('WithEnvOverrides factory supports interpolate option', () => {
  process.env.baseUrl = 'https://feature-${CI_COMMIT_REF_SLUG}.example.com'

  const withOverrides = WithEnvOverrides({
    interpolate: { CI_COMMIT_REF_SLUG: 'example-feat-999' },
  })
  const config = withOverrides({ baseUrl: 'https://localhost' })

  assert.strictEqual(config.baseUrl, 'https://feature-example-feat-999.example.com')
})

test('does not interpolate non-string values', () => {
  process.env.bool_prop = 'true'

  const config = withEnvOverrides(
    { bool_prop: false },
    { interpolate: { SOME_VAR: 'value' } },
  )

  assert.strictEqual(config.bool_prop, true)
})

test('empty interpolate object does not affect string values', () => {
  process.env.baseUrl = 'https://feature-${CI_COMMIT_REF_SLUG}.example.com'

  const config = withEnvOverrides({ baseUrl: 'https://localhost' }, { interpolate: {} })

  assert.strictEqual(
    config.baseUrl,
    'https://feature-${CI_COMMIT_REF_SLUG}.example.com',
  )
})
