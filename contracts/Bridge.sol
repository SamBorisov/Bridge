//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/presets/ERC20PresetMinterPauser.sol";

import "./IBridge.sol";

contract Bridge is IBridge{

    event Lock(uint8 targetChain, address token, uint256 amount, address receiver);

       
    event Unlock(uint8 sourceChain, address token, uint256 amount, address receiver);

     
    event Mint(uint8 sourceChain, uint256 amount, address receiver);

     
    event Burn(uint8 sourceChain, uint256 amount, address receiver);


      mapping(address => address) private WrappedToken;

      address bridge;

    constructor (address _bridge){
        bridge = _bridge;
    }


    function lock(uint8 targetChain, address token, uint256 amount, address receiver) external payable override {
        require(amount > 0,"Cannot Lock 0 tokens");
        IERC20(token).transferFrom(msg.sender, address(this), amount);

        emit Lock(targetChain, address(token), amount, msg.sender);

    }


    function unlock(uint8 sourceChain, address token, uint256 amount, address receiver) external override {
        require(amount > 0,"Cannot Unlock 0 tokens");
        IERC20(token).transfer(msg.sender, amount);

        emit Unlock(sourceChain, address(token), amount, msg.sender);

    }


    function mint(uint8 sourceChain, address token, uint256 amount, address receiver) external override {
        require(amount > 0,"Cannot Mint 0 tokens");
 //       IERC20(token).mint(receiver, amount);

        emit Mint(sourceChain, amount, msg.sender);

    }


    function burn(uint8 sourceChain, address wrappedToken, uint256 amount, address receiver) external override { 
        require(amount > 0,"Cannot Burn 0 tokens");
//        IERC20(token).burn(receiver, amount);

        emit Burn(sourceChain, amount, msg.sender);


    }


    

    modifier onlyBridge() {
        require(bridge == msg.sender, "only the bridge can trigger this function");
    } 


    
 
}