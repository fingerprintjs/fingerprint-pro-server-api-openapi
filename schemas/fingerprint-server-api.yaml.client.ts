import { makeApi, Zodios, type ZodiosOptions } from '@zodios/core';
import { z } from 'zod';

const BrowserDetails = z
  .object({
    browserName: z.string(),
    browserMajorVersion: z.string(),
    browserFullVersion: z.string(),
    os: z.string(),
    osVersion: z.string(),
    device: z.string(),
    userAgent: z.string(),
    botProbability: z.number().int().optional(),
  })
  .strict();
const Location = z.object({ code: z.string().min(2).max(2), name: z.string() }).strict();
const Subdivision = z.object({ isoCode: z.string(), name: z.string() }).partial().strict();
const IPLocation = z
  .object({
    accuracyRadius: z.number().int().gte(0),
    latitude: z.number().gte(-90).lte(90),
    longitude: z.number().gte(-180).lte(180),
    postalCode: z.string(),
    timezone: z.string(),
    city: z.object({ name: z.string() }).partial().strict(),
    country: Location,
    continent: Location,
    subdivisions: z.array(Subdivision),
  })
  .partial()
  .strict();
const Confidence = z.object({ score: z.number().gte(0).lte(1) }).strict();
const SeenAt = z
  .object({
    global: z.string().datetime({ offset: true }).nullable(),
    subscription: z.string().datetime({ offset: true }).nullable(),
  })
  .strict();
const Visit = z
  .object({
    requestId: z.string(),
    browserDetails: BrowserDetails,
    incognito: z.boolean(),
    ip: z.string(),
    ipLocation: IPLocation.optional(),
    timestamp: z.number().int(),
    time: z.string().datetime({ offset: true }),
    url: z.string().url(),
    tag: z.object({}).partial().strict().passthrough().optional(),
    linkedId: z.string().optional(),
    confidence: Confidence,
    visitorFound: z.boolean(),
    firstSeenAt: SeenAt,
    lastSeenAt: SeenAt,
  })
  .strict()
  .passthrough();
const IdentificationError = z
  .object({ code: z.enum(['429 Too Many Requests', 'Failed']), message: z.string() })
  .strict();
const BotdDetectionResult = z
  .object({ result: z.enum(['notDetected', 'good', 'bad']), type: z.string().optional() })
  .strict();
const BotdResult = z
  .object({
    ip: z.string(),
    time: z.string().datetime({ offset: true }),
    url: z.string(),
    userAgent: z.string().optional(),
    requestId: z.string().optional(),
    bot: BotdDetectionResult,
  })
  .strict()
  .passthrough();
const ProductError = z
  .object({ code: z.enum(['TooManyRequests', 'Failed']), message: z.string() })
  .strict()
  .passthrough();
const ASN = z.object({ asn: z.string(), network: z.string(), name: z.string().optional() }).strict();
const DataCenter = z.object({ result: z.boolean(), name: z.string().optional() }).strict();
const IpInfoResult = z
  .object({
    v4: z.object({ address: z.string(), geolocation: IPLocation, asn: ASN, datacenter: DataCenter }).partial().strict(),
    v6: z.object({ address: z.string(), geolocation: IPLocation, asn: ASN, datacenter: DataCenter }).partial().strict(),
  })
  .partial()
  .strict();
const IpBlockListResult = z
  .object({
    result: z.boolean(),
    details: z.object({ emailSpam: z.boolean(), attackSource: z.boolean() }).partial().strict().passthrough(),
  })
  .partial()
  .strict()
  .passthrough();
const VpnResult = z
  .object({
    result: z.boolean(),
    originTimezone: z.string(),
    originCountry: z.string(),
    methods: z
      .object({ timezoneMismatch: z.boolean(), publicVPN: z.boolean(), auxiliaryMobile: z.boolean() })
      .partial()
      .strict()
      .passthrough(),
  })
  .partial()
  .strict()
  .passthrough();
const TamperingResult = z
  .object({ result: z.boolean(), anomalyScore: z.number().gte(0).lte(1) })
  .partial()
  .strict()
  .passthrough();
