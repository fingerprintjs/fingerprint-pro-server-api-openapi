import { SearchEventsFilter } from '@fingerprintjs/fingerprintjs-pro-server-api';
import { REGION_MAP } from '../validationTools/constants';
import { createValidatorV4 } from '../validationTools/validation';
import { ValidationContext } from '../validationTools/types';
import fs from 'fs';
import { FingerprintJsServerApiClientV4 } from '../validationTools/clientV4';

/**
 * Validate Event schema
 */
export async function validateEventSchemaV4({ testSubscriptions, validateJson, fail }: ValidationContext) {
  const schemaName = 'Event';
  const eventValidator = createValidatorV4(schemaName, 'validateEventSchemaV4');

  // Validate against example files
  ['./schemas/paths/examples/events/get_event_200.json', './schemas/paths/examples/webhook/webhook_event.json'].forEach(
    (examplePath) =>
      validateJson({
        json: JSON.parse(fs.readFileSync(examplePath).toString()),
        jsonName: examplePath,
        validator: eventValidator,
        schemaName,
      })
  );

  // Validate against live Server API responses
  for (const subscription of testSubscriptions) {
    const client = new FingerprintJsServerApiClientV4({
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

export async function validateEventSearchSchemaV4({ testSubscriptions, validateJson }: ValidationContext) {
  const schemaName = 'EventSearch';
  const searchEventsResponseValidator = createValidatorV4(schemaName, 'validateEventSearchSchemaV4');

  // Validate against example file
  ['./schemas/paths/examples/events/search/get_event_search_200.json'].forEach((examplePath) =>
    validateJson({
      json: JSON.parse(fs.readFileSync(examplePath).toString()),
      jsonName: examplePath,
      validator: searchEventsResponseValidator,
      schemaName,
    })
  );

  // Validate against live Server API responses
  for (const subscription of testSubscriptions) {
    const client = new FingerprintJsServerApiClientV4({
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

export async function validateEventUpdateRequestSchemaV4({ validateJson }: ValidationContext) {
  const schemaName = 'EventUpdate';
  const eventUpdateRequestValidator = createValidatorV4(schemaName, 'validateEventUpdateRequestSchemaV4');
  // Validate against example file
  [
    './schemas/paths/examples/events/update_event_multiple_fields_request.json',
    './schemas/paths/examples/events/update_event_one_field_request.json',
  ].forEach((examplePath) =>
    validateJson({
      json: JSON.parse(fs.readFileSync(examplePath).toString()),
      jsonName: examplePath,
      validator: eventUpdateRequestValidator,
      schemaName,
    })
  );
}
