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
  ref: string
}

/**
 * The main action.
 */
export async function resk(
  { repo, owner, ref }: SyncInput,
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

    /* Create gists */

    const octokit = new Octokit({
      auth: `Bearer ${process.env.GH_TOKEN}`,
    })

    const urls = await Promise.all(
      gists.map(gist =>
        octokit.gists
          .create({
            public: true,
            files: {
              [`${gist.gist.name}${gist.extension}`]: {
                content: gist.gist.source,
              },
            },
          })
          .then(res => ({ gist, url: res.data.url })),
      ),
    )

    const dump = objectFromEntries(
      urls.map(({ url, gist }) => [`${gist.gist.name}${gist.extension}`, url]),
    )
    const file = JSON.stringify(dump)
    const buffer = Buffer.from(file, 'utf-8').toString('base64')

    await octokit.repos.createOrUpdateFile({
      owner,
      repo,
      branch: ref,
      content: buffer,
      path: '.github/resk.json',
      message: 'Resk action paths update.',
    })

    console.log(`Done!`)
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
  let [argv, filename, fullRepo, ref] = process.argv
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
  if (!ref) ref = 'master'

  console.log(`ref: ${ref}`)

  resk({ owner, repo, ref })
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
    .map(({ name, source }) => ({ name, source: lang.formatter(source, file) }))
    .map(gist => ({ ...file, gist }))
}
