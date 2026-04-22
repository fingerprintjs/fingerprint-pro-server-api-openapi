# Agent instructions

## Repository structure and versioning

Two Server API versions ship from this repo:

- **v4 (current)**: source in `schemas/components/` and `schemas/paths/`. Edit there, then run the build to regenerate the bundled schema.
- **v3 (legacy)**: no source files — edit the bundled YAMLs directly in `schemas/`. Changes should be rare.

## Changesets

Files in `.changeset/*.md` feed the generated `CHANGELOG.md` / release notes.

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
