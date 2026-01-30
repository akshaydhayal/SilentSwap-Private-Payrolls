// Stub for @silentswap/react on server-side
// This package uses top-level await and cannot be used in SSR
// These stubs are only used during SSR - client-side will use the real package

// Stub Provider component that just renders children
const SilentSwapProvider = ({ children }) => children;

// Stub hooks that return safe default values
function useSilentSwap() {
  return {
    executeSwap: async () => {
      console.warn('useSilentSwap: Using stub - SilentSwap not loaded');
      return null;
    },
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
    overheadUsd: 0,
    egressEstimatesLoading: false,
    fetchEstimates: () => {},
    wallet: null,
    walletLoading: false,
    auth: null,
    authLoading: false,
    clearQuote: () => {},
    client: null,
    environment: null,
    config: null,
    orderProgresses: [],
    orderOutputs: [],
    orderTrackingError: null,
    viewingAuth: null,
    serviceFeeRate: 0,
  };
}

function useOrdersContext() {
  return {
    orders: [],
    loading: false,
    refreshOrders: () => {},
    error: null,
  };
}

function useBalancesContext() {
  return {
    balances: {},
    loading: false,
    totalUsdValue: 0,
    refreshBalances: () => {},
  };
}

function usePricesContext() {
  return {
    prices: {},
    getPrice: () => null,
    loadingPrices: false,
  };
}

function useSwap() {
  return {
    tokenIn: null,
    tokenOut: null,
    inputAmount: '',
    setInputAmount: () => {},
    destinations: [],
    setDestinations: () => {},
    splits: [1],
    setSplits: () => {},
    slippage: 0.5,
    setSlippage: () => {},
    isAutoSlippage: true,
    setIsAutoSlippage: () => {},
    privacyEnabled: true,
    usdInputMode: false,
    setTokenIn: () => {},
    updateDestinationAsset: () => {},
    updateDestinationContact: () => {},
    updateDestinationAmount: () => {},
    handleAddOutput: () => {},
    handleDeleteOutput: () => {},
    toggleUsdInputMode: () => {},
    getCanAddOutput: () => true,
    getHasMultipleOutputs: () => false,
  };
}

function useSolanaAdapter() {
  return {
    solanaConnector: null,
    solanaConnectionAdapter: null,
  };
}

function useBitcoinAdapter() {
  return {
    bitcoinConnector: null,
    bitcoinConnectionAdapter: null,
  };
}

// Export everything
module.exports = {
  SilentSwapProvider,
  useSilentSwap,
  useOrdersContext,
  useBalancesContext,
  usePricesContext,
  useSwap,
  useSolanaAdapter,
  useBitcoinAdapter,
};
