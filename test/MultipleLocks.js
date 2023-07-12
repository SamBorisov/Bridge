const { ethers } = require('hardhat');
const { expect } = require('chai');

describe('Miltiple Locks, Votes & Tokens', () => {
    let Bridge;
    let bridge;
    let ERC20PresetMinterPauser;
    let token;
    let token2;
    let deployer;
    let observerAddresses1;
    let observerAddresses2;
    let observerAddresses3;
    let executor;
    let receiver;
    let defender;
    const assetID = 1;
    const assetID2 = 2;
    const amount = 100;
    const sourceChain = 1;
    const targetChain = 2;

    before(async () => {
        Bridge = await ethers.getContractFactory('Bridge');
        ERC20PresetMinterPauser = await ethers.getContractFactory('ERC20PresetMinterPauser');
        [deployer, executor, receiver, observerAddresses1, observerAddresses2, observerAddresses3, defender] = await ethers.getSigners();

        // Deploy Bridge contract
        bridge = await Bridge.deploy();
        await bridge.grantRole(bridge.OBSERVER_ROLE(), deployer.address);

        // Deploy ERC20 token
        token = await ERC20PresetMinterPauser.deploy('Test Token', 'TTK');
        await token.connect(deployer).grantRole(token.MINTER_ROLE(), bridge.address);
        await token.mint(deployer.address, 1000);
        await token.mint(executor.address, 1050);

        // Transfer tokens to the bridge contract
        await token.transfer(bridge.address, amount);

        //Token 2
        token2 = await ERC20PresetMinterPauser.deploy('Test Token 2', 'TT2');
        await token2.connect(deployer).grantRole(token2.MINTER_ROLE(), bridge.address);
        await token2.mint(executor.address, 25);
    });

    it('should allow adding an assets', async () => {
        await bridge.connect(deployer).addAsset(assetID, token.address, true);
        await bridge.connect(deployer).addAsset(assetID2, token2.address, true);

        const assetDetails = await bridge.tokenDetails(assetID);
        expect(assetDetails.token).to.equal(token.address);
        expect(assetDetails.wrapped).to.equal(true);

        const assetDetails2 = await bridge.tokenDetails(assetID2);
        expect(assetDetails2.token).to.equal(token2.address);
        expect(assetDetails2.wrapped).to.equal(true);
    });

    it('should allow to set Role to observers & defender', async () => {
        await bridge.connect(deployer).grantRole(bridge.OBSERVER_ROLE(), observerAddresses1.address);
        await bridge.connect(deployer).grantRole(bridge.OBSERVER_ROLE(), observerAddresses2.address);
        await bridge.connect(deployer).grantRole(bridge.OBSERVER_ROLE(), observerAddresses3.address);
        await bridge.connect(deployer).grantRole(bridge.DEFENDER_ROLE(), defender.address);

        expect(await bridge.hasRole(bridge.OBSERVER_ROLE(), observerAddresses1.address)).to.equal(true);
        expect(await bridge.hasRole(bridge.OBSERVER_ROLE(), observerAddresses2.address)).to.equal(true);
        expect(await bridge.hasRole(bridge.OBSERVER_ROLE(), observerAddresses3.address)).to.equal(true);
        expect(await bridge.hasRole(bridge.DEFENDER_ROLE(), defender.address)).to.equal(true);


    });

    it('should lock tokens & allow observers to vote', async () => {
        // Locking 2 tokens different tokens with 3 locks
        await token.connect(executor).approve(bridge.address, amount);
        const lockTransaction = await bridge.connect(executor).lock(assetID, amount, targetChain);
        const lockTransactionHash = lockTransaction.hash;

        await token.connect(executor).approve(bridge.address, 50);
        const lockTransaction1 = await bridge.connect(executor).lock(assetID, 50, targetChain);
        const lockTransactionHash1 = lockTransaction1.hash;

        await token2.connect(executor).approve(bridge.address, 25);
        const lockTransaction2 = await bridge.connect(executor).lock(assetID2, 25, targetChain);
        const lockTransactionHash2 = lockTransaction2.hash;

        // Vote for 1st transaction
        await bridge.connect(observerAddresses1).vote(lockTransactionHash, executor.address, amount, assetID, sourceChain);
        await bridge.connect(observerAddresses2).vote(lockTransactionHash, executor.address, amount, assetID, sourceChain);
        await bridge.connect(observerAddresses3).vote(lockTransactionHash, executor.address, amount, assetID, sourceChain);
        // Vote for 2nd transaction
        await bridge.connect(observerAddresses1).vote(lockTransactionHash1, executor.address, 50, assetID, sourceChain);
        await bridge.connect(observerAddresses2).vote(lockTransactionHash1, executor.address, 50, assetID, sourceChain);
        await bridge.connect(observerAddresses3).vote(lockTransactionHash1, executor.address, 50, assetID, sourceChain);
        // Vote for 3rd transaction
        await bridge.connect(observerAddresses1).vote(lockTransactionHash2, executor.address, 25, assetID2, sourceChain);
        await bridge.connect(observerAddresses2).vote(lockTransactionHash2, executor.address, 25, assetID2, sourceChain);
        await bridge.connect(observerAddresses3).vote(lockTransactionHash2, executor.address, 25, assetID2, sourceChain);

        expect(await token.balanceOf(executor.address)).to.equal(900);
        expect(await token2.balanceOf(executor.address)).to.equal(0);

    });

    it('should unlock tokens after 50 blocks & transfer them to the receiver', async () => {

        // Fast forward 50 blocks
        for (let i = 0; i < 50; i++) {
            await network.provider.send('evm_mine', []);
        }

        // Unlock tokens
        await bridge.connect(executor).unlock(receiver.address)
        await bridge.connect(executor).unlock(executor.address)
        await bridge.connect(executor).unlock(receiver.address)

        // check for balance
        expect(await token.balanceOf(executor.address)).to.equal(950);
        expect(await token.balanceOf(receiver.address)).to.equal(100);
        expect(await token2.balanceOf(receiver.address)).to.equal(25);

    });

    it('defender should reject an incorrect proposal & unlocking is blocked', async () => {

        const fakeHash = '0xa550239c026596b311b11b350090b97488c297c3803b82cfced6fc3b84584990';

        // Vote for fake transaction
        await bridge.connect(observerAddresses1).vote(fakeHash, executor.address, amount, assetID2, sourceChain);
        await bridge.connect(observerAddresses2).vote(fakeHash, executor.address, amount, assetID2, sourceChain);
        await bridge.connect(observerAddresses3).vote(fakeHash, executor.address, amount, assetID2, sourceChain);

        const someTestHash = '0xa550239c026596b314b11b350090b97488c297c3803b82ccced6fc3b84584990';
        // Vote for fake transaction
        await bridge.connect(observerAddresses1).vote(someTestHash, executor.address, amount, assetID, sourceChain);
        await bridge.connect(observerAddresses2).vote(someTestHash, executor.address, amount, assetID, sourceChain);
        await bridge.connect(observerAddresses3).vote(someTestHash, executor.address, amount, assetID, sourceChain);

        const fakePropsal = await bridge.approvedProposalsList(3)
        await bridge.connect(defender).defend(fakePropsal);

        // Fast forward 50 blocks
        for (let i = 0; i < 50; i++) {
            await network.provider.send('evm_mine', []);
        }

        // Unlocking only 1 trasnaction, becouse the deffender rejected the other
        bridge.connect(executor).unlock(receiver.address);
        await expect(bridge.connect(executor).unlock(receiver.address)).to.be.revertedWith('Array accessed at an out-of-bounds or negative index');

        // check for balance
        expect(await token.balanceOf(executor.address)).to.equal(950); // stays the same cuz we used someTestHash & didn't lock any tokens
        expect(await token.balanceOf(receiver.address)).to.equal(200); // +100 cuz we unlocked 1 transaction with someTestHash
        expect(await token2.balanceOf(executor.address)).to.equal(0); // stays the same cuz it was rejected
        expect(await token2.balanceOf(receiver.address)).to.equal(25); // statys the same cuz it was rejected

    });

});