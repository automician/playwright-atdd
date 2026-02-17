import { test } from 'node:test'
import assert from 'node:assert'
import commitRefSlug from './commitRefSlug.js'

test('converts simple branch name to lowercase', () => {
  assert.strictEqual(commitRefSlug('Main'), 'main')
})

test('replaces slashes with dashes', () => {
  assert.strictEqual(commitRefSlug('feature/new-feature'), 'feature-new-feature')
})

test('replaces underscores with dashes', () => {
  assert.strictEqual(commitRefSlug('feature_branch'), 'feature-branch')
})

test('replaces multiple special characters with single dash', () => {
  assert.strictEqual(commitRefSlug('feature//branch'), 'feature-branch')
})

test('removes leading dashes', () => {
  assert.strictEqual(commitRefSlug('-feature'), 'feature')
})

test('removes trailing dashes', () => {
  assert.strictEqual(commitRefSlug('feature-'), 'feature')
})

test('handles complex branch names', () => {
  assert.strictEqual(
    commitRefSlug('feature/ABC-123_my-branch'),
    'feature-abc-123-my-branch',
  )
})

test('truncates to 63 bytes', () => {
  const longName = 'a'.repeat(100)
  assert.strictEqual(commitRefSlug(longName).length, 63)
})

test('removes trailing dash after truncation', () => {
  const name = 'a'.repeat(62) + '-b'
  const result = commitRefSlug(name)
  assert.ok(!result.endsWith('-'))
  assert.ok(result.length <= 63)
})

test('returns empty string for empty input', () => {
  assert.strictEqual(commitRefSlug(''), '')
})

test('falls back to current branch for null input', () => {
  const result = commitRefSlug(/** @type {any} */ (null))
  assert.ok(typeof result === 'string')
  assert.ok(result.length > 0)
})

test('falls back to current branch for undefined input', () => {
  const result = commitRefSlug(undefined)
  assert.ok(typeof result === 'string')
  assert.ok(result.length > 0)
})

test('handles uppercase letters', () => {
  assert.strictEqual(commitRefSlug('FEATURE-BRANCH'), 'feature-branch')
})

test('handles dots', () => {
  assert.strictEqual(commitRefSlug('release/v1.2.3'), 'release-v1-2-3')
})

test('handles spaces', () => {
  assert.strictEqual(commitRefSlug('my branch name'), 'my-branch-name')
})

test('handles mixed special characters', () => {
  assert.strictEqual(
    commitRefSlug('feat/ABC_123.test@branch'),
    'feat-abc-123-test-branch',
  )
})
