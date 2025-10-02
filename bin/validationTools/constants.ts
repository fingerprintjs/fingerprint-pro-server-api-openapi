import { Region } from '@fingerprintjs/fingerprintjs-pro-server-api';

// Region map for Server API SDK
export const REGION_MAP = {
  us: Region.Global,
  eu: Region.EU,
  ap: Region.AP,
} as const;
