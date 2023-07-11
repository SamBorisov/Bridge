//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;


import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol";



contract Test is AccessControl{


    //Setting up roles

    bytes32 public constant OBSERVER_ROLE = keccak256("OBSERVER_ROLE");
    bytes32 public constant DEFENDER_ROLE = keccak256("DEFENDER_ROLE");

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }


    // execute after 50 blocks modifier

    uint256 public executionBlock;

    modifier after50Block() {
        require(block.number >= executionBlock + 50, "50 blocks not passed until last vote");
        _;
    }

    // Defend logic & functions

    event Defend(bytes32 indexed proposalHash, Status status);

    function defend(bytes32 proposalHash) external {
    
            require(hasRole(DEFENDER_ROLE, msg.sender), "Caller is not defender");
            require(proposals[proposalHash].status == Status.ReadyToUnlock, string(abi.encodePacked("Transaction status is ", proposals[proposalHash].status)) );

            proposals[proposalHash].status = Status.Rejected;
    
            emit Defend(proposalHash, Status.Rejected);
        
    }

    // Voting logic & functions

    event Vote(bytes32 indexed proposalHash, bytes32 indexed transactionHash, address executor, uint256 amount, uint8 assetID, uint256 sourceChain);
    event Approved(bytes32 indexed proposalHash);

    mapping(bytes32 => mapping(address => bool))  public hasVoted;
    mapping(bytes32 => uint8)  public voteCount;

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
        Status status;
    }

    mapping(bytes32 => Proposal) public proposals;
    mapping(address => bytes32) public unlocker;

    function vote(bytes32 _transactionHash, address _executor, uint256 _amount, uint8 _assetID, uint256 _sourceChain) external {

        bytes32 proposalHash = keccak256(abi.encodePacked(_transactionHash, _executor, _amount, _assetID, _sourceChain));

        require(!hasVoted[proposalHash][msg.sender], "Already voted");
        require(hasRole(OBSERVER_ROLE, msg.sender), "Caller is not observer");
        require(proposals[proposalHash].status == Status.OnGoing , "Transaction has enough votes already");
        // basic checks
        require(_amount > 0,"Cannot vote for 0 tokens");
        require(_executor != address(0),"The executor shoud be a valid address");
        require(tokenDetails[_assetID].token != address(0),"Not supported token");

        if (voteCount[proposalHash] == 0) {

            proposals[proposalHash].sourceChain = _sourceChain;
            proposals[proposalHash].executor = _executor;
            proposals[proposalHash].assetID = _assetID;
            proposals[proposalHash].amount = _amount;
            proposals[proposalHash].status = Status.OnGoing;
            unlocker[_executor] = proposalHash;
        }

        voteCount[proposalHash] ++;
        hasVoted[proposalHash][msg.sender] = true;

        if (voteCount[proposalHash] >= 3) {
                proposals[proposalHash].status = Status.ReadyToUnlock;
                executionBlock = block.number;
                emit Approved(proposalHash);
            }

        emit Vote(proposalHash, _transactionHash, _executor, _amount, _assetID, _sourceChain);

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

        TokenInfo memory storeIt = TokenInfo({
            assetID: assetID,
            token: token,
            wrapped: wrapped
        });

        tokenDetails[assetID] = storeIt;
        savedIDs.push(assetID);

        emit AssetAdded(assetID, token, wrapped);
   
    }
}