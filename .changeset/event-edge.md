---
'fingerprint-pro-server-api-openapi': minor
---

**events**: Replace `EdgeResponse` with `EventEdge`. Add `EventDevice`. Model `Event` as a `source` discriminated union of `EventDevice` and `EventEdge` in docs and the Node SDK schema. Other SDK schemas flatten `Event` and leave `source` optional. Get-event copy describes `source` without naming generated types. `POST /edge` returns `EventEdge`.

