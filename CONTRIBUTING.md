# Contributing to Fingerprint Pro Server API OpenAPI

The repository contains [Fingerprint Pro Server API](https://dev.fingerprint.com/docs/server-api) definition in OpenAPI format.

## Schema

You can find the definition in the [schemes](/schemes) folder. You can find information about OpenAPI 3.0.3 in the [official specification](https://spec.openapis.org/oas/v3.0.3).

## Demo app

Code of demo application can be found in [src](src) folder. It uses [Swagger UI](https://github.com/swagger-api/swagger-ui) to render schema and provide sandbox.

## Validation

Schema is supported separately from the API code. It is a bad use case, but we will fix it in future API versions.
To validate that schema is still actual there is [special script](/bin/validateSchema.js). It uses mocks from [examples](/examples) folder and makes requests to the API.
Validation runs as a part of PR process and once a day. You can run it locally using `yarn validateSchema`.