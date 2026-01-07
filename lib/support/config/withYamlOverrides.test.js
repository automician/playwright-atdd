import { test, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import withYamlOverrides, { WithYamlOverrides } from './withYamlOverrides.js'

let tempDir
let tempFile

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yaml-test-'))
  tempFile = path.join(tempDir, 'config.yaml')
})

afterEach(() => {
  fs.rmSync(tempDir, { recursive: true, force: true })
})

const writeYaml = content => {
  fs.writeFileSync(tempFile, content, 'utf8')
}

test('overrides string property from YAML', () => {
  writeYaml(`
baseUrl: https://staging.example.com
`)
  const config = withYamlOverrides(
    { baseUrl: 'https://localhost:3000' },
    { file: tempFile },
  )
  assert.strictEqual(config.baseUrl, 'https://staging.example.com')
})

test('overrides number property from YAML', () => {
  writeYaml(`
timeout: 5000
`)

  const config = withYamlOverrides({ timeout: 3000 }, { file: tempFile })

  assert.strictEqual(config.timeout, 5000)
})

test('overrides boolean property from YAML', () => {
  writeYaml(`
headless: false
`)

  const config = withYamlOverrides({ headless: true }, { file: tempFile })

  assert.strictEqual(config.headless, false)
})

test('overrides array property from YAML', () => {
  writeYaml(`
browsers:
  - chrome
  - firefox
`)

  const config = withYamlOverrides({ browsers: ['safari'] }, { file: tempFile })

  assert.deepStrictEqual(config.browsers, ['chrome', 'firefox'])
})

test('does not override property not present in YAML', () => {
  writeYaml(`
other: value
`)

  const config = withYamlOverrides({ baseUrl: 'https://localhost' }, { file: tempFile })

  assert.strictEqual(config.baseUrl, 'https://localhost')
})

test('does not add properties from YAML that are not in original object', () => {
  writeYaml(`
baseUrl: https://staging.example.com
extraProp: should-not-appear
`)

  const config = withYamlOverrides({ baseUrl: 'https://localhost' }, { file: tempFile })

  assert.strictEqual(config.baseUrl, 'https://staging.example.com')
  assert.strictEqual(config['extraProp'], undefined)
})

test('respects ignore option with string', () => {
  writeYaml(`
baseUrl: https://staging.example.com
password: secret123
`)

  const config = withYamlOverrides(
    { baseUrl: 'https://localhost', password: 'default' },
    { file: tempFile, ignore: ['password'] },
  )

  assert.strictEqual(config.baseUrl, 'https://staging.example.com')
  assert.strictEqual(config.password, 'default')
})

test('respects ignore option with RegExp', () => {
  writeYaml(`
apiKey: new-key
secretToken: new-token
baseUrl: https://staging.example.com
`)

  const config = withYamlOverrides(
    { apiKey: 'old-key', secretToken: 'old-token', baseUrl: 'https://localhost' },
    { file: tempFile, ignore: [/secret/i] },
  )

  assert.strictEqual(config.apiKey, 'new-key')
  assert.strictEqual(config.secretToken, 'old-token')
  assert.strictEqual(config.baseUrl, 'https://staging.example.com')
})

test('supports nested path in YAML (dot-notation)', () => {
  writeYaml(`
environments:
  staging:
    baseUrl: https://staging.example.com
    timeout: 10000
  production:
    baseUrl: https://example.com
`)

  const config = withYamlOverrides(
    { baseUrl: 'https://localhost', timeout: 3000 },
    { file: tempFile, path: 'environments.staging' },
  )

  assert.strictEqual(config.baseUrl, 'https://staging.example.com')
  assert.strictEqual(config.timeout, 10000)
})

test('supports nested path in YAML (array notation)', () => {
  writeYaml(`
environments:
  staging:
    baseUrl: https://staging.example.com
    timeout: 10000
  production:
    baseUrl: https://example.com
`)

  const config = withYamlOverrides(
    { baseUrl: 'https://localhost', timeout: 3000 },
    { file: tempFile, path: ['environments', 'staging'] },
  )

  assert.strictEqual(config.baseUrl, 'https://staging.example.com')
  assert.strictEqual(config.timeout, 10000)
})

test('throws TypeError on type mismatch - string vs number', () => {
  writeYaml(`
timeout: "not-a-number"
`)

  const config = withYamlOverrides({ timeout: 3000 }, { file: tempFile })

  assert.throws(() => config.timeout, {
    name: 'TypeError',
    message:
      'Type mismatch for property "timeout": expected number, got string from YAML',
  })
})

test('throws TypeError on type mismatch - boolean vs string', () => {
  writeYaml(`
headless: "true"
`)

  const config = withYamlOverrides({ headless: true }, { file: tempFile })

  assert.throws(() => config.headless, {
    name: 'TypeError',
    message:
      'Type mismatch for property "headless": expected boolean, got string from YAML',
  })
})

test('throws TypeError on type mismatch - array vs string', () => {
  writeYaml(`
browsers: "chrome,firefox"
`)

  const config = withYamlOverrides({ browsers: ['safari'] }, { file: tempFile })

  assert.throws(() => config.browsers, {
    name: 'TypeError',
    message:
      'Type mismatch for property "browsers": expected array, got string from YAML',
  })
})

test('WithYamlOverrides.from factory works', () => {
  writeYaml(`
environments:
  staging:
    baseUrl: https://staging.example.com
`)

  const withStagingOverrides = WithYamlOverrides.from(tempFile, {
    path: 'environments.staging',
  })
  const config = withStagingOverrides({ baseUrl: 'https://localhost' })

  assert.strictEqual(config.baseUrl, 'https://staging.example.com')
})

test('WithYamlOverrides.from factory supports ignore option', () => {
  writeYaml(`
baseUrl: https://staging.example.com
password: secret
`)

  const withOverrides = WithYamlOverrides.from(tempFile, { ignore: ['password'] })
  const config = withOverrides({ baseUrl: 'https://localhost', password: 'default' })

  assert.strictEqual(config.baseUrl, 'https://staging.example.com')
  assert.strictEqual(config.password, 'default')
})

test('handles empty path (root level)', () => {
  writeYaml(`
baseUrl: https://example.com
`)

  const config = withYamlOverrides(
    { baseUrl: 'https://localhost' },
    { file: tempFile, path: '' },
  )

  assert.strictEqual(config.baseUrl, 'https://example.com')
})

test('handles non-existent path gracefully', () => {
  writeYaml(`
other:
  nested: value
`)

  const config = withYamlOverrides(
    { baseUrl: 'https://localhost' },
    { file: tempFile, path: 'environments.staging' },
  )

  assert.strictEqual(config.baseUrl, 'https://localhost')
})
