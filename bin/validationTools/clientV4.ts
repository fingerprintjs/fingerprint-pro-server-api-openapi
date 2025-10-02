/**
 * DISCLAIMER:
 * This is a temporary lightweight fork of the FingerprintJS Pro Server API client that works with the API v4.
 * It is used for validation purposes and does not include all features of the original client.
 * It would be replaced as soon as possible as we will migrate the original client to the API v4.
 */

import {
  ErrorPlainResponse,
  ErrorResponse,
  EventsGetResponse,
  FingerprintJsServerApiClient,
  Options,
  Region,
  SearchEventsFilter,
  TooManyRequestsError,
} from '@fingerprintjs/fingerprintjs-pro-server-api';

const euRegionUrl = 'https://eu.api.fpjs.io/';
const apRegionUrl = 'https://ap.api.fpjs.io/';
const globalRegionUrl = 'https://api.fpjs.io/';

type QueryStringScalar = string | number | boolean | null | undefined;

type QueryStringParameters = Record<string, QueryStringScalar | string[]> & {
  api_key?: string;
};

function isEmptyValue(value: any): boolean {
  return value === undefined || value === null;
}

function serializeQueryStringParams(params: QueryStringParameters): string {
  const entries: [string, string][] = [];

  for (const [key, value] of Object.entries(params)) {
    // Use the helper for the main value
    if (isEmptyValue(value)) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const v of value) {
        // Also use the helper for each item in the array
        if (isEmptyValue(v)) {
          continue;
        }
        entries.push([`${key}[]`, String(v)]);
      }
    } else {
      entries.push([key, String(value)]);
    }
  }

  if (!entries.length) {
    return '';
  }

  const urlSearchParams = new URLSearchParams(entries);

  return urlSearchParams.toString();
}

class SdkError extends Error {
  constructor(
    message: string,
    readonly response?: Response,
    cause?: Error
  ) {
    // @ts-ignore
    super(message, { cause });
    this.name = this.constructor.name;
  }
}

export class RequestError<Code extends number = number, Body = unknown> extends SdkError {
  // HTTP Status code
  readonly statusCode: Code;

  // API error code
  readonly errorCode: string;

  // API error response
  readonly responseBody: Body;

  // Raw HTTP response
  override readonly response: Response;

  constructor(message: string, body: Body, statusCode: Code, errorCode: string, response: Response) {
    super(message, response);
    this.responseBody = body;
    this.response = response;
    this.errorCode = errorCode;
    this.statusCode = statusCode;
  }

  static unknown(response: Response) {
    return new RequestError('Unknown error', undefined, response.status, response.statusText, response);
  }

  static fromPlainError(body: ErrorPlainResponse, response: Response) {
    return new RequestError(body.error, body, response.status, response.statusText, response);
  }

  static fromErrorResponse(body: ErrorResponse, response: Response) {
    return new RequestError(body.error.message, body, response.status, body.error.code, response);
  }
}

function isErrorResponse(value: unknown): value is ErrorResponse {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'error' in value &&
      typeof value.error === 'object' &&
      value.error &&
      'code' in value.error &&
      'message' in value.error
  );
}

function isPlainErrorResponse(value: unknown): value is ErrorPlainResponse {
  return Boolean(value && typeof value === 'object' && 'error' in value && typeof value.error === 'string');
}

export function handleErrorResponse(json: any, response: Response): never {
  if (isErrorResponse(json)) {
    if (response.status === 429) {
      throw new TooManyRequestsError(json, response);
    }

    throw RequestError.fromErrorResponse(json, response);
  }

  if (isPlainErrorResponse(json)) {
    if (response.status === 429) {
      throw TooManyRequestsError.fromPlain(json, response);
    }

    throw RequestError.fromPlainError(json, response);
  }

  throw RequestError.unknown(response);
}

export function toError(e: unknown): Error {
  if (e && typeof e === 'object' && 'message' in e) {
    return e as Error;
  }

  return new Error(String(e));
}

async function copyResponseJson(response: Response) {
  try {
    return await response.clone().json();
  } catch (e) {
    throw new SdkError('Failed to parse JSON response', response, toError(e));
  }
}

