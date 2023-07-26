const { ethers } = require('hardhat');
const { expect } = require('chai');

describe('Functions & Errors', () => {
    let Bridge;
    let bridge;
    let ERC20PresetMinterPauser;
    let token;
    let token2;
    let deployer;
    let observerAddresses1;
    let observerAddresses2;
    let observerAddresses3;
    let observerAddresses4;
    let defender;
    let executor;
    const assetID = 1;
    const assetID2 = 2;
    const amount = 100;
    const sourceChain = 1;
    const targetChain = 2;
    let lockTransactionHash;

    before(async () => {
        Bridge = await ethers.getContractFactory('Bridge');
        ERC20PresetMinterPauser = await ethers.getContractFactory('ERC20PresetMinterPauser');
        [deployer, executor, observerAddresses1, observerAddresses2, observerAddresses3, observerAddresses4, defender] = await ethers.getSigners();

        // Deploy Bridge contract
        bridge = await Bridge.deploy();

        // Deploy ERC20 token
        token = await ERC20PresetMinterPauser.deploy('Test Token', 'TTK');
        await token.mint(executor.address, 1000);

        token2 = await ERC20PresetMinterPauser.deploy('Test Token 2', 'TT2');

    });

    // Adding an asset -----------------------------------------------------------  
    it('------------------------Assets------------------------', async () => {});      
    it('- should revert adding an asset if not owner called it', async () => {
        await expect(bridge.connect(observerAddresses1).addAsset(assetID, token.address, false)).to.be.revertedWith('AccessControl: sender must be an admin to add Asset')
    });
    it('- should revert adding an asset ID is 0', async () => {
        await expect(bridge.connect(deployer).addAsset(0, token.address, false)).to.be.revertedWith('ID cannot be 0')
    });
    it('+ setting assets', async () => {
        await bridge.connect(deployer).addAsset(assetID, token.address, false);
        await bridge.connect(deployer).addAsset(assetID2, token2.address, false);

        const assetDetails = await bridge.tokenDetails(assetID);
        expect(assetDetails.token).to.equal(token.address);
        expect(assetDetails.wrapped).to.equal(false);

        const assetDetails2 = await bridge.tokenDetails(assetID2);
        expect(assetDetails2.token).to.equal(token2.address);
        expect(assetDetails2.wrapped).to.equal(false);
        
    });
    it('- should revert if the ID or address is already taken', async () => {
        await expect(bridge.connect(deployer).addAsset(assetID, token.address, false)).to.be.revertedWith('Token ID has address already')
    });

    // Adding roles -----------------------------------------------------------
    it('------------------------Roles------------------------', async () => {});
    it('- should revert to set Roles if called by not by deployer', async () => {
        await expect(bridge.connect(executor).grantRole(bridge.OBSERVER_ROLE(), observerAddresses1.address)).to.be.revertedWith('AccessControl: sender must be an admin to grant')
        expect(await bridge.hasRole(bridge.OBSERVER_ROLE(), observerAddresses1.address)).to.equal(false);
    });
    it('+ setting Role to observers', async () => {
        await bridge.connect(deployer).grantRole(bridge.OBSERVER_ROLE(), observerAddresses1.address);
        await bridge.connect(deployer).grantRole(bridge.OBSERVER_ROLE(), observerAddresses2.address);
        await bridge.connect(deployer).grantRole(bridge.OBSERVER_ROLE(), observerAddresses3.address);
        await bridge.connect(deployer).grantRole(bridge.OBSERVER_ROLE(), observerAddresses4.address);

        expect(await bridge.hasRole(bridge.OBSERVER_ROLE(), observerAddresses1.address)).to.equal(true);
        expect(await bridge.hasRole(bridge.OBSERVER_ROLE(), observerAddresses2.address)).to.equal(true);
        expect(await bridge.hasRole(bridge.OBSERVER_ROLE(), observerAddresses3.address)).to.equal(true);
        expect(await bridge.hasRole(bridge.OBSERVER_ROLE(), observerAddresses4.address)).to.equal(true);
    });
    it('+ setting Role to defender', async () => {
        await bridge.connect(deployer).grantRole(bridge.DEFENDER_ROLE(), defender.address);
        expect(await bridge.hasRole(bridge.DEFENDER_ROLE(), defender.address)).to.equal(true);
    });

    // Locking tokens -----------------------------------------------------------
    it('------------------------Locking------------------------', async () => {});
    it('- should revert locking if there is not enough allowance', async () => {
        await expect(bridge.connect(executor).lock(assetID, amount, targetChain)).to.be.revertedWith('ERC20: transfer amount exceeds allowance');
    });
    it('- should revert locking 0 tokens', async () => {
        await token.connect(executor).approve(bridge.address, amount);
        await expect(bridge.connect(executor).lock(assetID, 0, targetChain)).to.be.revertedWith('Cannot Lock 0 tokens');
    });
    it('- should revert locking if ID is not set to a token address', async () => {
        await expect(bridge.connect(executor).lock(7, amount, targetChain)).to.be.revertedWith('Not supported token');
    });
    it('+ locking tokens', async () => {
        const lockTransaction = await bridge.connect(executor).lock(assetID, amount, targetChain);
        lockTransactionHash = lockTransaction.hash;
    });
    it('+ balances of bridge & executor shoud be updated after locking', async () => {
        expect(await token.balanceOf(bridge.address)).to.equal(100);
        expect(await token.balanceOf(executor.address)).to.equal(900);
    });

    // Voting -----------------------------------------------------------
    it('------------------------Voting------------------------', async () => {});
    it('- should revert if voting with accout without observer role', async () => {
        await expect (bridge.connect(deployer).vote(lockTransactionHash, executor.address, amount, assetID, sourceChain)).to.be.revertedWith('Caller is not observer');
    });
    it('- should revert if voting amouth is 0', async () => {
        await expect (bridge.connect(observerAddresses1).vote(lockTransactionHash, executor.address, 0, assetID, sourceChain)).to.be.revertedWith('Cannot vote for 0 tokens');
    });
    it('- should revert if executor address is not valid', async () => {
        await expect (bridge.connect(observerAddresses1).vote(lockTransactionHash, '0x0000000000000000000000000000000000000000', amount, assetID, sourceChain)).to.be.revertedWith('The executor shoud be a valid address');
    });
    it('- should revert if assetID is not set', async () => {
        await expect (bridge.connect(observerAddresses1).vote(lockTransactionHash, executor.address, amount, 7, sourceChain)).to.be.revertedWith('Not supported token');
    });
    it('+ observers 1 votes', async () => {
        await bridge.connect(observerAddresses1).vote(lockTransactionHash, executor.address, amount, assetID, sourceChain);
    });
    it('- shoud revert if observer 1 want to vote again for the same trasaction', async () => {
        await expect (bridge.connect(observerAddresses1).vote(lockTransactionHash, executor.address, amount, assetID, sourceChain)).to.be.revertedWith('Already voted');
    });
    it('+ obeservers 2 and 3 vote', async () => {
        await bridge.connect(observerAddresses2).vote(lockTransactionHash, executor.address, amount, assetID, sourceChain);
        await bridge.connect(observerAddresses3).vote(lockTransactionHash, executor.address, amount, assetID, sourceChain);

        await bridge.connect(observerAddresses2).vote(lockTransactionHash, observerAddresses1.address, amount, assetID, sourceChain);
        await bridge.connect(observerAddresses3).vote(lockTransactionHash, observerAddresses1.address, amount, assetID, sourceChain);
    });
    it('- shoud revert if observer vote after enough votes are collected', async () => {
        await expect (bridge.connect(observerAddresses4).vote(lockTransactionHash, executor.address, amount, assetID, sourceChain)).to.be.revertedWith('Transaction has enough votes already');
    });

    // Unlocking tokens -----------------------------------------------------------
    it('------------------------Unlocking------------------------', async () => {});
    it('- should revert unlock if 50 blocks are not mined after votes', async () => {
        await expect(bridge.connect(executor).unlock(executor.address)).to.be.revertedWith('Not Enough blocks have passed until last vote');
    });
    it('- should revert unlock if reciver address is not valid', async () => {
        for (let i = 0; i < 50; i++) {
            await network.provider.send('evm_mine', []);
        }
        await expect(bridge.connect(executor).unlock("0x0000000000000000000000000000000000000000")).to.be.revertedWith('The receiver shoud be a valid address');
    });
    it('- should revert unlock if the executor do not have enough votes', async () => {
        await expect(bridge.connect(deployer).unlock(executor.address)).to.be.revertedWith('Array accessed at an out-of-bounds or negative index');
    });
    it('+ unlocking tokens', async () => {
        await bridge.connect(executor).unlock(executor.address)
    });
    it('+ balances of bridge & executor shoud be updated after unlocking', async () => {
        expect(await token.balanceOf(bridge.address)).to.equal(0);
        expect(await token.balanceOf(executor.address)).to.equal(1000);
    });
    it('- should revert unlock if status is not ready to be unlocked', async () => {
        await expect(bridge.connect(executor).unlock(executor.address)).to.be.revertedWith('Array accessed at an out-of-bounds or negative index');
    });
    it('- should revert unlock with fake votes, if bridge do not have enough tokens', async () => {
        const fakeHash = '0xa550239c026596b311b11b350090b97488c297c3803b82ccced6fc3b84584990';
        await bridge.connect(observerAddresses1).vote(fakeHash, executor.address, amount, assetID, sourceChain);
        await bridge.connect(observerAddresses2).vote(fakeHash, executor.address, amount, assetID, sourceChain);
        await bridge.connect(observerAddresses3).vote(fakeHash, executor.address, amount, assetID, sourceChain);
 
        for (let i = 0; i < 50; i++) {
            await network.provider.send('evm_mine', []);
        }
        await expect(bridge.connect(executor).unlock(executor.address)).to.be.revertedWith('ERC20: transfer amount exceeds balance');
    });
    // Defender rejects -----------------------------------------------------------
    it('- should revert unlock if defender reject the fake proposal', async () => {
        const fakePropsal = await bridge.approvedProposalsList(1)
        await bridge.connect(defender).defend(fakePropsal);
 
        await expect(bridge.connect(executor).unlock(executor.address)).to.be.revertedWith('Array accessed at an out-of-bounds or negative index');
    });
    it('- should revert if defender tries to reject same proposal', async () => {
        const fakePropsal = await bridge.approvedProposalsList(1)
        await expect (bridge.connect(defender).defend(fakePropsal)).to.be.revertedWith('Transaction status is not Approved');
 
    });
});