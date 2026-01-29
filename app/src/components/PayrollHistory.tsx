"use client";

import { useOrdersContext } from "@silentswap/react";

export function PayrollHistory() {
  const { orders, loading, refreshOrders } = useOrdersContext();

  return (
    <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Recent Payouts</h2>
        <button
          onClick={refreshOrders}
          className="text-sm px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading orders...</p>
      ) : orders.length === 0 ? (
        <p className="text-gray-400">No payouts yet</p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div
              key={order.orderId}
              className="p-4 bg-zinc-800 rounded-lg border border-zinc-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono text-gray-300">
                    {order.orderId.slice(0, 16)}...
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {order.modified
                      ? new Date(order.modified).toLocaleString()
                      : "Unknown date"}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      order.status === "complete"
                        ? "bg-green-500/20 text-green-400"
                        : order.status === "pending"
                        ? "bg-yellow-500/20 text-yellow-400"
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
