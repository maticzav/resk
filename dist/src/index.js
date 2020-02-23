"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const glob = __importStar(require("@actions/glob"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const prettier = __importStar(require("prettier"));
/**
 * The main action.
 */
function action() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            /* Find gists */
            const globber = yield glob.create('**');
            const paths = yield globber.glob();
            const files = paths.map(loadFile).filter(notNull);
            core.debug(JSON.stringify(files));
            core.info(`Found ${paths.length} files (${files.length} supported).`);
            const gists = flatten(files.map(extractGists));
            /* Create gists */
            const ghToken = core.getInput('GH_TOKEN');
            const octokit = new github.GitHub(ghToken);
            /* Context of the aciton. */
            const { repo: { owner, repo }, ref, } = github.context;
            const urls = yield Promise.all(gists.map(gist => octokit.gists
                .create({
                public: true,
                files: {
                    [`${gist.gist.name}${gist.extension}`]: gist.gist.source,
                },
            })
                .then(res => ({ gist, url: res.data.url }))));
            const dump = objectFromEntries(urls.map(({ url, gist }) => [`${gist.gist.name}${gist.extension}`, url]));
            yield octokit.repos.createOrUpdateFile({
                owner,
                repo,
                branch: ref,
                content: JSON.stringify(dump),
                path: '.github/resk.json',
                message: 'Resk action paths update.',
            });
            core.info('Done!');
        }
        catch (error) /* istanblul ignore next */ {
            core.setFailed(error.message);
        }
    });
}
/* istanbul ignore next */
if (((_a = require.main) === null || _a === void 0 ? void 0 : _a.filename) === __filename) {
    action();
}
/**
 * Loads a file and determines the extension.
 * @param path
 */
function loadFile(filePath) {
    const extension = path.extname(filePath);
    const lang = getLanguageFromExtension(extension);
    if (notNull(lang))
        return {
            lang,
            source: fs.readFileSync(filePath, { encoding: 'utf-8' }),
            extension,
        };
    /* istanbul ignore next */
    return null;
}
exports.loadFile = loadFile;
/**
 * Extracts Gists from a file.
 *
 * @param source
 * @param lang
 */
function extractGists(file) {
    const { lang, source } = file;
    const regex = new RegExp(`${lang.start.source}((?:.|\n)*?)${lang.end.source}`, 'g');
    const matches = Array.from(source.matchAll(regex));
    return matches
        .map(lang.gistter)
        .map(({ name, source }) => ({ name, source: lang.formatter(source, file) }))
        .map(gist => (Object.assign(Object.assign({}, file), { gist })));
}
exports.extractGists = extractGists;
/**
 * Supported languages.
 */
exports.languages = {
    typescript: {
        start: /\/\*\s*resk start\s+\"(.+)\"\s*\*\//,
        end: /\/\*\s*resk end\s*\*\//,
        gistter: ([, name, source]) => ({
            name: name,
            source: source,
        }),
        formatter: source => prettier.format(source, {
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
            name: name,
            source: source,
        }),
        formatter: source => prettier.format(source, {
            semi: false,
            trailingComma: 'all',
            singleQuote: true,
            parser: 'babel',
        }),
        extensions: ['.js', '.jsx'],
    },
};
/**
 * Returns a language with the specified extension from supported languages.
 * @param ext
 */
function getLanguageFromExtension(ext) {
    const lang = Object.keys(exports.languages).find(lang => exports.languages[lang].extensions.includes(ext));
    if (lang)
        return exports.languages[lang];
    return null;
}
exports.getLanguageFromExtension = getLanguageFromExtension;
/* Prettiers */
/**
 * Doesn't change the code.
 *
 * @param source
 */
function noneFormatter(source) {
    return source;
}
exports.noneFormatter = noneFormatter;
/* Utils */
/**
 * Determines whether a value is null.
 * @param v
 */
function notNull(v) {
    return v !== null;
}
exports.notNull = notNull;
/**
 * Flattens an array of arrays to a single array.
 * @param xss
 */
function flatten(xss) {
    return xss.reduce((acc, xs) => acc.concat(xs), []);
}
exports.flatten = flatten;
/**
 * Creates an object from entries.
 * @param entries
 */
function objectFromEntries(entries) {
    return entries.reduce((acc, [key, value]) => {
        return Object.assign(Object.assign({}, acc), { [key]: value });
    }, {});
}
exports.objectFromEntries = objectFromEntries;
