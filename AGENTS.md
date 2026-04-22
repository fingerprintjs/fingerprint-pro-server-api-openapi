# Agent instructions

## Repository structure and versioning

Two Server API versions ship from this repo:

- **v4 (current)**: source in `schemas/components/` and `schemas/paths/`. Edit there, then run the build to regenerate the bundled schema.
- **v3 (legacy)**: no source files — edit the bundled YAMLs directly in `schemas/`. Changes should be rare.

## Build outputs

- `dist/` is webpack output — edit source under `schemas/components/` and `schemas/paths/`, then rebuild. Never hand-edit files in `dist/`.
- `schemas/paths/examples/*.json` are downloaded by downstream SDK repos for validation. Don't delete files that look unused locally.
- `x-readme/` holds ReadMe.io documentation extensions merged into the schema at build time — not standard OpenAPI.
- `vacuum-ignore.yaml` lists intentional lint exceptions. Don't "fix" them.

## Release flow and changesets

Changesets (`.changeset/*.md` files) drive both this package's `CHANGELOG.md` and release notes for six downstream SDKs (Node, Go, .NET, Python, Java, PHP) auto-synced on release. A missing changeset means downstream SDKs ship without context for the change.

- **Filename**: descriptive kebab-case, never the auto-generated random slug. Share a prefix to group related entries (e.g. `raw-device-attributes-android.md`, `raw-device-attributes-ios.md`).
- **Frontmatter**: single-quoted package name.
- **Body**: 
  - optional bold scope (`**events**:`), then a capitalized verb. 
  - Backticks around identifiers (`` `field_name` ``, `` `SchemaName` ``).
  - No period at the end, unless the entry has multiple sentences.
  - Trailing newline.

Example:

```markdown
---
'fingerprint-pro-server-api-openapi': minor
---

**events**: Add `proxy_ml_score` to `Event`
```
