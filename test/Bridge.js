const { expect } = require("chai");
const { ethers } = require("hardhat");
const { TestToken } = require("../artifacts/contracts/TestToken.sol/TestToken.json")


describe('Bridge', function name () {
    let tokenContract
    let bridgeContract
    const sourceChainId = 1
    const targetChainId = 2
    

    before(async () => {
        const [deployer] = await ethers.getSigners();
        bridgeContract = await ethers.getContractFactory("Bridge");
        tokenContract = await ethers.getContractFactory("TestToken");
        const token = await tokenContract.deploy();
        const bridge = await bridgeContract.deploy(await deployer.address);
        await token.deployed();
        await bridge.deployed();


      });

it('Locks & emits Lock event', async () => {
    await TestToken.increaseAllowance(bridge.address, amountWei)
    await expect(bridge.lock(targetChainId, TestToken.address, amountWei))
      .to.emit(bridge, 'Lock')
      .withArgs(targetChainId, TestToken.address, ownerWallet.address, amountWei)
  })




});

