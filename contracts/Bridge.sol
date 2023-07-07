//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;


import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol";



contract Bridge is AccessControl{


    //Setting up roles

    bytes32 public constant OBSERVER_ROLE = keccak256("OBSERVER_ROLE");

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // Voting logic & functions

    event Vote(bytes32 indexed proposalId, address executor, uint256 amount, uint8 assetID, uint8 sourceChain);

    address[] public voters;

    mapping(address => bool) public hasVoted;

    struct Proposal {
        uint8 assetID;
        uint256 amount;
        uint8 sourceChain;
        address executor;
        uint8 voteCount;
        bool executed;
    }

    mapping(bytes32 => Proposal) public proposals;
    mapping(address => bytes32) public unlocker;

    function vote(bytes32 proposalId, address _executor, uint256 _amount, uint8 _assetID, uint8 _sourceChain) external {
        require(!hasVoted[msg.sender], "Already voted");
        require(!proposals[proposalId].executed, "It is already executed");
        require(hasRole(OBSERVER_ROLE, msg.sender), "Caller does not have OBSERVER_ROLE");
        // basic checks
        require(_amount > 0,"Cannot Unlock 0 tokens");
        require(tokenDetails[_assetID].assetID == _assetID,"ID not found");
        require(_executor != address(0),"The receiver shoud be a valid address");

        if (proposals[proposalId].voteCount != 0) {
            require(proposals[proposalId].assetID == _assetID, "Asset ID does not match");
            require(proposals[proposalId].amount == _amount, "The amount does not match");
            require(proposals[proposalId].executor == _executor, "The executor does not match");
            require(proposals[proposalId].sourceChain == _sourceChain, "The source chain does not match");
        } else {
            proposals[proposalId].sourceChain = _sourceChain;
            proposals[proposalId].executor = _executor;
            proposals[proposalId].assetID = _assetID;
            proposals[proposalId].amount = _amount;
            unlocker[_executor] = proposalId;
        }

        proposals[proposalId].voteCount ++;
        hasVoted[msg.sender] = true;
        voters.push(msg.sender);

        emit Vote(proposalId, _executor, _amount, _assetID, _sourceChain);

    }


    // Locking and Unlocking events

    event Lock(uint8 indexed assetID, address indexed token, uint256 amount, address user, uint8 targetChain);

    event Unlock(uint8 indexed assetID, address indexed token, uint256 amount, address user, address receiver);


    // Locking or Burining tokens

    function lock(uint8 assetID, uint256 amount, uint8 targetChain) external {

        address token = tokenDetails[assetID].token;

        require(amount > 0,"Cannot Lock 0 tokens");
        require(token != address(0),"Not supported token");
        require(tokenDetails[assetID].assetID == assetID,"ID not found");

        if(tokenDetails[assetID].wrapped){

            ERC20PresetMinterPauser(token).burnFrom(msg.sender, amount);

        } else {

            IERC20(token).transferFrom(msg.sender, address(this), amount);
        }

        emit Lock(assetID, address(token), amount, msg.sender, targetChain);

    }

    // Unlocking or Minting tokens

    function unlock(uint8 assetID, uint256 amount, address receiver) external {

        address token = tokenDetails[assetID].token;

        require(amount > 0,"Cannot Unlock 0 tokens");
        require(token != address(0),"Not supported token");
        require(tokenDetails[assetID].assetID == assetID,"ID not found");
        require(receiver != address(0),"The receiver shoud be a valid address");
        // checking validations
        require(!proposals[unlocker[msg.sender]].executed, "It is already executed");
        require(amount <= proposals[unlocker[msg.sender]].amount, "Amount is more than the proposal");
        require(proposals[unlocker[msg.sender]].executor == msg.sender, "Caller is not the executor");
        require(proposals[unlocker[msg.sender]].voteCount >= 3, "User Don't have enough votes yet");

        // unlocking or minting
        if(tokenDetails[assetID].wrapped){

            ERC20PresetMinterPauser(token).mint(receiver, amount);

        } else {
            require(IERC20(token).balanceOf(address(this)) > amount,"The Bridge don't have enough tokes");
            IERC20(token).transfer(receiver, amount);
        }
        // reseting the values after unlocking
        proposals[unlocker[msg.sender]].voteCount = 0;
        proposals[unlocker[msg.sender]].executed = true;
        unlocker[msg.sender] = 0x00;
        // reseting the voters, so  they can vote for the next transaction
        for(uint i = 0; i < voters.length; i++) {
            hasVoted[voters[i]] = false;
        }

        emit Unlock(assetID, address(token), amount, msg.sender, receiver);

    }



    // Adding and Saving tokens

    event AssetAdded(uint16 indexed assetID,address indexed token, bool wrapped);

        mapping(uint8 => TokenInfo) public tokenDetails;

        struct TokenInfo {
            uint8 assetID;
            address token;
            bool wrapped;
        }

        uint8[] internal savedIDs;


    function addAsset(uint8 assetID, address token, bool wrapped) external {

        require(hasRole(getRoleAdmin(DEFAULT_ADMIN_ROLE), _msgSender()), "AccessControl: sender must be an admin to add Asset");
        require(assetID > 0, "ID cannot be 0"); 
        require(tokenDetails[assetID].token == address(0), "Token ID has address already");
        require(checkSavedValues(assetID, token) == false ,"Token ID or address already set");

        TokenInfo memory storeIt = TokenInfo({
            assetID: assetID,
            token: token,
            wrapped: wrapped
        });

        tokenDetails[assetID] = storeIt;
        savedIDs.push(assetID);

        emit AssetAdded(assetID, token, wrapped);
   
    }


    // View functions


    function checkSavedValues(uint8 assetID, address token) internal view returns(bool) {

        for (uint256 i = 0; i < savedIDs.length; i++) {
            if (tokenDetails[savedIDs[i]].assetID == assetID || tokenDetails[savedIDs[i]].token == token) {
               return true;
            }
        }
        return false;
    }

 
}