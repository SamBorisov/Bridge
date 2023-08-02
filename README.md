# Hardhat Project

```shell
npm install
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
npx hardhat help
node scripts/sample-script.js
npx hardhat run scripts/sample-script.js
```
Front End - [Bridge-UI](https://github.com/SamBorisov/Bridge-UI)

# ERC-20 Bridge
A bridge that transfers tokens from one Ethereum Testnet to another, using Solidity and React.

## Smart Contracts 
 - Bridge.sol - includes functions for Locking, Unlocking, Minting and Burning tokens, as well as events for each function

 - Wrap.sol - wrapping function that takes the data from token on the one network and copies the symbol, name
and maps the address of the token to the original token so there won't be new wrapped tokens for the same token

 - TestToken.sol - a normal ERC20 token for testing the whole process

## JavaScript

 - Tests for the bridge written in JS

 - Scripts for deploying the bridge contract on the testnet and mainnet

## Front End 

- Balance component - for showing the balance of the user

- TransactionModal - for creating a transaction

- TokenTransListModal - list with the transactions

- TokenTransDetailModal - details for the transactions

- Other components - used with template with some pre-existing components:
button, connection with wallet and more

- Contracts - folder with the ABIs and necessary keys for Infura or EtherscanProvider

## What could be better? 
The current branch doesn't have any validation and it's quite centralized! However...

Bridge has a second branch [Bridge2](https://github.com/SamBorisov/Bridge/tree/Bridge2) that has good documentation, it is also working with Observers and Defenders! This is an entirely new bridge that's more secure. There are links for the Observer/Defender and the Front-End that are built from others, working as a team!

## Technology used
Solidity, OpenZeppelin, Hardhat, Node.js, React, Ethers and more