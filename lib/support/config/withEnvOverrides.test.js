import { test } from 'node:test'
import assert from 'node:assert'
import withEnvOverrides from './withEnvOverrides.js'

// TODO: break down into smaller tests and make cleaner
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
