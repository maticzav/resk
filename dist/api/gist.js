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
Object.defineProperty(exports, "__esModule", { value: true });
const rest_1 = require("@octokit/rest");
/**
 * /gist?repo=graphql-shield&owner=maticzav&gist=libraries.ts
 */
exports.default = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { repo, owner, gist, ref } = req.query;
    if (typeof repo !== 'string' ||
        typeof owner !== 'string' ||
        typeof gist !== 'string' ||
        (ref !== undefined && typeof ref !== 'string')) {
        return res
            .status(404)
            .send(`Missing repo, owner, or gist query. ref is optional and defaults to master.`);
    }
    try {
        const client = new rest_1.Octokit();
        const ghData = yield client.repos
            .getContents({
            owner,
            repo,
            ref,
            path: '.github/resk.json',
        })
            .then(res => res.data);
        if (Array.isArray(ghData) || !ghData.content) {
            return res.status(404).send("Couldn't find the dump.");
        }
        const dump = JSON.parse(Buffer.from(ghData.content, 'base64').toString());
        const url = dump[gist];
        if (!url) {
            return res.status(404).send("Couldn't find the gist.");
        }
        return res.status(301).send(url);
    }
    catch (err) {
        console.error(err);
        return res.status(500);
    }
});
