import { REGION_MAP } from '../validationTools/constants';
import { createValidatorV4 } from '../validationTools/validation';
import { ValidationContext } from '../validationTools/types';
import fs from 'fs';
import { FingerprintJsServerApiClientV4, RequestError } from '../validationTools/clientV4';
import { generateIdentificationEvent } from '../../utils/validateSchema/generateIdentificationEvent';

/**
 * Validates ErrorCommon403Response schema
 */
export async function validateCommonError403SchemaV4({ testSubscriptions, validateJson, fail }: ValidationContext) {
  const schemaName = 'ErrorResponse';
  const commonError403Validator = createValidatorV4(schemaName, 'validateCommonError403Schema');

  // Validate against example file
  [
    './schemas/paths/examples/errors/403_feature_not_enabled.json',
    './schemas/paths/examples/errors/403_secret_api_key_not_found.json',
    './schemas/paths/examples/errors/403_secret_api_key_required.json',
    './schemas/paths/examples/errors/403_subscription_not_active.json',
    './schemas/paths/examples/errors/403_wrong_region.json',
  ].forEach((examplePath) =>
    validateJson({
      json: JSON.parse(fs.readFileSync(examplePath).toString()),
      jsonName: examplePath,
      validator: commonError403Validator,
      schemaName,
    })
  );

  // Validate against live Server API responses
  for (const subscription of testSubscriptions) {
    const client = new FingerprintJsServerApiClientV4({
      apiKey: 'Wrong Server API Key',
      region: REGION_MAP[subscription.region || 'us'],
    });

    try {
      const eventResponse = await client.getEvent(subscription.requestId);
      fail(`❌ Request for event ${eventResponse} in ${subscription.name} should have failed`);
    } catch (error) {
      validateJson({
        json: (error as RequestError).responseBody,
        jsonName: `🌐 Response for GET event '${subscription.name}' > '${subscription.requestId}'`,
        validator: commonError403Validator,
        schemaName,
      });
    }

    try {
      await client.updateEvent({ linkedId: 'OpenAPI spec test' }, subscription.requestId);
      fail(`❌ Updating event ${subscription.requestId} with wrong API key was expected to fail with status 403`);
    } catch (error) {
      validateJson({
        json: (error as RequestError).responseBody,
        jsonName: `🌐 Response for PATCH event '${subscription.name}' > '${subscription.requestId}'`,
        validator: commonError403Validator,
        schemaName,
      });
    }

    try {
      const eventResponse = await client.deleteVisitorData(subscription.visitorId);
      fail(`❌ Request for event ${eventResponse} in ${subscription.name} should have failed`);
    } catch (error) {
      validateJson({
        json: (error as RequestError).responseBody,
        jsonName: `🌐 Response for DELETE visitor '${subscription.name}' > '${subscription.visitorId}'`,
        validator: commonError403Validator,
        schemaName,
      });
    }

    // Validate against SearchEvents API response
    try {
      const searchEventsResponse = await client.searchEvents({ limit: 10 });
      fail(`❌ Request for search-events ${searchEventsResponse} in ${subscription.name} should have failed`);
    } catch (error) {
      validateJson({
        json: (error as RequestError).responseBody,
        jsonName: `🌐 Response for GET search-events '${subscription.name}' > '${subscription.visitorId}'`,
        validator: commonError403Validator,
        schemaName,
      });
    }
  }
}

/**
 * Validates ErrorCommon500Response schema
 */
export async function validateCommonError500SchemaV4({ validateJson }: ValidationContext) {
  const schemaName = 'ErrorResponse';
  const commonError403Validator = createValidatorV4(schemaName, 'validateCommonError500SchemaV4');

  // Validate against example file
  ['./schemas/paths/examples/errors/500_internal_server_error.json'].forEach((examplePath) =>
    validateJson({
      json: JSON.parse(fs.readFileSync(examplePath).toString()),
      jsonName: examplePath,
      validator: commonError403Validator,
      schemaName,
    })
  );
}

/**
 * Validate EventError404 schema
 */
