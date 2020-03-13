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
    expect.assertions(4)

    let gists = {}
    let logs: string[] = []

    /* Mocks */

    let defaultLog = console.log

    console.log = jest.fn().mockImplementation(log => {
      logs.push(log)
    })

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

    nock('https://api.github.com')
      .patch('/gists/123')
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

    nock('https://api.github.com/')
      .get('/repos/maticzav/resk/contents/.github%2Fresk.json?ref=master')
      .reply(200, (uri, body) => {
        const dump = JSON.stringify({
          'schema.ts': {
            id: '123',
            html_url: 'something',
          },
        })
        return { sha: 'sha', content: Buffer.from(dump).toString('base64') }
      })
      .put('/repos/maticzav/resk/contents/.github%2Fresk.json')
      .reply(200, (uri, body) => {
        expect((body as any).sha).toBe('sha')
        expect(
          Buffer.from((body as any).content, 'base64').toString('utf-8'),
        ).toMatchSnapshot()
        return
      })
      .persist()

    const fixtures = path.resolve(__dirname, './__fixtures__/')
    await resk({ owner: 'maticzav', repo: 'resk', branch: 'master' }, fixtures)

    expect(gists).toMatchSnapshot()
    expect(logs).toMatchSnapshot()

    /* Clear mocks */

    console.log = defaultLog
  })
})

test('loads the file correctly', async () => {
  const file = path.resolve(__dirname, './__fixtures__/typescript.ts')
  expect(loadFile(file)).toMatchSnapshot()
})
