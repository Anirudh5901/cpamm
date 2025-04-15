// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {CPAMM} from "../src/CPAMM.sol";
import {ERC20Mock} from "../lib/openzeppelin-contracts/contracts/mocks/token/ERC20Mock.sol";

contract DeployCPAMM is Script {
    CPAMM cpamm;
    ERC20Mock token0;
    ERC20Mock token1;

    function run() public returns (CPAMM, ERC20Mock, ERC20Mock) {
        vm.startBroadcast();
        token0 = new ERC20Mock();
        token1 = new ERC20Mock();
        token0.mint(address(this), 1000 ether);
        token1.mint(address(this), 1000 ether);
        cpamm = new CPAMM(address(token0), address(token1));
        vm.stopBroadcast();
        return (cpamm, token0, token1);
    }
}
