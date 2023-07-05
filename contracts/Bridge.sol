//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;


import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol";



contract Bridge is Ownable{


    event Lock(uint8 indexed assetID, address indexed token, uint256 amount, address user, address receiver);

    event Unlock(uint8 indexed assetID, address indexed token, uint256 amount, address user, address receiver);


    // Locking or Burining tokens

    function lock(uint8 assetID, uint256 amount, address receiver) external {

        address token = tokenDetails[assetID].token;

        require(amount > 0,"Cannot Lock 0 tokens");
        require(token != address(0),"Not supported token");
        require(tokenDetails[assetID].assetID == assetID,"ID not found");
        require(receiver != address(0),"The receiver shoud be a valid address");

        if(tokenDetails[assetID].wrapped){

            require(IERC20(token).allowance(msg.sender, address(this)) >= amount, "Insufficient allowance");
            require(IERC20(token).balanceOf(msg.sender) > amount,"Insufficient balance");
            ERC20PresetMinterPauser(token).burnFrom(msg.sender, amount);

        } else {

            require(IERC20(token).allowance(msg.sender, address(this)) >= amount, "Insufficient allowance");
            require(IERC20(token).balanceOf(msg.sender) >= amount, "Insufficient balance");
            IERC20(token).transferFrom(msg.sender, address(this), amount);
        }

        emit Lock(assetID, address(token), amount, msg.sender, receiver);

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


    function addAsset(uint8 assetID, address token, bool wrapped) external onlyOwner {

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