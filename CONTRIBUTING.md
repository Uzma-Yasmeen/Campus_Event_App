# Working on this project

## Branching model

A trimmed-down git-flow. Three kinds of branch, each with one job:

| Branch | Purpose | Merges into |
|---|---|---|
| `main` | Always deployable. Every commit here is a released state, and each release is tagged. | — |
| `develop` | Integration branch. Finished work lands here first and is verified together. | `main` |
| `feature/<name>` | One change, one branch. Branched from `develop`. | `develop` |

Support branches when they are needed:

| Branch | Purpose | Merges into |
|---|---|---|
| `fix/<name>` | A bug fix that is not urgent. | `develop` |
| `hotfix/<name>` | An urgent fix against a release. Branched from `main`. | `main` **and** `develop` |

### Why merge commits rather than fast-forward

Feature branches are merged with `--no-ff`:

```bash
git switch develop
git merge --no-ff feature/campus-scoping
```

This keeps one merge commit per feature, so `git log --first-parent develop` reads as a
list of features rather than a flat stream of individual commits. The detail is still
there if you want it; it is just one level down.

### A change, start to finish

```bash
git switch develop
git pull
git switch -c feature/event-reminders

# ... work, committing as you go ...

git switch develop
git merge --no-ff feature/event-reminders
git push origin develop
git branch -d feature/event-reminders
```

When `develop` is verified and ready to release:

```bash
git switch main
git merge --no-ff develop
git tag -a v1.2.0 -m "Event reminders"
git push origin main --tags
```

## Versioning

[Semantic versioning](https://semver.org): `MAJOR.MINOR.PATCH`.

- **MAJOR** — a change that breaks an existing API contract
- **MINOR** — a feature added without breaking anything
- **PATCH** — a bug fix only

Tags are annotated (`git tag -a`), so they carry a message and a date rather than just
pointing at a commit.

## Commit messages

A short summary line in the imperative — "Add campus scoping", not "Added" or "Adding" —
then a blank line, then the reasoning. The summary says *what*; the body says *why*, and
notes anything a reviewer would otherwise have to work out for themselves.

## Before merging anything

- `npm test` in `backend/` passes
- The affected client has been opened and exercised, not just compiled
- No secrets, `node_modules`, build output or local config is staged
- `README.md` still describes what the code actually does
