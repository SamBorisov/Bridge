//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;


import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol";



contract Bridge is AccessControl{


    //Setting up roles_______________

    bytes32 public constant OBSERVER_ROLE = keccak256("OBSERVER_ROLE");
    bytes32 public constant DEFENDER_ROLE = keccak256("DEFENDER_ROLE");

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }


    // _______________Adding and Saving tokens_______________

    event AssetAdded(uint16 indexed assetID,address indexed token, bool wrapped);

        mapping(uint16 => TokenInfo) public tokenDetails;

        struct TokenInfo {
            uint16 assetID;
            address token;
            bool wrapped;
        }

        uint16[] internal savedIDs;
        

    function addAsset(uint16 assetID, address token, bool wrapped) external {

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


    // _______________Locking and Unlocking_______________

    event Lock(uint16 indexed assetID, address indexed token, uint256 amount, address user, uint256 targetChain);

    event Unlock(uint16 indexed assetID, address indexed token, uint256 amount, address user, address receiver);


    // Locking or Burining tokens

    function lock(uint16 assetID, uint256 amount, uint256 targetChain) external {

        address token = tokenDetails[assetID].token;

        require(amount > 0,"Cannot Lock 0 tokens");
        require(token != address(0),"Not supported token");

        if(tokenDetails[assetID].wrapped){

            ERC20PresetMinterPauser(token).burnFrom(msg.sender, amount);

        } else {

            IERC20(token).transferFrom(msg.sender, address(this), amount);
        }

        emit Lock(assetID, address(token), amount, msg.sender, targetChain);
    }


    // Unlocking or Minting tokens

    function unlock(uint16 assetID, uint256 amount, address receiver) external after50Block{

        address token = tokenDetails[assetID].token;

        require(amount > 0,"Cannot Unlock 0 tokens");
        require(token != address(0),"Not supported token");
        require(receiver != address(0),"The receiver shoud be a valid address");
        // checking validations
        require(voteCount[unlocker[msg.sender]] >= 3, "Executor does not have enough votes");
        require(amount <= proposals[unlocker[msg.sender]].amount, "Amount is more than the proposal");
        require(proposals[unlocker[msg.sender]].assetID == assetID, "Asset ID is not the same as the proposal");
        require(proposals[unlocker[msg.sender]].status == Status.Approved , "Status for unlocking is not approved");

        if(tokenDetails[assetID].wrapped){

            ERC20PresetMinterPauser(token).mint(receiver, amount);

        } else {
    
            IERC20(token).transfer(receiver, amount);
        }
        // changing status to unlocked
        proposals[unlocker[msg.sender]].status = Status.Unlocked;

        emit Unlock(assetID, address(token), amount, msg.sender, receiver);

    }

    // _______________Voting logic & functions_______________

    event Vote(bytes32 indexed proposalHash, bytes32 indexed transactionHash, address executor, uint256 amount, uint16 assetID, uint256 sourceChain);
    event Approved(bytes32 indexed proposalHash , bytes32 indexed transactionHash);

    mapping(bytes32 => mapping(address => bool))  public hasVoted;
    mapping(bytes32 => uint8)  public voteCount;

    // aproved propsals list (can remove this if not needed)
    bytes32[] public approvedProposalsList;

    enum Status {
        Pending,
        Approved,
        Unlocked,
        Rejected
    }

    struct Proposal {
        uint16 assetID;
        uint256 amount;
        uint256 sourceChain;
        address executor;
        Status status;
    }

    mapping(bytes32 => Proposal) public proposals;
    mapping(address => bytes32) public unlocker;

    function vote(bytes32 _transactionHash, address _executor, uint256 _amount, uint16 _assetID, uint256 _sourceChain) external {

        bytes32 proposalHash = keccak256(abi.encodePacked(_transactionHash, _executor, _amount, _assetID, _sourceChain));

        require(!hasVoted[proposalHash][msg.sender], "Already voted");
        require(hasRole(OBSERVER_ROLE, msg.sender), "Caller is not observer");
        require(proposals[proposalHash].status == Status.Pending , "Transaction has enough votes already");
        // basic checks
        require(_amount > 0,"Cannot vote for 0 tokens");
        require(_executor != address(0),"The executor shoud be a valid address");
        require(tokenDetails[_assetID].token != address(0),"Not supported token");

        if (voteCount[proposalHash] == 0) {

            proposals[proposalHash].sourceChain = _sourceChain;
            proposals[proposalHash].executor = _executor;
            proposals[proposalHash].assetID = _assetID;
            proposals[proposalHash].amount = _amount;
            proposals[proposalHash].status = Status.Pending;
            unlocker[_executor] = proposalHash;
        }

        voteCount[proposalHash] ++;
        hasVoted[proposalHash][msg.sender] = true;

        if (voteCount[proposalHash] >= 3) {
                proposals[proposalHash].status = Status.Approved;
                executionBlock = block.number;
                approvedProposalsList.push(proposalHash);
                emit Approved(proposalHash, _transactionHash);
            }

        emit Vote(proposalHash, _transactionHash, _executor, _amount, _assetID, _sourceChain);

    }

    // _______________Defend logic & functions_______________

    event Defend(bytes32 indexed proposalHash, Status status);

    function defend(bytes32 proposalHash) external {
    
            require(hasRole(DEFENDER_ROLE, msg.sender), "Caller is not defender");
            require(proposals[proposalHash].status == Status.Approved, "Transaction status is not Approved");

            proposals[proposalHash].status = Status.Rejected;
    
            emit Defend(proposalHash, Status.Rejected);
    }


    // execute after 50 blocks modifier_______________

    uint256 public executionBlock;

    modifier after50Block() {
        require(block.number >= executionBlock + 50, "50 blocks not passed until last vote");
        _;
    }


    // View functions_______________

    function checkSavedValues(uint16 assetID, address token) internal view returns(bool) {

        for (uint256 i = 0; i < savedIDs.length; i++) {
            if (tokenDetails[savedIDs[i]].assetID == assetID || tokenDetails[savedIDs[i]].token == token) {
               return true;
            }
        }
        return false;
    }
 
}