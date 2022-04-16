const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TestToken", function () {

    let tokenContract

    before(async () => {
        tokenContract = await ethers.getContractFactory("TestToken");
        const Token = await tokenContract.deploy();
        await Token.deployed();



        it('has a name', async function () {
            expect(await this.token.name()).to.equal(name);
          });

        it('has a symbol', async function () {
            expect(await this.token.symbol()).to.equal(symbol);
        });

        it('has 18 decimals', async function () {
            expect(await this.token.decimals()).to.be.bignumber.equal('18');
        });



    });
});