export async function validateEventError404SchemaV4({ testSubscriptions, validateJson, fail }: ValidationContext) {
  const schemaName = 'ErrorResponse';
  const eventError404Validator = createValidatorV4(schemaName, 'validateEventError404SchemaV4');

  // Validate against example file
  ['./schemas/paths/examples/errors/404_event_not_found.json'].forEach((examplePath) =>
    validateJson({
      json: JSON.parse(fs.readFileSync(examplePath).toString()),
      jsonName: examplePath,
      validator: eventError404Validator,
      schemaName,
    })
  );

  const nonExistentRequestId = 'non-existent-request-id';

  // Validate against live Server API responses
  for (const subscription of testSubscriptions) {
    const client = new FingerprintJsServerApiClientV4({
      apiKey: subscription.serverApiKey,
      region: REGION_MAP[subscription.region || 'us'],
    });

    try {
      const eventResponse = await client.getEvent(nonExistentRequestId);
      fail(`❌ Request for event ${eventResponse} in ${subscription.name} should have failed`);
    } catch (error) {
      validateJson({
        json: (error as RequestError).responseBody,
        jsonName: `🌐 Response for GET event '${subscription.name}' > '${nonExistentRequestId}'`,
        validator: eventError404Validator,
        schemaName: 'ErrorResponse',
      });
    }

    try {
      const eventResponse = await client.updateEvent({ linkedId: 'OpenAPI spec test' }, nonExistentRequestId);
      fail(`❌ Updating non-existent requestId was expected to fail with status 404, not with ${eventResponse}`);
    } catch (error) {
      validateJson({
        json: (error as RequestError).responseBody,
        jsonName: `🌐 Response for PATCH event '${subscription.name}' > '${nonExistentRequestId}'`,
        validator: eventError404Validator,
        schemaName: 'ErrorResponse',
      });
    }
  }
}

/**
 * Validates ErrorVisitor400Response schema
 */
export async function validateErrorVisitor400ResponseV4({ testSubscriptions, validateJson, fail }: ValidationContext) {
  const schemaName = 'ErrorResponse';
  const visitorError400Validator = createValidatorV4(schemaName, 'validateErrorVisitor400ResponseV4');

  // Validate against example file
  [
    './schemas/paths/examples/errors/400_request_body_invalid.json',
    './schemas/paths/examples/errors/400_visitor_id_invalid.json',
    './schemas/paths/examples/errors/400_visitor_id_required.json',
  ].forEach((examplePath) =>
    validateJson({
      json: JSON.parse(fs.readFileSync(examplePath).toString()),
      jsonName: examplePath,
      validator: visitorError400Validator,
      schemaName,
    })
  );

  // Validate against live Server API responses
  for (const subscription of testSubscriptions) {
    const client = new FingerprintJsServerApiClientV4({
      apiKey: subscription.serverApiKey,
      region: REGION_MAP[subscription.region || 'us'],
    });

    // Validate against DELETE visitor API response
    try {
      const visitsResponse = await client.deleteVisitorData('malformed visitor id');
      fail(`❌ Request for visits ${visitsResponse} in ${subscription.name} should have failed`);
    } catch (error) {
      validateJson({
        json: (error as RequestError).responseBody,
        jsonName: `🌐 Response for DELETE visitor '${subscription.name}' > '${subscription.visitorId}'`,
        validator: visitorError400Validator,
        schemaName: 'DeleteVisitsError400',
      });
    }
  }
}

/**
 * Validates ErrorCommon429Response
 */
export async function validateErrorCommon429ResponseV4({ validateJson }: ValidationContext) {
  const schemaName = 'ErrorResponse';
  const errorCommon429ResponseValidator = createValidatorV4(schemaName, 'validateErrorCommon429ResponseV4');

  // Validate against example file
  ['./schemas/paths/examples/errors/429_too_many_requests.json'].forEach((examplePath) =>
    validateJson({
      json: JSON.parse(fs.readFileSync(examplePath).toString()),
      jsonName: examplePath,
      validator: errorCommon429ResponseValidator,
      schemaName,
    })
  );
}

