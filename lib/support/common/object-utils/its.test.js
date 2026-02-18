import assert from 'node:assert'
import { test } from 'node:test'
import its, { describe, KeyByValue, get, Get, has, Has, set, Set, at } from './its.js'

// todo: given too much of tests here, let's break the its.test.js file into smaller files
//       following the pattern of `its.<functionUnderTest>.test.js`

// --- describe ---

test('describe: returns string representation for a primitive', () => {
  assert.strictEqual(describe(42), '42')
})

test('describe: returns the string itself for a string', () => {
  assert.strictEqual(describe('hello'), 'hello')
})

test('describe: returns JSON for a plain object', () => {
  assert.strictEqual(describe({ a: 1 }), '{"a":1}')
})

test('describe: returns constructor name for a class instance', () => {
  class Foo {}
  assert.strictEqual(describe(new Foo()), 'Foo')
})

test('describe: returns empty string for null', () => {
  assert.strictEqual(describe(null), '')
})

test('describe: returns empty string for undefined', () => {
  assert.strictEqual(describe(undefined), '')
})

test('describe: returns "true" for boolean true', () => {
  assert.strictEqual(describe(true), 'true')
})

// --- KeyByValue ---

test('KeyByValue: finds key by value', () => {
  assert.strictEqual(KeyByValue('b')({ x: 'a', y: 'b', z: 'c' }), 'y')
})

test('KeyByValue: returns undefined when value not found', () => {
  assert.strictEqual(KeyByValue('missing')({ x: 'a' }), undefined)
})

test('KeyByValue: returns first matching key when multiple keys share a value', () => {
  const result = KeyByValue(1)({ a: 1, b: 1 })
  assert.strictEqual(result, 'a')
})

// todo: get and has should be tested on same input params and so would be good
//       to restructure them so corresponding test pairs are next to each other.

// --- get ---

test('get: gets a nested value by array path', () => {
  assert.strictEqual(get(['a', 'b'], { a: { b: 42 } }), 42)
})

test('get: gets a nested value by dot-notation string path', () => {
  assert.strictEqual(get('a.b', { a: { b: 42 } }), 42)
})

test('get: gets an array element by numeric index in path', () => {
  assert.strictEqual(get('a.[0]', { a: [10, 20] }), 10)
})

test('get: gets a deeply nested value with mixed keys', () => {
  const obj = { a: { b: [{ c: 'found' }] } }
  assert.strictEqual(get('a.b.[0].c', obj), 'found')
})

test('get: gets a deeply nested value with mixed keys in array path', () => {
  const obj = { a: { b: [{ c: 'not found' }, { d: 'found' }] } }
  assert.strictEqual(get(['a', 'b', 1, 'd'], obj), 'found')
})

test('get: returns undefined for a missing path', () => {
  assert.strictEqual(get('a.b.c', { a: {} }), undefined)
})

test('get: returns undefined for a missing numeric key in object', () => {
  assert.strictEqual(get('0', { a: {} }), undefined)
})

test('get: returns the object itself for empty string path', () => {
  const obj = { a: 1 }
  assert.strictEqual(get('', obj), obj)
})

test('get: returns the object itself for empty array path', () => {
  const obj = { a: 1 }
  assert.strictEqual(get([], obj), obj)
})

test('get: returns the array itself for empty array path', () => {
  const arr = ['_', '__']
  assert.strictEqual(get([], arr), arr)
})

test('get: returns undefined for null path', () => {
  assert.strictEqual(get(/** @type {any} */ (null), { a: 1 }), undefined)
})

test('get: returns undefined for undefined path', () => {
  assert.strictEqual(get(/** @type {any} */ (undefined), { a: 1 }), undefined)
})

test('get: gets array element by numeric 0 path', () => {
  assert.strictEqual(get(0, ['first', 'second']), 'first')
})

test('get: gets array element by numeric path via array keys', () => {
  assert.strictEqual(get([0], ['first', 'second']), 'first')
})

test('get: gets a top-level key by string path', () => {
  assert.strictEqual(get('x', { x: 99 }), 99)
})

// --- Get (curried) ---

test('Get: returns a curried getter', () => {
  const getB = Get('a.b')
  assert.strictEqual(getB({ a: { b: 7 } }), 7)
})

// --- has ---

// string path on objects

test('has: returns true for a top-level key by string path', () => {
  assert.strictEqual(has('a', { a: 1 }), true)
})

test('has: returns true for a nested key by string dot-notation path', () => {
  assert.strictEqual(has('a.b', { a: { b: 1 } }), true)
})

test('has: returns true for a deeply nested key by string path', () => {
  assert.strictEqual(has('a.b.c', { a: { b: { c: 'deep' } } }), true)
})

test('has: returns false when nested key is absent by string path', () => {
  assert.strictEqual(has('a.b.c', { a: {} }), false)
})

test('has: returns false when top-level key is absent by string path', () => {
  assert.strictEqual(has('b', { a: 1 }), false)
})

// array path on objects

test('has: returns true for a top-level key by array path', () => {
  assert.strictEqual(has(['a'], { a: 1 }), true)
})

