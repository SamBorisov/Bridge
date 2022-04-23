const { ethers } = require("hardhat");
const { expect } = require ('chai');
const { BigNumber } = require("ethers");
const TestToken = require("../artifacts/contracts/TestToken.sol/TestToken.json");


describe('Bridge', function name () {
    let tokenContract
    let bridgeContract
    let token
    let bridge
    let deployer
    let myWallet
    const sourceChainId = 1
    const targetChainId = 2
    const amountWei = '1000000000000000'
    const InitialBalance = '299999999000000000000000000'
    

    before(async () => {
        [myWallet] = await ethers.getSigners();
        [deployer] = await ethers.getSigners();
        bridgeContract = await ethers.getContractFactory("Bridge");
        tokenContract = await ethers.getContractFactory("TestToken");
        token = await tokenContract.deploy();
        bridge = await bridgeContract.deploy(await deployer.address);
        await token.deployed();
        await bridge.deployed();
      });


  it('Locks & emits Lock event', async () => {
    await token.increaseAllowance(bridge.address, amountWei)
    await expect(bridge.lock(targetChainId, token.address, amountWei))
      .to.emit(bridge, 'Lock')
      .withArgs(targetChainId, token.address, amountWei, deployer.address)
  })

  it('Lock reduce sender balance', async () => {
    await token.increaseAllowance(bridge.address, amountWei)
    const initialBalance = BigNumber.from(InitialBalance)
    const amount = BigNumber.from(amountWei)

    const deployerBalance = (await token.balanceOf(deployer.address))
    const expectBalance = initialBalance.sub(amount)
    
    expect(deployerBalance).to.equal(expectBalance)
  })

  it('Lock from other wallet should reduce sender balance', async () => {
    await token.transfer(myWallet.address, 7)
    const TTMyWallet = token.connect(myWallet)
    await TTMyWallet.increaseAllowance(bridge.address, 2)
    const bridgeMyWallet = bridge.connect(myWallet)
    await bridgeMyWallet.lock(targetChainId, token.address, 2)
    expect(await token.balanceOf(myWallet.address)).to.equal(BigNumber.from('299999998998999999999999998'))
  })

  it('Unlocks & emits Unlock event', async () => {
    await token.increaseAllowance(bridge.address, amountWei)
    await bridge.lock(targetChainId, token.address, amountWei)

    await expect(bridge.unlock(sourceChainId, token.address, amountWei, deployer.address))
      .to.emit(bridge, 'Unlock')
      .withArgs(sourceChainId, token.address, amountWei, deployer.address)
  })

  it('Unlock increase receiver balance', async () => {
    await token.transfer(myWallet.address, amountWei)
    const TT = token.connect(myWallet)
    await TT.increaseAllowance(bridge.address, amountWei)
    const bridgeMyWallet = bridge.connect(myWallet)

    await bridgeMyWallet.lock(targetChainId, token.address, amountWei)
    expect(await token.balanceOf(myWallet.address)).to.equal('299999998997999999999999998')

    await bridgeMyWallet.unlock(sourceChainId, token.address, amountWei, myWallet.address)
    expect(await token.balanceOf(myWallet.address)).to.equal(BigNumber.from('299999998997999999999999998').add(BigNumber.from(amountWei)))
  })

  it('Unlock non existing token on this network should revert', async () => {
    const SomeNonwrappedToken = '0x194671f6eABc00A4783271EF05820C5411dC28F6'
    await expect(bridge.unlock(sourceChainId, SomeNonwrappedToken, amountWei, deployer.address))
      .to.be.revertedWith('function call to a non-contract account')
  })

  it('Minting token with empty name should revert', async () => {
    await expect(bridge.mint(sourceChainId, token.address, amountWei, deployer.address, '', 'symbol')).to.be.revertedWith('Put longer name')
  })

  it('Minting token with empty symbol should revert', async () => {
    await expect(bridge.mint(sourceChainId, token.address, amountWei, deployer.address, 'name', '')).to.be.revertedWith('Put longer symbol')
  })

  it('Minting token with invalid source chain id should revert', async () => {
    await expect(bridge.mint(0, token.address, amountWei, deployer.address, 'name', 'symbol')).to.be.revertedWith("Can't be 0")
  })


  it('Mints , emits Mint event & emits WrappedTokenDeployed event', async () => {
    await expect(bridge.mint(sourceChainId, token.address, amountWei, deployer.address, 'name', 'symbol'))
      .to.emit(bridge, 'Mint')
      .to.emit(bridge, 'WrappedTokenDeployed')
  })

   it('Mints new token', async () => {
    const allTokens = await bridge.wrappedTokens()
    const wrappedToken = allTokens[0]
    const Ttoken = new ethers.Contract(wrappedToken.wrappedToken, TestToken.abi, deployer)

    expect(await Ttoken.balanceOf(deployer.address)).to.equal(amountWei)
    expect(await Ttoken.totalSupply()).to.equal(amountWei)
  })


  it('Burn emits Burn event', async () => {
    const allTokens = await bridge.wrappedTokens()
    const wrappedToken = allTokens[0]
    const Ttoken = new ethers.Contract(wrappedToken.wrappedToken, TestToken.abi, deployer)
    await Ttoken.increaseAllowance(bridge.address, amountWei)

    await expect(bridge.burn(sourceChainId, Ttoken.address, amountWei, deployer.address))
      .to.emit(bridge, 'Burn')
      .withArgs(sourceChainId, amountWei, deployer.address)
  })


it('Burn burns allowed amount', async () => {
   await bridge.mint(sourceChainId, token.address, amountWei, deployer.address, 'name', 'symbol')
   const allTokens = await bridge.wrappedTokens()
   const wrappedToken = allTokens[0]
   const Ttoken = new ethers.Contract(wrappedToken.wrappedToken, TestToken.abi, deployer)
   await Ttoken.increaseAllowance(bridge.address, amountWei)

   expect(await Ttoken.totalSupply()).to.equal(amountWei)
   await bridge.burn(sourceChainId, Ttoken.address, amountWei, deployer.address)
   expect(await Ttoken.totalSupply()).to.equal(0)
})


it('Sending ETH should reverts', async () => {
  const Eth = ethers.utils.parseEther('5')
  const tx = { to: bridge.address, value: Eth }
  await expect(myWallet.sendTransaction(tx)).to.be.revertedWith('Transaction reverted')
})  


});
