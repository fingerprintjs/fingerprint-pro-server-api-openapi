---
'fingerprint-pro-server-api-openapi': major
---

- Rename `BotdResult` -> `Botd`.
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
  - Extract `city` type as `GeolocationCity`.
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
  - Extract `v4` type as `IPInfoV4`.
  - Extract `v6` type as `IPInfoV6`.
  - Rename `ASN` -> `IPInfoASN`.
  - Rename `DataCenter` -> `IPInfoDataCenter`.
- Rename `JailbrokenResult` -> `Jailbroken`.
- Rename `LocationSpoofingResult` -> `LocationSpoofing`.
- Rename `PrivacySettingsResult` -> `PrivacySettings`.
- Rename `ProductsResponse` -> `Products`:
  - Extract inner types: `ProductIdentification`, `ProductBotd`, `ProductRootApps`, `ProductEmulator`, `ProductIPInfo`, `ProductIPBlocklist`, `ProductTor`, `ProductVPN`, `ProductProxy`, `ProductIncognito`, `ProductTampering`, `ProductClonedApp`, `ProductFactoryReset`, `ProductJailbroken`, `ProductFrida`, `ProductPrivacySettings`, `ProductVirtualMachine`, `ProductRawDeviceAttributes`, `ProductHighActivity`, `ProductLocationSpoofing`, `ProductSuspectScore`, `ProductRemoteControl`, `ProductVelocity`, `ProductDeveloperTools`.
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
- Extract the `Visit` field `ipLocation` type as `DeprecatedGeolocation`.
- Rename `Response` -> `VisitorsGetResponse`.
- Rename `VpnResult` -> `VPN`.
  - Extract `confidence` type as `VPNConfidence`.
  - Extract `methods` type as `VPNMethods`.
- Rename `WebhookVisit` -> `Webhook`.
  - Introduce new inner types: `WebhookRootApps`, `WebhookEmulator`, `WebhookIPInfo`, `WebhookIPBlocklist`, `WebhookTor`, `WebhookVPN`, `WebhookProxy`, `WebhookTampering`, `WebhookClonedApp`, `WebhookFactoryReset`, `WebhookJailbroken`, `WebhookFrida`, `WebhookPrivacySettings`, `WebhookVirtualMachine`, `WebhookRawDeviceAttributes`, `WebhookHighActivity`, `WebhookLocationSpoofing`, `WebhookSuspectScore`, `WebhookRemoteControl`, `WebhookVelocity`, `WebhookDeveloperTools`.