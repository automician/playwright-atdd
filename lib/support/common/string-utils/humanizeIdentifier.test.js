import { test } from 'node:test'
import assert from 'node:assert'
import humanizeIdentifier from './humanizeIdentifier.js'

// camelCase tests
test('converts simple camelCase', () => {
  assert.strictEqual(humanizeIdentifier('camelCase'), 'Camel case')
})

test('converts multi-word camelCase', () => {
  assert.strictEqual(humanizeIdentifier('thisIsATest'), 'This is a test')
})

test('converts camelCase starting with lowercase', () => {
  assert.strictEqual(humanizeIdentifier('myVariableName'), 'My variable name')
})

// PascalCase tests
test('converts simple PascalCase', () => {
  assert.strictEqual(humanizeIdentifier('PascalCase'), 'Pascal case')
})

test('converts multi-word PascalCase', () => {
  assert.strictEqual(humanizeIdentifier('ThisIsATest'), 'This is a test')
})

test('converts PascalCase with acronyms', () => {
  assert.strictEqual(humanizeIdentifier('XMLParser'), 'XML parser')
})

test('converts PascalCase with consecutive uppercase', () => {
  assert.strictEqual(humanizeIdentifier('HTMLElement'), 'HTML element')
})

// snake_case tests
test('converts simple snake_case', () => {
  assert.strictEqual(humanizeIdentifier('snake_case'), 'Snake case')
})

test('converts multi-word snake_case', () => {
  assert.strictEqual(humanizeIdentifier('this_is_a_test'), 'This is a test')
})

test('converts snake_case with single letters', () => {
  assert.strictEqual(humanizeIdentifier('a_b_c'), 'A b c')
})

// UPPER_SNAKE_CASE tests
test('converts simple UPPER_SNAKE_CASE', () => {
  assert.strictEqual(humanizeIdentifier('UPPER_SNAKE'), 'Upper snake')
})

test('converts multi-word UPPER_SNAKE_CASE', () => {
  assert.strictEqual(humanizeIdentifier('THIS_IS_A_TEST'), 'This is a test')
})

test('converts UPPER_SNAKE_CASE constant', () => {
  assert.strictEqual(humanizeIdentifier('MAX_VALUE'), 'Max value')
})

// capitalizeFirst option tests
test('capitalizes first letter by default', () => {
  assert.strictEqual(humanizeIdentifier('testValue'), 'Test value')
})

test('capitalizes first letter when explicitly true', () => {
  assert.strictEqual(
    humanizeIdentifier('testValue', { capitalize: true }),
    'Test value',
  )
})

test('does not capitalize first letter when false', () => {
  assert.strictEqual(
    humanizeIdentifier('testValue', { capitalize: false }),
    'test value',
  )
})

test('does not capitalize first letter for PascalCase when false', () => {
  assert.strictEqual(
    humanizeIdentifier('TestValue', { capitalize: false }),
    'test value',
  )
})

test('does not capitalize first letter for UPPER_SNAKE_CASE when false', () => {
  assert.strictEqual(
    humanizeIdentifier('TEST_VALUE', { capitalize: false }),
    'test value',
  )
})

// edge cases
test('returns empty string for empty input', () => {
  assert.strictEqual(humanizeIdentifier(''), '')
})

test('returns empty string for null input', () => {
  assert.strictEqual(humanizeIdentifier(null), '')
})

test('returns empty string for undefined input', () => {
  assert.strictEqual(humanizeIdentifier(undefined), '')
})

test('handles single word lowercase', () => {
  assert.strictEqual(humanizeIdentifier('test'), 'Test')
})

test('handles single word uppercase', () => {
  assert.strictEqual(humanizeIdentifier('TEST'), 'Test')
})

test('handles single character', () => {
  assert.strictEqual(humanizeIdentifier('a'), 'A')
})

test('handles multiple underscores', () => {
  assert.strictEqual(humanizeIdentifier('test__value'), 'Test value')
})

test('handles leading underscore', () => {
  assert.strictEqual(humanizeIdentifier('_privateVar'), 'Private var')
})

test('handles trailing underscore', () => {
  assert.strictEqual(humanizeIdentifier('value_'), 'Value')
})

test('mixed case', () => {
  assert.strictEqual(
    humanizeIdentifier('mixedCamel_and_snakeCase'),
    'Mixed camel and snake case',
  )
})