/**
 * Validates ErrorVisitor404Response schema
 */
export async function validateErrorVisitor404ResponseV4({ testSubscriptions, validateJson, fail }: ValidationContext) {
  const schemaName = 'ErrorResponse';
  const visitorError404Validator = createValidatorV4(schemaName, 'validateErrorVisitor404ResponseV4');

  // Validate against example file
  ['./schemas/paths/examples/errors/404_visitor_not_found.json'].forEach((examplePath) =>
    validateJson({
      json: JSON.parse(fs.readFileSync(examplePath).toString()),
      jsonName: examplePath,
      validator: visitorError404Validator,
      schemaName: 'DeleteVisitsError404',
    })
  );

  // Validate against live Server API responses
  for (const subscription of testSubscriptions) {
    const client = new FingerprintJsServerApiClientV4({
      apiKey: subscription.serverApiKey,
      region: REGION_MAP[subscription.region || 'us'],
    });

    const nonExistentVisitorId = 'e1srMXYG7PjFCAbE0yIH';
    try {
      const visitsResponse = await client.deleteVisitorData(nonExistentVisitorId);
      fail(`❌ Request for visits ${visitsResponse} in ${subscription.name} should have failed`);
    } catch (error) {
      validateJson({
        json: (error as RequestError).responseBody,
        jsonName: `🌐 Response for DELETE visitor '${subscription.name}' > '${nonExistentVisitorId}'`,
        validator: visitorError404Validator,
        schemaName,
      });
    }
  }
}

/*
 * Validates EventUpdateError400
 */
