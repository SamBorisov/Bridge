//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;


import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol";



contract Bridge {


    event Lock(uint8 indexed assetID, address token, uint256 amount, address receiver);

    event Unlock(uint8 indexed assetID, address token, uint256 amount, address receiver);

    event AssetAdded(uint16 indexed assetID,address token, bool mintable, bool bunrable);


    address private bridge;
    address private admin;


    constructor (){
        bridge = address(this);
        admin = msg.sender;
    }

    // Locking or Burining tokens

    function lock(uint8 assetID, uint256 amount) external {

        address token = tokenDetails[assetID].token;

        require(amount > 0,"Cannot Lock 0 tokens");
        require(token != address(0),"Not supported token");
        require(tokenDetails[assetID].assetID == assetID,"ID not found");

        if(tokenDetails[assetID].bunrable){
            
            ERC20Burnable _token = ERC20Burnable(token);
            _token.burnFrom(msg.sender, amount);

        } else {
        IERC20 tokenInstance = IERC20(token);
        require(tokenInstance.allowance(msg.sender, address(this)) >= amount, "Insufficient allowance");
         tokenInstance.transferFrom(msg.sender, address(this), amount);
        }

        emit Lock(assetID, address(token), amount, msg.sender);

    }

    // Unlocking or Minting tokens

    function unlock(uint8 assetID, uint256 amount, address receiver) external {

        address token = tokenDetails[assetID].token;

        require(amount > 0,"Cannot Unlock 0 tokens");
        require(receiver == msg.sender,"Receiver should be the sender");


        if(tokenDetails[assetID].mintable){

            ERC20PresetMinterPauser(token).mint(msg.sender, amount);

        } else {
            require(IERC20(token).balanceOf(address(this)) > amount,"The Bridge don't have enough tokes");
            IERC20(token).approve(address(this), amount);
            IERC20(token).transfer(msg.sender, amount);
        }

        emit Unlock(assetID, address(token), amount, msg.sender);

    }





    // adding and saving assets

        mapping(uint8 => TokenInfo) internal tokenDetails;

        struct TokenInfo {
            string name;
            string symbol;
            uint8 assetID;
            address token;
            bool bunrable;
            bool mintable;
        }

        uint8[] internal savedIDs;
        TokenInfo[] public _TokensList;


    function addAsset(uint8 assetID, address token, bool mintable, bool bunrable, string memory name, string memory symbol) external onlyAdmin  {

        require(assetID > 0, "ID cannot be 0"); 
        require(tokenDetails[assetID].token == address(0), "Token ID has address already");
        require(checkSavedValues(assetID, token) == false ,"Token ID or address already set");


        TokenInfo memory storeIt = TokenInfo({
            name: name,
            symbol: symbol,
            assetID: assetID,
            token: token,
            bunrable: bunrable,
            mintable: mintable
        });

        tokenDetails[assetID] = storeIt;
        _TokensList.push(storeIt);
        savedIDs.push(assetID);


        emit AssetAdded(assetID, token, mintable, bunrable);
   
    }





    // modifers for security

    modifier onlyBridge() {
        require(bridge == msg.sender, "only the bridge can trigger this function");
        _;
    } 

    modifier onlyAdmin() {
        require(admin == msg.sender, "only the admin can trigger this function");
        _;
    } 


    // View functions

    function viewAssets() public view returns (TokenInfo[] memory) {
        return _TokensList;
    }

    function checkSavedValues(uint8 assetID, address token) internal view returns(bool) {

        for (uint256 i = 0; i < savedIDs.length; i++) {
            if (tokenDetails[savedIDs[i]].assetID == assetID || tokenDetails[savedIDs[i]].token == token) {
               return true;
            }
        }
        return false;
    }

    function getBalanceOfToken(uint8 assetID) public view returns(uint256) {

        require(tokenDetails[assetID].token != address(0),"Not supported token");
        require(tokenDetails[assetID].assetID == assetID,"ID not found");

        return IERC20(tokenDetails[assetID].token).balanceOf(msg.sender);
        
    }
    
 
}