//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;


interface IBridge {


    event Lock(uint8 targetChain, address token, uint256 amount, bytes receiver);

       
    event Unlock(bytes _transactionId, address token, uint256 amount, address receiver);

     
    event Mint(address token, uint256 amount, address receiver);

     
    event Burn(uint8 _nativeChain,bytes _nativeToken, bytes _transactionId, address token, uint256 amount, bytes receiver);

  
    event WrappedTokenDeployed(uint8 sourceChain, bytes nativeToken, address wrappedToken);



    function lock(
        uint8 _targetChain, 
        address _nativeToken, 
        uint256 _amount, 
        bytes memory _receiver
        ) external;

    function unlock(
        uint8 _sourceChain,
        bytes memory _transactionId,
        address _nativeToken,
        uint256 _amount,
        address _receiver
    ) external;

    function mint(
        uint8 _nativeChain,
        bytes memory _nativeToken,
        bytes memory _transactionId,
        uint256 _amount,
        address _receiver
    ) external;


    function burn(
        address _wrappedToken, 
        uint256 _amount, 
        bytes memory _receiver
        ) external;

    function wrappedTokens() external view returns (
        string memory name, 
        string memory symbol, 
        uint8 decimals, 
        address wrappedToken, 
        address token,
        uint16 sourceChain
        );
 
}
