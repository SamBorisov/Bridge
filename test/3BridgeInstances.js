const { ethers } = require('hardhat');
const { expect } = require('chai');

describe('Bridge Between 3 Chains Full Cycle - Happy Path', () => {
    let Bridge;
    let bridge;
    let bridge2;
    let bridge3;
    let ERC20PresetMinterPauser;
    let token;
    let token2;
    let token3;
    let deployer;
    let observerAddresses1;
    let observerAddresses2;
    let observerAddresses3;
    let executor;
    let defender;
    const assetID = 1;
    const amount = 100;
    const chain1 = 1;
    const chain2 = 2;
    const chain3 = 3;

    before(async () => {
        Bridge = await ethers.getContractFactory('Bridge');
        ERC20PresetMinterPauser = await ethers.getContractFactory('ERC20PresetMinterPauser');
        [deployer, executor, observerAddresses1, observerAddresses2, observerAddresses3, defender] = await ethers.getSigners();

        // Deploy Bridges contracts
        bridge = await Bridge.deploy();
        bridge2 = await Bridge.deploy();
        bridge3 = await Bridge.deploy();

        //grant role to the observers
        await bridge.grantRole(bridge.OBSERVER_ROLE(), observerAddresses1.address);
        await bridge.grantRole(bridge.OBSERVER_ROLE(), observerAddresses2.address);
        await bridge.grantRole(bridge.OBSERVER_ROLE(), observerAddresses3.address);
        await bridge2.grantRole(bridge.OBSERVER_ROLE(), observerAddresses1.address);
        await bridge2.grantRole(bridge.OBSERVER_ROLE(), observerAddresses2.address);
        await bridge2.grantRole(bridge.OBSERVER_ROLE(), observerAddresses3.address);
        await bridge3.grantRole(bridge.OBSERVER_ROLE(), observerAddresses1.address);
        await bridge3.grantRole(bridge.OBSERVER_ROLE(), observerAddresses2.address);
        await bridge3.grantRole(bridge.OBSERVER_ROLE(), observerAddresses3.address);
        await bridge.grantRole(bridge.DEFENDER_ROLE(), defender.address);

        // Deploy ERC20 tokens
        token = await ERC20PresetMinterPauser.deploy('Test Token', 'TTK');
        token2 = await ERC20PresetMinterPauser.deploy('Test Token', 'TTK');
        token3 = await ERC20PresetMinterPauser.deploy('Test Token', 'TTK');

        //Giving minter role to the bridge addresses who are wrapped
        await token2.grantRole(await token2.MINTER_ROLE(), bridge2.address);
        await token3.grantRole(await token3.MINTER_ROLE(), bridge3.address);

        // Mint tokens to the executor
        await token.mint(executor.address, 1000);


    });

    it('should allow adding an asset', async () => {
        await bridge.connect(deployer).addAsset(assetID, token.address, false);
        await bridge2.connect(deployer).addAsset(assetID, token2.address, true);
        await bridge3.connect(deployer).addAsset(assetID, token3.address, true);

        const assetDetails = await bridge.tokenDetails(assetID);
        expect(assetDetails.token).to.equal(token.address);
        expect(assetDetails.wrapped).to.equal(false);

        const assetDetails2 = await bridge2.tokenDetails(assetID);
        expect(assetDetails2.token).to.equal(token2.address);
        expect(assetDetails2.wrapped).to.equal(true);

        const assetDetails3 = await bridge3.tokenDetails(assetID);
        expect(assetDetails3.token).to.equal(token3.address);
        expect(assetDetails3.wrapped).to.equal(true);
    });


    it('should allow locking & observers to vote', async () => {
        // Lock tokens and emit event
        await token.connect(executor).approve(bridge.address, amount);
        const lockTransaction = await bridge.connect(executor).lock(assetID, amount, chain2);

        expect(lockTransaction)
            .to.emit(bridge, 'Lock')
            .withArgs(assetID, token.address, amount, executor.address, chain2);

        const lockTransactionHash = lockTransaction.hash;

        // Vote for the transaction
        await bridge2.connect(observerAddresses1).vote(lockTransactionHash, executor.address, amount, assetID, chain1);
        await bridge2.connect(observerAddresses2).vote(lockTransactionHash, executor.address, amount, assetID, chain1);
        await bridge2.connect(observerAddresses3).vote(lockTransactionHash, executor.address, amount, assetID, chain1);

    });


    it('should unlock tokens after 50 blocks from chain2', async () => {

        // Fast forward 50 blocks
        for (let i = 0; i < 50; i++) {
            await network.provider.send('evm_mine', []);
        }

        // Unlock tokens and emit event
        const unlockTransaction = await bridge2.connect(executor).unlock(executor.address)

        expect(unlockTransaction)
            .to.emit(bridge2, 'Unlock')
            .withArgs(assetID, token2.address, amount, executor.address, executor.address);

        // check for balances
        expect(await token2.balanceOf(executor.address)).to.equal(100);
        expect(await token.balanceOf(executor.address)).to.equal(900);

        // check for bridge balance
        expect(await token.balanceOf(bridge.address)).to.equal(100);

    });

    it('should allow locking & observers to vote from bridge2 to brdige3', async () => {
        // Lock tokens and emit event
        await token2.connect(executor).approve(bridge2.address, amount);
        const lockTransaction = await bridge2.connect(executor).lock(assetID, amount, chain3);

        expect(lockTransaction)
            .to.emit(bridge2, 'Lock')
            .withArgs(assetID, token2.address, amount, executor.address, chain3);

        const lockTransactionHash = lockTransaction.hash;

        // Vote for the transaction
        await bridge3.connect(observerAddresses1).vote(lockTransactionHash, executor.address, amount, assetID, chain2);
        await bridge3.connect(observerAddresses2).vote(lockTransactionHash, executor.address, amount, assetID, chain2);
        await bridge3.connect(observerAddresses3).vote(lockTransactionHash, executor.address, amount, assetID, chain2);

    });

    it('should unlock tokens from chain2 to chain3', async () => {

        // Fast forward 50 blocks
        for (let i = 0; i < 50; i++) {
            await network.provider.send('evm_mine', []);
        }

        // Unlock tokens and emit event
        const unlockTransaction = await bridge3.connect(executor).unlock(executor.address)

        expect(unlockTransaction)
            .to.emit(bridge3, 'Unlock')
            .withArgs(assetID, token3.address, amount, executor.address, executor.address);

        // check for balance of executor
        expect(await token3.balanceOf(executor.address)).to.equal(100);
        expect(await token2.balanceOf(executor.address)).to.equal(0);
        expect(await token.balanceOf(executor.address)).to.equal(900);

        // check for balance of bridges
        expect(await token.balanceOf(bridge.address)).to.equal(100);
        expect(await token2.balanceOf(bridge2.address)).to.equal(0);

    });

    it('should lock & vote from bridge3 to main bridge', async () => {
        // Lock tokens and emit event
        await token3.connect(executor).approve(bridge3.address, amount);
        const lockTransaction = await bridge3.connect(executor).lock(assetID, amount, chain1);

        expect(lockTransaction)
            .to.emit(bridge3, 'Lock')
            .withArgs(assetID, token3.address, amount, executor.address, chain1);

        const lockTransactionHash = lockTransaction.hash;

        // Vote for the transaction
        await bridge.connect(observerAddresses1).vote(lockTransactionHash, executor.address, amount, assetID, chain3);
        await bridge.connect(observerAddresses2).vote(lockTransactionHash, executor.address, amount, assetID, chain3);
        await bridge.connect(observerAddresses3).vote(lockTransactionHash, executor.address, amount, assetID, chain3);

        // check for balance of executor
        expect(await token3.balanceOf(executor.address)).to.equal(0);
        expect(await token2.balanceOf(executor.address)).to.equal(0);
        expect(await token.balanceOf(executor.address)).to.equal(900);

        // check for balance of bridges
        expect(await token.balanceOf(bridge.address)).to.equal(100);
        expect(await token2.balanceOf(bridge2.address)).to.equal(0);
        expect(await token3.balanceOf(bridge2.address)).to.equal(0);

    });

    it('should unlock tokens from chain3 to main chain', async () => {

        // Fast forward 50 blocks
        for (let i = 0; i < 50; i++) {
            await network.provider.send('evm_mine', []);
        }

        // Unlock tokens and emit event
        const unlockTransaction = await bridge.connect(executor).unlock(executor.address)

        expect(unlockTransaction)
            .to.emit(bridge, 'Unlock')
            .withArgs(assetID, token.address, amount, executor.address, executor.address);

        // check for balance of executor
        expect(await token3.balanceOf(executor.address)).to.equal(0);
        expect(await token2.balanceOf(executor.address)).to.equal(0);
        expect(await token.balanceOf(executor.address)).to.equal(1000);

        // check for balance of bridges
        expect(await token.balanceOf(bridge.address)).to.equal(0);
        expect(await token2.balanceOf(bridge2.address)).to.equal(0);
        expect(await token3.balanceOf(bridge2.address)).to.equal(0);

    });
    it('defender should reject a proposal if incorrect', async () => {

        const fakeHash = '0xa550239c026596b311b11b350090b97488c297c3803b82ccced6fc3b84584990';

        // Vote for fake transaction
        await bridge.connect(observerAddresses1).vote(fakeHash, executor.address, amount, assetID, chain3);
        await bridge.connect(observerAddresses2).vote(fakeHash, executor.address, amount, assetID, chain3);
        await bridge.connect(observerAddresses3).vote(fakeHash, executor.address, amount, assetID, chain3);

        const fakePropsal = await bridge.approvedProposalsList(1)
        await bridge.connect(defender).defend(fakePropsal);


    });

    it('the user cannot unlock tokens and balances are not chaged after rejection', async () => {

        // Fast forward 50 blocks
        for (let i = 0; i < 50; i++) {
            await network.provider.send('evm_mine', []);
        }

        // Reject unlock function
        await expect(bridge.connect(executor).unlock(executor.address)).to.be.revertedWith('Array accessed at an out-of-bounds or negative index');

        // check for balance of executor
        expect(await token3.balanceOf(executor.address)).to.equal(0);
        expect(await token2.balanceOf(executor.address)).to.equal(0);
        expect(await token.balanceOf(executor.address)).to.equal(1000);

        // check for balance of bridges
        expect(await token.balanceOf(bridge.address)).to.equal(0);
        expect(await token2.balanceOf(bridge2.address)).to.equal(0);
        expect(await token3.balanceOf(bridge2.address)).to.equal(0);

    });

});