test('has: returns true for a nested key by array path', () => {
  assert.strictEqual(has(['a', 'b'], { a: { b: 1 } }), true)
})

test('has: returns false when nested key is absent by array path', () => {
  assert.strictEqual(has(['a', 'b', 'c'], { a: {} }), false)
})

// string path with bracket notation on arrays

test('has: returns true for an array element by string bracket path', () => {
  assert.strictEqual(has('items.[0]', { items: [10, 20] }), true)
})

test('has: returns false for out-of-bounds array index by string path', () => {
  assert.strictEqual(has('items.[5]', { items: [10, 20] }), false)
})

// array path with numeric keys on arrays

test('has: returns true for an array element by array path with numeric key', () => {
  assert.strictEqual(has(['items', 0], { items: [10, 20] }), true)
})

test('has: returns false for out-of-bounds index by array path with numeric key', () => {
  assert.strictEqual(has(['items', 5], { items: [10, 20] }), false)
})

// numeric path on arrays

test('has: returns true for a top-level array element by numeric path', () => {
  assert.strictEqual(has(0, ['first', 'second']), true)
})

test('has: returns false for out-of-bounds numeric path on array', () => {
  assert.strictEqual(has(5, ['first', 'second']), false)
})

// mixed objects and arrays

test('has: returns true for nested value inside array of objects by string path', () => {
  assert.strictEqual(has('a.b.[0].c', { a: { b: [{ c: 'found' }] } }), true)
})

test('has: returns false for missing key inside array of objects by string path', () => {
  assert.strictEqual(has('a.b.[0].d', { a: { b: [{ c: 'found' }] } }), false)
})

test('has: returns true for nested value inside array of objects by array path', () => {
  assert.strictEqual(has(['a', 'b', 0, 'c'], { a: { b: [{ c: 'found' }] } }), true)
})

test('has: returns false for missing key inside array of objects by array path', () => {
  assert.strictEqual(has(['a', 'b', 0, 'd'], { a: { b: [{ c: 'found' }] } }), false)
})

// special values at path

test('has: returns true when value at path is null', () => {
  assert.strictEqual(has('a', { a: null }), true)
})

test('has: returns true when value at path is explicitly undefined', () => {
  assert.strictEqual(has('a', { a: undefined }), true)
})

test('has: returns true when value at path is false', () => {
  assert.strictEqual(has('a', { a: false }), true)
})

test('has: returns true when value at path is 0', () => {
  assert.strictEqual(has('a', { a: 0 }), true)
})

test('has: returns true when value at path is empty string', () => {
  assert.strictEqual(has('a', { a: '' }), true)
})

// path through null/undefined intermediate

test('has: returns false when intermediate in path is null', () => {
  assert.strictEqual(has('a.b', { a: null }), false)
})

test('has: returns false when intermediate in path is undefined', () => {
  assert.strictEqual(has('a.b', { a: undefined }), false)
})

test('has: returns false when intermediate in path is a primitive', () => {
  assert.strictEqual(has('a.b', { a: 42 }), false)
})

// edge cases

test('has: returns true for empty string path (root)', () => {
  assert.strictEqual(has('', { a: 1 }), true)
})

test('has: returns true for empty array path (root)', () => {
  assert.strictEqual(has([], { a: 1 }), true)
})

test('has: returns undefined for null path', () => {
  assert.strictEqual(has(/** @type {any} */ (null), { a: 1 }), undefined)
})

test('has: returns undefined for undefined path', () => {
  assert.strictEqual(has(/** @type {any} */ (undefined), { a: 1 }), undefined)
})

// --- Has (curried) ---

test('Has: returns a curried checker', () => {
  const hasB = Has('a.b')
  assert.strictEqual(hasB({ a: { b: 1 } }), true)
  assert.strictEqual(hasB({ a: {} }), false)
})

// --- set ---

test('set: sets a nested value by array path', () => {
  const obj = { a: { b: 1 } }
  set(['a', 'b'], 42, obj)
  assert.strictEqual(obj.a.b, 42)
})

test('set: sets a nested value by string path', () => {
  const obj = { a: { b: 1 } }
  set('a.b', 42, obj)
  assert.strictEqual(obj.a.b, 42)
})

test('set: returns the original object (mutates in place)', () => {
  const obj = { a: { b: 1 } }
  const result = set('a.b', 42, obj)
  assert.strictEqual(result, obj)
})

test('set: sets an array element by index', () => {
  const obj = { items: [1, 2, 3] }
  set('items.[1]', 99, obj)
  assert.strictEqual(obj.items[1], 99)
})

// --- Set (curried) ---

test('Set: returns a curried setter', () => {
  const setB = Set('a.b', 42)
  const obj = { a: { b: 1 } }
  const result = setB(obj)
  assert.strictEqual(result.a.b, 42)
  assert.strictEqual(result, obj)
})

// --- at ---

test('at.path().from() gets a value', () => {
  assert.strictEqual(at.path('a.b').from({ a: { b: 5 } }), 5)
})

