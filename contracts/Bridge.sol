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


    // execute function after 50 blocks 

    uint256 public executionBlock;
    uint256 public requiredBlockDifference = 50;

    modifier afterRequiredBlockDifference() {
        require(block.number >= executionBlock + requiredBlockDifference, "Block difference not met");
        _;
    }

    // Voting logic & functions

    event Vote(bytes32 indexed proposalHash, bytes32 indexed transactionHash, address executor, uint256 amount, uint8 assetID, uint256 sourceChain);

    mapping(bytes32 => mapping(address => bool))  public hasVoted;

    enum Status {
        OnGoing,
        ReadyToUnlock,
        Unlocked,
        Rejected
    }

    struct Proposal {
        uint8 assetID;
        uint256 amount;
        uint256 sourceChain;
        address executor;
        uint8 voteCount;
        Status status;
    }

    mapping(bytes32 => Proposal) public proposals;
    mapping(address => bytes32) public unlocker;

    function vote(bytes32 _transactionHash, address _executor, uint256 _amount, uint8 _assetID, uint256 _sourceChain) external {

        bytes32 proposalHash = keccak256(abi.encodePacked(_transactionHash, _executor, _amount, _assetID, _sourceChain));

        require(!hasVoted[proposalHash][msg.sender], "Already voted");
        require(hasRole(OBSERVER_ROLE, msg.sender), "Caller does not have OBSERVER_ROLE");
        require(proposals[proposalHash].status == Status.OnGoing , "It has enough votes already");
        // basic checks
        require(_amount > 0,"Cannot Unlock 0 tokens");
        require(_executor != address(0),"The receiver shoud be a valid address");

        if (proposals[proposalHash].voteCount == 0) {

            proposals[proposalHash].sourceChain = _sourceChain;
            proposals[proposalHash].executor = _executor;
            proposals[proposalHash].assetID = _assetID;
            proposals[proposalHash].amount = _amount;
            proposals[proposalHash].status = Status.OnGoing;
            unlocker[_executor] = proposalHash;
        }

        proposals[proposalHash].voteCount ++;
        hasVoted[proposalHash][msg.sender] = true;

        if (proposals[proposalHash].voteCount >= 3) {
                proposals[proposalHash].status = Status.ReadyToUnlock;
                executionBlock = block.number;
            }

        emit Vote(proposalHash, _transactionHash, _executor, _amount, _assetID, _sourceChain);

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

    function unlock(uint8 assetID, uint256 amount, address receiver) external afterRequiredBlockDifference{

        address token = tokenDetails[assetID].token;

        require(amount > 0,"Cannot Unlock 0 tokens");
        require(token != address(0),"Not supported token");
        require(receiver != address(0),"The receiver shoud be a valid address");
        // checking validations
        require(proposals[unlocker[msg.sender]].voteCount >= 3, "User Don't have enough votes yet");
        require(amount <= proposals[unlocker[msg.sender]].amount, "Amount is more than the proposal");
        require(proposals[unlocker[msg.sender]].executor == msg.sender, "Caller is not the executor");
        require(proposals[unlocker[msg.sender]].status == Status.ReadyToUnlock , "Status isn't ready to be Unlocked");

        // unlocking or minting
        if(tokenDetails[assetID].wrapped){

            ERC20PresetMinterPauser(token).mint(receiver, amount);

        } else {
            require(IERC20(token).balanceOf(address(this)) > amount,"The Bridge don't have enough tokes");
            IERC20(token).transfer(receiver, amount);
        }
        // reseting the values after unlocking
        proposals[unlocker[msg.sender]].status = Status.Unlocked;
        unlocker[msg.sender] = 0x00;

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