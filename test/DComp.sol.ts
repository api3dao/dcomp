import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';
import * as helpers from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import hardhat from 'hardhat';

const { ethers } = hardhat;

const COMP_ADDRESS = '0xc00e94Cb662C3520282E6f5717214004A7f26888';

async function deploy() {
  const roleNames = ['deployer', 'owner', 'user', 'otherUser', 'delegateeA', 'delegateeB'] as const;
  const accounts = await ethers.getSigners();
  const roles = roleNames.reduce(
    (acc, roleName, index) => {
      return { ...acc, [roleName]: accounts[index] };
    },
    {} as Record<(typeof roleNames)[number], HardhatEthersSigner>
  );

  const mockCompFactory = await ethers.getContractFactory('MockComp', roles.deployer);
  const mockCompImplementation = await mockCompFactory.deploy(roles.deployer.address);
  const runtimeCode = await ethers.provider.getCode(await mockCompImplementation.getAddress());
  await ethers.provider.send('hardhat_setCode', [COMP_ADDRESS, runtimeCode]);

  const mockComp = await ethers.getContractAt('MockComp', COMP_ADDRESS, roles.deployer);

  const dCompFactory = await ethers.getContractFactory('DComp', roles.deployer);
  const dComp = await dCompFactory.deploy(roles.owner.address, roles.delegateeA.address, [roles.user.address]);

  const mintedAmount = ethers.parseEther('100');
  await mockComp.mint(roles.user.address, mintedAmount);

  return { roles, mockComp, dComp, mintedAmount, dCompFactory };
}

