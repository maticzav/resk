import {
  extractGists,
  loadFile,
  flatten,
  noneFormatter,
  objectFromEntries,
} from '../src/'
import * as path from 'path'

describe('languages:', () => {
  /* Language gists extracts. */
  test('typescript', async () => {
    const file = path.resolve(__dirname, './__fixtures__/typescript.ts')
    const gists = extractGists(loadFile(file)!)
    expect(gists).toMatchSnapshot()
    expect(gists.length).toBe(3)
  })

  test('javascript', async () => {
    const file = path.resolve(__dirname, './__fixtures__/javascript.js')
    const gists = extractGists(loadFile(file)!)
    expect(gists).toMatchSnapshot()
    expect(gists.length).toBe(3)
  })
})

test('loads the file correctly', async () => {
  const file = path.resolve(__dirname, './__fixtures__/typescript.ts')
  expect(loadFile(file)).toMatchSnapshot()
})

test('flattens', () => {
  expect(
    flatten([
      [1, 2, 3],
      [4, 5, 6],
    ]),
  ).toEqual([1, 2, 3, 4, 5, 6])
})

test('noneFormatter', () => {
  const rand = Math.random().toString()
  expect(noneFormatter(rand)).toBe(rand)
})

test('objectFromEntries', () => {
  expect(
    objectFromEntries([
      ['foo', '1'],
      ['bar', '2'],
    ]),
  ).toEqual({
    foo: '1',
    bar: '2',
  })
})