const HighActivityResult = z
  .object({ result: z.boolean(), dailyRequests: z.number().gte(1) })
  .partial()
  .strict()
  .passthrough();
const LocationSpoofingResult = z.object({ result: z.boolean() }).partial().strict().passthrough();
const SuspectScoreResult = z.object({ result: z.number().int() }).partial().strict().passthrough();
const RawDeviceAttributesResult = z.record(
  z
    .object({ error: z.object({ name: z.string(), message: z.string() }).strict().passthrough(), value: z.unknown() })
    .partial()
    .strict()
    .passthrough()
);
const ProductsResponse = z
  .object({
    identification: z
      .object({
        data: Visit.and(z.object({ visitorId: z.string() }).strict().passthrough()),
        error: IdentificationError,
      })
      .partial()
      .strict(),
    botd: z.object({ data: BotdResult, error: ProductError }).partial().strict(),
    ipInfo: z.object({ data: IpInfoResult, error: ProductError }).partial().strict().passthrough(),
    incognito: z
      .object({ data: z.object({ result: z.boolean() }).partial().strict().passthrough(), error: ProductError })
      .partial()
      .strict()
      .passthrough(),
    rootApps: z
      .object({ data: z.object({ result: z.boolean() }).partial().strict().passthrough(), error: ProductError })
      .partial()
      .strict()
      .passthrough(),
    emulator: z.union([
      z.object({ data: z.object({ result: z.boolean() }).strict() }).strict(),
      z.object({ error: ProductError }).strict(),
    ]),
    clonedApp: z
      .object({ data: z.object({ result: z.boolean() }).strict(), error: ProductError })
      .partial()
      .strict(),
    factoryReset: z
      .object({
        data: z
          .object({ time: z.string().datetime({ offset: true }), timestamp: z.number().int() })
          .partial()
          .strict()
          .passthrough(),
        error: ProductError,
      })
      .partial()
      .strict()
      .passthrough(),
    jailbroken: z
      .object({ data: z.object({ result: z.boolean() }).partial().strict().passthrough(), error: ProductError })
      .partial()
      .strict()
      .passthrough(),
    frida: z
      .object({ data: z.object({ result: z.boolean() }).partial().strict().passthrough(), error: ProductError })
      .partial()
      .strict()
      .passthrough(),
    ipBlocklist: z.object({ data: IpBlockListResult, error: ProductError }).partial().strict().passthrough(),
    tor: z
      .object({ data: z.object({ result: z.boolean() }).partial().strict().passthrough(), error: ProductError })
      .partial()
      .strict()
      .passthrough(),
    privacySettings: z
      .object({ data: z.object({ result: z.boolean() }).partial().strict().passthrough(), error: ProductError })
      .partial()
      .strict()
      .passthrough(),
    virtualMachine: z
      .object({ data: z.object({ result: z.boolean() }).partial().strict().passthrough(), error: ProductError })
      .partial()
      .strict()
      .passthrough(),
    vpn: z.object({ data: VpnResult, error: ProductError }).partial().strict().passthrough(),
    proxy: z
      .object({ data: z.object({ result: z.boolean() }).partial().strict().passthrough(), error: ProductError })
      .partial()
      .strict()
      .passthrough(),
    tampering: z.object({ data: TamperingResult, error: ProductError }).partial().strict().passthrough(),
    highActivity: z.object({ data: HighActivityResult, error: ProductError }).partial().strict().passthrough(),
    locationSpoofing: z.object({ data: LocationSpoofingResult, error: ProductError }).partial().strict().passthrough(),
    suspectScore: z.object({ data: SuspectScoreResult, error: ProductError }).partial().strict().passthrough(),
    rawDeviceAttributes: z.object({ data: RawDeviceAttributesResult }).partial().strict().passthrough(),
  })
  .partial()
  .strict();
const EventResponse = z.object({ products: ProductsResponse }).partial().strict();
const ErrorEvent403Response = z
  .object({
    error: z
      .object({
        code: z.enum(['TokenRequired', 'TokenNotFound', 'SubscriptionNotActive', 'WrongRegion']),
        message: z.string(),
      })
      .strict(),
  })
  .partial()
  .strict();
