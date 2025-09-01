# Changesets

This project uses changesets to document and release changes. Read more about changesets here: 
https://github.com/changesets/changesets/blob/main/docs/intro-to-using-changesets.md

## Everyday workflow

A changeset is a markdown file with the follow information:

1. What package has changed.
2. What kind of change it is (major/minor/patch).
3. A description of the change.

When working on a new feature or refactor you can create a changeset before you open your PR.

To do this, run the following in the project root and follow the on screen instructions:

```sh
$ pnpm changeset:add
```

This will create a new file in the `.changeset` directory and commit it to your branch.

You can create multiple changesets for each PR, however you don't need to do it for every commit, 
one for each overall change you make is good enough.


## Versioning releases

The changeset files will accumulate over time, and each time you want to create a new of a package to release, you run

```sh
$ pnpm changeset:version
```

This command compiles all the changesets and automatically bumps the package(s) based on the information that it finds,
as well as appending this to each packages's CHANGELOG.md. Lastly, it deletes the changeset files that it has consumed.

It bumps the versions in all applicable package.json files and commits the new changes to your current branch.

> [!IMPORTANT]
> Before running this command, you need to configure a [GitHub access token](https://github.com/settings/tokens/new) with the scopes `repo` and `read:user` and add this to `.changeset/.env` as `GITHUB_TOKEN`. This is used to read info about PR authors to add these to the changelog.

## Tagging and publishing releases

When you want to tag and publish a release (usually right after a new version), you run the following command:

```sh
$ pnpm changeset:tag
```

This creates new tags for all packages that have new versions. Then, you can build the packages and publish these new tags on NPM by running:

```sh
$ pnpm run build && pnpm release -r
```