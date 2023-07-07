// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;


contract MyContract {


    address[] public voters;

    mapping(address => bool)  public hasVoted;

    //     mapping(bytes32 => mapping(address => bool))  public hasVoted;

    struct Proposal {
        uint8 assetID;
        uint256 amount;
        uint8 sourceChain;
        address executor;
        uint8 voteCount;
        bool executed;
    }

    mapping(bytes32 => Proposal) public proposals;
    
    mapping(bytes32 => uint8) public voteCount;

    mapping(address => bytes32) public unlocker;

    function vote(bytes32 proposalId, address _executor, uint256 _amount, uint8 _assetID, uint8 _sourceChain) public {
        require(!hasVoted[msg.sender], "Already voted");
        require(!proposals[proposalId].executed, "It is already executed");

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

    }

    function executeProposal() public {
         
        require(!proposals[unlocker[msg.sender]].executed, "It is already executed");
        require(proposals[unlocker[msg.sender]].voteCount >= 3, "User Don't have enough votes yet");
        require(proposals[unlocker[msg.sender]].executor == msg.sender, "Caller is not the executor");


        proposals[unlocker[msg.sender]].voteCount = 0;
        proposals[unlocker[msg.sender]].executed = true;
        unlocker[msg.sender] = 0x00;

        for(uint i = 0; i < voters.length; i++) {
            hasVoted[voters[i]] = false;
        }

    }
}