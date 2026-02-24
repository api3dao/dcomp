/* eslint-disable no-console */
import type { DeployFunction } from 'hardhat-deploy/types';

const deployDComp: DeployFunction = async ({ deployments, ethers, network, getUnnamedAccounts }) => {
  if (!['ethereum', 'localhost', 'hardhat'].includes(network.name)) {
    throw new Error(
      `DComp deployment is supported on ethereum and local forks (localhost/hardhat), got ${network.name}`
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

  console.log(`Deploying dComp with the account: ${deployer}`);

  const ownerAddress = process.env.OWNER ?? deployer;
  const initialDelegatee = process.env.INITIAL_DELEGATEE;

  if (!initialDelegatee) {
    throw new Error('Set INITIAL_DELEGATEE in environment');
  }

  const deployment = await deployments.deploy('DComp', {
    from: deployer,
    args: [ownerAddress, initialDelegatee, []],
    log: true,
  });

  const dComp = await ethers.getContractAt('DComp', deployment.address);

  console.log(`dComp deployed at: ${deployment.address}`);
  console.log(`Owner: ${await dComp.owner()}`);
  console.log(`Initial delegatee: ${await dComp.delegatee()}`);

  if (network.name === 'ethereum') {
    console.log('Verify with:');
    console.log(`pnpm hardhat verify --network ethereum ${deployment.address} "${ownerAddress}" "${initialDelegatee}"`);
  }
};

deployDComp.tags = ['DComp'];

// eslint-disable-next-line import/no-default-export
export default deployDComp;
