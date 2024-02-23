# Contributing to Fingerprint Pro Server API OpenAPI

The repository contains [Fingerprint Pro Server API](https://dev.fingerprint.com/docs/server-api) definition in OpenAPI format.

## Schema

You can find the definition in the [schemas](/schemas) folder. You can find information about OpenAPI 3.0.3 in the [official specification](https://spec.openapis.org/oas/v3.0.3).

## Demo app

Code of demo application can be found in [src](src) folder. It uses [Swagger UI](https://github.com/swagger-api/swagger-ui) to render schema and provide sandbox.

## Validation

Schema is supported separately from the API code. It is a bad practice, but we will fix it in future API versions.
To validate that schema is still up to date there is a [special validation script](/bin/validateSchema.ts).

- It uses mocks from [examples](/examples) folder to validate against. Note that some files in the examples folder appear unused like `get_event_extra_fields.json`, but they are downloaded and used for validation by individual SDK repositories.
- It also generates fresh identification events using the TEST_SUBSCRIPTION [env variable](./.env.example), retrieves fresh Server API responses and validates the schema against those.

Validation runs as a part of PR process and once a day. You can run it locally using `yarn validateSchema`.
