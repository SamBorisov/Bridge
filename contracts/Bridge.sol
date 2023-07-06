//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;


import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol";



contract Bridge is AccessControl{

    using SafeMath for uint256;


    //Setting up roles

    bytes32 public constant OBSERVER_ROLE = keccak256("OBSERVER_ROLE");

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // Voting logic & functions

    mapping(bytes32 => uint256) public voteCount;
    mapping(address => uint256) public userVotes;
    
    struct Proposal {
        address executor;
        uint256 voteThreshold;
        uint256 amount;
        uint8 assetID;
        uint8 targetChain;
    }

    mapping(address => bool) public hasVoted;

    uint256 public threshold = 3; // Number of votes required for execution
    
    mapping(bytes32 => Proposal) public proposals;


    function vote(bytes32 proposalId) public {
        require(!hasVoted[msg.sender], "Already voted");
        require(hasRole(OBSERVER_ROLE, msg.sender), "Caller is not an observer");

        voteCount[proposalId] = voteCount[proposalId].add(1);
        userVotes[msg.sender] = userVotes[msg.sender].add(1);
        hasVoted[msg.sender] = true;

        if (voteCount[proposalId] >= threshold && userVotes[msg.sender] >= 3) {
            executeProposal(proposalId);
        }
    }

    function executeProposal(bytes32 proposalId) public view returns (address) {
        require(userVotes[msg.sender] >= 3, "Caller does not have enough votes");
        require(voteCount[proposalId] >= proposals[proposalId].voteThreshold, "Vote threshold not met");
        address executor = proposals[proposalId].executor;
        return executor;
        
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


        if(tokenDetails[assetID].wrapped){

            ERC20PresetMinterPauser(token).mint(receiver, amount);

        } else {
            require(IERC20(token).balanceOf(address(this)) > amount,"The Bridge don't have enough tokes");
            IERC20(token).transfer(receiver, amount);
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