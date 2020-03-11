import { flatten, objectFromEntries } from '../src/utils'

describe('utils:', () => {
  test('flattens', () => {
    expect(
      flatten([
        [1, 2, 3],
        [4, 5, 6],
      ]),
    ).toEqual([1, 2, 3, 4, 5, 6])
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
})
