import * as core from '@actions/core'
import * as github from '@actions/github'
import * as glob from '@actions/glob'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import * as prettier from 'prettier'

/**
 * The main action.
 */
async function action(): Promise<void> {
  try {
    const globber = await glob.create('**')
    const paths = await globber.glob()
    const files = paths.map(loadFile).filter(notNull)

    core.debug(JSON.stringify(files))

    core.info(`Found ${paths.length} files (${files.length} supported).`)

    const gists = flatten(files.map(extractGists))

    const ghToken = core.getInput('gh_token')
    const octokit = new github.GitHub(ghToken)

    const { repo, sha } = github.context

    const res = await octokit.gists
      .create({
        public: true,
        files: objectFromEntries(
          gists.map(gist => [
            /* name of the file */
            `${repo.repo}-${repo.owner}-${sha}-${gist.gist.name}${gist.extension}`,
            /* file source */
            gist.gist.source,
          ]),
        ),
      })
      .then(res => (res.data?.files as any) as { [file: string]: string })

    core.debug(JSON.stringify(res))

    core.info(
      Object.keys(res)
        .map(file => {
          return `${file}: ${res[file]}`
        })
        .join(os.EOL),
    )
  } catch (error) /* istanblul ignore next */ {
    core.setFailed(error.message)
  }
}

/* istanbul ignore next */
if (require.main?.filename === __filename) {
  action()
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
  const source = fs.readFileSync(filePath, { encoding: 'utf-8' })
  const lang = getLanguageFromExtension(extension)

  if (notNull(lang)) return { lang, source, extension }
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
 * Supported languages.
 */
export const languages: { [lang: string]: Language } = {
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

/**
 * Returns a language with the specified extension from supported languages.
 * @param ext
 */
export function getLanguageFromExtension(ext: string): Language | null {
  const lang = Object.keys(languages).find(lang =>
    languages[lang]!.extensions.includes(ext),
  )
  if (lang) return languages[lang]
  return null
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
