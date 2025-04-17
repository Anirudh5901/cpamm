// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {CPAMM} from "../src/CPAMM.sol";
import {MockToken} from "../script/MockToken.sol";

contract DeployCPAMM is Script {
    CPAMM cpamm;
    MockToken token0;
    MockToken token1;

    function run() public returns (CPAMM, MockToken, MockToken) {
        // Store msg.sender to ensure consistent use
        address deployer = msg.sender;

        vm.startBroadcast(deployer);
        token0 = new MockToken("Token A", "TKA");
        token1 = new MockToken("Token B", "TKB");
        cpamm = new CPAMM(address(token0), address(token1));

        uint256 initialLiquidity = 1000 ether;
        token0.mint(deployer, initialLiquidity);
        token1.mint(deployer, initialLiquidity);

        // Approve and add liquidity as deployer
        token0.approve(address(cpamm), initialLiquidity);
        token1.approve(address(cpamm), initialLiquidity);
        cpamm.addLiquidity(initialLiquidity, initialLiquidity);

        vm.stopBroadcast();
        return (cpamm, token0, token1);
    }
}
