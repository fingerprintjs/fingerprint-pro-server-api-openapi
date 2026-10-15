---
'openapi': minor
---

**events**: Model `Event` as a union of `EventDevice` and `EventEdge`, discriminated by `source`, in the docs and the Node SDK schema. Other SDK schemas keep a single flat `Event` with optional `source`
