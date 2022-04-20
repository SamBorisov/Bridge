const { expect } = require("chai");
const { ethers } = require("hardhat");
const { TestToken } = require("../artifacts/contracts/TestToken.sol/TestToken.json")


describe('Bridge', function name () {
    let tokenContract
    let bridgeContract
    let token
    let bridge
    let deployer
    const sourceChainId = 1
    const targetChainId = 2
    const amountWei = '1000000000000000'
    

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




});

