# fingerprint-pro-server-api-openapi

## 2.5.0

### Minor Changes

- **events-search**: Event search now supports a new set of filter parameters: `vpn`, `virtual_machine`, `tampering`, `anti_detect_browser`, `incognito`, `privacy_settings`, `jailbroken`, `frida`, `factory_reset`, `cloned_app`, `emulator`, `root_apps`, `vpn_confidence`, `min_suspect_score`. ([1fbba3a](https://github.com/fingerprintjs/fingerprint-pro-server-api-openapi/commit/1fbba3a8a148addc3435dcd3994aae0466fb105c))

### Patch Changes

- **events**: Update Tampering descriptions to reflect Android support. ([52d19e7](https://github.com/fingerprintjs/fingerprint-pro-server-api-openapi/commit/52d19e77c5f42d72299103093a115d263153e9c0))
- **webhook**: Add `environmentId` property ([20c49ca](https://github.com/fingerprintjs/fingerprint-pro-server-api-openapi/commit/20c49ca0201bff3dbccd2585c828514109d14645))

## 2.4.1

### Patch Changes

- **webhook**: Apply x-flatten-optional-params: true in correct place in the webhook.yaml ([ab92861](https://github.com/fingerprintjs/fingerprint-pro-server-api-openapi/commit/ab92861b58aac17c29e893cb1b50e1d669aa8066))

## 2.4.0

### Minor Changes

- Add `mitmAttack` (man-in-the-middle attack) Smart Signal. ([5c06fc5](https://github.com/fingerprintjs/fingerprint-pro-server-api-openapi/commit/5c06fc587b70c084ac25c1c6a08b3b281ae80488))

## 2.3.0

### Minor Changes

- **events-search**: Add 'pagination_key' parameter ([031c4ef](https://github.com/fingerprintjs/fingerprint-pro-server-api-openapi/commit/031c4efafa7dee2aac18a65ac54b4aeda1946d42))

## 2.2.1

### Patch Changes

- **events-search**: Improve parameter descriptions for `bot`, `suspect` ([8633780](https://github.com/fingerprintjs/fingerprint-pro-server-api-openapi/commit/863378093a0397c5cb3c642c778c35f53e2ef072))

## 2.2.0

### Minor Changes

- Add `relay` detection method to the VPN Detection Smart Signal ([adf30a1](https://github.com/fingerprintjs/fingerprint-pro-server-api-openapi/commit/adf30a1b58cf122d5f9b26343edf844fd0f6b4df))
- **events-search**: Add a new `events/search` API endpoint. Allow users to search for identification events matching one or more search criteria, for example, visitor ID, IP address, bot detection result, etc. ([3634610](https://github.com/fingerprintjs/fingerprint-pro-server-api-openapi/commit/36346101110e3061c5ae497d52d8b2ebb088e688))
- **events**: Add a `suspect` field to the `identification` product schema ([3634610](https://github.com/fingerprintjs/fingerprint-pro-server-api-openapi/commit/36346101110e3061c5ae497d52d8b2ebb088e688))

## 2.1.0

### Minor Changes

- Remove `ipv4` format from `ip` field in `Botd`, `Identification`, `Visit` and `Webhook` models. ([ed991f6](https://github.com/fingerprintjs/fingerprint-pro-server-api-openapi/commit/ed991f6914c696a4dfbd003ded4a1c117b52a1df))

### Patch Changes

- Fix errors examples `403_feature_not_enabled` and `403_subscription_not_active`. ([a2d7e87](https://github.com/fingerprintjs/fingerprint-pro-server-api-openapi/commit/a2d7e87e146fe184bbf85593fc4eb58f349d4000))

## 2.0.0

### Major Changes

- - Remove the `BrowserDetails` field `botProbability`.
  - Update the `IdentificationConfidence` field `score` type format: `float` -> `double`.
  - Make the `RawDeviceAttributeError` field `name` **optional** .
  - Make the `RawDeviceAttributeError` field `message` **optional** .
  - **events**: Remove the `EventsResponse` field `error`.
    - [note]: The errors are represented by `ErrorResponse` model.
  - **events**: Update the `HighActivity` field `dailyRequests` type format: `number` -> `int64`.
  - **events**: Specify the `Tampering` field `anomalyScore` type format: `double`.
  - **webhook**: Make the `Webhook` fields **optional**: `visitorId`, `visitorFound`, `firstSeenAt`, `lastSeenAt`, `browserDetails`, `incognito`.
  - **webhook**: Make the `WebhookClonedApp` field `result` **optional**.
  - **webhook**: Make the `WebhookDeveloperTools` field `result` **optional**.
  - **webhook**: Make the `WebhookEmulator` field `result` **optional**.
  - **webhook**: Make the `WebhookFactoryReset` fields `time` and `timestamp` **optional**.
  - **webhook**: Make the `WebhookFrida` field `result` **optional**.
  - **webhook**: Update the `WebhookHighActivity` field `dailyRequests` type format: `number` -> `int64`.
  - **webhook**: Make the `WebhookIPBlocklist` fields `result` and `details` **optional**.
  - **webhook**: Make the `WebhookJailbroken` field `result` **optional**.
  - **webhook**: Make the `WebhookLocationSpoofing` field `result` **optional**.
  - **webhook**: Make the `WebhookPrivacySettings` field `result` **optional**.
  - **webhook**: Make the `WebhookProxy` field `result` **optional**.
  - **webhook**: Make the `WebhookRemoteControl` field `result` **optional**.
  - **webhook**: Make the `WebhookRootApps` field `result` **optional**.
  - **webhook**: Make the `WebhookSuspectScore` field `result` **optional**.
  - **webhook**: Make the `WebhookTampering` fields `result`, `anomalyScore` and `antiDetectBrowser` **optional**.
  - **webhook**: Specify the `WebhookTampering` field `anomalyScore` type format: `double`.
  - **webhook**: Make the `WebhookTor` field `result` **optional**.
  - **webhook**: Make the `WebhookVelocity` fields **optional**: `distinctIp`, `distinctLinkedId`, `distinctCountry`, `events`, `ipEvents`, `distinctIpByLinkedId`, `distinctVisitorIdByLinkedId`.
  - **webhook**: Make the `WebhookVirtualMachine` field `result` **optional**.
  - **webhook**: Make the `WebhookVPN` fields **optional**: `result`, `confidence`, `originTimezone`, `methods`. ([5205383](https://github.com/fingerprintjs/fingerprint-pro-server-api-openapi/commit/52053838050364bec51a1517ac21f5024fc9b709))
- - Rename `BotdResult` -> `Botd`.
  - Rename `BotdDetectionResult` -> `BotdBot`:
    - Extract `result` type as `BotdBotResult`.
  - Rename `ClonedAppResult` -> `ClonedApp`.
  - Rename `DeveloperToolsResult` -> `DeveloperTools`.
  - Rename `EmulatorResult` -> `Emulator`.
  - Refactor error models:
    - Remove `ErrorCommon403Response`, `ErrorCommon429Response`, `ErrorEvent404Response`, `TooManyRequestsResponse`, `ErrorVisits403`, `ErrorUpdateEvent400Response`, `ErrorUpdateEvent409Response`, `ErrorVisitor400Response`, `ErrorVisitor404Response`, `IdentificationError`, `ProductError`.
    - Introduce `ErrorResponse` and `ErrorPlainResponse`.
      - [note]: `ErrorPlainResponse` has a different format `{ "error": string }` and it is used only in `GET /visitors`.
    - Extract `error` type as `Error`.
    - Extract `error.code` type as `ErrorCode`.
  - Rename `EventResponse` -> `EventsGetResponse`.
  - Rename `EventUpdateRequest` -> `EventsUpdateRequest`.
  - Rename `FactoryResetResult` -> `FactoryReset`.
  - Rename `FridaResult` -> `Frida`.
  - Rename `IPLocation` -> `Geolocation`:
    - Rename `IPLocationCity` -> `GeolocationCity`.
    - Extract `subdivisions` type as `GeolocationSubdivisions`.
    - Rename `Location` -> `GeolocationContinent`:
    - Introduce a dedicated type `GeolocationCountry`.
    - Rename `Subdivision` -> `GeolocationSubdivision`.
  - Rename `HighActivityResult` -> `HighActivity`.
  - Rename `Confidence` -> `IdentificationConfidence`.
  - Rename `SeenAt` -> `IdentificationSeenAt`.
  - Rename `IncognitoResult` -> `Incognito`.
  - Rename `IpBlockListResult` -> `IPBlocklist`:
    - Extract `details` type as `IPBlocklistDetails`.
  - Rename `IpInfoResult` -> `IPInfo`:
    - Rename `IpInfoResultV4` -> `IPInfoV4`.
    - Rename `IpInfoResultV6` -> `IPInfoV6`.
    - Rename `ASN` -> `IPInfoASN`.
    - Rename `DataCenter` -> `IPInfoDataCenter`.
  - Rename `JailbrokenResult` -> `Jailbroken`.
  - Rename `LocationSpoofingResult` -> `LocationSpoofing`.
  - Rename `PrivacySettingsResult` -> `PrivacySettings`.
  - Rename `ProductsResponse` -> `Products`:
    - Rename inner types: `ProductsResponseIdentification` -> `ProductIdentification`, `ProductsResponseIdentificationData` -> `Identification`, `ProductsResponseBotd` -> `ProductBotd`, `SignalResponseRootApps` -> `ProductRootApps`, `SignalResponseEmulator` -> `ProductEmulator`, `SignalResponseIpInfo` -> `ProductIPInfo`, `SignalResponseIpBlocklist` -> `ProductIPBlocklist`, `SignalResponseTor` -> `ProductTor`, `SignalResponseVpn` -> `ProductVPN`, `SignalResponseProxy` -> `ProductProxy`, `ProxyResult` -> `Proxy`, `SignalResponseIncognito` -> `ProductIncognito`, `SignalResponseTampering` -> `ProductTampering`, `SignalResponseClonedApp` -> `ProductClonedApp`, `SignalResponseFactoryReset` -> `ProductFactoryReset`, `SignalResponseJailbroken` -> `ProductJailbroken`, `SignalResponseFrida` -> `ProductFrida`, `SignalResponsePrivacySettings` -> `ProductPrivacySettings`, `SignalResponseVirtualMachine` -> `ProductVirtualMachine`, `SignalResponseRawDeviceAttributes` -> `ProductRawDeviceAttributes`, `RawDeviceAttributesResultValue` -> `RawDeviceAttributes`, `SignalResponseHighActivity` -> `ProductHighActivity`, `SignalResponseLocationSpoofing` -> `ProductLocationSpoofing`, `SignalResponseSuspectScore` -> `ProductSuspectScore`, `SignalResponseRemoteControl` -> `ProductRemoteControl`, `SignalResponseVelocity` -> `ProductVelocity`, `SignalResponseDeveloperTools` -> `ProductDeveloperTools`.
    - Extract `identification.data` type as `Identification`.
  - Rename `RawDeviceAttributesResult` -> `RawDeviceAttributes`:
    - Extract item type as `RawDeviceAttribute`.
    - Extract `error` type as `RawDeviceAttributeError`.
  - Rename `RemoteControlResult` -> `RemoteControl`.
  - Rename `RootAppsResult` -> `RootApps`.
  - Rename `SuspectScoreResult` -> `SuspectScore`.
  - Extract new model `Tag`.
  - Rename `TamperingResult` -> `Tampering`.
  - Rename `TorResult` -> `Tor`.
  - Rename `VelocityResult` -> `Velocity`:
    - Rename `VelocityIntervals` -> `VelocityData`.
    - Rename `VelocityIntervalResult` -> `VelocityIntervals`.
  - Rename `VirtualMachineResult` -> `VirtualMachine`.
  - Rename the `Visit` field `ipLocation` type `DeprecatedIPLocation` -> `DeprecatedGeolocation`.
    - Instead of `DeprecatedIPLocationCity` use common `GeolocationCity`
  - Rename `Response` -> `VisitorsGetResponse`.
    - Omit extra inner type `ResponseVisits`
  - Rename `VpnResult` -> `VPN`.
    - Extract `confidence` type as `VPNConfidence`.
    - Extract `methods` type as `VPNMethods`.
  - Rename `WebhookVisit` -> `Webhook`.
    - Introduce new inner types: `WebhookRootApps`, `WebhookEmulator`, `WebhookIPInfo`, `WebhookIPBlocklist`, `WebhookTor`, `WebhookVPN`, `WebhookProxy`, `WebhookTampering`, `WebhookClonedApp`, `WebhookFactoryReset`, `WebhookJailbroken`, `WebhookFrida`, `WebhookPrivacySettings`, `WebhookVirtualMachine`, `WebhookRawDeviceAttributes`, `WebhookHighActivity`, `WebhookLocationSpoofing`, `WebhookSuspectScore`, `WebhookRemoteControl`, `WebhookVelocity`, `WebhookDeveloperTools`. ([aa869ec](https://github.com/fingerprintjs/fingerprint-pro-server-api-openapi/commit/aa869ece12f90956d9cfb86dcc7e2ab754325c48))

### Minor Changes

- Added new `ipEvents`, `distinctIpByLinkedId`, and `distinctVisitorIdByLinkedId` fields to the `velocity` Smart Signal. ([02dc195](https://github.com/fingerprintjs/fingerprint-pro-server-api-openapi/commit/02dc195c58f636b5a42017b0decba55671a286f5))
- - Make the `GeolocationCity` field `name` **required**.
  - Make the `GeolocationSubdivision` field `isoCode` **required**.
  - Make the `GeolocationSubdivision` field `name` **required**.
  - Make the `IPInfoASN` field `name` **required** .
  - Make the `IPInfoDataCenter` field `name` **required**.
  - Add **optional** `IdentificationConfidence` field `comment`.
  - **events**: Add **optional** `Botd` field `meta`.
  - **events**: Add **optional** `Identification` field `components`.
  - **events**: Make the `VPN` field `originCountry` **required**.
  - **visitors**: Add **optional** `Visit` field `components`.
  - **webhook**: Add **optional** `Webhook` field `components`. ([5205383](https://github.com/fingerprintjs/fingerprint-pro-server-api-openapi/commit/52053838050364bec51a1517ac21f5024fc9b709))

### Patch Changes

- - Fix descriptions formatting:
    - Remove extra line breaks.
    - Fix block styles.
  - Fix links in descriptions. ([202d335](https://github.com/fingerprintjs/fingerprint-pro-server-api-openapi/commit/202d335c773bbf6c677fd32b66f4c5cde64b6792))
- - Remove all `example` YAML attributes from all the properties due to [deprecation](https://spec.openapis.org/oas/v3.1.0#fixed-fields-19).
    - Keep using JSON Schema `examples` with the `externalValue` associated with JSON example from `/schemas/paths/examples`.
  - Reorder all the `schemas` fields (e.g. `type` -> `format` -> `description` -> `required` -> `properties`).
  - Reorder all the `paths` fields (e.g. `tags` -> `summary` -> `description` -> `parameters` -> ...)
  - Reorder all the object properties in the order they returned by API.
  - Move existing and add new error examples to `/schemas/paths/examples/errors`.
  - Replace GET /events TooManyRequests examples with a single `get_event_200_too_many_requests_error.json`.
  - Update `products.identification.error.message` in `get_event_200_<...>.json` examples.
  - Rename GET /visitors example files. ([aa869ec](https://github.com/fingerprintjs/fingerprint-pro-server-api-openapi/commit/aa869ece12f90956d9cfb86dcc7e2ab754325c48))

## 1.3.1

### Patch Changes

- **related-visitors**: Add mention that the API is billable ([ac4380a](https://github.com/fingerprintjs/fingerprint-pro-server-api-openapi/commit/ac4380a6c9bacca2a7810523b069ec3bb948c294))

## 1.3.0

### Minor Changes

- **related-visitors**: Add GET `/related-visitors` endpoint ([d576d69](https://github.com/fingerprintjs/fingerprint-pro-server-api-openapi/commit/d576d69b495c7b8609a481505ca7d536e33b21e6))
- **events**: Add `antiDetectBrowser` detection method to the `tampering` Smart Signal. ([c11f7f8](https://github.com/fingerprintjs/fingerprint-pro-server-api-openapi/commit/c11f7f8b657104abb4df1d08c98ac78ee1adad0e))

## 1.2.0

### Minor Changes

- **visitors**: Add the confidence field to the VPN Detection Smart Signal ([50feba2](https://github.com/fingerprintjs/fingerprint-pro-server-api-openapi/commit/50feba20615c531a630ec19357e0de7520e4b09f))

## 1.1.0

### Minor Changes

- **events**: Introduce `PUT` endpoint for `/events` API ([e8bc23f](https://github.com/fingerprintjs/fingerprint-pro-server-api-openapi/commit/e8bc23f115c3b01f9d0d472b02093d0d05d3f4a5))
