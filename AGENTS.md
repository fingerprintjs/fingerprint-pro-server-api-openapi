# Agent instructions

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
