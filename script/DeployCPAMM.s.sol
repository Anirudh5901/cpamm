// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/CPAMM.sol";
import {MockToken} from "../script/MockToken.sol";

contract DeployCPAMM is Script {
    function run() external returns (CPAMM, MockToken, MockToken) {
        vm.startBroadcast();

        // Deploy mock ERC20 tokens
        MockToken token0 = new MockToken("Token A", "TKA");
        MockToken token1 = new MockToken("Token B", "TKB");

        // Deploy CPAMM with token addresses
        CPAMM cpamm = new CPAMM(address(token0), address(token1));

        // Mint tokens to deployer for initial liquidity
        uint256 initialLiquidity = 1000 ether; // 1000 tokens of each
        token0.mint(msg.sender, initialLiquidity);
        token1.mint(msg.sender, initialLiquidity);

        // Approve CPAMM to spend tokens
        token0.approve(address(cpamm), initialLiquidity);
        token1.approve(address(cpamm), initialLiquidity);

        // Add initial liquidity
        cpamm.addLiquidity(initialLiquidity, initialLiquidity);

        vm.stopBroadcast();
        return (cpamm, token0, token1);
    }
}
