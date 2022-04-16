const { expect } = require("chai");
const { ethers } = require("hardhat");



describe('Bridge', function name () {
    let tokenContract
    let bridgeContract
    const sourceChainId = 1
    const targetChainId = 2

    before(async () => {
        bridgeContract = await ethers.getContractFactory("Bridge");
        const bridge = await bridgeContract.deploy();
        await bridge.deployed();

});





});

