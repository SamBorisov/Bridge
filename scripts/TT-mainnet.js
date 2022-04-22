const hre = require('hardhat')
const ethers = hre.ethers;

async function deployContract(_privateKey) {
    await hre.run('compile'); // We are compiling the contracts using subtask
    const wallet = new ethers.Wallet(_privateKey, hre.ethers.provider) // New wallet with the privateKey passed from CLI as param
    console.log('Deploying contracts with the account:', wallet.address); // We are printing the address of the deployer
    console.log('Account balance:', (await wallet.getBalance()).toString()); // We are printing the account balance

    const TestToken = await ethers.getContractFactory("TestToken", wallet); // Get the contract factory with the signer from the wallet created
    const TTcontract = await TestToken.deploy();
    console.log('Waiting for deployment...');
    await TTcontract.deployed();

    console.log('Contract address: ', TTcontract.address);
    console.log('Done!');
}
  
module.exports = deployContract;