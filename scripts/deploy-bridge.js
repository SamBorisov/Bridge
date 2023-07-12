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

    // // Setting roles for the bridge and adding assets if needed
    // const assetID = 1;
    // const tokenAddress = "0x00000"
    // const isWrapped = true;

    // const [observer1 , observer2, observer3, defender] = await ethers.getSigners();
    // await bridge.connect(deployer).grantRole(bridge.OBSERVER_ROLE(), observer1.address);
    // await bridge.connect(deployer).grantRole(bridge.OBSERVER_ROLE(), observer2.address);
    // await bridge.connect(deployer).grantRole(bridge.OBSERVER_ROLE(), observer3.address);
    // await bridge.connect(deployer).grantRole(bridge.DEFENDER_ROLE(), defender.address);

    // await bridge.connect(deployer).addAsset(assetID, tokenAddress, isWrapped);

    // console.log('Roles and assets set!');
}
  
module.exports = deployBridge;