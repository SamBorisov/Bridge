const { ethers } = require('hardhat');
const { expect } = require ('chai');


describe('Bridge Contract', () => {
  let Bridge;
  let bridge;
  let ERC20PresetMinterPauser;
  let token;
  let deployer;
  let observerAddresses;
  let executor;
  const assetID = 1;
  const amount = 100;
  const sourceChain = 1;
  const targetChain = 2;

  before(async () => {
    Bridge = await ethers.getContractFactory('Bridge');
    ERC20PresetMinterPauser = await ethers.getContractFactory('ERC20PresetMinterPauser');
    [deployer, ...observerAddresses] = await ethers.getSigners();

    // Deploy Bridge contract
    bridge = await Bridge.deploy();
    await bridge.grantRole(bridge.OBSERVER_ROLE(), deployer.address);

    // Deploy ERC20 token
    token = await ERC20PresetMinterPauser.deploy('Test Token', 'TTK');
    await token.mint(deployer.address, 1000);

    // Transfer tokens to the bridge contract
    await token.transfer(bridge.address, amount);

    // Set up observer addresses
    for (let i = 0; i < observerAddresses.length; i++) {
      const observer = observerAddresses[i];
      await bridge.grantRole(bridge.OBSERVER_ROLE(), observer.address);
    }

    // Lock tokens and emit event
    executor = deployer;
    await bridge.lock(assetID, amount, targetChain);
    await bridge.emit('Lock', assetID, token.address, amount, executor.address, deployer.address);
  });

  it('should allow observers to vote and unlock tokens', async () => {
    // Call vote function from each observer address
    for (let i = 0; i < observerAddresses.length; i++) {
      const observer = observerAddresses[i];
      const proposalHash = ethers.utils.solidityKeccak256(
        ['bytes32', 'address', 'uint256', 'uint8', 'uint256'],
        [ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(['bytes32', 'address', 'uint256', 'uint8', 'uint256'], [tx.hash, executor.address, amount, assetID, sourceChain])), executor.address, amount, assetID, sourceChain]
      );
      await bridge.connect(observer).vote(proposalHash, executor.address, amount, assetID, sourceChain);
    }

    // Fast forward 50 blocks
    await network.provider.send('evm_mine', []);

    // Call unlock function
    await bridge.connect(executor).unlock(assetID, amount, deployer.address);
    await bridge.emit('Unlock', assetID, token.address, amount, executor.address, deployer.address);

    // Assert the tokens are transferred to the receiver
    const receiverBalance = await token.balanceOf(deployer.address);
    expect(receiverBalance).to.equal(amount);
  });
});
