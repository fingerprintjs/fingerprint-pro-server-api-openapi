import { ValidateFunction } from 'ajv-draft-04';
import { z } from 'zod';

// Zod helper for parsing environment variables
export const testSubscriptionEnvVariableZod = z.object({
  name: z.string(),
  publicApiKey: z.string(),
  serverApiKey: z.string(),
  region: z.union([z.literal('us'), z.literal('eu'), z.literal('ap')]),
  // Coerce "true" into true
  deleteEnabled: z.coerce.boolean().optional(),
  relatedVisitorsEnabled: z.coerce.boolean().optional(),
  botDetectionEnabled: z.coerce.boolean().optional(),
});
export type TestSubscription = z.infer<typeof testSubscriptionEnvVariableZod> & {
  requestId: string;
  visitorId: string;
};

export type ValidateJsonFn = (_: {
  json: any;
  validator: ValidateFunction;
  jsonName: string;
  schemaName: string;
}) => void;

export type ValidationContext = {
  validateJson: ValidateJsonFn;
  testSubscriptions: TestSubscription[];
  fail: (message: string) => void;
};