function getServerApiUrl(region: Region): string {
  switch (region) {
    case Region.EU:
      return euRegionUrl;
    case Region.AP:
      return apRegionUrl;
    case Region.Global:
      return globalRegionUrl;
    default:
      throw new Error('Unsupported region');
  }
}

function getRequestPath({
  path,
  pathParams,
  queryParams,
  region,
  // method mention here so that it can be referenced in JSDoc
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  method: _,
}: any): string {
  // Step 1: Extract the path parameters (placeholders) from the path
  // @ts-ignore
  const placeholders = Array.from(path.matchAll(/{(.*?)}/g)).map((match) => match[1]);

  // Step 2: Replace the placeholders with provided pathParams
  let formattedPath: string = path;
  placeholders.forEach((placeholder, index) => {
    if (pathParams?.[index]) {
      formattedPath = formattedPath.replace(`{${placeholder}}`, pathParams[index]);
    } else {
      throw new Error(`Missing path parameter for ${placeholder}`);
    }
  });

  const url = new URL(getServerApiUrl(region));
  url.pathname = formattedPath;
  url.search = serializeQueryStringParams(queryParams || {});

  return url.toString();
}

// @ts-ignore
export class FingerprintJsServerApiClientV4 implements FingerprintJsServerApiClient {
  readonly region: Region;
  readonly apiKey: string;

  constructor(options: Readonly<Options>) {
    this.region = options.region || Region.Global;
    this.apiKey = options.apiKey;
  }

  private getHeaders() {
    return {
      accept: 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    };
  }

  public async getEvent(eventId: string): Promise<any> {
    if (!eventId) {
      throw new TypeError('requestId is not set');
    }

    const url = getRequestPath({
      path: '/v4/events/{event_id}',
      region: this.region,
      pathParams: [eventId],
      method: 'get',
    });

    const headers = this.getHeaders();

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    const jsonResponse = await copyResponseJson(response);

    if (response.status === 200) {
      return jsonResponse as EventsGetResponse;
    }

    handleErrorResponse(jsonResponse, response);
  }

  public async searchEvents(filter: SearchEventsFilter): Promise<any> {
    const url = getRequestPath({
      path: '/v4/events',
      region: this.region,
      method: 'get',
      queryParams: filter,
    });
    const headers = this.getHeaders();
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    const jsonResponse = await copyResponseJson(response);

    if (response.status === 200) {
      return jsonResponse;
    }

    handleErrorResponse(jsonResponse, response);
  }

  public async updateEvent(body: any, eventId: string): Promise<void> {
    if (!body) {
      throw new TypeError('body is not set');
    }

    if (!eventId) {
      throw new TypeError('eventId is not set');
    }

    const url = getRequestPath({
      path: '/v4/events/{event_id}',
      region: this.region,
      pathParams: [eventId],
      method: 'patch',
    });
    const headers = this.getHeaders();

    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
    });

    if (response.status === 200) {
      return;
    }

    const jsonResponse = await copyResponseJson(response);

    handleErrorResponse(jsonResponse, response);
  }

  public async deleteVisitorData(visitorId: string): Promise<void> {
    if (!visitorId) {
      throw TypeError('VisitorId is not set');
    }

    const url = getRequestPath({
      path: '/v4/visitors/{visitor_id}',
      region: this.region,
      pathParams: [visitorId],
      method: 'delete',
    });

    const headers = this.getHeaders();

    const response = await fetch(url, {
      method: 'DELETE',
      headers,
    });

    if (response.status === 200) {
      return;
    }

    const jsonResponse = await copyResponseJson(response);

    handleErrorResponse(jsonResponse, response);
  }

  public getVisitorHistory(): Promise<any> {
    throw new Error('Method not implemented.');
  }
  public getVisits(): Promise<any> {
    throw new Error('Method not implemented.');
  }
  public getRelatedVisitors(): Promise<any> {
    throw new Error('Method not implemented.');
  }
  public getQueryApiKey(): string {
    throw new Error('Method not implemented.');
  }
}
