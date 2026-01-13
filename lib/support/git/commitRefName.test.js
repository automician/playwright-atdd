import { test } from 'node:test'
import assert from 'node:assert'
import commitRefName from './commitRefName.js'

test('returns current branch name as non-empty string', () => {
  const result = commitRefName()
  assert.ok(typeof result === 'string')
  assert.ok(result.length > 0, 'Expected non-empty branch name')
})

test('returns string without newlines', () => {
  const result = commitRefName()
  assert.ok(!result.includes('\n'))
})
