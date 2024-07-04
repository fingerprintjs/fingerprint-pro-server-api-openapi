# Contributing to Fingerprint Pro Server API OpenAPI

The repository contains OpenAPI definition files for various [Fingerprint Pro Server-side APIs](https://dev.fingerprint.com/reference).

## Schemas

You can find the schemas definitions in the [schemas](/schemas) folder. You can find information about OpenAPI 3.0.3 in the [official specification](https://spec.openapis.org/oas/v3.0.3).

## Demo app

Code of demo application can be found in [src](src) folder. It uses [Swagger UI](https://github.com/swagger-api/swagger-ui) to render schema and provide sandbox.

## Contributing to the schema definition

- If you are not familiar with the OpenAPI format, you can watch this [video summary](https://www.youtube.com/watch?v=pRS9LRBgjYg) (1.5x speed recommended).
- Authoring schemas is easier with IDE support. For VS Code, you can use [OpenAPI (Swagger) Editor](https://marketplace.visualstudio.com/items?itemName=42Crunch.vscode-openapi). You can look for similar extensions for your IDE of choice.
- OpenAPI schema is repetitive, the easiest way to add something (schema, endpoint, response, property...) is to copy-paste an existing entity and modify it. Try to follow the established patterns for naming, ordering, example values, example files, etc.
- Use the **Demo app** to dynamically render your changes into a documentation site a preview them there.

  1. Clone this repository: `git clone https://github.com/fingerprintjs/fingerprint-pro-server-api-openapi.git`
  2. Install dependencies: `pnpm install`
  3. Run `pnpm dev` to start the demo app

- Your IDE should warn you about errors in your schema. You can also run `pnpm run lintSchema` to run your schema through a linter.
- You can reference the [OpenAPI specification](https://spec.openapis.org/oas/v3.0.3) for more information.

## Validation

Schema is supported separately from the API code. It is a bad practice, but we will fix it in future API versions.
To validate that schema is still up to date there is a [special validation script](/bin/validateSchema.ts).

- It uses mocks from [examples](/examples) folder to validate against. Note that some files in the examples folder appear unused like `get_event_extra_fields.json`, but they are downloaded and used for validation by individual SDK repositories.
- It also generates fresh identification events using the TEST_SUBSCRIPTION [env variable](./.env.example), retrieves fresh Server API responses and validates the schema against those.
- Validation runs as a part of PR process and once a day. You can run it locally using `pnpm validateSchema`.

If you are adding things to the schema, you can also try adding the appropriate validations for the changes to the `validateSchema.ts` script. If you run into problems, the maintainers will be happy to help or to add the validations themselves as part of the PR review.
