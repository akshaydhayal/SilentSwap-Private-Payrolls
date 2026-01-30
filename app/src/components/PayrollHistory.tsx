"use client";

import { useSilentSwapContext } from "@/app/providers";

// Import from @silentswap/react - uses stubs if provider not available
import { useOrdersContext } from "@silentswap/react";

export function PayrollHistory() {
  const { isReady } = useSilentSwapContext();
  
  // Try to use the orders context - will use stub if provider not available
  let orders: any[] = [];
  let loading = false;
  let refreshOrders = () => {};
  
  try {
    const ordersContext = useOrdersContext();
    orders = ordersContext?.orders || [];
    loading = ordersContext?.loading || false;
    refreshOrders = ordersContext?.refreshOrders || (() => {});
  } catch (error) {
    // If hook fails, use defaults
    console.warn("useOrdersContext not available:", error);
  }

  if (!isReady) {
    return (
      <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
        <h2 className="text-xl font-bold mb-4">Recent Payouts</h2>
        <p className="text-gray-400 text-sm">Connect wallets and initialize SilentSwap to view order history.</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Recent Payouts</h2>
        <button
          onClick={refreshOrders}
          disabled={loading}
          className="text-sm px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-gray-600 border-t-yellow-500 rounded-full animate-spin"></div>
          <span className="ml-2 text-gray-400">Loading orders...</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400">No payouts yet</p>
          <p className="text-sm text-gray-500 mt-2">Your private payout history will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order: any) => (
            <div
              key={order.orderId}
              className="p-4 bg-zinc-800 rounded-lg border border-zinc-700 hover:border-zinc-600 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono text-gray-300 truncate">
                    {order.orderId.slice(0, 20)}...
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {order.modified
                      ? new Date(order.modified).toLocaleString()
                      : order.created
                      ? new Date(order.created).toLocaleString()
                      : "Unknown date"}
                  </p>
                </div>
                <div className="text-right ml-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      order.status === "complete"
                        ? "bg-green-500/20 text-green-400"
                        : order.status === "pending"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : order.status === "processing"
                        ? "bg-blue-500/20 text-blue-400"
                        : order.status === "failed"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
