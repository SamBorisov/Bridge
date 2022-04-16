const hre = require('hardhat')
const ethers = hre.ethers;

async function deployTestToken() {
  
  
    await hre.run('compile'); // We are compiling the contracts using subtask
    
    const [deployer] = await ethers.getSigners(); // We are getting the deployer
  
    console.log('Deploying contracts with the account:', deployer.address); // We are printing the address of the deployer
    console.log('Account balance:', (await deployer.getBalance()).toString()); // We are printing the account balance

    const TT = await ethers.getContractFactory("TestToken"); // 
    const TestT = await TT.deploy();
    console.log('Waiting for deployment...');
    await TestT.deployed();

    console.log('Token Contract address: ', TestT.address);
    console.log('Done!');
}
  
module.exports = deployTestToken;