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

## Deposit USDC directly to dCOMP/USDC market

1. Approve USDC
   - In browser go to [USDC contract on Etherscan](https://etherscan.io/address/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48#writeProxyContract) and open "Write as Proxy" tab.
   - Click on "Connect to Web3" to connect your wallet.
   - Click on "approve (0x095ea7b3)", enter `0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb` (Morpho address) as spender and a value (USDC amount) to approve. USDC has 6 decimals, so the value needs to be scaled by 10^6, i.e. 1.000.000 is 1 USDC.
   - Click "Write" and submit the transaction.

2. Deposit USDC to dCOMP/USDC market
   - In browser go to [Morpho contract on Etherscan](https://etherscan.io/address/0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb#writeContract) and open "Write Contract" tab.
   - Click on "Connect to Web3" to connect your wallet.
   - Click on "supply (0xa99aad89)", enter the following values:
     - loanToken: `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`
     - collateralToken: `0x91d14789071e5E195FFC9F745348736677De3292`
     - oracle: `0x0798dE3DDb22c289A653c020863AaA7ef33C05d7`
     - irm: `0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC`
     - lltv: `625000000000000000`
     - assets: amount of USDC to deposit, scaled by 10^6
     - shares: `0`
     - onBehalf: your wallet address
     - data: `0x`
   - Click "Write" and submit the transaction.

## Wrap COMP to dCOMP

Note: dCOMP minting is only enabled for whitelisted wallet addresses.

1. Approve COMP
   - In browser go to [COMP contract on Etherscan](https://etherscan.io/address/0xc00e94Cb662C3520282E6f5717214004A7f26888#writeContract) and open "Write Contract" tab.
   - Click on "Connect to Web3" to connect your wallet.
   - Click on "approve (0x095ea7b3)", enter `0x91d14789071e5E195FFC9F745348736677De3292` (dCOMP address) as spender and a value (COMP amount) to approve. COMP has 18 decimals, so the value needs to be scaled by 10^18, i.e. 1.000.000.000.000.000.000 is 1 COMP.
   - Click "Write" and submit the transaction.
2. Mint dCOMP
   - In browser go to [dCOMP contract on Etherscan](https://etherscan.io/address/0x91d14789071e5E195FFC9F745348736677De3292#writeContract) and open "Write Contract" tab.
   - Click on "Connect to Web3" to connect your wallet.
   - Click on "deposit (0xb6b55f25)" and enter the amount of COMP to deposit (scaled by 10^18).
   - Click "Write" and submit the transaction.

## Borrow USDC against dCOMP

- In browser go to [dCOMP/USDC market in Morpho app](https://app.morpho.org/ethereum/market/0x24852d8d7464402ddcd717415e009d42bf7427d6a8893487f83c75ee0f4a0ea6/dcomp-usdc).
- Enter amount of dCOMP as collateral and amount of USDC to borrow.
- Click "Supply collateral & borrow" button below.

## Unwrap dCOMP to COMP

- In browser go to [dCOMP contract on Etherscan](https://etherscan.io/address/0x91d14789071e5E195FFC9F745348736677De3292#writeContract) and open "Write Contract" tab.
- Click on "Connect to Web3" to connect your wallet.
- Click on "withdraw (0x2e1a7d4d)" and enter the amount of COMP to withdraw (scaled by 10^18).
- Click "Write" and submit the transaction.
