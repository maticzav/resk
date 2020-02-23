<p align="center">
  <a href="https://github.com/actions/typescript-action/actions"><img alt="typescript-action status" src="https://github.com/actions/typescript-action/workflows/build-test/badge.svg"></a>
</p>

# resk

> Resk helps you create gists from your source code.

## How to use?

It's so simple! Add a start and end comment to the part of the code you would like to turn into a gist.

For example, if you had a TypeScript file, you could do something like this:

```ts
/* resk start "users" */
const users = {
  matic: {
    id: 1,
    name: 'Matic',
    role: 'admin',
  },
}
/* resk end */

/* resk start "libraries" */
const libraries = {
  resk: {
    cool: 9001,
  },
}
/* resk end */
```

This would create two gists - one named `users` and one named `libraries`. Besides that, it will also create a dump in `.github/resk.json` which includes pointers to your latest gists. This way, you don't have to change urls as you push changes.

**Embed:**

- `https://resk.now.sh/api/gist?repo=label-sync&owner=maticzav&gist=tutorial.ts`
- `<script src="https://resk.now.sh/api/gist?repo=label-sync&owner=maticzav&gist=tutorial.ts"></script>`

**Supported languages:**

- Typescript/Javascript: `/* resk start "<gist>" */`, `/* resk end */`

**Example usage:**

```yml
uses: maticzav/resk@v1
```

## Why `resk`?

Scissors make a "resk" when you cut the paper. Making gists is like cutting gists out of a big paper.

## Contributing

Please create a PR with the new features. To add a new language please add a language specification in index file, create a test case, and add documentation above.

## License

MIT @ Zavadlal Matic
