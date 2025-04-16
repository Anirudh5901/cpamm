import React from "react";

function Tabs({ activeTab, setActiveTab }) {
  return (
    <div className="flex border-b">
      <button
        className={`flex-1 py-4 font-medium ${
          activeTab === "swap"
            ? "text-blue-600 border-b-2 border-blue-600"
            : "text-gray-500 hover:text-gray-700"
        }`}
        onClick={() => setActiveTab("swap")}
      >
        Swap
      </button>
      <button
        className={`flex-1 py-4 font-medium ${
          activeTab === "liquidity"
            ? "text-blue-600 border-b-2 border-blue-600"
            : "text-gray-500 hover:text-gray-700"
        }`}
        onClick={() => setActiveTab("liquidity")}
      >
        Liquidity
      </button>
    </div>
  );
}

export default Tabs;
