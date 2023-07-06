// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";


contract MyContract {

    using SafeMath for uint256;

    mapping(bytes32 => uint256) public voteCount;
    mapping(address => uint256) public userVotes;
    mapping(address => bool) public hasVoted;

    struct Proposal {
        address executor;
        uint256 voteThreshold;
        uint256 amount;
        string chain;
        bool executed;
    }

    mapping(bytes32 => Proposal) public proposals;

    uint256 public threshold = 3; // Number of votes required for execution


    function vote(bytes32 proposalId, Proposal memory proposal) public {
        require(!hasVoted[msg.sender], "Already voted");

        voteCount[proposalId] = voteCount[proposalId].add(1);
        userVotes[msg.sender] = userVotes[msg.sender].add(1);
        hasVoted[msg.sender] = true;

        if (voteCount[proposalId] >= threshold && userVotes[msg.sender] >= threshold) {
            proposals[proposalId].executed = true;
        }
    }

    function executeProposal(bytes32 proposalId) public view {
        require(proposals[proposalId].executed, "Proposal not executed yet");
        require(proposals[proposalId].executor == msg.sender, "Caller is not the executor");

        // Perform actions specific to the proposal
        // ...
    }
}
