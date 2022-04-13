//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/presets/ERC20PresetMinterPauser.sol";

import "./IBridge.sol";

contract Bridge is IBridge{

      mapping(address => address) private WrappedToken;



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


    function wrapToken(uint16 sourceChain, address token, string memory name, string memory symbol) internal returns (address) {
        require(WrappedToken[token] == address(0), "This token is already wrapped");
        require(bytes(name).length != 0, "Name should be longer");
        require(bytes(symbol).length != 0, "Symbol should be longer");
        require(sourceChain > 0, "Invalid chain id");


    }


    function wrappedTokens() external view override returns (string memory name, string memory symbol, uint8 decimals, address wrappedToken, address token, uint8 sourceChain) {






    }  

 
}