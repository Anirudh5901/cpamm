import React from "react";

function ConnectWallet({ connectWallet, isLoading }) {
  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8 text-center">
      <h2 className="text-2xl font-semibold mb-6">Welcome to Mini-Swap V2</h2>
      <p className="mb-6 text-gray-600">
        Connect your wallet to start trading and providing liquidity
      </p>
      <button
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg w-full transition duration-300"
        onClick={connectWallet}
        disabled={isLoading}
      >
        {isLoading ? "Connecting..." : "Connect Wallet"}
      </button>
    </div>
  );
}

export default ConnectWallet;
