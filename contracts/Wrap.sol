//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol";



contract Wrap {

    event WrappedTokenDeployed(uint16 sourceChain,address token,address wrappedToken);
      
    
        mapping(address => address) private orignalToWrap;
        mapping(address => WrappedToken) private wrappedDetails;


        struct WrappedToken {
        string name;
        string symbol;
        uint8 decimals;
        address wrappedToken;
        address token;
        uint16 sourceChain;
        }

        WrappedToken[] private _WrappedTokens;

        function wrapToken (uint16 sourceChain, address token, string memory name, string memory symbol) internal returns (address) {
        require(orignalToWrap[token] == address(0), "Token already wrapped");
        require(bytes(name).length != 0, "Put longer name");
        require(bytes(symbol).length != 0, "Put longer symbol");
        require(sourceChain > 0, "Can't be 0");

        ERC20PresetMinterPauser wrappedToken = new ERC20PresetMinterPauser(name, symbol);

        orignalToWrap[token] = address(wrappedToken);
        WrappedToken memory storeIt = WrappedToken({
            name: name,
            symbol: symbol,
            decimals: wrappedToken.decimals(),
            wrappedToken: address(wrappedToken),
            token: token,
            sourceChain: sourceChain
        });

        _WrappedTokens.push(storeIt);
        wrappedDetails[address(wrappedToken)] = storeIt;

        emit WrappedTokenDeployed(sourceChain, token, address(wrappedToken));

        return address(wrappedToken);

}

        function wrappedTokens() external view returns (WrappedToken[] memory) {
            return _WrappedTokens;
        }

    
}