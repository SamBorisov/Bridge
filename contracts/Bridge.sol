//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol";

import "./Wrap.sol";


contract Bridge is Wrap {

    event Lock(uint8 targetChain, address token, uint256 amount, address receiver);

       
    event Unlock(uint8 sourceChain, address token, uint256 amount, address receiver);

     
    event Mint(uint8 sourceChain, uint256 amount, address receiver);

     
    event Burn(uint8 sourceChain, uint256 amount, address receiver);


      address bridge;

      uint8 _targetChain;
      uint8 _sourceChain;



    constructor (address _bridge){
        bridge = _bridge;
    }


    function lock(uint8 targetChain, address token, uint256 amount, address receiver) external {
        require(amount > 0,"Cannot Lock 0 tokens");
        IERC20(token).transferFrom(msg.sender, address(this), amount);

        emit Lock(targetChain, address(token), amount, msg.sender);

    }


    function unlock(uint8 sourceChain, address token, uint256 amount, address receiver) external onlyBridge {
        require(amount > 0,"Cannot Unlock 0 tokens");
        require(receiver == msg.sender,"Receiver should be the sender");
        IERC20(token).transfer(msg.sender, amount);

        emit Unlock(sourceChain, address(token), amount, msg.sender);

    }


    function mint(uint8 sourceChain, address token, uint256 amount, address receiver, string memory TokenName, string memory TokenSymbol) external onlyBridge {
        require(amount > 0,"Cannot Mint 0 tokens");
        require(receiver == msg.sender,"Receiver should be the sender");

        address WrappedToken = orignalToWrap[token];
        if (WrappedToken == address(0)) {
            WrappedToken = wrapToken(sourceChain, token, TokenName, TokenSymbol);
        }
        ERC20PresetMinterPauser(WrappedToken).mint(msg.sender, amount);
 //       IERC20(token).mint(receiver, amount);

        emit Mint(sourceChain, amount, msg.sender);

    }


    function burn(uint8 sourceChain, address wrappedToken, uint256 amount, address receiver) external { 
        require(amount > 0,"Cannot Burn 0 tokens");
        require(receiver == msg.sender, "Receiver should be the sender");
        require(wrappedDetails[wrappedToken].token != address(0),"Not supported token");
        require(wrappedDetails[wrappedToken].sourceChain == sourceChain,"Bad source chain");

        ERC20Burnable token = ERC20Burnable(wrappedToken);
        token.burnFrom(receiver, amount);
//        IERC20(token).burn(amount);

        emit Burn(sourceChain, amount, msg.sender);


    }
        




    modifier onlyBridge() {
        require(bridge == msg.sender, "only the bridge can trigger this function");
        _;
    } 


    
 
}