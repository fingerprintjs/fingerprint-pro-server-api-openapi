# Contributing to Fingerprint Pro Server API OpenAPI

The repository contains OpenAPI definition files for various [Fingerprint Pro Server-side APIs](https://dev.fingerprint.com/reference).

## Schemas

You can find the schemas definitions in the [schemas](/schemas) folder. You can find information about OpenAPI 3.0.3 in the [official specification](https://spec.openapis.org/oas/v3.0.3).

## Contributing to the schema definition

- If you are not familiar with the OpenAPI format, you can watch this [video summary](https://www.youtube.com/watch?v=pRS9LRBgjYg) (1.5x speed recommended).
- Authoring schemas is easier with IDE support. For VS Code, you can use [OpenAPI (Swagger) Editor](https://marketplace.visualstudio.com/items?itemName=42Crunch.vscode-openapi). You can look for similar extensions for your IDE of choice.
- OpenAPI schema is repetitive, the easiest way to add something (schema, endpoint, response, property...) is to copy-paste an existing entity and modify it. Try to follow the established patterns for naming, ordering, example values, example files, etc.
- You can reference the [OpenAPI specification](https://spec.openapis.org/oas/v3.0.3) for more information.
- If you are adding a new signal, please also add it to `get_event_200.json`, `webhook.json`, `get_event_200_all_errors.json` and other relevant files in the `examples` folder.

### Previewing changes

Use the included [Swagger UI](https://github.com/swagger-api/swagger-ui) demo app to dynamically render your changes into a documentation site a preview them there. Some mistakes and inconsistencies are much easier to spot in rendered documentation than by looking at the raw schema.

1. Clone this repository: `git clone https://github.com/fingerprintjs/fingerprint-pro-server-api-openapi.git`
2. Install dependencies: `pnpm install`
3. Run `pnpm dev` to start the demo app

Code of demo application is in [src](src) folder.

### Linting the schema

- Your IDE (with the right extensions/plugins) should warn you if your schema does not follow the OpenAPI specification.
- You can also run `pnpm run lintSchema` to run your schema through a linter.
- This check also runs in the CI pipeline for your PR.

### Schema Validation

The schema is currently created separately from the API code. This is a bad practice, but we will fix it in future API versions.
To validate that schema matches the actual API implementation we use a [special validation script](/bin/validateSchema.ts).

- It validates the schema against JSON examples file from [examples](/examples) folder. Note that some files in the examples folder appear unused like `get_event_extra_fields.json`, but they are downloaded and used for validation by individual SDK repositories.
- It also generates fresh identification events using the TEST_SUBSCRIPTION [env variable](./.env.example), retrieves fresh Server API responses and validates the schema against those.
- You can run `pnpm run validateSchema` to validate the schema locally.
  - You can create a `.env` file according to `.env.example` and set the TEST_SUBSCRIPTIONS variable to include your personal Fingerprint subscription.
  - Or you can ask the DX team to provide you with the same test subscriptions as are used in the CI pipeline.
- This check also runs in the CI pipeline for your PR and once a day as a scheduled job.
- If you are adding things to the schema, you can also try adding the appropriate validations for the changes to the `validateSchema.ts` script. If you run into problems, the repository maintainers will be happy to help or to add the validations themselves as part of the PR review.

### Publishing changes

- We use [changesets](https://github.com/changesets/changesets) for handling release notes. We have a handy script that simplifies the process of creating notes available via `pnpm changeset`
- When a PR is merged into `main`, the latest schema is automatically published to the [GitHub pages](https://fingerprintjs.github.io/fingerprint-pro-server-api-openapi/).
- The changes are currently NOT automatically published to the [Documentation API Reference](https://dev.fingerprint.com/reference) repository. You need to publish them manually using Readme CLI or Readme dashboard. The DX team is happy to assist.
