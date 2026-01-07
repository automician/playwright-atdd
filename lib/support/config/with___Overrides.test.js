import { test, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import withYamlOverrides, { WithYamlOverrides } from './withYamlOverrides.js'

let tempDir
let tempYaml

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yaml-test-'))
  tempYaml = path.join(tempDir, 'config.yaml')
})

afterEach(() => {
  fs.rmSync(tempDir, { recursive: true, force: true })
})

const writeTempYaml = content => {
  fs.writeFileSync(tempYaml, content, 'utf8')
}

test('env overrides yaml once env var is present', async () => {
  // GIVEN
  writeTempYaml(`
environments:
  staging:
    baseUrl: https://from-yaml.example.com
    timeout: 10000
  production:
    baseUrl: https://example.com
`)
  const withYamlOverrides = WithYamlOverrides.from(tempYaml, {
    path: 'environments.staging',
  })
  const withEnvOverrides = (await import('./withEnvOverrides.js')).default

  // WHEN
  const configWithYamlOverrides = withEnvOverrides(
    withYamlOverrides({ baseUrl: 'https://localhost' }),
  )

  // THEN
  assert.strictEqual(configWithYamlOverrides.baseUrl, 'https://from-yaml.example.com')
  assert.strictEqual(configWithYamlOverrides['timeout'], undefined)

  // WHEN
  process.env['baseUrl'] = 'https://from-env.example.com'
  const configEnvOverrides = withEnvOverrides(
    withYamlOverrides({ baseUrl: 'https://localhost' }),
  )

  // THEN
  assert.strictEqual(configEnvOverrides.baseUrl, 'https://from-env.example.com')
})
