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
        const fileName = Object.keys((body as any).files)[0]
        gists = {
          ...gists,
          [fileName]: (body as any).files[fileName].content,
        }
        return {
          html_url: `https://api.github.com/gists/${
            Object.keys((body as any).files)[0]
          }`,
        }
      })
      .persist()

    nock('https://api.github.com/')
      .get('/repos/maticzav/resk/git/ref/heads%2Fmaster')
      .reply(200, () => {
        return { object: { sha: 'sha' } }
      })

    nock('https://api.github.com/')
      .put('/repos/maticzav/resk/contents/.github%2Fresk.json')
      .reply(200, (uri, body) => {
        expect(
          Buffer.from((body as any).content, 'base64').toString('utf-8'),
        ).toMatchSnapshot()
        return
      })

    const fixtures = path.resolve(__dirname, './__fixtures__/')
    await resk({ owner: 'maticzav', repo: 'resk', branch: 'master' }, fixtures)

    expect(gists).toMatchSnapshot()
  })
})

test('loads the file correctly', async () => {
  const file = path.resolve(__dirname, './__fixtures__/typescript.ts')
  expect(loadFile(file)).toMatchSnapshot()
})
