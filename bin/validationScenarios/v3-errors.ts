import { FingerprintJsServerApiClient, RequestError } from '@fingerprintjs/fingerprintjs-pro-server-api';
import { REGION_MAP } from '../validationTools/constants';
import { ValidationContext } from '../validationTools/types';
import { createValidatorV3 } from '../validationTools/validation';
import { generateIdentificationEvent } from '../../utils/validateSchema/generateIdentificationEvent';

/**
 * Validates ErrorCommon403Response schema
 */
export async function validateCommonError403SchemaV3({ testSubscriptions, validateJson, fail }: ValidationContext) {
  const schemaName = 'ErrorResponse';
  const commonError403Validator = createValidatorV3(schemaName, 'validateCommonError403SchemaV3');

  // Validate against live Server API responses
  for (const subscription of testSubscriptions) {
    const client = new FingerprintJsServerApiClient({
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

    // Validate against Related visitors API response
    try {
      const relatedVisitorsResponse = await client.getRelatedVisitors({ visitor_id: subscription.visitorId });
      fail(`❌ Request for related-visitors ${relatedVisitorsResponse} in ${subscription.name} should have failed`);
    } catch (error) {
      validateJson({
        json: (error as RequestError).responseBody,
        jsonName: `🌐 Response for GET related-visitors '${subscription.name}' > '${subscription.visitorId}'`,
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
 * Validate EventError404 schema
 */
export async function validateEventError404SchemaV3({ testSubscriptions, validateJson, fail }: ValidationContext) {
  const schemaName = 'ErrorResponse';
  const eventError404Validator = createValidatorV3(schemaName, 'validateEventError404SchemaV3');

  const nonExistentRequestId = 'non-existent-request-id';

  // Validate against live Server API responses
  for (const subscription of testSubscriptions) {
    const client = new FingerprintJsServerApiClient({
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
 * Validates VisitsError400 schema
 */
export async function validateGetVisitsError400SchemaV3({ testSubscriptions, validateJson, fail }: ValidationContext) {
  const schemaName = 'ErrorPlainResponse';
  const visitsError400Validator = createValidatorV3(schemaName, 'validateGetVisitsError400SchemaV3');

  // Validate against live Server API responses
  for (const subscription of testSubscriptions) {
    const client = new FingerprintJsServerApiClient({
      apiKey: subscription.serverApiKey,
      region: REGION_MAP[subscription.region || 'us'],
    });

    try {
      const visitsResponse = await client.getVisits(subscription.visitorId, { request_id: 'Wrong Request ID' });
      fail(`❌ Request for visits ${visitsResponse} in ${subscription.name} should have failed`);
    } catch (error) {
      validateJson({
        json: (error as RequestError).responseBody,
        jsonName: `🌐 Response for GET visitor '${subscription.name}' > '${subscription.visitorId}'`,
        validator: visitsError400Validator,
        schemaName,
      });
    }
  }
}

/**
 * Validates VisitsError403 schema
 */
export async function validateGetVisitsError403SchemaV3({ testSubscriptions, validateJson, fail }: ValidationContext) {
  const schemaName = 'ErrorPlainResponse';
  const visitsError403Validator = createValidatorV3(schemaName, 'validateGetVisitsError403SchemaV3');

  // Validate against live Server API responses
  for (const subscription of testSubscriptions) {
    const client = new FingerprintJsServerApiClient({
      apiKey: 'Wrong Server API Key',
      region: REGION_MAP[subscription.region || 'us'],
    });

    try {
      const visitsResponse = await client.getVisits(subscription.visitorId);
      fail(`❌ Request for visits ${visitsResponse} in ${subscription.name} should have failed`);
    } catch (error) {
      validateJson({
        json: (error as RequestError).responseBody,
        jsonName: `🌐 Response for GET visitor '${subscription.name}' > '${subscription.visitorId}'`,
        validator: visitsError403Validator,
        schemaName,
      });
    }
  }
}

/**
 * Validates ErrorVisitor400Response schema
 */
export async function validateErrorVisitor400ResponseV3({ testSubscriptions, validateJson, fail }: ValidationContext) {
  const schemaName = 'ErrorResponse';
  const visitorError400Validator = createValidatorV3(schemaName, 'validateErrorVisitor400ResponseV3');

  // Validate against live Server API responses
  for (const subscription of testSubscriptions) {
    const client = new FingerprintJsServerApiClient({
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

    // Validate against GET related-visitors API response
    try {
      const relatedVisitorsResponse = await client.getRelatedVisitors({ visitor_id: 'badVisitorId' });
      fail(`❌ Request for related-visitors ${relatedVisitorsResponse} in ${subscription.name} should have failed`);
    } catch (error) {
      validateJson({
        json: (error as RequestError).responseBody,
        jsonName: `🌐 Response for GET related-visitors '${subscription.name}' > 'badVisitorId'`,
        validator: visitorError400Validator,
        schemaName,
      });
    }
  }
}

/**
 * Validates ErrorVisitor404Response schema
 */
export async function validateErrorVisitor404ResponseV3({ testSubscriptions, validateJson, fail }: ValidationContext) {
  const schemaName = 'ErrorResponse';
  const visitorError404Validator = createValidatorV3(schemaName, 'validateErrorVisitor404ResponseV3');

  // Validate against live Server API responses
  for (const subscription of testSubscriptions) {
    const nonExistentVisitor = 'e0srMXYG7PjFCAbE0yIH';

    const client = new FingerprintJsServerApiClient({
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

    try {
      const relatedVisitorsResponse = await client.getRelatedVisitors({ visitor_id: nonExistentVisitor });
      fail(`❌ Request for related-visitors ${relatedVisitorsResponse} in ${subscription.name} should have failed`);
    } catch (error) {
      validateJson({
        json: (error as RequestError).responseBody,
        jsonName: `🌐 Response for GET related-visitors '${subscription.name}' > '${nonExistentVisitor}'`,
        validator: visitorError404Validator,
        schemaName,
      });
    }
  }
}

/*
 * Validates EventUpdateError400
 */
export async function validateUpdateEventError400SchemaV3({
  testSubscriptions,
  validateJson,
  fail,
}: ValidationContext) {
  const schemaName = 'ErrorResponse';
  const updateEvent400ErrorValidator = createValidatorV3(schemaName, 'validateUpdateEventError400SchemaV3');

  // Validate against live Server API responses
  for (const subscription of testSubscriptions) {
    const client = new FingerprintJsServerApiClient({
      apiKey: subscription.serverApiKey,
      region: REGION_MAP[subscription.region || 'us'],
    });

    try {
      // @ts-expect-error
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
export async function validateUpdateEventError409SchemaV3({
  testSubscriptions,
  validateJson,
  fail,
}: ValidationContext) {
  const schemaName = 'ErrorResponse';
  const updateEvent409ErrorValidator = createValidatorV3(schemaName, 'validateUpdateEventError409SchemaV3');

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

    const client = new FingerprintJsServerApiClient({
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

export async function validateSearchEventsError400SchemaV3({
  testSubscriptions,
  validateJson,
  fail,
}: ValidationContext) {
  const schemaName = 'ErrorResponse';
  const searchEventsError400Validator = createValidatorV3(schemaName, 'validateSearchEventsError400SchemaV3');

  // Validate against live Server API responses
  for (const subscription of testSubscriptions) {
    const client = new FingerprintJsServerApiClient({
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
