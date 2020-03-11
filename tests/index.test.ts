import nock from 'nock'
import * as path from 'path'

import { loadFile, resk } from '../src/'

describe('resk:', () => {
  beforeAll(() => {
    nock.disableNetConnect()
    process.env.GH_TOKEN = 'test'
  })

  afterAll(() => {
    nock.enableNetConnect()
  })

  test('test languages', async () => {
    expect.assertions(2)

    let gists = {}

    nock('https://api.github.com')
      .post('/gists')
      .reply(200, (uri, body) => {
        gists = { ...gists, ...(body as any).files }
        return {
          url: `https://api.github.com/gists/${
            Object.keys((body as any).files)[0]
          }`,
        }
      })
      .persist()

    nock('https://api.github.com/')
      .put('/repos/maticzav/resk/contents/.github%2Fresk.json')
      .reply(200, (uri, body) => {
        expect(body).toMatchSnapshot()
        return
      })

    const fixtures = path.resolve(__dirname, './__fixtures__/')
    await resk({ owner: 'maticzav', repo: 'resk', ref: 'master' }, fixtures)

    expect(gists).toMatchSnapshot()
  })
})

test('loads the file correctly', async () => {
  const file = path.resolve(__dirname, './__fixtures__/typescript.ts')
  expect(loadFile(file)).toMatchSnapshot()
})
