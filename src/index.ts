#!/usr/bin/env node

import { Octokit } from '@octokit/rest'
import globby from 'globby'
import * as fs from 'fs'
import * as path from 'path'

import {
  getLanguageExtensions,
  globsFromExtensions,
  getLanguageFromExtension,
  File,
  Gist,
} from './languages'
import { notNull, objectFromEntries, flatten } from './utils'

export type SyncInput = {
  repo: string
  owner: string
  branch: string
}

const RESK_SYNC_PATH = '.github/resk.json'

/**
 * The main action.
 */
export async function resk(
  { repo, owner, branch }: SyncInput,
  cwd: string = process.cwd(),
): Promise<void> {
  try {
    /* Find gists */
    const supportedLanguagesExts = getLanguageExtensions()
    const globs = globsFromExtensions(supportedLanguagesExts)
    const paths = await globby(globs, {
      gitignore: true,
      absolute: true,
      dot: true,
      cwd,
    })
    const files = paths.map(loadFile).filter(notNull)

    console.log(`Found ${files.length} files...`)

    const gists = flatten(files.map(extractGists))

    /* istanbul ignore next */
    if (gists.length === 0) {
      console.log(`Found no gists.`)
      process.exit(0)
    }

    console.log(`Uploading ${gists.length} gists...`)

    /* Sync gists */

    const octokit = new Octokit({
      auth: `Bearer ${process.env.GH_TOKEN}`,
    })

    /**
     * Loads the current dump to see which gists have already been created.
     */
    const currentDump = await octokit.repos
      .getContents({
        owner: owner,
        repo: repo,
        ref: branch,
        path: RESK_SYNC_PATH,
      })
      .then(res => (Array.isArray(res.data) ? undefined : res.data))
      .catch(() => undefined)
    const currentGists = loadDump(currentDump?.content)

    /**
     * Updates existing gists and creates new ones.
     */
    const newGists = await Promise.all(
      gists.map<
        Promise<{
          gist: Gist
          data: { id: string; html_url: string }
        }>
      >(async ({ gist }) => {
        if (currentGists.hasOwnProperty(gist.name)) {
          return octokit.gists
            .update({
              gist_id: currentGists[gist.name]!.id,
              files: {
                [gist.name]: { content: gist.source },
              },
            })
            .then(res => ({ gist, data: res.data }))
        }
        return octokit.gists
          .create({
            public: true,
            files: {
              [gist.name]: { content: gist.source },
            },
          })
          .then(res => ({ gist, data: res.data }))
      }),
    )

    /* Upload links file */

    const newDump = createDump(getDump(newGists))

    await octokit.repos.createOrUpdateFile({
      owner,
      repo,
      branch: branch,
      sha: currentDump?.sha,
      content: newDump,
      path: RESK_SYNC_PATH,
      message: 'Resk action paths update.',
    })

    console.log(`Done creating Gists!`)

    newGists.forEach(({ gist, data }) => {
      console.log(`${gist.name}: ${data.html_url}`)
    })
  } catch (err) /* istanbul ignore next */ {
    console.log(
      `SUGGESTION: make sure your GH_TOKEN has access to Gist and can write to your repository!`,
    )
    console.error(err)
    process.exit(1)
  }
}

/* istanbul ignore next */
if (require.main?.filename === __filename) {
  let [argv, filename, fullRepo, branch] = process.argv
  const [owner, repo] = fullRepo.split('/')

  if (!owner || !repo) {
    console.error(`Missing full repo name. Recieved ${fullRepo}`)
    process.exit(1)
  }

  console.log(`✂️  running in ${owner}/${repo}`)

  if (!process.env.GH_TOKEN) {
    console.error(`Missing GH_TOKEN!`)
    process.exit(1)
  }
  if (!branch) branch = 'master'

  console.log(`branch: ${branch}`)

  resk({ owner, repo, branch })
}

/* Helper functions */
/**
 * Loads a file and determines the extension.
 * @param path
 */
export function loadFile(filePath: string): File | null {
  const extension = path.extname(filePath)
  const lang = getLanguageFromExtension(extension)

  if (notNull(lang))
    return {
      lang,
      source: fs.readFileSync(filePath, { encoding: 'utf-8' }),
      extension,
    }
  /* istanbul ignore next */
  return null
}

/**
 * Extracts Gists from a file.
 *
 * @param source
 * @param lang
 */
export function extractGists(file: File): (File & { gist: Gist })[] {
  const { lang, source } = file
  const regex = new RegExp(
    `${lang.start.source}((?:.|\n)*?)${lang.end.source}`,
    'g',
  )
  const matches = Array.from(source.matchAll(regex)!)

  return matches
    .map(lang.gistter)
    .map(({ name, source }) => ({
      name: `${name}${file.extension}`,
      source: lang.formatter(source, file),
    }))
    .map(gist => ({ ...file, gist }))
}

type GistDump = {
  [gist: string]: {
    id: string
    html_url: string
  }
}

/**
 * Creates a gist dump from Github's response.
 * @param gist
 */
function getDump(
  gists: {
    gist: Gist
    data: { id: string; html_url: string }
  }[],
): GistDump {
  return objectFromEntries(
    gists.map(({ data, gist }) => [
      gist.name,
      { id: data.id, html_url: data.html_url },
    ]),
  )
}

/**
 * Converts the dump into a base64 string.
 * @param dump
 */
function createDump(dump: GistDump): string {
  return Buffer.from(JSON.stringify(dump), 'utf-8').toString('base64')
}

/**
 * Loads a dump from the base64 string.
 * @param dump
 */
function loadDump(dump: string | undefined): GistDump {
  return dump ? JSON.parse(Buffer.from(dump, 'base64').toString('utf-8')) : {}
}
