<p align="center">
  <a href="https://fingerprint.com">
    <picture>
     <source media="(prefers-color-scheme: dark)" srcset="res/logo_light.svg" />
     <source media="(prefers-color-scheme: light)" srcset="res/logo_dark.svg" />
     <img src="res/logo_dark.svg" alt="Fingerprint logo" width="312px" />
   </picture>
  </a>
</p>
<p align="center">
  <a href="https://github.com/fingerprintjs/fingerprint-pro-server-api-openapi/actions/workflows/validate.yml"><img src="https://github.com/fingerprintjs/fingerprint-pro-server-api-openapi/actions/workflows/validate.yml/badge.svg" alt="CI badge" /></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/:license-mit-blue.svg?style=flat"/></a>
  <a href="https://discord.gg/39EpE2neBg"><img src="https://img.shields.io/discord/852099967190433792?style=logo&label=Discord&logo=Discord&logoColor=white" alt="Discord server"></a>
</p>

# Fingerprint Server API OpenAPI Schema

[Fingerprint](https://fingerprint.com) is a device intelligence platform offering industry-leading accuracy. Fingerprint [Server API](https://dev.fingerprint.com/reference/pro-server-api) allows you to search, update, and delete identification events in a server environment.

This repository contains the [OpenAPI](https://swagger.io/docs/specification/about/) schema of the Fingerprint Server API. You can use it as a reference, to try the API or to generate types for your code. It's the basis for all available [Fingerprint Server SDKs](https://dev.fingerprint.com/docs/backend-libraries).

## Getting started

- The OpenAPI schema is published to the [Fingerprint API reference](https://dev.fingerprint.com/reference/pro-server-api) and also as a [Swagger UI app on GitHub pages](https://fingerprintjs.github.io/fingerprint-pro-server-api-openapi/).
- You can also [download the latest schema file here](https://fingerprintjs.github.io/fingerprint-pro-server-api-openapi/schemas/fingerprint-server-api.yaml).

> [!NOTE]  
> Please note that some signals and attributes present in the schema are only available to Enterprise or Pro Plus customers on request, as indicated in the signal description.

## Editing the schema

See [CONTRIBUTING.md](CONTRIBUTING.md) for more information.

## FAQ

#### Why OpenAPI 3.0.3 version?

It is the last version supported by `swagger-codegen`. See more information in the [related GitHub issue](https://github.com/swagger-api/swagger-codegen/issues/11627).

## Support and feedback

To report problems, ask questions, or provide feedback, please use [Issues](https://github.com/fingerprintjs/fingerprint-pro-server-api-openapi/issues). If you need private support, you can email us at [oss-support@fingerprint.com](mailto:oss-support@fingerprint.com).

## License

This project is licensed under the [MIT license](./LICENSE).
