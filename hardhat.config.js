require("@nomiclabs/hardhat-waffle");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
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

    ropsten: {
      url: "https://ropsten.infura.io/v3/40c2813049e44ec79cb4d7e0d18de173",
      accounts: ['0x216b6e8e5512846deddebeec8bc7eb3a36a8d6cf502c6c9a4722bc2644228f89']
    },
    // rinkeby: {
    //   url: "",
    //   accounts: ['']
    // }
  },

};
