import assert from 'node:assert'
import { test } from 'node:test'
import joinUrl from './joinUrl.js'

test('joins base without trailing slash and path without leading slash', () => {
  assert.strictEqual(
    joinUrl('https://example.com/app', 'login'),
    'https://example.com/app/login',
  )
})

test('joins base with trailing slash and path without leading slash', () => {
  assert.strictEqual(
    joinUrl('https://example.com/app/', 'login'),
    'https://example.com/app/login',
  )
})

test('joins base without trailing slash and path with leading slash', () => {
  assert.strictEqual(
    joinUrl('https://example.com/app', '/login'),
    'https://example.com/app/login',
  )
})

test('joins base with trailing slash and path with leading slash', () => {
  assert.strictEqual(
    joinUrl('https://example.com/app/', '/login'),
    'https://example.com/app/login',
  )
})

test('preserves query params from base URL', () => {
  assert.strictEqual(
    joinUrl('https://example.com/app?token=abc', 'login'),
    'https://example.com/app/login?token=abc',
  )
})

test('preserves multiple query params from base URL', () => {
  assert.strictEqual(
    joinUrl('https://example.com/app?token=abc&foo=bar', '/login'),
    'https://example.com/app/login?token=abc&foo=bar',
  )
})

test('preserves query params with trailing slash in base', () => {
  assert.strictEqual(
    joinUrl('https://example.com/app/?token=abc', 'login'),
    'https://example.com/app/login?token=abc',
  )
})

test('preserves hash from base URL', () => {
  assert.strictEqual(
    joinUrl('https://example.com/app#section', 'login'),
    'https://example.com/app/login#section',
  )
})

test('preserves both query params and hash from base URL', () => {
  assert.strictEqual(
    joinUrl('https://example.com/app?token=abc#section', 'login'),
    'https://example.com/app/login?token=abc#section',
  )
})

test('works with root path as base', () => {
  assert.strictEqual(
    joinUrl('https://example.com', 'login'),
    'https://example.com/login',
  )
})

test('works with root path with trailing slash as base', () => {
  assert.strictEqual(
    joinUrl('https://example.com/', 'login'),
    'https://example.com/login',
  )
})

test('handles nested path segments', () => {
  assert.strictEqual(
    joinUrl('https://example.com/app', 'auth/login'),
    'https://example.com/app/auth/login',
  )
})

test('adds query params when provided', () => {
  assert.strictEqual(
    joinUrl('https://example.com/app', 'login', { foo: 'bar' }),
    'https://example.com/app/login?foo=bar',
  )
})

test('adds multiple query params when provided', () => {
  assert.strictEqual(
    joinUrl('https://example.com/app', 'login', { foo: 'bar', baz: 'qux' }),
    'https://example.com/app/login?foo=bar&baz=qux',
  )
})

test('merges query params with existing ones from base URL', () => {
  assert.strictEqual(
    joinUrl('https://example.com/app?token=abc', 'login', { foo: 'bar' }),
    'https://example.com/app/login?token=abc&foo=bar',
  )
})

test('overwrites existing query param if same key provided', () => {
  assert.strictEqual(
    joinUrl('https://example.com/app?foo=old', 'login', { foo: 'new' }),
    'https://example.com/app/login?foo=new',
  )
})

test('handles empty params object', () => {
  assert.strictEqual(
    joinUrl('https://example.com/app', 'login', {}),
    'https://example.com/app/login',
  )
})

test('handles undefined params', () => {
  assert.strictEqual(
    joinUrl('https://example.com/app', 'login', undefined),
    'https://example.com/app/login',
  )
})
