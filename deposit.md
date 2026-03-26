# User flows

## Deposit USDC to V2 Vault

1. Approve USDC
   - In browser go to [USDC contract on Etherscan](https://etherscan.io/address/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48#writeProxyContract) and open "Write as Proxy" tab.
   - Click on "Connect to Web3" to connect your wallet.
   - Click on "approve (0x095ea7b3)", enter `0x36cfe1568461E499391ef0A555300F1ae2da2439` (dCOMP `V2Vault` address) as spender and a value (USDC amount) to approve. USDC has 6 decimals, so the value needs to be scaled by 10^6, i.e. 1.000.000 is 1 USDC.
   - Click "Write" and submit the transaction.

2. Deposit USDC to Vault
   - In browser go to [dCOMP V2 Vault contract on Etherscan](https://etherscan.io/address/0x36cfe1568461E499391ef0A555300F1ae2da2439#writeContract) and open "Write Contract" tab.
   - Click on "Connect to Web3" to connect your wallet.
   - Click on "deposit (0x6e553f65)", enter the deposit amount as "assets" (again scaled by 10^6) and your wallet address as "onBehalf".
   - Click "Write" and submit the transaction.
