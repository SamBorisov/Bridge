const { ethers } = require("hardhat");
const { expect, use } = require ('chai');
const { Contract, BigNumber} = require("ethers");
const { solidity, deployContract } = require ('ethereum-waffle');
const { SignerWithAddress } = require ('@nomiclabs/hardhat-ethers/signers');
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
    const InitialBalance = '29999999900000000000'
    

    before(async () => {
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

  // it('Lock reduce sender balance', async () => {
  //   await token.increaseAllowance(bridge.address, amountWei)
  //   await bridge.lock(targetChainId, token.address, amountWei)
  //   const initialBalance = BigNumber.from(InitialBalance)
  //   const amount = BigNumber.from(amountWei)
  //   expect(await token.balanceOf(deployer.address)).to.equal(BigNumber(initialBalance.sub(amount)))
  // })

  // it('Lock from other wallet should reduce sender balance', async () => {
  //   await token.transfer(myWallet.address, 7)
  //   const TTMyWallet = token.connect(myWallet)
  //   await TTMyWallet.increaseAllowance(bridge.address, 2)
  //   const bridgeMyWallet = bridge.connect(myWallet)
  //   await bridgeMyWallet.lock(targetChainId, token.address, 2)
  //   expect(await token.balanceOf(myWallet.address)).to.equal(7 - 2)
  // })


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

  // it('Mint mints new tokens', async () => {
  //   await bridge.mint(sourceChainId, token.address, amountWei, deployer.address, 'name', 'symbol')
  //   const allTokens = await bridge.wrappedTokens()
  //   const wrappedToken = allTokens[0]
  //   const Ttoken = new ethers.Contract(wrappedToken.wrappedToken, token.abi, deployer)

  //   // test
  //   expect(await Ttoken.balanceOf(deployer.address)).to.equal(amountWei)
  //   expect(await Ttoken.totalSupply()).to.equal(amountWei)
  // })







//   it('Burn emits Burn event', async () => {
//     await bridge.mint(sourceChainId, token.address, amountWei, deployer.address, 'name', 'symbol')
//     const allTokens = await bridge.wrappedTokens()
//     const wrappedToken = allTokens[0]
//     const Ttoken = new ethers.Contract(wrappedToken.wrappedToken, token.abi, deployer)
//     await Ttoken.increaseAllowance(bridge.address, amountWei)

//     await expect(bridge.burn(sourceChainId, token.address, amountWei, deployer.address))
//       .to.emit(bridge, 'Burn')
//       .withArgs(token.address, amountWei, deployer.address)
//   })


it('Burn burns allowed amount', async () => {
  await bridge.mint(sourceChainId, token.address, amountWei, deployer.address, 'name', 'symbol')
  const allTokens = await bridge.wrappedTokens()
  const wrappedToken = allTokens[0]
  const Ttoken = new ethers.Contract(wrappedToken.wrappedToken, token.abi, deployer)
  await Ttoken.increaseAllowance(bridge.address, amountWei)
  expect(await token.totalSupply()).to.equal(amountWei)
  await bridge.burn(sourceChainId, token.address, amountWei, deployer.address)
  expect(await token.totalSupply()).to.equal(0)
})


it('Sending ETH should reverts', async () => {
  const Eth = ethers.utils.parseEther('5')
  const tx = {
    to: bridge.address,
    value: Eth
  }
  await expect(myWallet.sendTransaction(tx)).to.be.revertedWith('Reverted')
})  

});

