// Stub for @silentswap/react on server-side
// This package uses top-level await and cannot be used in SSR
// These stubs are only used during SSR - client-side will use the real package

function createStubHook(defaultValue) {
  return () => defaultValue;
}

module.exports = {
  SilentSwapProvider: ({ children }) => children,
  useSilentSwap: createStubHook({
    executeSwap: async () => null,
    isSwapping: false,
    swapLoading: false,
    currentStep: null,
    orderId: null,
    orderComplete: false,
    orderStatusTexts: [],
    swapError: null,
    handleNewSwap: () => {},
    serviceFeeUsd: 0,
    bridgeFeeIngressUsd: 0,
    bridgeFeeEgressUsd: 0,
    slippageUsd: 0,
    egressEstimatesLoading: false,
  }),
  useOrdersContext: createStubHook({
    orders: [],
    loading: false,
    refreshOrders: () => {},
  }),
  useBalancesContext: createStubHook({
    balances: {},
    loading: false,
    totalUsdValue: 0,
  }),
  usePricesContext: createStubHook({
    prices: {},
    getPrice: () => null,
    loadingPrices: false,
  }),
  useSwap: createStubHook({}),
};
