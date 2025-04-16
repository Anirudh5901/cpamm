import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import Header from "./components/Header";
import ConnectWallet from "./components/ConnectWallet";
import Tabs from "./components/Tabs";
import Swap from "./components/Swap";
import Liquidity from "./components/Liquidity";
import Stats from "./components/Stats";
import { CPAMM_ADDRESS } from "./constants/abi.js";
import { CPAMM_ABI } from "./constants/abi.js";
import { MOCK_TOKEN_ABI } from "./constants/abi.js";

function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState("");
  const [cpammContract, setCpammContract] = useState(null);
  const [token0Contract, setToken0Contract] = useState(null);
  const [token1Contract, setToken1Contract] = useState(null);
  const [token0Address, setToken0Address] = useState("");
  const [token1Address, setToken1Address] = useState("");
  const [token0Symbol, setToken0Symbol] = useState("");
  const [token1Symbol, setToken1Symbol] = useState("");
  const [reserves, setReserves] = useState({ reserve0: "0", reserve1: "0" });
  const [shares, setShares] = useState("0");
  const [totalShares, setTotalShares] = useState("0");
  const [activeTab, setActiveTab] = useState("swap");
  const [isLoading, setIsLoading] = useState(false);

  // Contract address for CPAMM - replace with your deployed contract address
  //const CPAMM_ADDRESS = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9"; // Replace with your contract address

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        setIsLoading(true);
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const address = await signer.getAddress();

        setProvider(provider);
        setSigner(signer);
        setAccount(address);

        const chainId = await provider
          .getNetwork()
          .then((network) => network.chainId);
        console.log("Connected Chain ID:", chainId);

        // Initialize contracts
        const cpammContract = new ethers.Contract(
          CPAMM_ADDRESS,
          CPAMM_ABI,
          signer
        );
        setCpammContract(cpammContract);

        // Get token addresses
        const token0Address = await cpammContract.getToken0();
        const token1Address = await cpammContract.getToken1();
        setToken0Address(token0Address);
        setToken1Address(token1Address);

        // Initialize token contracts
        const token0Contract = new ethers.Contract(
          token0Address,
          MOCK_TOKEN_ABI,
          signer
        );
        const token1Contract = new ethers.Contract(
          token1Address,
          MOCK_TOKEN_ABI,
          signer
        );
        setToken0Contract(token0Contract);
        setToken1Contract(token1Contract);

        // Get token symbols
        const token0Symbol = await token0Contract.symbol();
        const token1Symbol = await token1Contract.symbol();
        setToken0Symbol(token0Symbol);
        setToken1Symbol(token1Symbol);

        // Load initial data
        await refreshData(cpammContract, address);

        setIsLoading(false);
      } catch (error) {
        console.error("Error connecting to wallet:", error);
        setIsLoading(false);
      }
    } else {
      alert("Please install MetaMask to use this dApp");
    }
  };

  const refreshData = async (contract, address) => {
    try {
      // Get reserves
      const reserves = await contract.getReserves();
      setReserves({
        reserve0: ethers.utils.formatEther(reserves.reserve0),
        reserve1: ethers.utils.formatEther(reserves.reserve1),
      });

      // Get user shares
      const shares = await contract.getShares(address);
      setShares(ethers.utils.formatEther(shares));

      // Get total shares
      const totalShares = await contract.getTotalShares();
      setTotalShares(ethers.utils.formatEther(totalShares));
    } catch (error) {
      console.error("Error refreshing data:", error);
    }
  };

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          if (cpammContract) {
            refreshData(cpammContract, accounts[0]);
          }
        } else {
          setAccount("");
          setShares("0");
        }
      });

      return () => {
        window.ethereum.removeAllListeners("accountsChanged");
      };
    }
  }, [cpammContract]);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <Header account={account} />

      <main className="container mx-auto px-4 py-8">
        {!account ? (
          <ConnectWallet connectWallet={connectWallet} isLoading={isLoading} />
        ) : (
          <div className="max-w-lg mx-auto bg-white rounded-lg shadow-md overflow-hidden">
            <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

            <div className="p-6">
              {activeTab === "swap" && (
                <Swap
                  cpammContract={cpammContract}
                  token0Contract={token0Contract}
                  token1Contract={token1Contract}
                  token0Address={token0Address}
                  token1Address={token1Address}
                  token0Symbol={token0Symbol}
                  token1Symbol={token1Symbol}
                  reserves={reserves}
                  refreshData={() => refreshData(cpammContract, account)}
                />
              )}

              {activeTab === "liquidity" && (
                <Liquidity
                  cpammContract={cpammContract}
                  token0Contract={token0Contract}
                  token1Contract={token1Contract}
                  token0Address={token0Address}
                  token1Address={token1Address}
                  token0Symbol={token0Symbol}
                  token1Symbol={token1Symbol}
                  reserves={reserves}
                  shares={shares}
                  totalShares={totalShares}
                  refreshData={() => refreshData(cpammContract, account)}
                />
              )}

              <Stats
                token0Symbol={token0Symbol}
                token1Symbol={token1Symbol}
                reserves={reserves}
                shares={shares}
                totalShares={totalShares}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
