// Permissive structural types for the parsed OpenAPI documents that the schema
// transformers walk and mutate. The transformers operate on an arbitrary
// parsed-YAML tree (adding/removing/rewriting fields), so values are intentionally
// loose rather than modelled against a strict OpenAPI schema.
export type JsonObject = Record<string, any>;

// An OpenAPI document (or any sub-tree of one) as handled by the transformers.
export type OpenApiDocument = JsonObject;

// A transformer mutates the parsed document in place.
export type Transformer = (document: OpenApiDocument) => void;
