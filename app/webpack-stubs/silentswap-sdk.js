// Stub for @silentswap/sdk on server-side
// This package uses top-level await and cannot be used in SSR
module.exports = {
  createSilentSwapClient: () => ({}),
  ENVIRONMENT: {
    STAGING: 'staging',
    PRODUCTION: 'production',
  },
};