const ErrorEvent404Response = z
  .object({ error: z.object({ code: z.literal('RequestNotFound'), message: z.string() }).strict() })
  .partial()
  .strict();
const Response = z
  .object({
    visitorId: z.string(),
    visits: z.array(
      Visit.and(
        z
          .object({ tag: z.object({}).partial().strict().passthrough() })
          .strict()
          .passthrough()
      )
    ),
    lastTimestamp: z.number().int().optional(),
    paginationKey: z.string().optional(),
  })
  .strict();
const ErrorVisits403 = z.object({ error: z.string() }).strict();
const ManyRequestsResponse = z.object({ error: z.string() }).strict();

export const schemas = {
  BrowserDetails,
  Location,
  Subdivision,
  IPLocation,
  Confidence,
  SeenAt,
  Visit,
  IdentificationError,
  BotdDetectionResult,
  BotdResult,
  ProductError,
  ASN,
  DataCenter,
  IpInfoResult,
  IpBlockListResult,
  VpnResult,
  TamperingResult,
  HighActivityResult,
  LocationSpoofingResult,
  SuspectScoreResult,
  RawDeviceAttributesResult,
  ProductsResponse,
  EventResponse,
  ErrorEvent403Response,
  ErrorEvent404Response,
  Response,
  ErrorVisits403,
  ManyRequestsResponse,
};

const endpoints = makeApi([
  {
    method: 'get',
    path: '/events/:request_id',
    alias: 'getEvent',
    description: `This endpoint allows you to get a detailed analysis of an individual request. 
**Only for Enterprise customers:** Please note that the response includes mobile signals (e.g. &#x60;rootApps&#x60;) even if the request orignated from a non-mobile platform.
It is highly recommended that you **ignore** the mobile signals for such requests. 

Use &#x60;requestId&#x60; as the URL path parameter. This API method is scoped to a request, i.e. all returned information is by &#x60;requestId&#x60;.
`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'request_id',
        type: 'Path',
        schema: z.string(),
      },
    ],
    response: EventResponse,
    errors: [
      {
        status: 403,
        description: `Forbidden`,
        schema: ErrorEvent403Response,
      },
      {
        status: 404,
        description: `Not found`,
        schema: ErrorEvent404Response,
      },
    ],
  },
  {
    method: 'get',
    path: '/visitors/:visitor_id',
    alias: 'getVisits',
    description: `This endpoint allows you to get a history of visits for a specific &#x60;visitorId&#x60;. Use the &#x60;visitorId&#x60; as a URL path parameter.
Only information from the _Identification_ product is returned.

#### Headers

* &#x60;Retry-After&#x60; — Present in case of &#x60;429 Too many requests&#x60;. Indicates how long you should wait before making a follow-up request. The value is non-negative decimal integer indicating the seconds to delay after the response is received.
`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'visitor_id',
        type: 'Path',
        schema: z.string(),
      },
      {
        name: 'request_id',
        type: 'Query',
        schema: z.string().optional(),
      },
      {
        name: 'linked_id',
        type: 'Query',
        schema: z.string().optional(),
      },
      {
        name: 'limit',
        type: 'Query',
        schema: z.number().int().gte(0).optional(),
      },
      {
        name: 'paginationKey',
        type: 'Query',
        schema: z.string().optional(),
      },
      {
        name: 'before',
        type: 'Query',
        schema: z.number().int().gte(0).optional(),
      },
    ],
    response: Response,
    errors: [
      {
        status: 403,
        description: `Forbidden. The API Key is probably missing or incorrect.`,
        schema: z.object({ error: z.string() }).strict(),
      },
      {
        status: 429,
        description: `Too Many Requests`,
        schema: z.object({ error: z.string() }).strict(),
      },
    ],
  },
  {
    method: 'trace',
    path: '/webhook',
    alias: 'traceWebhook',
    description: `Fake path to describe webhook format. More information about webhooks can be found in the [documentation](https://dev.fingerprint.com/docs/webhooks)`,
    requestFormat: 'json',
    response: z.void(),
  },
]);

export const api = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
