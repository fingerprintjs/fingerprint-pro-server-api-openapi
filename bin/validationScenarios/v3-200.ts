import { FingerprintJsServerApiClient, SearchEventsFilter } from '@fingerprintjs/fingerprintjs-pro-server-api';
import { REGION_MAP } from '../validationTools/constants';
import { ValidationContext } from '../validationTools/types';
import { createValidatorV3 } from '../validationTools/validation';

/**
 * Validate EventGetResponse schema
 */
export async function validateEventResponseSchemaV3({ testSubscriptions, validateJson, fail }: ValidationContext) {
  const schemaName = 'EventsGetResponse';
  const eventValidator = createValidatorV3(schemaName, 'validateEventResponseSchemaV3');

  // Validate against live Server API responses
  for (const subscription of testSubscriptions) {
    const client = new FingerprintJsServerApiClient({
      apiKey: subscription.serverApiKey,
      region: REGION_MAP[subscription.region || 'us'],
    });

    try {
      const eventResponse = await client.getEvent(subscription.requestId);
      validateJson({
        json: eventResponse,
        jsonName: `🌐 Live Server API EventResponse for GET event '${subscription.name}' > '${subscription.requestId}'`,
        validator: eventValidator,
        schemaName,
      });
    } catch (error) {
      console.error(error);
      fail(`❌ Error while validating live Server API EventResponse for ${subscription.name}`);
    }
  }
}

/**
 * Validate Visits schema
 */
export async function validateVisitsResponseSchemaV3({ testSubscriptions, validateJson, fail }: ValidationContext) {
  const schemaName = 'VisitorsGetResponse';
  const visitsResponseValidator = createValidatorV3(schemaName, 'validateVisitsResponseSchema');

  // Validate against live Server API responses
  for (const subscription of testSubscriptions) {
    const client = new FingerprintJsServerApiClient({
      apiKey: subscription.serverApiKey,
      region: REGION_MAP[subscription.region || 'us'],
    });

    try {
      const visitsResponse = await client.getVisitorHistory(subscription.visitorId, { limit: 3 });
      validateJson({
        json: visitsResponse,
        jsonName: `🌐 Live Server API Visits Response for GET visitor '${subscription.name}' > '${subscription.visitorId}'`,
        validator: visitsResponseValidator,
        schemaName: 'VisitorsGetResponse',
      });
    } catch (error) {
      console.error(error);
      fail(`❌ Error while validating live Server API VisitsResponse for ${subscription.name}`);
    }
  }
}

export async function validateSearchEventsResponseSchemaV3({ testSubscriptions, validateJson }: ValidationContext) {
  const schemaName = 'SearchEventsResponse';
  const searchEventsResponseValidator = createValidatorV3(schemaName, 'validateSearchEventsResponseSchemaV3');

  // Validate against live Server API responses
  for (const subscription of testSubscriptions) {
    const client = new FingerprintJsServerApiClient({
      apiKey: subscription.serverApiKey,
      region: REGION_MAP[subscription.region || 'us'],
    });

    const filters = [
      { limit: 10 },
      { limit: 10, bot: 'bad' },
      { limit: 10, ip_address: '127.0.0.1/32' },
      { limit: 10, end: new Date().getTime() },
      { limit: 10, start: new Date().getTime() },
      { limit: 10, linked_id: '123' },

      { limit: 10, visitor_id: subscription.visitorId },
      { limit: 10, reverse: true },
      { limit: 10, suspect: true },
      { limit: 10, pagination_key: '123' },
      { limit: 10, vpn: true },
      { limit: 10, virtual_machine: true },
      { limit: 10, tampering: true },
      { limit: 10, anti_detect_browser: true },
      { limit: 10, incognito: true },
      { limit: 10, privacy_settings: true },
      { limit: 10, jailbroken: true },
      { limit: 10, frida: true },
      { limit: 10, factory_reset: true },
      { limit: 10, cloned_app: true },
      { limit: 10, emulator: true },
      { limit: 10, root_apps: true },
      { limit: 10, vpn_confidence: 'high' },
      { limit: 10, min_suspect_score: 0.5 },
      { limit: 10, ip_blocklist: true },
      { limit: 10, datacenter: true },
    ] satisfies SearchEventsFilter[];

    for (const filter of filters) {
      const searchEventsResponse = await client.searchEvents(filter);
      validateJson({
        json: searchEventsResponse,
        jsonName: `🌐 Live Server API Response for GET search-events with filter '${JSON.stringify(filter)}'`,
        validator: searchEventsResponseValidator,
        schemaName,
      });
      // Wait for 100ms to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
}

export async function validateRelatedVisitorsResponseSchemaV3({ testSubscriptions, validateJson }: ValidationContext) {
  const schemaName = 'RelatedVisitorsResponse';
  const relatedVisitorsResponseValidator = createValidatorV3(schemaName, 'validateRelatedVisitorsResponseSchemaV3');

  // Validate against live Server API responses
  for (const subscription of testSubscriptions) {
    const client = new FingerprintJsServerApiClient({
      apiKey: subscription.serverApiKey,
      region: REGION_MAP[subscription.region || 'us'],
    });

    const relatedVisitorsResponse = await client.getRelatedVisitors({ visitor_id: subscription.visitorId });
    validateJson({
      json: relatedVisitorsResponse,
      jsonName: `🌐 Response for GET related-visitors '${subscription.name}' > '${subscription.visitorId}'`,
      validator: relatedVisitorsResponseValidator,
      schemaName,
    });
  }
}
