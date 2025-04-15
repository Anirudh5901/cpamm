// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {IERC20} from "../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

/// @title minimal CPAMM (Contstant Product Automated Market Maker)
/// @author Anirudh
/// @notice The CPAMM contract is a simple implementation of a constant product automated market maker.
/// It will take in two erc20 tokens and allow users to swap between them.
contract CPAMM {
    //////ERRORS//////
    error CPAMM__InvalidToken();
    error CAPMM__AmountInTooLow();
    error CPAMM__PriceNotEqualAfterAddingLiquidity();
    error CPAMM__NoSharesMinted();
    error CPAMM__AmountOutZero();
    error CPAMM__InsufficientShares();

    //////STATE VARIABLES//////
    IERC20 private immutable i_token0;
    IERC20 private immutable i_token1;

    //state variables that keep track of how many tokens are in the contract
    // we are keeping an internal track of the amount of tokens so that users cannot directly send token0 and token1 to mess up the balance of the two tokens
    // if the users were able to directly manipulate the balance of the tokens then they might be able to mess up the swaps and the amount of shares to mint or burn
    uint256 private s_reserve0;
    uint256 private s_reserve1;

    //when a user provides or removes liquidity we will need to mint or burn shares
    uint256 private s_totalShares; // stores total number of shares
    mapping(address => uint256) private s_balanceOf; // stores the balance of shares for each user

    // New minimum thresholds
    uint256 private constant MINIMUM_SHARES = 1000; // 1000 wei
    uint256 private constant MINIMUM_AMOUNT = 1000; // 1000 wei

    //////MODIFIERS//////
    modifier validToken(address _tokenIn) {
        if (_tokenIn != address(i_token0) && _tokenIn != address(i_token1)) {
            revert CPAMM__InvalidToken();
        }
        _;
    }

    //////CONSTRUCTOR//////
    constructor(address _token0, address _token1) {
        i_token0 = IERC20(_token0);
        i_token1 = IERC20(_token1);
    }

    //////INTERNAL AND PRIVATE FUNCTIONS//////
    function _mint(address _to, uint256 _amount) private {
        s_balanceOf[_to] += _amount;
        s_totalShares += _amount;
    }

    function _burn(address _from, uint256 _amount) private {
        s_balanceOf[_from] -= _amount;
        s_totalShares -= _amount;
    }

    function _update(uint256 _reserve0, uint256 _reserve1) private {
        s_reserve0 = _reserve0;
        s_reserve1 = _reserve1;
    }

    // picked up from uniswapV2's code base
    function _sqrt(uint256 y) private pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }

    function _min(uint256 x, uint256 y) private pure returns (uint256) {
        if (x < y) {
            return x;
        } else {
            return y;
        }
    }

    //////PUBLIC FUNCTIONS//////
    function swap(address _tokenIn, uint256 _amountIn) external validToken(_tokenIn) returns (uint256 amountOut) {
        if (_amountIn <= 0) {
            revert CAPMM__AmountInTooLow();
        }

        // 1. Pull in token in
        bool isToken0 = _tokenIn == address(i_token0);
        (IERC20 tokenIn, IERC20 tokenOut, uint256 reserveIn, uint256 reserveOut) =
            isToken0 ? (i_token0, i_token1, s_reserve0, s_reserve1) : (i_token1, i_token0, s_reserve1, s_reserve0);
        tokenIn.transferFrom(msg.sender, address(this), _amountIn);

        // 2. Calculate token out (includeing fees), fee == 0.3%
        // y0dx / (x0 + dx) = dy  dy = amountOut dx = amountIn x0= reserve0 y0 = reserve1
        uint256 amountInWithFee = (_amountIn * 997) / 1000; //0.3% fee
        amountOut = (reserveOut * amountInWithFee) / (reserveIn + amountInWithFee);

        // 3. Transfer token out to msg.sender
        tokenOut.transfer(msg.sender, amountOut);

        // 4. Update the reserves
        _update(i_token0.balanceOf(address(this)), i_token1.balanceOf(address(this)));
    }

    function addLiquidity(uint256 _amount0, uint256 _amount1) external returns (uint256 shares) {
        // 1. Pull in token0 and token1
        i_token0.transferFrom(msg.sender, address(this), _amount0);
        i_token1.transferFrom(msg.sender, address(this), _amount1);
        // dy / dx == y0 / x0
        if (s_reserve0 > 0 || s_reserve1 > 0) {
            if (s_reserve0 * _amount1 != s_reserve1 * _amount0) {
                revert CPAMM__PriceNotEqualAfterAddingLiquidity();
            }
        }
        // 2. Mint shares
        // f(x, y) = value of liquidity = sqrt(xy)
        // s = dx/x * T = dy/y * T
        if (s_totalShares == 0) {
            shares = _sqrt(_amount0 * _amount1);
        } else {
            shares = _min(((_amount0 * s_totalShares) / s_reserve0), ((_amount1 * s_totalShares) / s_reserve1));
        }
        // Enforce minimum shares
        if (shares < MINIMUM_SHARES) {
            revert CPAMM__NoSharesMinted();
        }

        if (shares == 0) {
            revert CPAMM__NoSharesMinted();
        }
        _mint(msg.sender, shares);

        // 3. Update the reserves
        _update(i_token0.balanceOf(address(this)), i_token1.balanceOf(address(this)));
    }

    function removeLiquidity(uint256 _shares) external returns (uint256 amount0, uint256 amount1) {
        // 1. Calculate amount0 and amount1 to withdraw
        // dx = s/T * x0   dy = s/T * y0
        if (_shares > s_balanceOf[msg.sender]) {
            revert CPAMM__InsufficientShares();
        }
        uint256 balance0 = i_token0.balanceOf(address(this));
        uint256 balance1 = i_token1.balanceOf(address(this));
        amount0 = (_shares * balance0) / s_totalShares;
        amount1 = (_shares * balance1) / s_totalShares;
        if (amount0 < MINIMUM_AMOUNT || amount1 < MINIMUM_AMOUNT) {
            revert CPAMM__AmountOutZero();
        }

        // 2. Burn shares
        _burn(msg.sender, _shares);

        // 3. Update reserves
        _update(balance0 - amount0, balance1 - amount1);

        // 4. Transfer tokens to msg.sender
        i_token0.transfer(msg.sender, amount0);
        i_token1.transfer(msg.sender, amount1);
    }

    //////VIEW FUNCTIONS//////
    function getReserves() external view returns (uint256 reserve0, uint256 reserve1) {
        reserve0 = s_reserve0;
        reserve1 = s_reserve1;
    }

    function getShares(address _user) external view returns (uint256 shares) {
        shares = s_balanceOf[_user];
    }

    function getTotalShares() external view returns (uint256 totalShares) {
        totalShares = s_totalShares;
    }

    function getToken0() external view returns (address token0) {
        token0 = address(i_token0);
    }

    function getToken1() external view returns (address token1) {
        token1 = address(i_token1);
    }

    function getToken0Balance() external view returns (uint256 token0Balance) {
        token0Balance = i_token0.balanceOf(address(this));
    }

    function getToken1Balance() external view returns (uint256 token1Balance) {
        token1Balance = i_token1.balanceOf(address(this));
    }
}
