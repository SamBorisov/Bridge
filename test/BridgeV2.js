const { ethers } = require('hardhat');
const { expect } = require('chai');

describe('Bridge Contract', () => {
  let Bridge;
  let bridge;
  let ERC20PresetMinterPauser;
  let token;
  let deployer;
  let observerAddresses1;
  let observerAddresses2;
  let observerAddresses3;
  let executor;
  const assetID = 1;
  const amount = 100;
  const sourceChain = 1;
  const targetChain = 2;

  before(async () => {
    Bridge = await ethers.getContractFactory('Bridge');
    ERC20PresetMinterPauser = await ethers.getContractFactory('ERC20PresetMinterPauser');
    [deployer, executor, observerAddresses1, observerAddresses2 , observerAddresses3] = await ethers.getSigners();

    // Deploy Bridge contract
    bridge = await Bridge.deploy();
    await bridge.grantRole(bridge.OBSERVER_ROLE(), deployer.address);

    // Deploy ERC20 token
    token = await ERC20PresetMinterPauser.deploy('Test Token', 'TTK');
    await token.mint(deployer.address, 1000);
    await token.mint(executor.address, 1000);

    // Transfer tokens to the bridge contract
    await token.transfer(bridge.address, amount);
  });

  it('should allow adding an asset', async () => {
    await bridge.connect(deployer).addAsset(assetID, token.address, false);

    const assetDetails = await bridge.tokenDetails(assetID);
    expect(assetDetails.token).to.equal(token.address);
    expect(assetDetails.wrapped).to.equal(false);
  });

  it('should allow to set Role to observers', async () => {
    await bridge.connect(deployer).grantRole(bridge.OBSERVER_ROLE(), observerAddresses1.address);
    await bridge.connect(deployer).grantRole(bridge.OBSERVER_ROLE(), observerAddresses2.address);
    await bridge.connect(deployer).grantRole(bridge.OBSERVER_ROLE(), observerAddresses3.address);
    
    expect(await bridge.hasRole(bridge.OBSERVER_ROLE(), observerAddresses1.address)).to.equal(true);
    expect(await bridge.hasRole(bridge.OBSERVER_ROLE(), observerAddresses2.address)).to.equal(true);
    expect(await bridge.hasRole(bridge.OBSERVER_ROLE(), observerAddresses3.address)).to.equal(true);


  });

  it('should allow observers to vote', async () => {
    // Lock tokens and emit event
    await token.connect(executor).approve(bridge.address, amount);
    const lockTransaction = await bridge.connect(executor).lock(assetID, amount, targetChain);
 
    expect(lockTransaction)
    .to.emit(bridge, 'Lock')
    .withArgs(assetID, token.address, amount, executor.address, targetChain);

    const lockTransactionHash = lockTransaction.hash;
  
    // Vote
    await bridge.connect(observerAddresses1).vote(lockTransactionHash, executor.address, amount, assetID, sourceChain);
    await bridge.connect(observerAddresses2).vote(lockTransactionHash, executor.address, amount, assetID, sourceChain);
    await bridge.connect(observerAddresses3).vote(lockTransactionHash, executor.address, amount, assetID, sourceChain);

  });
  
  
  it('should unlock tokens after 50 blocks and transfer them to the receiver', async () => {

    // Fast forward 50 blocks
    for (let i = 0; i < 50; i++) {
      await network.provider.send('evm_mine', []);
    }

    // Unlock tokens and emit event
    const unlockTransaction = await bridge.connect(executor).unlock(assetID, amount, executor.address)

    expect(unlockTransaction)
    .to.emit(bridge, 'Lock')
    .withArgs(assetID, token.address, amount, executor.address, targetChain);
    
    // check for balance
    expect(await token.balanceOf(executor.address)).to.equal(1000);

    });
});
