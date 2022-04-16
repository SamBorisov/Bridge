const hre = require('hardhat')
const ethers = hre.ethers;

async function deployBridge() {
  
  
    await hre.run('compile'); // We are compiling the contracts using subtask
    
    const [deployer] = await ethers.getSigners(); // We are getting the deployer
  
    console.log('Deploying contracts with the account:', deployer.address); // We are printing the address of the deployer
    console.log('Account balance:', (await deployer.getBalance()).toString()); // We are printing the account balance

    const bridgeContract = await ethers.getContractFactory("Bridge"); // 
    const bridge = await bridgeContract.deploy();
    console.log('Waiting for bridge deployment...');
    await bridge.deployed();

    console.log('Bridge Contract address: ', bridge.address);
    console.log('Done!');
}
  
module.exports = deployBridge;