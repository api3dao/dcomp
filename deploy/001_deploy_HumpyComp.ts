/* eslint-disable no-console */
import type { DeployFunction } from 'hardhat-deploy/types';

const deployHumpyComp: DeployFunction = async ({ deployments, ethers, network, getUnnamedAccounts }) => {
  if (!['ethereum', 'localhost', 'hardhat'].includes(network.name)) {
    throw new Error(
      `HumpyComp deployment is supported on ethereum and local forks (localhost/hardhat), got ${network.name}`
    );
  }

  const compAddress = '0xc00e94Cb662C3520282E6f5717214004A7f26888';
  const compCode = await ethers.provider.getCode(compAddress);
  if (compCode === '0x') {
    throw new Error(
      `COMP is not available at ${compAddress} on ${network.name}. Use Ethereum mainnet or a local Ethereum mainnet fork.`
    );
  }

  const [deployer] = await getUnnamedAccounts();
  if (!deployer) {
    throw new Error('No deployer account available');
  }

  console.log(`Deploying HumpyComp with the account: ${deployer}`);

  const ownerAddress = process.env.OWNER ?? deployer;
  const initialDelegatee = process.env.INITIAL_DELEGATEE;

  if (!initialDelegatee) {
    throw new Error('Set INITIAL_DELEGATEE in environment');
  }

  const deployment = await deployments.deploy('HumpyComp', {
    from: deployer,
    args: [ownerAddress, initialDelegatee],
    log: true,
  });

  const humpyComp = await ethers.getContractAt('HumpyComp', deployment.address);

  console.log(`HumpyComp deployed at: ${deployment.address}`);
  console.log(`Owner: ${await humpyComp.owner()}`);
  console.log(`Initial delegatee: ${await humpyComp.delegatee()}`);

  if (network.name === 'ethereum') {
    console.log('Verify with:');
    console.log(`pnpm hardhat verify --network ethereum ${deployment.address} "${ownerAddress}" "${initialDelegatee}"`);
  }
};

deployHumpyComp.tags = ['HumpyComp'];

// eslint-disable-next-line import/no-default-export
export default deployHumpyComp;
