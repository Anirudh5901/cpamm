import React from "react";
import { Vortex } from "./ui/vortex";

export default function ConnectWallet({ connectWallet, isLoading }) {
  return (
    <div className="w-full mx-auto h-[100vh] overflow-hidden">
      <Vortex
        backgroundColor="black"
        className="flex items-center flex-col justify-center px-2 md:px-10 py-4 w-full h-full"
      >
        <h2 className="text-white text-2xl md:text-6xl font-bold text-center">
          Welcome to Mini-Swap V2
        </h2>
        <p className="text-white text-sm md:text-2xl max-w-xl mt-6 text-center">
          Connect your wallet to start trading and providing liquidity
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-6">
          <button
            className="inline-flex h-12 animate-shimmer items-center justify-center rounded-md border border-slate-800 bg-[linear-gradient(110deg,#000103,45%,#1e2631,55%,#000103)] bg-[length:200%_100%] px-6 font-medium text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50"
            onClick={connectWallet}
            disabled={isLoading}
          >
            {isLoading ? "Connecting..." : "Connect Wallet"}
          </button>
        </div>
      </Vortex>
    </div>
  );
}
