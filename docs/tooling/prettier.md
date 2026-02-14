# Prettier

## Configuration

Prettier is configured via `.prettierrc.cjs` with `experimentalTernary`
enabled. EditorConfig (`.editorconfig`) is also present for editors that
support it.

## Scripts

```json
"scripts": {
  "format": "prettier --check . --cache --cache-location node_modules/.cache/.prettiercache",
  "format:fix": "prettier --write . --cache --cache-location node_modules/.cache/.prettiercache"
}
```

### `--cache`

Makes Prettier skip files that haven't changed since the last run.
Without it, every matched file is re-parsed on every invocation.
The difference is small on a project with ~40 files, but matters in
larger codebases and in pre-commit hooks where speed counts.

### `--cache-location node_modules/.cache/.prettiercache`

Stores the cache file inside `node_modules/.cache/` -- a conventional
location that many tools use (ESLint, Vite, etc.) and that is already
gitignored via `node_modules`.
