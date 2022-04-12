//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;


interface IBridge {


    event Lock(uint8 targetChain, address token, uint256 amount, address receiver);

       
    event Unlock(uint8 sourceChain, address token, uint256 amount, address receiver);

     
    event Mint(address token, uint256 amount, address receiver);

     
    event Burn(address token, uint256 amount, address receiver);


    event WrappedToken(uint8 sourceChain, address token, address wrappedToken);



    function lock(
        uint8 targetChain, 
        address token, 
        uint256 amount, 
        address  receiver
        ) external payable;

    function unlock(
        uint8 sourceChain,
        address token,
        uint256 amount,
        address receiver,
        bytes memory txHash,
        bytes memory txSigned
    ) external;

    function mint(
        uint8 sourceChain,
        address token,
        uint256 amount,
        address receiver,
        bytes memory txHash,
        bytes memory txSigned
    ) external;


    function burn(
        uint8 sourceChain,
        address wrappedToken, 
        uint256 amount, 
        address receiver
        ) external;

    function wrappedTokens() external view returns (
        string memory name, 
        string memory symbol, 
        uint8 decimals, 
        address wrappedToken, 
        address token,
        uint8 sourceChain
        );

 
}
