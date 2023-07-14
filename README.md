# Basic Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, a sample script that deploys that contract, and an example of a task implementation, which simply lists the available accounts.

Try running some of the following tasks:

```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
node scripts/sample-script.js
npx hardhat help
npx hardhat deploy-Bridge-testnet
npx hardhat deploy-TT-testnet
```
FrontEnd - [Link to Git](https://github.com/NikiKerezov/react-ts-bridge-frontend)
Observer - [Link to Git](https://github.com/TechXTT/contract-observer)
Defender - [Link to Git](https://github.com/Krumomir/BridgeDefender)

# Bridge Contract

The Bridge contract is a smart contract that allows users to transfer tokens between two different blockchains. The contract is designed to be deployed on both blockchains and acts as a bridge between them.

## Getting Started

To use the Bridge contract, you will need to deploy it on both the source and destination blockchains. You will also need to deploy a compatible token contract on both blockchains.

Once the contracts are deployed, you can interact with the Bridge contract using the provided functions.

# Main Functions

## Adding an Asset

To add a new asset to the Bridge contract, you will need to deploy a compatible token contract on both the source and destination blockchains. Once the token contracts are deployed, you can add them to the Bridge contract using the `addAsset` function:

```solidity
function addAsset(uint8 assetID, address token, bool wrapped) external;
```

- `assetID`: The ID of the asset.
- `token`: The address of the token contract.
- `wrapped`: Whether the token is wrapped or not.

Adding an asset triggers AssetAdded event:
```solidity
event AssetAdded(uint16 indexed assetID,address indexed token, bool wrapped);
```

## Locking

The `lock` function in the Bridge contract allows users to lock tokens on the source chain. The function takes three parameters: `assetID`, `amount`, and `targetChain`.

```solidity
 function lock(uint8 assetID, uint256 amount, uint8 targetChain) external;
```

The `assetID` parameter is an integer that represents the ID of the asset being locked. The `amount` parameter is the number of tokens being locked. The `targetChain` parameter is an integer that represents the ID of the destination chain.

When a user calls the `lock` function, several checks are performed to ensure that the locking process is valid. For example, the function checks that the `amount` parameter is greater than zero and that the `token` associated with the `assetID` is not the zero address.

If the locking process is valid, the function checks whether the `token` is a wrapped token or not. If the `token` is a wrapped token, the function calls the `burnFrom` function on the token contract to burn the specified number of tokens from the user's account. If the `token` is not a wrapped token, the function calls the `transferFrom` function on the token contract to transfer the specified number of tokens from the user's account to the Bridge contract.

Finally, the `lock` function emits a `Lock` event with information about the locked tokens, including the `assetID`, `token` address, `amount`, `user` address, and `targetChain` ID.

Locking triggers a Lock event:
```solidity
event Lock(uint8 indexed assetID, address indexed token, uint256 amount, address user, uint8 targetChain);
```


## Unlocking

The `unlock` function in the Bridge contract allows users to unlock tokens on the destination chain. The function takes three parameters: `assetID`, `amount`, and `receiver`.

```solidity
function unlock(address receiver) external after50Block;
```
Here we put the parameter of the `receiver`, a valid address that shoud get the tokens.

Finally, the `unlock` function updates the status of the proposal to `Unlocked` and emits an `Unlock` event with information about the unlocked tokens, including the `assetID`, `token` address, `amount`, `user` address, and `receiver` address.

The function has a modifier that allows it's exectuon after 50 block from the apprived proposal. This is made so the Defender will have time to reject a fake proposal!

Unlocking triggers a Unlock event:
```solidity
event Unlock(uint8 indexed assetID, address indexed token, uint256 amount, address user, address receiver);
```

## Roles

The Bridge contract includes two roles:

- `OBSERVER_ROLE`: Allows a user to observe proposals and votes.
- `DEFENDER_ROLE`: Allows a user to defend proposals.

The contract owner is automatically granted the `DEFAULT_ADMIN_ROLE` role, which allows them to grant and revoke roles.


## Voting

```solidity
function vote(bytes32 _transactionHash, address _executor, uint256 _amount, uint8 _assetID, uint256 _sourceChain) external;
```

The `vote` function in the Bridge contract allows users to vote on a proposed transaction. The function takes several parameters, including the transaction hash, executor address, amount, asset ID, and source chain. These parameters are used to create a unique proposal hash, which is then used to track the status of the proposal.

When a user calls the `vote` function, several checks are performed to ensure that the proposal is valid. For example, the function checks that the user has not already voted on the proposal, that the user has the `OBSERVER_ROLE`, and that the proposal is still in the `Pending` status.

If the proposal is valid, the user's vote is counted and the `voteCount` mapping is updated. If the proposal has received enough votes, the status of the proposal is changed to `Approved` and the transaction can be executed.

When a trasacion is approved, we push the `proposalID` with the details into `unlocker` mapping, the item is deleted when the person unlock the tokens or if the defender reject the trasaction!

After each vote , a Vote event is emited & after 3 votes an Approved event is emited
```solidity
event Vote(bytes32 indexed proposalHash, bytes32 indexed transactionHash, address executor, uint256 amount, uint8 assetID, uint256 sourceChain);
event Approved(bytes32 indexed proposalHash , bytes32 indexed transactionHash);
```

## Defend

Defending a proposal on the blockchain if is incorrect.

```solidity
function defend(bytes32 proposalHash) external;
```

- `proposalHash`: The hash of the proposal to defend..


Emitted when a proposal is defended on the source blockchain.

```solidity
event Defend(bytes32 indexed proposalHash, Status status);
```

- `proposalHash`: The hash of the defended proposal.
- `status`: The status of the proposal after being defended.

### Proposal Status

The status of a proposal in the Bridge contract can be one of the following:

- `Pending`: The proposal has been created but has not yet received enough votes to be approved.
- `Approved`: The proposal has received enough votes to be approved and can be executed.
- `Unlocked`: The proposal has been apprived and unloked after 50 blocks.
- `Rejected`: The proposal has been rejected and cannot be executed.

## Testing

```shell
npx hardhat node
npx hardhat test

```

The contract have 4 tests to make sure everything is working perfect
- BridgeSimple.js - goes over one cycle of the fucntion (Happy Path)
- 3BridgeInstances.js - goes over one all function between 3 bridge contract instances and swaps token (Happy Path)
- FunctionTest.js - goes over all functions and possible errors with a asset that's not wrapped
- FunctionTestWrapped.js - goes over all functions and possible errors with a asset that is wrapped

## Conclusion

The Bridge contract is a powerful tool for transferring assets between different blockchains. It is using observers that vote for approval of trasaction and a defender who has 50 block of execution time to reject a fake trasaction. This makes is decentralized and very secure!




