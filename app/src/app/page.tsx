"use client";

import dynamic from "next/dynamic";

// Dynamically import PayrollDashboard to avoid SSR issues with SilentSwap
const PayrollDashboard = dynamic(() => import("@/components/PayrollDashboard").then(mod => ({ default: mod.PayrollDashboard })), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[400px]">
      <p className="text-gray-400">Loading...</p>
    </div>
  ),
});

export default function Home() {
  return (
    <main className="min-h-screen p-8">
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