export async function validateUpdateEventError400SchemaV4({
  testSubscriptions,
  validateJson,
  fail,
}: ValidationContext) {
  const schemaName = 'ErrorResponse';
  const updateEvent400ErrorValidator = createValidatorV4(schemaName, 'validateUpdateEventError400SchemaV4');

  // Validate against example file
  ['./schemas/paths/examples/errors/400_request_body_invalid.json'].forEach((examplePath) =>
    validateJson({
      json: JSON.parse(fs.readFileSync(examplePath).toString()),
      jsonName: examplePath,
      validator: updateEvent400ErrorValidator,
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
      const updateEventResponse = await client.updateEvent({ invalid: 'payload' }, subscription.requestId);
      fail(
        `❌ Updating event ${subscription.requestId} in ${subscription.name} should have failed, not succeed with ${updateEventResponse}`
      );
    } catch (error) {
      validateJson({
        json: (error as RequestError).responseBody,
        jsonName: `🌐 Live Server API Response for PATCH event '${subscription.name}' > '${subscription.requestId}'`,
        validator: updateEvent400ErrorValidator,
        schemaName,
      });
    }
  }
}

/**
 * Validates EventUpdateError409
 */
export async function validateUpdateEventError409SchemaV4({
  testSubscriptions,
  validateJson,
  fail,
}: ValidationContext) {
  const schemaName = 'ErrorResponse';
  const updateEvent409ErrorValidator = createValidatorV4(schemaName, 'validateUpdateEventError409SchemaV4');

  // Validate against example file
  ['./schemas/paths/examples/errors/409_state_not_ready.json'].forEach((examplePath) =>
    validateJson({
      json: JSON.parse(fs.readFileSync(examplePath).toString()),
      jsonName: examplePath,
      validator: updateEvent409ErrorValidator,
      schemaName,
    })
  );

  /**
   * Validate against live Server API responses
   * Must generate fresh event and try updating it immediately to get the 409 Response
   */
  for (const subscription of testSubscriptions) {
    const { requestId } = await generateIdentificationEvent(
      subscription.publicApiKey,
      subscription.region,
      subscription.name
    );

    const client = new FingerprintJsServerApiClientV4({
      apiKey: subscription.serverApiKey,
      region: REGION_MAP[subscription.region || 'us'],
    });

    try {
      const updateEventResponse = await client.updateEvent({ linkedId: '409test' }, requestId);
      fail(
        `❌ Updating event ${subscription.requestId} in ${subscription.name} was expected to fail with status 409, not succeed with ${updateEventResponse}`
      );
    } catch (error) {
      validateJson({
        json: (error as RequestError).responseBody,
        jsonName: `🌐 Live Server API Response for PATCH event '${subscription.name}' > '${requestId}'`,
        validator: updateEvent409ErrorValidator,
        schemaName,
      });
    }
  }
}

export async function validateSearchEventsError400SchemaV4({
  testSubscriptions,
  validateJson,
  fail,
}: ValidationContext) {
  const schemaName = 'ErrorResponse';
  const searchEventsError400Validator = createValidatorV4(schemaName, 'validateSearchEventsError400SchemaV4');

  // Validate against example file
  [
    './schemas/paths/examples/errors/400_bot_type_invalid.json',
    './schemas/paths/examples/errors/400_end_time_invalid.json',
    './schemas/paths/examples/errors/400_event_id_invalid.json',
    './schemas/paths/examples/errors/400_ip_address_invalid.json',
    './schemas/paths/examples/errors/400_limit_invalid.json',
    './schemas/paths/examples/errors/400_pagination_key_invalid.json',
    './schemas/paths/examples/errors/400_linked_id_invalid.json',
    './schemas/paths/examples/errors/400_pagination_key_invalid.json',
    './schemas/paths/examples/errors/400_reverse_invalid.json',
    './schemas/paths/examples/errors/400_start_time_invalid.json',
    './schemas/paths/examples/errors/400_visitor_id_invalid.json',
    './schemas/paths/examples/errors/400_visitor_id_required.json',
  ].forEach((examplePath) =>
    validateJson({
      json: JSON.parse(fs.readFileSync(examplePath).toString()),
      jsonName: examplePath,
      validator: searchEventsError400Validator,
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
      { limit: 'invalid limit' },
      { limit: 1, ip_address: 'not an ip address' },
      { limit: 1, end: 'not a timestamp' },
      { limit: 1, start: 'not a timestamp' },
      { limit: 1, linked_id: 'C'.repeat(257) },
      { limit: 1, visitor_id: 'not a visitor id' },
      { limit: 1, reverse: 'not a boolean' },
      { limit: 1, suspect: 'not a boolean' },
      { limit: 1, pagination_key: false },
      { limit: 10, vpn: 'not a boolean' },
      { limit: 10, virtual_machine: 'not a boolean' },
      { limit: 10, tampering: 'not a boolean' },
      { limit: 10, anti_detect_browser: 'not a boolean' },
      { limit: 10, incognito: 'not a boolean' },
      { limit: 10, privacy_settings: 'not a boolean' },
      { limit: 10, jailbroken: 'not a boolean' },
      { limit: 10, frida: 'not a boolean' },
      { limit: 10, factory_reset: 'not a boolean' },
      { limit: 10, cloned_app: 'not a boolean' },
      { limit: 10, emulator: 'not a boolean' },
      { limit: 10, root_apps: 'not a boolean' },
      { limit: 10, vpn_confidence: 'not a confidence value' },
      { limit: 10, min_suspect_score: 'not a number' },
      { limit: 10, ip_blocklist: 'not a boolean' },
      { limit: 10, datacenter: 'not a boolean' },
      // Temporary small bug, remove condition when fixed
      subscription.botDetectionEnabled && { limit: 1, bot: 'invalid bot value' },
    ];

    for (const filter of filters.filter(Boolean)) {
      try {
        // @ts-expect-error
        const searchEventsResponse = await client.searchEvents(filter);
        fail(
          `❌ Request for search-events with filter '${JSON.stringify(filter)}' should have failed, but returned ${JSON.stringify(searchEventsResponse, null, 2)} in ${subscription.name}`
        );
      } catch (error) {
        validateJson({
          json: (error as RequestError).responseBody,
          jsonName: `🌐 Live Server API Response for GET search-events with filter '${JSON.stringify(filter)}' in ${subscription.name}`,
          validator: searchEventsError400Validator,
          schemaName,
        });
      }
    }
  }
}
