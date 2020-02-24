import { Octokit } from '@octokit/rest'
import globby from 'globby'
import * as fs from 'fs'
import * as path from 'path'
import * as prettier from 'prettier'

/**
 * Supported languages.
 */
export const LANGUAGES: { [lang: string]: Language } = {
  typescript: {
    start: /\/\*\s*resk start\s+\"(.+)\"\s*\*\//,
    end: /\/\*\s*resk end\s*\*\//,
    gistter: ([, name, source]) => ({
      name: name!,
      source: source!,
    }),
    formatter: source =>
      prettier.format(source, {
        semi: false,
        trailingComma: 'all',
        singleQuote: true,
        parser: 'typescript',
      }),
    extensions: ['.ts', '.tsx'],
  },
  javascript: {
    start: /\/\*\s*resk start\s+\"(.+)\"\s*\*\//,
    end: /\/\*\s*resk end\s*\*\//,
    gistter: ([, name, source]) => ({
      name: name!,
      source: source!,
    }),
    formatter: source =>
      prettier.format(source, {
        semi: false,
        trailingComma: 'all',
        singleQuote: true,
        parser: 'babel',
      }),
    extensions: ['.js', '.jsx'],
  },
}

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
    const paths = await globby(globs, { gitignore: true, absolute: true, cwd })
    const files = paths.map(loadFile).filter(notNull)

    console.log(`Found ${files.length} files...`)

    const gists = flatten(files.map(extractGists))

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
              [`${gist.gist.name}${gist.extension}`]: gist.gist.source,
            },
          })
          .then(res => ({ gist, url: res.data.url })),
      ),
    )

    const dump = objectFromEntries(
      urls.map(({ url, gist }) => [`${gist.gist.name}${gist.extension}`, url]),
    )

    await octokit.repos.createOrUpdateFile({
      owner,
      repo,
      branch: ref,
      content: JSON.stringify(dump),
      path: '.github/resk.json',
      message: 'Resk action paths update.',
    })

    console.log(`Done!`)
  } catch (err) /* istanbul ignore next */ {
    console.error(err)
  }
}

/* istanbul ignore next */
if (require.main?.filename === __filename) {
  let [, fullRepo, ref] = process.argv
  const [owner, repo] = fullRepo.split('/')

  if (!owner && !repo) throw new Error(`Missing repo name.`)
  if (!ref) ref = 'master'

  resk({ owner, repo, ref })
}

/* Helper functions */

type File = {
  source: string
  extension: string
  lang: Language
}

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

export type Gist = {
  name: string
  source: string
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

/* Languages */

export type Language = {
  /* Starting comment */
  start: RegExp
  /* Ending comment */
  end: RegExp
  /* Turns a match into a Gist */
  gistter: (mathces: RegExpMatchArray) => Gist
  /* Function to use to format the source code */
  formatter: (source: string, file: File) => string
  /* Language extensions */
  extensions: string[]
}

/**
 * Returns a language with the specified extension from supported languages.
 * @param ext
 */
export function getLanguageFromExtension(ext: string): Language | null {
  const lang = Object.keys(LANGUAGES).find(lang =>
    LANGUAGES[lang]!.extensions.includes(ext),
  )
  if (lang) return LANGUAGES[lang]
  /* istanbul ignore next */
  return null
}

/**
 * Returns a list of extensions from a dictionary of languages.
 * @param dict
 */
export function getLanguageExtensions(): string[] {
  return flatten(Object.keys(LANGUAGES).map(lang => LANGUAGES[lang].extensions))
}

/**
 * Turns extensions to glob patterns.
 *
 * @param extensions
 */
export function globsFromExtensions(exts: string[]): string[] {
  return exts.map(ext => `**/*${ext}`)
}

/* Prettiers */

/**
 * Doesn't change the code.
 *
 * @param source
 */
export function noneFormatter(source: string): string {
  return source
}

/* Utils */

/**
 * Determines whether a value is null.
 * @param v
 */
export function notNull<T>(v: T | null): v is T {
  return v !== null
}

/**
 * Flattens an array of arrays to a single array.
 * @param xss
 */
export function flatten<T>(xss: T[][]): T[] {
  return xss.reduce((acc, xs) => acc.concat(xs), [])
}

/**
 * Creates an object from entries.
 * @param entries
 */
export function objectFromEntries(
  entries: [string, string][],
): { [key: string]: string } {
  return entries.reduce((acc, [key, value]) => {
    return {
      ...acc,
      [key]: value,
    }
  }, {})
}