describe('DComp', function () {
  describe('constructor', function () {
    it('sets owner, metadata, underlying and initial delegation', async function () {
      const { roles, dComp, mockComp } = await helpers.loadFixture(deploy);

      expect(await dComp.owner()).to.equal(roles.owner.address);
      expect(await dComp.decimals()).to.equal(18);
      expect(await dComp.underlying()).to.equal(COMP_ADDRESS);
      expect(await dComp.delegatee()).to.equal(roles.delegateeA.address);
      expect(await mockComp.delegates(await dComp.getAddress())).to.equal(roles.delegateeA.address);
    });

    it('reverts if owner is zero', async function () {
      const { roles, dCompFactory } = await helpers.loadFixture(deploy);
      await expect(dCompFactory.deploy(ethers.ZeroAddress, roles.delegateeA.address, []))
        .to.be.revertedWithCustomError(dCompFactory, 'OwnableInvalidOwner')
        .withArgs(ethers.ZeroAddress);
    });

    it('seeds initial whitelisted depositors from constructor', async function () {
      const { roles, dComp } = await helpers.loadFixture(deploy);

      expect(await dComp.isDepositorWhitelisted(roles.user.address)).to.equal(true);
      expect(await dComp.isDepositorWhitelisted(roles.otherUser.address)).to.equal(false);
    });
  });

  describe('deposit/withdraw helpers', function () {
    it('deposit wraps 1:1', async function () {
      const { roles, dComp, mockComp, mintedAmount } = await helpers.loadFixture(deploy);
      const amount = ethers.parseEther('25');

      await mockComp.connect(roles.user).approve(await dComp.getAddress(), amount);
      await expect(dComp.connect(roles.user).deposit(amount))
        .to.emit(dComp, 'Transfer')
        .withArgs(ethers.ZeroAddress, roles.user.address, amount);

      expect(await dComp.balanceOf(roles.user.address)).to.equal(amount);
      expect(await mockComp.balanceOf(await dComp.getAddress())).to.equal(amount);
      expect(await mockComp.balanceOf(roles.user.address)).to.equal(mintedAmount - amount);
    });

    it('withdraw unwraps 1:1', async function () {
      const { roles, dComp, mockComp, mintedAmount } = await helpers.loadFixture(deploy);
      const amount = ethers.parseEther('30');

      await mockComp.connect(roles.user).approve(await dComp.getAddress(), amount);
      await dComp.connect(roles.user).deposit(amount);

      expect(await dComp.balanceOf(roles.user.address)).to.equal(amount);
      expect(await mockComp.balanceOf(roles.user.address)).to.equal(mintedAmount - amount);

      await expect(dComp.connect(roles.user).withdraw(amount))
        .to.emit(dComp, 'Transfer')
        .withArgs(roles.user.address, ethers.ZeroAddress, amount);

      expect(await dComp.balanceOf(roles.user.address)).to.equal(0);
      expect(await mockComp.balanceOf(await dComp.getAddress())).to.equal(0);
      expect(await mockComp.balanceOf(roles.user.address)).to.equal(mintedAmount);
    });

    it('reverts deposit when allowance is insufficient', async function () {
      const { roles, dComp } = await helpers.loadFixture(deploy);
      await expect(dComp.connect(roles.user).deposit(1)).to.be.reverted;
    });

    it('reverts withdraw when wrapped balance is insufficient', async function () {
      const { roles, dComp } = await helpers.loadFixture(deploy);
      await expect(dComp.connect(roles.user).withdraw(1)).to.be.reverted;
    });

    it('reverts deposit for non-whitelisted caller', async function () {
      const { roles, dComp, mockComp } = await helpers.loadFixture(deploy);
      const amount = ethers.parseEther('1');

      await mockComp.connect(roles.otherUser).approve(await dComp.getAddress(), amount);
      await expect(dComp.connect(roles.otherUser).deposit(amount)).to.be.revertedWith('Caller is not whitelisted');
      await expect(dComp.connect(roles.otherUser).depositFor(roles.otherUser.address, amount)).to.be.revertedWith(
        'Caller is not whitelisted'
      );
    });

    it('allows non-whitelisted user to withdraw funds', async function () {
      const { roles, dComp, mockComp, mintedAmount } = await helpers.loadFixture(deploy);
      const amount = ethers.parseEther('7');

      await mockComp.connect(roles.user).approve(await dComp.getAddress(), amount);
      await dComp.connect(roles.user).depositFor(roles.otherUser.address, amount);

      expect(await dComp.isDepositorWhitelisted(roles.otherUser.address)).to.equal(false);
      expect(await dComp.balanceOf(roles.otherUser.address)).to.equal(amount);

      await expect(dComp.connect(roles.otherUser).withdraw(amount))
        .to.emit(dComp, 'Transfer')
        .withArgs(roles.otherUser.address, ethers.ZeroAddress, amount);

      expect(await dComp.balanceOf(roles.otherUser.address)).to.equal(0);
      expect(await mockComp.balanceOf(roles.otherUser.address)).to.equal(amount);
      expect(await mockComp.balanceOf(roles.user.address)).to.equal(mintedAmount - amount);
    });
  });

  describe('depositor whitelist', function () {
    it('owner updates whitelist and emits event on change', async function () {
      const { roles, dComp } = await helpers.loadFixture(deploy);

      expect(await dComp.isDepositorWhitelisted(roles.otherUser.address)).to.equal(false);

      await expect(dComp.connect(roles.owner).updateWhitelistedDepositors([roles.otherUser.address], [true]))
        .to.emit(dComp, 'DepositorWhitelistStatusUpdated')
        .withArgs(roles.otherUser.address, true);

      expect(await dComp.isDepositorWhitelisted(roles.otherUser.address)).to.equal(true);
    });

    it('does not emit event for no-op whitelist update', async function () {
      const { roles, dComp } = await helpers.loadFixture(deploy);

      await expect(dComp.connect(roles.owner).updateWhitelistedDepositors([roles.user.address], [true])).to.not.emit(
        dComp,
        'DepositorWhitelistStatusUpdated'
      );
    });

    it('reverts whitelist update from non-owner', async function () {
      const { roles, dComp } = await helpers.loadFixture(deploy);

      await expect(dComp.connect(roles.user).updateWhitelistedDepositors([roles.otherUser.address], [true]))
        .to.be.revertedWithCustomError(dComp, 'OwnableUnauthorizedAccount')
        .withArgs(roles.user.address);
    });

    it('reverts on mismatched whitelist update array lengths', async function () {
      const { roles, dComp } = await helpers.loadFixture(deploy);

      await expect(
        dComp.connect(roles.owner).updateWhitelistedDepositors([roles.user.address], [true, false])
      ).to.be.revertedWith('Mismatched array lengths');
    });
  });

  describe('erc20Wrapper inherited paths', function () {
    it('depositFor mints to receiver and withdrawTo sends underlying to receiver', async function () {
      const { roles, dComp, mockComp, mintedAmount } = await helpers.loadFixture(deploy);
      const amount = ethers.parseEther('10');

      await mockComp.connect(roles.user).approve(await dComp.getAddress(), amount);
      await dComp.connect(roles.user).depositFor(roles.otherUser.address, amount);
      expect(await dComp.balanceOf(roles.otherUser.address)).to.equal(amount);
      expect(await mockComp.balanceOf(roles.user.address)).to.equal(mintedAmount - amount);

      await dComp.connect(roles.otherUser).withdrawTo(roles.user.address, amount);
      expect(await dComp.balanceOf(roles.otherUser.address)).to.equal(0);
      expect(await mockComp.balanceOf(roles.user.address)).to.equal(mintedAmount);
    });

    it('reverts depositFor when receiver is wrapper itself', async function () {
      const { roles, dComp, mockComp } = await helpers.loadFixture(deploy);
      const amount = ethers.parseEther('1');
      await mockComp.connect(roles.user).approve(await dComp.getAddress(), amount);

      await expect(dComp.connect(roles.user).depositFor(await dComp.getAddress(), amount))
        .to.be.revertedWithCustomError(dComp, 'ERC20InvalidReceiver')
        .withArgs(await dComp.getAddress());
    });

    it('reverts withdrawTo when receiver is wrapper itself', async function () {
      const { roles, dComp, mockComp } = await helpers.loadFixture(deploy);
      const amount = ethers.parseEther('5');
      await mockComp.connect(roles.user).approve(await dComp.getAddress(), amount);
      await dComp.connect(roles.user).deposit(amount);

      await expect(dComp.connect(roles.user).withdrawTo(await dComp.getAddress(), amount))
        .to.be.revertedWithCustomError(dComp, 'ERC20InvalidReceiver')
        .withArgs(await dComp.getAddress());
    });
  });

  describe('delegation', function () {
    it('owner can update delegatee', async function () {
      const { roles, dComp, mockComp } = await helpers.loadFixture(deploy);

      await dComp.connect(roles.owner).setDelegatee(roles.delegateeB.address);
      expect(await mockComp.delegates(await dComp.getAddress())).to.equal(roles.delegateeB.address);
      expect(await dComp.delegatee()).to.equal(roles.delegateeB.address);
    });

    it('non-owner cannot update delegatee', async function () {
      const { roles, dComp } = await helpers.loadFixture(deploy);

      await expect(dComp.connect(roles.user).setDelegatee(roles.delegateeB.address))
        .to.be.revertedWithCustomError(dComp, 'OwnableUnauthorizedAccount')
        .withArgs(roles.user.address);
    });

    it('keeps delegation on wrapper address across wrap and unwrap lifecycle', async function () {
      const { roles, dComp, mockComp } = await helpers.loadFixture(deploy);
      const amount = ethers.parseEther('40');

      await mockComp.connect(roles.user).approve(await dComp.getAddress(), amount);
      await dComp.connect(roles.user).deposit(amount);

      expect(await mockComp.balanceOf(await dComp.getAddress())).to.equal(amount);
      expect(await mockComp.getCurrentVotes(roles.delegateeA.address)).to.equal(amount);
      expect(await mockComp.delegates(await dComp.getAddress())).to.equal(roles.delegateeA.address);

      await dComp.connect(roles.owner).setDelegatee(roles.delegateeB.address);
      expect(await mockComp.delegates(await dComp.getAddress())).to.equal(roles.delegateeB.address);

      await dComp.connect(roles.user).withdraw(amount);

      expect(await mockComp.balanceOf(await dComp.getAddress())).to.equal(0);
      expect(await mockComp.delegates(await dComp.getAddress())).to.equal(roles.delegateeB.address);
      expect(await dComp.delegatee()).to.equal(roles.delegateeB.address);
      expect(await mockComp.getCurrentVotes(roles.delegateeA.address)).to.equal(0);
      expect(await mockComp.getCurrentVotes(roles.delegateeB.address)).to.equal(0);
    });

    it('changing delegatee updates votes correctly', async function () {
      const { roles, dComp, mockComp } = await helpers.loadFixture(deploy);
      const amount = ethers.parseEther('40');

      await mockComp.connect(roles.user).approve(await dComp.getAddress(), amount);
      await dComp.connect(roles.user).deposit(amount);

      expect(await mockComp.balanceOf(await dComp.getAddress())).to.equal(amount);
      expect(await mockComp.getCurrentVotes(roles.delegateeA.address)).to.equal(amount);
      expect(await mockComp.delegates(await dComp.getAddress())).to.equal(roles.delegateeA.address);

      await dComp.connect(roles.owner).setDelegatee(roles.delegateeB.address);

      expect(await mockComp.delegates(await dComp.getAddress())).to.equal(roles.delegateeB.address);
      expect(await dComp.delegatee()).to.equal(roles.delegateeB.address);
      expect(await mockComp.getCurrentVotes(roles.delegateeA.address)).to.equal(0);
      expect(await mockComp.getCurrentVotes(roles.delegateeB.address)).to.equal(amount);
    });

    it('delegatee keeps votes after user deposit', async function () {
      const { roles, dComp, mockComp, mintedAmount } = await helpers.loadFixture(deploy);
      const amount = ethers.parseEther('30');

      await mockComp.connect(roles.user).delegate(roles.delegateeA.address);
      expect(await mockComp.getCurrentVotes(roles.delegateeA.address)).to.equal(mintedAmount);

      await mockComp.connect(roles.user).approve(await dComp.getAddress(), amount);
      await dComp.connect(roles.user).deposit(amount);

      expect(await mockComp.getCurrentVotes(roles.delegateeA.address)).to.equal(mintedAmount);
      expect(await mockComp.delegates(await dComp.getAddress())).to.equal(roles.delegateeA.address);
      expect(await dComp.delegatee()).to.equal(roles.delegateeA.address);
      expect(await mockComp.balanceOf(await dComp.getAddress())).to.equal(amount);
      expect(await mockComp.balanceOf(roles.user.address)).to.equal(mintedAmount - amount);
    });
  });

  describe('Ownable2Step', function () {
    it('transfers ownership in two steps and new owner can set delegatee', async function () {
      const { roles, dComp, mockComp } = await helpers.loadFixture(deploy);

      await dComp.connect(roles.owner).transferOwnership(roles.otherUser.address);
      expect(await dComp.pendingOwner()).to.equal(roles.otherUser.address);
      expect(await dComp.owner()).to.equal(roles.owner.address);

      await dComp.connect(roles.otherUser).acceptOwnership();
      expect(await dComp.owner()).to.equal(roles.otherUser.address);

      await dComp.connect(roles.otherUser).setDelegatee(roles.delegateeB.address);
      expect(await mockComp.delegates(await dComp.getAddress())).to.equal(roles.delegateeB.address);
    });

    it('rejects acceptOwnership from non-pending owner', async function () {
      const { roles, dComp } = await helpers.loadFixture(deploy);

      await dComp.connect(roles.owner).transferOwnership(roles.otherUser.address);
      await expect(dComp.connect(roles.user).acceptOwnership())
        .to.be.revertedWithCustomError(dComp, 'OwnableUnauthorizedAccount')
        .withArgs(roles.user.address);
    });
  });
});
