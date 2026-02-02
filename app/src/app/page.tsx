"use client";

import dynamic from "next/dynamic";

const PayrollDashboard = dynamic(
  () => import("@/components/PayrollDashboard"),
  { 
    ssr: false,
    loading: () => <div className="min-h-[400px]" /> 
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
