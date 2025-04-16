// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {CPAMM} from "../src/CPAMM.sol";
import {DeployCPAMM} from "../script/DeployCPAMM.s.sol";
import {MockToken} from "../script/MockToken.sol";

contract CPAMMTest is Test {
    DeployCPAMM deployer;
    CPAMM cpamm;
    MockToken token0;
    MockToken token1;
    address USER = makeAddr("user");
    address DEPLOYER = address(this);

    function setUp() public {
        deployer = new DeployCPAMM();
        (cpamm, token0, token1) = deployer.run();

        // Mint tokens to deployer and user for testing
        token0.mint(DEPLOYER, 10000 ether);
        token1.mint(DEPLOYER, 10000 ether);
        token0.mint(USER, 10000 ether);
        token1.mint(USER, 10000 ether);
    }

    // Helper function to approve tokens from DEPLOYER
    function approveTokens(uint256 amount0, uint256 amount1) internal {
        token0.approve(address(cpamm), amount0);
        token1.approve(address(cpamm), amount1);
    }

    // Helper function to approve tokens from USER
    function approveTokensFromUser(uint256 amount0, uint256 amount1) internal {
        vm.prank(USER);
        token0.approve(address(cpamm), amount0);
        vm.prank(USER);
        token1.approve(address(cpamm), amount1);
    }

    // Helper function to add liquidity from USER
    function addLiquidityFromUser(uint256 amount0, uint256 amount1) internal {
        vm.prank(USER);
        cpamm.addLiquidity(amount0, amount1);
    }

    ////// Constructor Tests //////
    function testConstructorSetsTokens() public view {
        assertEq(cpamm.getToken0(), address(token0), "Token0 not set correctly");
        assertEq(cpamm.getToken1(), address(token1), "Token1 not set correctly");
    }

    ////// Swap Tests //////
    function testSwapToken0ForToken1() public {
        // Add initial liquidity from deployer
        approveTokens(100 ether, 100 ether);
        cpamm.addLiquidity(100 ether, 100 ether);

        // Swap 1 ether of token0 for token1 from USER
        vm.startPrank(USER);
        token0.approve(address(cpamm), 1 ether);
        uint256 amountOut = cpamm.swap(address(token0), 1 ether);
        vm.stopPrank();

        // Verify swap results
        assertGt(amountOut, 0, "Amount out should be greater than zero");
        (uint256 reserve0, uint256 reserve1) = cpamm.getReserves();
        assertEq(reserve0, 101 ether, "Reserve0 should increase by swap amount");
        assertEq(reserve1, 100 ether - amountOut, "Reserve1 should decrease by amount out");

        // Verify fee
        uint256 amountInWithFee = (1 ether * 997) / 1000;
        uint256 expectedAmountOut = (100 ether * amountInWithFee) / (100 ether + amountInWithFee);
        assertEq(amountOut, expectedAmountOut, "Fee calculation incorrect");
    }

    function testSwapToken1ForToken0() public {
        approveTokens(100 ether, 100 ether);
        cpamm.addLiquidity(100 ether, 100 ether);

        vm.startPrank(USER);
        token1.approve(address(cpamm), 1 ether);
        uint256 amountOut = cpamm.swap(address(token1), 1 ether);
        vm.stopPrank();

        assertGt(amountOut, 0, "Amount out should be greater than zero");
        (uint256 reserve0, uint256 reserve1) = cpamm.getReserves();
        assertEq(reserve1, 101 ether, "Reserve1 should increase by swap amount");
        assertEq(reserve0, 100 ether - amountOut, "Reserve0 based on amount out");
    }

    function testSwapRevertsWithInvalidToken() public {
        vm.prank(USER);
        vm.expectRevert(CPAMM.CPAMM__InvalidToken.selector);
        cpamm.swap(address(this), 1 ether);
    }

    function testSwapRevertsWithZeroAmount() public {
        vm.prank(USER);
        vm.expectRevert(CPAMM.CAPMM__AmountInTooLow.selector);
        cpamm.swap(address(token0), 0);
    }

    ////// Add Liquidity Tests //////
    function testAddLiquidityFirstTime() public {
        uint256 amount0 = 100 ether;
        uint256 amount1 = 100 ether;
        approveTokensFromUser(amount0, amount1);
        addLiquidityFromUser(amount0, amount1);

        uint256 shares = cpamm.getShares(USER);
        assertEq(shares, 100 ether, "Initial shares incorrect");
        assertEq(cpamm.getTotalShares(), shares, "Total shares incorrect");
        (uint256 reserve0, uint256 reserve1) = cpamm.getReserves();
        assertEq(reserve0, amount0, "Reserve0 incorrect");
        assertEq(reserve1, amount1, "Reserve1 incorrect");
    }

    function testAddLiquidityMaintainsRatio() public {
        approveTokens(100 ether, 100 ether);
        cpamm.addLiquidity(100 ether, 100 ether);

        approveTokensFromUser(50 ether, 50 ether);
        addLiquidityFromUser(50 ether, 50 ether);

        uint256 shares = cpamm.getShares(USER);
        assertEq(shares, 50 ether, "Shares should be proportional");
        assertEq(cpamm.getTotalShares(), 150 ether, "Total shares incorrect");
        (uint256 reserve0, uint256 reserve1) = cpamm.getReserves();
        assertEq(reserve0, 150 ether, "Reserve0 incorrect");
        assertEq(reserve1, 150 ether, "Reserve1 incorrect");
    }

    function testAddLiquidityRevertsOnRatioMismatch() public {
        approveTokens(100 ether, 100 ether);
        cpamm.addLiquidity(100 ether, 100 ether);

        approveTokensFromUser(50 ether, 100 ether);
        vm.prank(USER);
        vm.expectRevert(CPAMM.CPAMM__PriceNotEqualAfterAddingLiquidity.selector);
        cpamm.addLiquidity(50 ether, 100 ether);
    }

    function testAddLiquidityRevertsOnZeroShares() public {
        // Add large initial liquidity from deployer
        approveTokens(10000 ether, 10000 ether);
        cpamm.addLiquidity(10000 ether, 10000 ether);

        // Try to add tiny amount from USER
        approveTokensFromUser(1, 1); // 1 wei
        vm.prank(USER);
        vm.expectRevert(CPAMM.CPAMM__NoSharesMinted.selector);
        cpamm.addLiquidity(1, 1);
    }

    ////// Remove Liquidity Tests //////
    function testRemoveLiquidity() public {
        approveTokensFromUser(1000 ether, 1000 ether);
        addLiquidityFromUser(1000 ether, 1000 ether);

        uint256 burnShares = 500 ether;
        vm.prank(USER);
        (uint256 amount0, uint256 amount1) = cpamm.removeLiquidity(burnShares);

        assertEq(amount0, 500 ether, "Amount0 withdrawn incorrect");
        assertEq(amount1, 500 ether, "Amount1 withdrawn incorrect");
        assertEq(cpamm.getShares(USER), 500 ether, "User shares incorrect");
        assertEq(cpamm.getTotalShares(), 500 ether, "Total shares incorrect");
        (uint256 reserve0, uint256 reserve1) = cpamm.getReserves();
        assertEq(reserve0, 500 ether, "Reserve0 incorrect");
        assertEq(reserve1, 500 ether, "Reserve1 incorrect");
    }

    function testRemoveLiquidityRevertsOnZeroAmountOut() public {
        approveTokensFromUser(10000 ether, 10000 ether);
        addLiquidityFromUser(10000 ether, 10000 ether);

        vm.prank(USER);
        vm.expectRevert(CPAMM.CPAMM__AmountOutZero.selector);
        cpamm.removeLiquidity(1); // 1 wei of shares
    }

    function testRemoveLiquidityRevertsOnInsufficientShares() public {
        approveTokensFromUser(1000 ether, 1000 ether);
        addLiquidityFromUser(1000 ether, 1000 ether);

        vm.prank(USER);
        vm.expectRevert();
        cpamm.removeLiquidity(1000 ether + 1);
    }

    ////// View Function Tests //////
    function testViewFunctions() public {
        assertEq(cpamm.getToken0Balance(), 0, "Initial token0 balance incorrect");
        assertEq(cpamm.getToken1Balance(), 0, "Initial token1 balance incorrect");

        approveTokens(100 ether, 100 ether);
        cpamm.addLiquidity(100 ether, 100 ether);

        assertEq(cpamm.getToken0Balance(), 100 ether, "Token0 balance after liquidity incorrect");
        assertEq(cpamm.getToken1Balance(), 100 ether, "Token1 balance after liquidity incorrect");
        assertEq(cpamm.getShares(DEPLOYER), 100 ether, "Deployer shares incorrect");
        assertEq(cpamm.getTotalShares(), 100 ether, "Total shares incorrect");
        (uint256 reserve0, uint256 reserve1) = cpamm.getReserves();
        assertEq(reserve0, 100 ether, "Reserve0 incorrect");
        assertEq(reserve1, 100 ether, "Reserve1 incorrect");
    }
}