test('at.path().set().on() sets a value', () => {
  const obj = { a: { b: 1 } }
  at.path('a.b').set(99).on(obj)
  assert.strictEqual(obj.a.b, 99)
})

// --- its.Path ---

test('Path().from() gets a value', () => {
  assert.strictEqual(its.Path('a.b').from({ a: { b: 3 } }), 3)
})

test('Path().in() checks existence', () => {
  assert.strictEqual(its.Path('a.b').in({ a: { b: 1 } }), true)
  assert.strictEqual(its.Path('a.b').in({ a: {} }), false)
})

test('Path().value().set() sets a value on object', () => {
  const obj = { a: { b: 1 } }
  its.Path('a.b').value(42).set(obj)
  assert.strictEqual(obj.a.b, 42)
})

test('Path().on().get() gets a value', () => {
  assert.strictEqual(
    its
      .Path('a.b')
      .on({ a: { b: 7 } })
      .get(),
    7,
  )
})

test('Path().on().set() mutates the object', () => {
  const obj = { a: { b: 1 } }
  its.Path('a.b').on(obj).set(42)
  assert.strictEqual(obj.a.b, 42)
})

// todo: consider full clone in future
test('Path().on().with() returns a shallow clone with the value set', () => {
  const obj = { a: { b: 1 }, c: 2 }
  const result = its.Path('a.b').on(obj).with(42)
  assert.notStrictEqual(result, obj)
  assert.strictEqual(result.a.b, 42)
  // note: shallow clone means nested objects are shared
  assert.strictEqual(result.a, obj.a)
})

test('Path().set() sets a value (2-arg form)', () => {
  const obj = { a: { b: 1 } }
  its.Path('a.b').set(/** @type {any} */ (42), obj)
  assert.strictEqual(obj.a.b, 42)
})

// --- its.description ---

test('its.description delegates to describe', () => {
  assert.strictEqual(its.description(42), '42')
  assert.strictEqual(its.description(null), '')
})

// --- its.primitiveClone ---

test('primitiveClone: creates a deep clone of primitives', () => {
  const obj = { a: { b: 1 }, c: [2, 3] }
  const clone = its.primitiveClone(obj)
  assert.deepStrictEqual(clone, obj)
  assert.notStrictEqual(clone, obj)
  assert.notStrictEqual(clone.a, obj.a)
  assert.notStrictEqual(clone.c, obj.c)
})

test('primitiveClone: drops functions and undefined values', () => {
  const obj = { a: 1, b: undefined, c: () => {} }
  const clone = its.primitiveClone(obj)
  assert.deepStrictEqual(clone, { a: 1 })
})

// --- its.parsed ---

test('parsed: flat object produces paths to leaf values', () => {
  const result = its.parsed({ a: 1, b: 'two' })
  const entries = [...result.tree]
  assert.deepStrictEqual(entries, [
    [['a'], 1],
    [['b'], 'two'],
  ])
})

test('parsed: nested object produces leaf-only path', () => {
  const result = its.parsed({ a: { b: 42 } })
  const entries = [...result.tree]
  assert.deepStrictEqual(entries, [[['a', 'b'], 42]])
})

test('parsed: deeply nested object produces single leaf path', () => {
  const result = its.parsed({ x: { y: { z: 'deep' } } })
  const entries = [...result.tree]
  assert.deepStrictEqual(entries, [[['x', 'y', 'z'], 'deep']])
})

test('parsed: object with array values produces leaf entries per element', () => {
  const result = its.parsed({ items: [10, 20] })
  const entries = [...result.tree]
  assert.deepStrictEqual(entries, [
    [['items', '0'], 10],
    [['items', '1'], 20],
  ])
})

test('parsed: array values produces leaf entries per element', () => {
  const result = its.parsed([10, 20])
  const entries = [...result.tree]
  assert.deepStrictEqual(entries, [
    [['0'], 10],
    [['1'], 20],
  ])
})

test('parsed: mixed nested object with arrays', () => {
  const result = its.parsed({ a: 1, b: { c: [3] } })
  const entries = [...result.tree]
  assert.deepStrictEqual(entries, [
    [['a'], 1],
    [['b', 'c', '0'], 3],
  ])
})

test('parsed: empty object', () => {
  const result = its.parsed({})
  const entries = [...result.tree]
  assert.deepStrictEqual(entries, [])
})

test('parsed: empty array', () => {
  const result = its.parsed([])
  const entries = [...result.tree]
  assert.deepStrictEqual(entries, [])
})

test('parsed: object with null value', () => {
  const result = its.parsed({ a: null })
  const entries = [...result.tree]
  assert.deepStrictEqual(entries, [[['a'], null]])
})

test('parsed: object with undefined value', () => {
  const result = its.parsed({ a: undefined })
  const entries = [...result.tree]
  assert.deepStrictEqual(entries, [[['a'], undefined]])
})

test('parsed: object with boolean values', () => {
  const result = its.parsed({ flag: true, other: false })
  const entries = [...result.tree]
  assert.deepStrictEqual(entries, [
    [['flag'], true],
    [['other'], false],
  ])
})
