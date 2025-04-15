# Constant Product AMM (CPAMM)

A decentralized Automated Market Maker (AMM) implementing a constant product formula (x \* y = k) for token swaps and liquidity provision. Built with Solidity and tested using Foundry, this project enables users to swap tokens, add/remove liquidity, and manage pools securely.

# Features

Token Swaps: Swap between two ERC20 tokens with a 0.3% fee.
Liquidity Provision: Add or remove liquidity to/from the pool, receiving shares proportional to contributions.
Constant Product Formula: Maintains x \* y = k for stable pricing.
Minimum Thresholds: Prevents negligible share minting or withdrawals (minimum 1000 wei).
Robust Testing: Comprehensive test suite with 100% coverage using Foundry.
Error Handling: Custom errors for invalid tokens, insufficient amounts, and price mismatches.
Project Structure
text

├── lib/ # External libraries (e.g., OpenZeppelin)
├── script/ # Deployment scripts
│ └── DeployCPAMM.s.sol
├── src/ # Contract source
│ └── CPAMM.sol
├── test/ # Test suite
│ └── CPAMMTest.t.sol
├── foundry.toml # Foundry configuration
└── README.md # This file

# Prerequisites

Foundry: Install Foundry to compile, test, and deploy contracts.
Solidity: Version 0.8.24 or higher.
Node.js: Optional for scripting or additional tooling.
Git: To clone the repository.

# Installation

Clone the Repository:
bash
git clone https://github.com/yourusername/cpamm.git
cd cpamm
Install Foundry (if not already installed):
bash

curl -L https://foundry.paradigm.xyz | bash
foundryup
Install Dependencies: Ensure the lib/ directory includes OpenZeppelin contracts. Run:
bash

forge install openzeppelin/openzeppelin-contracts
Build the Project: Compile the contracts:
bash

forge build
Usage
Running Tests
The project includes a comprehensive test suite covering swaps, liquidity addition/removal, and edge cases.

bash

forge test
For detailed traces:

bash

forge test -vvvv
To check test coverage:

bash

forge coverage
Deploying the Contract
Use the provided DeployCPAMM.s.sol script to deploy the AMM with two mock ERC20 tokens.

Configure Deployment:
Update DeployCPAMM.s.sol with your network details (e.g., RPC URL, private key) if deploying to a testnet/mainnet.

Run Deployment:

bash

forge script script/DeployCPAMM.s.sol --rpc-url <your-rpc-url> --private-key <your-private-key> --broadcast
For local testing (e.g., Anvil):

bash

anvil
forge script script/DeployCPAMM.s.sol --rpc-url http://localhost:8545 --private-key <anvil-private-key> --broadcast
Interacting with the Contract
After deployment, interact with the CPAMM contract using tools like Foundry’s cast, Hardhat, or a frontend interface. Key functions include:

swap(address \_tokenIn, uint256 \_amountIn): Swap tokens, paying a 0.3% fee.
addLiquidity(uint256 \_amount0, uint256 \_amount1): Add liquidity, receiving shares.
removeLiquidity(uint256 \_shares): Burn shares to withdraw tokens.
View Functions: Query reserves, shares, and balances (e.g., getReserves, getShares).
Example with cast (assuming deployed at 0x...):

bash

cast call 0x... "getReserves()" --rpc-url http://localhost:8545
cast send 0x... "addLiquidity(uint256,uint256)" 1000000000000000000 1000000000000000000 --rpc-url http://localhost:8545 --private-key <your-private-key>
Testing Details
The test suite (test/CPAMMTest.t.sol) verifies:

Constructor: Correct token initialization.
Swaps: Token swaps in both directions with fee validation.
Liquidity:
Adding initial and subsequent liquidity.
Maintaining pool ratio.
Reverting on ratio mismatches or negligible amounts.
Removal: Withdrawing liquidity and handling insufficient shares.
Edge Cases: Invalid tokens, zero inputs, and tiny amounts.
View Functions: Accurate state reporting.
Run specific tests:

bash

forge test --mt testSwapToken0ForToken1
Contract Details
Solidity Version: 0.8.24
Tokens: Supports any ERC20 tokens, deployed with mock tokens for testing.
Fee: 0.3% (997/1000) on swaps.
Errors:
CPAMM**InvalidToken
CAPMM**AmountInTooLow (note: potential typo, consider renaming)
CPAMM**NoSharesMinted
CPAMM**PriceNotEqualAfterAddingLiquidity
CPAMM**AmountOutZero
CPAMM**InsufficientShares
Security Considerations
Minimum Thresholds: Prevents dust attacks by rejecting shares or amounts below 1000 wei.
Price Checks: Ensures liquidity additions maintain the pool’s price ratio.
Reentrancy: Safe due to state updates before external calls.
Integer Division: Uses Solidity 0.8’s safe math to avoid overflows.
Future Improvements:

Add events for swaps, liquidity changes, and burns.
Implement slippage protection.
Support flash swaps or advanced AMM features.
Contributing
Contributions are welcome! Please:

Fork the repository.
Create a feature branch (git checkout -b feature/your-feature).
Commit changes (git commit -m 'Add your feature').
Push to the branch (git push origin feature/your-feature).
Open a pull request.
License
This project is licensed under the MIT License. See the file for details.

Contact
For questions or suggestions, open an issue or contact aanirudh7777@gmail.com

Notes for Customization
Repository URL: Replace https://github.com/yourusername/cpamm.git with your actual repository URL.
Contact Info: Update the email or remove the contact section if not needed.
License: The MIT License is assumed based on your files’ SPDX headers. Change if you’re using a different license.
Additional Sections: If you have specific deployment instructions, frontend integration, or other features, let me know, and I can expand the README.
Typo Mention: I noted the CAPMM\_\_AmountInTooLow typo. If you want to fix it, I can provide updated contract and test files.
Saving the README
Create a file named README.md in your project’s root directory.
the above content into it.
Commit and push to your repository:
bash

git add README.md
git commit -m "Add README for CPAMM project"
git push origin main
