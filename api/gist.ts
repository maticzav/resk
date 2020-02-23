import { Octokit } from '@octokit/rest'
import { NowRequest, NowResponse } from '@now/node'

/**
 * /gist?repo=graphql-shield&owner=maticzav&gist=libraries.ts
 */
export default async (req: NowRequest, res: NowResponse) => {
  const { repo, owner, gist, ref } = req.query
  if (
    typeof repo !== 'string' ||
    typeof owner !== 'string' ||
    typeof gist !== 'string' ||
    (ref !== undefined && typeof ref !== 'string')
  ) {
    return res
      .status(404)
      .send(
        `Missing repo, owner, or gist query. ref is optional and defaults to master.`,
      )
  }

  try {
    const client = new Octokit()

    const ghData = await client.repos
      .getContents({
        owner,
        repo,
        ref,
        path: '.github/resk.json',
      })
      .then(res => res.data)

    if (Array.isArray(ghData) || !ghData.content) {
      return res.status(404).send("Couldn't find the dump.")
    }

    const dump = JSON.parse(Buffer.from(ghData.content, 'base64').toString())
    const url = dump[gist]

    if (!url) {
      return res.status(404).send("Couldn't find the gist.")
    }

    return res.status(301).send(url)
  } catch (err) {
    console.error(err)
    return res.status(500)
  }
}
