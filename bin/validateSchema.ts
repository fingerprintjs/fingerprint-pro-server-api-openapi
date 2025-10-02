import { ValidateFunction } from 'ajv-draft-04';
import { generateIdentificationEvent } from '../utils/validateSchema/generateIdentificationEvent';
import { z } from 'zod';
import { parseEnv } from 'znv';
import 'dotenv/config';
import { TestSubscription, testSubscriptionEnvVariableZod, ValidateJsonFn } from './validationTools/types';
import {
  validateEventResponseSchemaV3,
  validateRelatedVisitorsResponseSchemaV3,
  validateSearchEventsResponseSchemaV3,
  validateVisitsResponseSchemaV3,
} from './validationScenarios/v3-200';
import {
  validateEventSchemaV4,
  validateEventSearchSchemaV4,
  validateEventUpdateRequestSchemaV4,
} from './validationScenarios/v4-200';
import {
  validateCommonError403SchemaV4,
  validateCommonError500SchemaV4,
  validateErrorCommon429ResponseV4,
  validateErrorVisitor400ResponseV4,
  validateErrorVisitor404ResponseV4,
  validateEventError404SchemaV4,
  validateSearchEventsError400SchemaV4,
  validateUpdateEventError400SchemaV4,
  validateUpdateEventError409SchemaV4,
} from './validationScenarios/v4-errors';
import {
  validateCommonError403SchemaV3,
  validateErrorVisitor400ResponseV3,
  validateErrorVisitor404ResponseV3,
  validateEventError404SchemaV3,
  validateGetVisitsError400SchemaV3,
  validateGetVisitsError403SchemaV3,
  validateSearchEventsError400SchemaV3,
  validateUpdateEventError400SchemaV3,
  validateUpdateEventError409SchemaV3,
} from './validationScenarios/v3-errors';
import { initAjv } from './validationTools/validation';

initAjv();
// Global exit code variable and helper
let exitCode: number = 0;
const fail = (message: string) => {
  console.error(message);
  exitCode = 1;
};

// Validation Helper
const validateJson: ValidateJsonFn = ({
  json,
  validator,
  jsonName,
  schemaName,
}: {
  json: any;
  validator: ValidateFunction;
  jsonName: string;
  schemaName: string;
}) => {
  const valid = validator(json);
  if (valid) {
    console.log(`✅ ${schemaName} schema matches ${jsonName}`);
  } else {
    fail(`❌ ${schemaName} schema does not match ${jsonName} schema, because:`);
    console.error(validator.errors);
    console.log('::debug::Invalid JSON: ', JSON.stringify(json, null, 2));
  }
};

/**
 * Main function
 */
(async () => {
  // Parse an array of test subscriptions objects from environment variables
  const { TEST_SUBSCRIPTIONS } = parseEnv(process.env, {
    TEST_SUBSCRIPTIONS: z.array(testSubscriptionEnvVariableZod),
  });

  // Generate and identification event for each subscription and add the fresh requestId and visitorId to the object
  const testSubscriptions: TestSubscription[] = [];
  for (const sub of TEST_SUBSCRIPTIONS) {
    const { requestId, visitorId } = await generateIdentificationEvent(sub.publicApiKey, sub.region, sub.name);
    testSubscriptions.push({ ...sub, requestId, visitorId });
  }

  // Validate all parts of the schema against static examples AND live Server API responses from each test subscription

  // API v3
  await validateEventResponseSchemaV3({ testSubscriptions, validateJson, fail });
  await validateVisitsResponseSchemaV3({ testSubscriptions, validateJson, fail });
  await validateSearchEventsResponseSchemaV3({ testSubscriptions, validateJson, fail });
  await validateRelatedVisitorsResponseSchemaV3({
    testSubscriptions: testSubscriptions.filter((sub) => sub.relatedVisitorsEnabled),
    validateJson,
    fail,
  });

  await validateCommonError403SchemaV3({ testSubscriptions, validateJson, fail });
  await validateEventError404SchemaV3({ testSubscriptions, validateJson, fail });
  await validateGetVisitsError400SchemaV3({ testSubscriptions, validateJson, fail });
  await validateGetVisitsError403SchemaV3({ testSubscriptions, validateJson, fail });
  await validateErrorVisitor400ResponseV3({ testSubscriptions, validateJson, fail });
  await validateErrorVisitor404ResponseV3({
    testSubscriptions: testSubscriptions.filter((sub) => sub.deleteEnabled && sub.relatedVisitorsEnabled),
    validateJson,
    fail,
  });

  await validateUpdateEventError400SchemaV3({ testSubscriptions, validateJson, fail });
  await validateUpdateEventError409SchemaV3({
    testSubscriptions: testSubscriptions.slice(1, 2),
    validateJson,
    fail,
  });

  await validateSearchEventsError400SchemaV3({ testSubscriptions, validateJson, fail });

  // API v4

  await validateEventSchemaV4({ testSubscriptions, validateJson, fail });
  await validateEventSearchSchemaV4({ testSubscriptions, validateJson, fail });
  await validateEventUpdateRequestSchemaV4({ testSubscriptions, validateJson, fail });

  await validateCommonError403SchemaV4({ testSubscriptions, validateJson, fail });
  await validateEventError404SchemaV4({ testSubscriptions, validateJson, fail });
  await validateErrorVisitor400ResponseV4({ testSubscriptions, validateJson, fail });
  await validateErrorCommon429ResponseV4({ testSubscriptions, validateJson, fail });
  await validateCommonError500SchemaV4({ testSubscriptions, validateJson, fail });

  await validateErrorVisitor404ResponseV4({
    testSubscriptions: testSubscriptions.filter((sub) => sub.deleteEnabled && sub.relatedVisitorsEnabled),
    validateJson,
    fail,
  });

  await validateUpdateEventError400SchemaV4({ testSubscriptions, validateJson, fail });
  await validateUpdateEventError409SchemaV4({
    testSubscriptions: testSubscriptions.slice(1, 2),
    validateJson,
    fail,
  });

  await validateSearchEventsError400SchemaV4({ testSubscriptions, validateJson, fail });

  if (exitCode === 0) {
    console.log('\n ✅✅✅ All schemas are valid');
  } else {
    console.error('\n ❌❌❌ Some schema checks failed, see errors above.');
  }

  process.exit(exitCode);
})();
