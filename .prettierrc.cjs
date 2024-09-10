// This file needs to be in CommonJS format, otherwise changesets crash because they don't support ESM for now.
const commonDxTeamPrettierConfig = require('@fingerprintjs/prettier-config-dx-team');

module.exports = {
  ...commonDxTeamPrettierConfig,
  semi: true,
};
