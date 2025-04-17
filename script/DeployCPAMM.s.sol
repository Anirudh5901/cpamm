// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {CPAMM} from "../src/CPAMM.sol";
import {MockToken} from "../script/MockToken.sol";

contract DeployCPAMM is Script {
    CPAMM cpamm;
    MockToken token0;
    MockToken token1;

    function run() public returns (CPAMM, MockToken, MockToken) {
        address deployer = msg.sender;
        console.log("Deployer:", deployer);

        vm.startBroadcast(deployer);
        token0 = new MockToken("Token A", "TKA");
        token1 = new MockToken("Token B", "TKB");
        console.log("Token0:", address(token0));
        console.log("Token1:", address(token1));

        cpamm = new CPAMM(address(token0), address(token1));
        console.log("CPAMM:", address(cpamm));

        uint256 initialLiquidity = 1000 ether;
        console.log("Minting token0...");
        token0.mint(deployer, initialLiquidity);
        console.log("Deployer balance token0:", token0.balanceOf(deployer));
        console.log("Minting token1...");
        token1.mint(deployer, initialLiquidity);
        console.log("Deployer balance token1:", token1.balanceOf(deployer));

        console.log("Approving CPAMM for token0...");
        token0.approve(address(cpamm), initialLiquidity);
        console.log("Token0 allowance:", token0.allowance(deployer, address(cpamm)));
        console.log("Approving CPAMM for token1...");
        token1.approve(address(cpamm), initialLiquidity);
        console.log("Token1 allowance:", token1.allowance(deployer, address(cpamm)));

        console.log("Adding liquidity...");
        cpamm.addLiquidity(initialLiquidity, initialLiquidity);
        console.log("Liquidity added");

        vm.stopBroadcast();
        return (cpamm, token0, token1);
    }
}
