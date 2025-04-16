import React, { useState, useEffect } from "react";
import { ethers } from "ethers";

function Swap({
  cpammContract,
  token0Contract,
  token1Contract,
  token0Address,
  token1Address,
  token0Symbol,
  token1Symbol,
  reserves,
  refreshData,
}) {
  const [swapDirection, setSwapDirection] = useState("0to1"); // '0to1' or '1to0'
  const [amountIn, setAmountIn] = useState("");
  const [amountOut, setAmountOut] = useState("");
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [approved, setApproved] = useState(false);
  const [tokenInBalance, setTokenInBalance] = useState("0");
  const [tokenOutBalance, setTokenOutBalance] = useState("0");

  // Get current token addresses based on swap direction
  const tokenInAddress =
    swapDirection === "0to1" ? token0Address : token1Address;
  const tokenOutAddress =
    swapDirection === "0to1" ? token1Address : token0Address;
  const tokenInContract =
    swapDirection === "0to1" ? token0Contract : token1Contract;
  const tokenOutContract =
    swapDirection === "0to1" ? token1Contract : token0Contract;
  const tokenInSymbol = swapDirection === "0to1" ? token0Symbol : token1Symbol;
  const tokenOutSymbol = swapDirection === "0to1" ? token1Symbol : token0Symbol;

  // Load token balances
  useEffect(() => {
    const loadBalances = async () => {
      if (tokenInContract && tokenOutContract) {
        try {
          const signer = tokenInContract.signer;
          const address = await signer.getAddress();

          const balanceIn = await tokenInContract.balanceOf(address);
          const balanceOut = await tokenOutContract.balanceOf(address);

          setTokenInBalance(ethers.utils.formatEther(balanceIn));
          setTokenOutBalance(ethers.utils.formatEther(balanceOut));

          // Check if already approved
          const allowance = await tokenInContract.allowance(
            address,
            cpammContract.address
          );
          if (allowance.gt(0)) {
            setApproved(true);
          } else {
            setApproved(false);
          }
        } catch (error) {
          console.error("Error loading balances:", error);
        }
      }
    };

    loadBalances();
  }, [tokenInContract, tokenOutContract, cpammContract, swapDirection]);

  // Calculate amount out based on amount in
  const calculateAmountOut = (amountIn) => {
    if (!amountIn || isNaN(amountIn) || parseFloat(amountIn) <= 0) {
      setAmountOut("");
      return;
    }

    try {
      const amountInWei = ethers.utils.parseEther(amountIn);
      const amountInWithFee = amountInWei.mul(997).div(1000); // 0.3% fee

      let reserveIn, reserveOut;
      if (swapDirection === "0to1") {
        reserveIn = ethers.utils.parseEther(reserves.reserve0);
        reserveOut = ethers.utils.parseEther(reserves.reserve1);
      } else {
        reserveIn = ethers.utils.parseEther(reserves.reserve1);
        reserveOut = ethers.utils.parseEther(reserves.reserve0);
      }

      if (reserveIn.eq(0) || reserveOut.eq(0)) {
        setAmountOut("0");
        return;
      }

      const numerator = reserveOut.mul(amountInWithFee);
      const denominator = reserveIn.add(amountInWithFee);
      const amountOutWei = numerator.div(denominator);

      setAmountOut(ethers.utils.formatEther(amountOutWei));
    } catch (error) {
      console.error("Error calculating amount out:", error);
      setAmountOut("0");
    }
  };

  const handleAmountInChange = (e) => {
    const value = e.target.value;
    setAmountIn(value);
    calculateAmountOut(value);
  };

  const approveToken = async () => {
    if (!tokenInContract || !cpammContract) return;

    try {
      setApproving(true);
      const maxApproval = ethers.constants.MaxUint256;
      const tx = await tokenInContract.approve(
        cpammContract.address,
        maxApproval
      );
      await tx.wait();
      setApproved(true);
      setApproving(false);
    } catch (error) {
      console.error("Error approving token:", error);
      setApproving(false);
    }
  };

  const executeSwap = async () => {
    if (!amountIn || !cpammContract) return;

    try {
      setLoading(true);
      const amountInWei = ethers.utils.parseEther(amountIn);
      const tx = await cpammContract.swap(tokenInAddress, amountInWei);
      await tx.wait();

      // Refresh data
      await refreshData();

      // Reset form
      setAmountIn("");
      setAmountOut("");
      setLoading(false);
    } catch (error) {
      console.error("Error executing swap:", error);
      setLoading(false);
    }
  };

  const switchDirection = () => {
    setSwapDirection(swapDirection === "0to1" ? "1to0" : "0to1");
    setAmountIn("");
    setAmountOut("");
    setApproved(false);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Swap Tokens</h2>

      <div className="space-y-4">
        <div className="bg-gray-100 p-4 rounded-lg">
          <div className="flex justify-between mb-2">
            <label className="text-sm text-gray-600">From</label>
            <span className="text-sm text-gray-600">
              Balance: {parseFloat(tokenInBalance).toFixed(6)} {tokenInSymbol}
            </span>
          </div>

          <div className="flex items-center">
            <input
              type="number"
              placeholder="0.0"
              value={amountIn}
              onChange={handleAmountInChange}
              className="w-full bg-transparent text-lg focus:outline-none"
              disabled={loading}
            />
            <div className="ml-2 font-medium">{tokenInSymbol}</div>
          </div>
        </div>

        <button
          onClick={switchDirection}
          className="mx-auto block bg-gray-200 p-2 rounded-full hover:bg-gray-300"
          disabled={loading}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        <div className="bg-gray-100 p-4 rounded-lg">
          <div className="flex justify-between mb-2">
            <label className="text-sm text-gray-600">To</label>
            <span className="text-sm text-gray-600">
              Balance: {parseFloat(tokenOutBalance).toFixed(6)} {tokenOutSymbol}
            </span>
          </div>

          <div className="flex items-center">
            <input
              type="number"
              placeholder="0.0"
              value={amountOut}
              readOnly
              className="w-full bg-transparent text-lg focus:outline-none"
            />
            <div className="ml-2 font-medium">{tokenOutSymbol}</div>
          </div>
        </div>

        {!approved ? (
          <button
            onClick={approveToken}
            disabled={approving || !amountIn || parseFloat(amountIn) <= 0}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:bg-blue-400"
          >
            {approving ? "Approving..." : `Approve ${tokenInSymbol}`}
          </button>
        ) : (
          <button
            onClick={executeSwap}
            disabled={loading || !amountIn || parseFloat(amountIn) <= 0}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:bg-blue-400"
          >
            {loading ? "Swapping..." : "Swap"}
          </button>
        )}
      </div>
    </div>
  );
}

export default Swap;
