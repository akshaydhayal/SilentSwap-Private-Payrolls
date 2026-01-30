"use client";

import dynamic from "next/dynamic";

// Dynamically import PayrollDashboard to avoid bundling SilentSwap modules
// This prevents chunk load timeouts
const PayrollDashboard = dynamic(
  () => import("@/components/PayrollDashboard").then((mod) => ({ default: mod.PayrollDashboard })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-400 mb-2">Loading dashboard...</p>
          <div className="w-8 h-8 border-4 border-gray-600 border-t-yellow-500 rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    ),
  }
);

export default function Home() {
  return (
    <main className="min-h-screen p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2">SilentSwap Payroll</h1>
          <p className="text-gray-400">
            Private payroll and payouts on Solana - Keep payment history private
          </p>
        </header>
        <PayrollDashboard />
      </div>
    </main>
  );
}
