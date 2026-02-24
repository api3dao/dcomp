# dComp

ERC20 wrapper for COMP token that delegates voting power to another address.

Set the required environment variables before deploying:

- `INITIAL_DELEGATEE`: address that receives COMP voting power delegated by the wrapper
- `WHITELISTED_DEPOSITOR`: single address initially allowed to deposit/wrap COMP

Deploy on Ethereum:

```
INITIAL_DELEGATEE=0xDelegateeAddress WHITELISTED_DEPOSITOR=0xDepositorAddress pnpm deploy:dcomp:ethereum
```

Override initial owner:

```
INITIAL_DELEGATEE=0xDelegateeAddress WHITELISTED_DEPOSITOR=0xDepositorAddress OWNER=0xOwnerAddress pnpm run deploy:dcomp:ethereum
```

Deploy to a local mainnet fork (running on `localhost`) with:

```
INITIAL_DELEGATEE=0xDelegateeAddress WHITELISTED_DEPOSITOR=0xDepositorAddress pnpm deploy:dcomp:localhost
```
