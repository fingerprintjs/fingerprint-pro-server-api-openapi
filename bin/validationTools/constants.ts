import { Region } from '@fingerprintjs/fingerprintjs-pro-server-api';
import { Region as RegionV4 } from '@fingerprint/node-sdk';

// Region map for the API v3 Server SDK
export const REGION_MAP = {
  us: Region.Global,
  eu: Region.EU,
  ap: Region.AP,
} as const;

// Region map for the API v4 Server SDK
export const REGION_MAP_V4 = {
  us: RegionV4.Global,
  eu: RegionV4.EU,
  ap: RegionV4.AP,
} as const;
