# dComp

ERC20 wrapper for COMP token that delegates voting power to another address.

Set the required environment variable before deploying:

Deploy on Ethereum:

```
INITIAL_DELEGATEE=0xDelegateeAddress pnpm deploy:dcomp:ethereum
```

Override initial owner:

```
INITIAL_DELEGATEE=0xDelegateeAddress OWNER=0xOwnerAddress pnpm run deploy:dcomp:ethereum
```

Deploy to a local mainnet fork (running on `localhost`) with:

```
INITIAL_DELEGATEE=0xDelegateeAddress pnpm deploy:dcomp:localhost
```
