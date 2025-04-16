import React from "react";

function Stats({ token0Symbol, token1Symbol, reserves, shares, totalShares }) {
  const sharesPercentage =
    totalShares > 0
      ? ((parseFloat(shares) / parseFloat(totalShares)) * 100).toFixed(2)
      : "0.00";

  return (
    <div className="mt-6 pt-6 border-t border-gray-200">
      <h3 className="text-lg font-semibold mb-3">Pool Information</h3>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Reserves {token0Symbol}:</span>
          <span className="font-medium">
            {parseFloat(reserves.reserve0).toFixed(6)}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Reserves {token1Symbol}:</span>
          <span className="font-medium">
            {parseFloat(reserves.reserve1).toFixed(6)}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Your Shares:</span>
          <span className="font-medium">{parseFloat(shares).toFixed(6)}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Total Shares:</span>
          <span className="font-medium">
            {parseFloat(totalShares).toFixed(6)}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Your Pool Percentage:</span>
          <span className="font-medium">{sharesPercentage}%</span>
        </div>
      </div>
    </div>
  );
}

export default Stats;
