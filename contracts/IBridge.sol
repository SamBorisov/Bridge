//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;


interface IBridge {

        // @notice An event emitted once a Lock transaction is executed
    event Lock(uint8 targetChain, address token, bytes receiver, uint256 amount, uint256 serviceFee);

        // @notice An event emitted once an Unlock transaction is executed
    event Unlock(address token, uint256 amount, address receiver);

        // @notice An even emitted once a Mint transaction is executed
    event Mint(address token, uint256 amount, address receiver);

        // @notice An event emitted once a Burn transaction is executed
    event Burn(address token, uint256 amount, bytes receiver);

        // @notice An event emitted once a new wrapped token is deployed by the contract
    event WrappedTokenDeployed(uint8 sourceChain, bytes nativeToken, address wrappedToken);




    function lock(uint8 _targetChain, address _nativeToken, uint256 _amount, bytes memory _receiver) external;

    function unlock(
        uint8 _sourceChain,
        bytes memory _transactionId,
        address _nativeToken,
        uint256 _amount,
        address _receiver,
        bytes[] calldata _signatures
    ) external;

    function mint(
        uint8 _nativeChain,
        bytes memory _nativeToken,
        bytes memory _transactionId,
        uint256 _amount,
        address _receiver,
        bytes[] calldata _signatures
       // WrappedTokenParams memory _tokenParams
    ) external;


    function burn(address _wrappedToken, uint256 _amount, bytes memory _receiver) external;

 
}
