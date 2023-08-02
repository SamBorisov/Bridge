const { task } = require("hardhat/config");

require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-ganache");
require("solidity-coverage");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});



task("deploy-Bridge-testnet", "Deploys contract on a provided network")
    .setAction(async (taskArguments, hre, runSuper) => {
        const deployTestToken = require("./scripts/deploy-bridge");
        await deployTestToken(taskArguments);
   
    });
    

    task("deploy-mainnet", "Deploys contract on a provided network")
    .addParam("privateKey", "Please provide the private key")
    .setAction(async ({privateKey}) => {
      const TTcontract = require("./scripts/TT-mainnet");
      await TTcontract(privateKey);
    });

   
// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.4",
  defaultNetwork:"localhost",
  networks: {
    // localhost: {
    //   url:'http://127.0.0.1:8545/'
    // },

    // ropsten: {
    //   url: "https://ropsten.infura.io/v3/" + process.env.ROPSTEN_API_KEY,
    //   accounts: ['']
    //  },
    // rinkeby: {
    //   url: "https://rinkeby.infura.io/v3/" + process.env.RINKEBY_API_KEY,
    //   accounts: ['']
    // },
    // kovan: {
    //   url: "https://kovan.infura.io",
    //   accounts: ['']
    // },
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: process.env.ETHERSCAN_API_KEY
  }
};
