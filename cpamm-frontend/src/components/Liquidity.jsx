import React, { useState, useEffect } from "react";
import { ethers } from "ethers";

function Liquidity({
  cpammContract,
  token0Contract,
  token1Contract,
  token0Address,
  token1Address,
  token0Symbol,
  token1Symbol,
  reserves,
  shares,
  totalShares,
  refreshData,
}) {
  const [mode, setMode] = useState("add"); // 'add' or 'remove'
  const [amount0, setAmount0] = useState("");
  const [amount1, setAmount1] = useState("");
  const [sharesToRemove, setSharesToRemove] = useState("");
  const [estimatedAmount0, setEstimatedAmount0] = useState("");
  const [estimatedAmount1, setEstimatedAmount1] = useState("");
  const [approvedToken0, setApprovedToken0] = useState(false);
  const [approvedToken1, setApprovedToken1] = useState(false);
  const [approving0, setApproving0] = useState(false);
  const [approving1, setApproving1] = useState(false);
  const [loading, setLoading] = useState(false);
  const [token0Balance, setToken0Balance] = useState("0");
  const [token1Balance, setToken1Balance] = useState("0");

  // Load token balances and allowances
  useEffect(() => {
    const loadBalancesAndAllowances = async () => {
      if (token0Contract && token1Contract && cpammContract) {
        try {
          const signer = token0Contract.signer;
          const address = await signer.getAddress();

          // Get balances
          const balance0 = await token0Contract.balanceOf(address);
          const balance1 = await token1Contract.balanceOf(address);
          setToken0Balance(ethers.utils.formatEther(balance0));
          setToken1Balance(ethers.utils.formatEther(balance1));

          // Check approvals
          const allowance0 = await token0Contract.allowance(
            address,
            cpammContract.address
          );
          const allowance1 = await token1Contract.allowance(
            address,
            cpammContract.address
          );

          setApprovedToken0(allowance0.gt(0));
          setApprovedToken1(allowance1.gt(0));
        } catch (error) {
          console.error("Error loading balances and allowances:", error);
        }
      }
    };

    loadBalancesAndAllowances();
  }, [token0Contract, token1Contract, cpammContract]);

  // Calculate amounts based on reserves and inputs
  useEffect(() => {
    // When adding liquidity
    if (
      mode === "add" &&
      parseFloat(reserves.reserve0) > 0 &&
      parseFloat(reserves.reserve1) > 0
    ) {
      if (amount0 && !isNaN(parseFloat(amount0))) {
        // If reserves exist, calculate amount1 based on current ratio
        const ratio =
          parseFloat(reserves.reserve1) / parseFloat(reserves.reserve0);
        setAmount1((parseFloat(amount0) * ratio).toFixed(6));
      } else if (amount1 && !isNaN(parseFloat(amount1))) {
        // Calculate amount0 based on ratio if amount1 is provided
        const ratio =
          parseFloat(reserves.reserve0) / parseFloat(reserves.reserve1);
        setAmount0((parseFloat(amount1) * ratio).toFixed(6));
      }
    }

    // When removing liquidity
    if (mode === "remove" && sharesToRemove && parseFloat(totalShares) > 0) {
      const shareRatio = parseFloat(sharesToRemove) / parseFloat(totalShares);
      setEstimatedAmount0(
        (parseFloat(reserves.reserve0) * shareRatio).toFixed(6)
      );
      setEstimatedAmount1(
        (parseFloat(reserves.reserve1) * shareRatio).toFixed(6)
      );
    }
  }, [mode, amount0, amount1, sharesToRemove, reserves, totalShares]);

  const handleAmount0Change = (e) => {
    setAmount0(e.target.value);
    if (e.target.value === "") {
      setAmount1("");
    }
  };

  const handleAmount1Change = (e) => {
    setAmount1(e.target.value);
    if (e.target.value === "") {
      setAmount0("");
    }
  };

  const handleSharesChange = (e) => {
    setSharesToRemove(e.target.value);
  };

  const approveToken0 = async () => {
    if (!token0Contract || !cpammContract) return;

    try {
      setApproving0(true);
      const maxApproval = ethers.constants.MaxUint256;
      const tx = await token0Contract.approve(
        cpammContract.address,
        maxApproval
      );
      await tx.wait();
      setApprovedToken0(true);
      setApproving0(false);
    } catch (error) {
      console.error("Error approving token0:", error);
      setApproving0(false);
    }
  };

  const approveToken1 = async () => {
    if (!token1Contract || !cpammContract) return;

    try {
      setApproving1(true);
      const maxApproval = ethers.constants.MaxUint256;
      const tx = await token1Contract.approve(
        cpammContract.address,
        maxApproval
      );
      await tx.wait();
      setApprovedToken1(true);
      setApproving1(false);
    } catch (error) {
      console.error("Error approving token1:", error);
      setApproving1(false);
    }
  };

  const addLiquidity = async () => {
    if (!amount0 || !amount1 || !cpammContract) return;

    try {
      setLoading(true);
      const amount0Wei = ethers.utils.parseEther(amount0);
      const amount1Wei = ethers.utils.parseEther(amount1);

      const tx = await cpammContract.addLiquidity(amount0Wei, amount1Wei);
      await tx.wait();

      // Refresh data
      await refreshData();

      // Reset form
      setAmount0("");
      setAmount1("");
      setLoading(false);
    } catch (error) {
      console.error("Error adding liquidity:", error);
      setLoading(false);
    }
  };

  const removeLiquidity = async () => {
    if (!sharesToRemove || !cpammContract) return;

    try {
      setLoading(true);
      const sharesToRemoveWei = ethers.utils.parseEther(sharesToRemove);

      const tx = await cpammContract.removeLiquidity(sharesToRemoveWei);
      await tx.wait();

      // Refresh data
      await refreshData();

      // Reset form
      setSharesToRemove("");
      setEstimatedAmount0("");
      setEstimatedAmount1("");
      setLoading(false);
    } catch (error) {
      console.error("Error removing liquidity:", error);
      setLoading(false);
    }
  };

  // Calculate percentage of pool that user will own after adding liquidity
  const calculatePoolPercentage = () => {
    if (mode === "add" && amount0 && amount1) {
      if (
        parseFloat(reserves.reserve0) === 0 &&
        parseFloat(reserves.reserve1) === 0
      ) {
        return "100.00"; // First liquidity provider gets 100%
      }

      // Calculate new total shares after adding liquidity (rough estimation)
      const addedAmount0 = parseFloat(amount0);
      const reserve0 = parseFloat(reserves.reserve0);
      const existingShares = parseFloat(totalShares);

      if (reserve0 === 0 || existingShares === 0) return "0.00";

      // Estimate new shares based on proportional increase in token0
      const newSharesEstimate = (addedAmount0 / reserve0) * existingShares;
      const newTotalShares = existingShares + newSharesEstimate;
      const userSharesAfterAddition = parseFloat(shares) + newSharesEstimate;

      return ((userSharesAfterAddition / newTotalShares) * 100).toFixed(2);
    }

    return "0.00";
  };

  return (
    <div>
      <div className="flex mb-4">
        <button
          className={`flex-1 py-2 px-4 ${
            mode === "add"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          } rounded-l-lg font-medium transition duration-200`}
          onClick={() => setMode("add")}
        >
          Add Liquidity
        </button>
        <button
          className={`flex-1 py-2 px-4 ${
            mode === "remove"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          } rounded-r-lg font-medium transition duration-200`}
          onClick={() => setMode("remove")}
          disabled={parseFloat(shares) <= 0}
        >
          Remove Liquidity
        </button>
      </div>

      {mode === "add" ? (
        <div className="space-y-4">
          <div className="bg-gray-100 p-4 rounded-lg">
            <div className="flex justify-between mb-2">
              <label className="text-sm text-gray-600">
                Amount of {token0Symbol}
              </label>
              <span className="text-sm text-gray-600">
                Balance: {parseFloat(token0Balance).toFixed(6)}
              </span>
            </div>
            <input
              type="number"
              placeholder="0.0"
              value={amount0}
              onChange={handleAmount0Change}
              className="w-full bg-transparent text-lg focus:outline-none"
              disabled={loading}
            />
          </div>

          <div className="bg-gray-100 p-4 rounded-lg">
            <div className="flex justify-between mb-2">
              <label className="text-sm text-gray-600">
                Amount of {token1Symbol}
              </label>
              <span className="text-sm text-gray-600">
                Balance: {parseFloat(token1Balance).toFixed(6)}
              </span>
            </div>
            <input
              type="number"
              placeholder="0.0"
              value={amount1}
              onChange={handleAmount1Change}
              className="w-full bg-transparent text-lg focus:outline-none"
              disabled={loading}
            />
          </div>

          {parseFloat(reserves.reserve0) > 0 &&
            parseFloat(reserves.reserve1) > 0 && (
              <div className="text-sm text-blue-600">
                Pool ratio: 1 {token0Symbol} ={" "}
                {(
                  parseFloat(reserves.reserve1) / parseFloat(reserves.reserve0)
                ).toFixed(6)}{" "}
                {token1Symbol}
              </div>
            )}

          {amount0 && amount1 && (
            <div className="text-sm text-blue-600">
              You will receive approximately {calculatePoolPercentage()}% of the
              pool
            </div>
          )}

          <div className="flex space-x-2">
            {!approvedToken0 && (
              <button
                onClick={approveToken0}
                disabled={approving0 || loading}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:bg-blue-400"
              >
                {approving0 ? "Approving..." : `Approve ${token0Symbol}`}
              </button>
            )}

            {!approvedToken1 && (
              <button
                onClick={approveToken1}
                disabled={approving1 || loading}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:bg-blue-400"
              >
                {approving1 ? "Approving..." : `Approve ${token1Symbol}`}
              </button>
            )}
          </div>

          {approvedToken0 && approvedToken1 && (
            <button
              onClick={addLiquidity}
              disabled={
                loading ||
                !amount0 ||
                !amount1 ||
                parseFloat(amount0) <= 0 ||
                parseFloat(amount1) <= 0
              }
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:bg-blue-400"
            >
              {loading ? "Adding Liquidity..." : "Add Liquidity"}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gray-100 p-4 rounded-lg">
            <div className="flex justify-between mb-2">
              <label className="text-sm text-gray-600">Shares to Remove</label>
              <span className="text-sm text-gray-600">
                Available: {parseFloat(shares).toFixed(6)}
              </span>
            </div>
            <input
              type="number"
              placeholder="0.0"
              value={sharesToRemove}
              onChange={handleSharesChange}
              className="w-full bg-transparent text-lg focus:outline-none"
              disabled={loading}
              max={shares}
            />
          </div>

          {sharesToRemove && parseFloat(sharesToRemove) > 0 && (
            <div className="bg-gray-100 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">
                You will receive:
              </div>
              <div className="flex justify-between mb-2">
                <span>
                  {parseFloat(estimatedAmount0).toFixed(6)} {token0Symbol}
                </span>
                <span>
                  {parseFloat(estimatedAmount1).toFixed(6)} {token1Symbol}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={removeLiquidity}
            disabled={
              loading ||
              !sharesToRemove ||
              parseFloat(sharesToRemove) <= 0 ||
              parseFloat(sharesToRemove) > parseFloat(shares)
            }
            className="w-full py-3 bg-black hover:bg-blue-700 text-white rounded-lg font-medium disabled:bg-blue-400"
          >
            {loading ? "Removing Liquidity..." : "Remove Liquidity"}
          </button>
        </div>
      )}
    </div>
  );
}

export default Liquidity;
