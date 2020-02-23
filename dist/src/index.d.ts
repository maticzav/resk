declare type File = {
    source: string;
    extension: string;
    lang: Language;
};
/**
 * Loads a file and determines the extension.
 * @param path
 */
export declare function loadFile(filePath: string): File | null;
export declare type Gist = {
    name: string;
    source: string;
};
/**
 * Extracts Gists from a file.
 *
 * @param source
 * @param lang
 */
export declare function extractGists(file: File): (File & {
    gist: Gist;
})[];
export declare type Language = {
    start: RegExp;
    end: RegExp;
    gistter: (mathces: RegExpMatchArray) => Gist;
    formatter: (source: string, file: File) => string;
    extensions: string[];
};
/**
 * Supported languages.
 */
export declare const languages: {
    [lang: string]: Language;
};
/**
 * Returns a language with the specified extension from supported languages.
 * @param ext
 */
export declare function getLanguageFromExtension(ext: string): Language | null;
/**
 * Doesn't change the code.
 *
 * @param source
 */
export declare function noneFormatter(source: string): string;
/**
 * Determines whether a value is null.
 * @param v
 */
export declare function notNull<T>(v: T | null): v is T;
/**
 * Flattens an array of arrays to a single array.
 * @param xss
 */
export declare function flatten<T>(xss: T[][]): T[];
/**
 * Creates an object from entries.
 * @param entries
 */
export declare function objectFromEntries(entries: [string, string][]): {
    [key: string]: string;
};
export {};
//# sourceMappingURL=index.d.ts.map