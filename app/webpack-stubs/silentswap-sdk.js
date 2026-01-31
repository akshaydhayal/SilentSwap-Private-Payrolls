// Stub for @silentswap/sdk on server-side
// This package uses top-level await and cannot be used in SSR
// These stubs are only used during SSR - client-side will use the real package

// Environment enum stub
const ENVIRONMENT = {
  STAGING: 'STAGING',
  MAINNET: 'MAINNET',
  TESTNET: 'TESTNET',    
};

// Client factory stub
function createSilentSwapClient(options) {
  console.warn('createSilentSwapClient: Using stub - SDK not loaded');
  return {
    quote: async () => [{ type: 'stub', error: 'SDK not loaded' }, null],
    order: async () => [{ type: 'stub', error: 'SDK not loaded' }, null],
    authenticate: async () => [{ type: 'stub', error: 'SDK not loaded' }, null],
    nonce: async () => [{ type: 'stub', error: 'SDK not loaded' }, null],
    proxyPublicKey: null,
    s0xDepositorAddress: '0x0000000000000000000000000000000000000000',
  };
}

// Export everything
module.exports = {
  ENVIRONMENT,
  createSilentSwapClient,
  // Additional exports that might be needed
  DeliveryMethod: {
    SNIP: 'SNIP',
    DIRECT: 'DIRECT',
  },
  FacilitatorKeyType: {
    SECP256K1: 'SECP256K1',
    ED25519: 'ED25519',
  },
};
