import * as prettier from 'prettier'
import { flatten } from './utils'

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

export type File = {
  source: string
  extension: string
  lang: Language
}

export type Gist = {
  name: string
  source: string
}

/* Prettiers */

/**
 * Doesn't change the code.
 *
 * @param source
 */
export function noneFormatter(source: string): string {
  /* istanbul ignore next */
  return source
}

/* Internals (DON'T CHANGE!) */

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
