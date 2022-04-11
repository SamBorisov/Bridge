//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./IBridge.sol";

contract Bridge is IBridge{



    function lock(uint8 targetChain, address token, uint256 amount, address receiver) external payable {
        require(amount > 0,"Cannot Lock 0 tokens");




    }

    function unlock(uint8 sourceChain, address token, uint256 amount, address receiver, bytes memory txHash, bytes memory txSigned) external{





    }

    function mint(uint8 sourceChain, address token, uint256 amount, address receiver, bytes memory txHash, bytes memory txSigned) external{







    }

    function burn(uint8 sourceChain, address wrappedToken, uint256 amount, address receiver) external{







    }

    function wrappedTokens() external view returns (string memory name, string memory symbol, uint8 decimals, address wrappedToken, address token, uint8 sourceChain){








    }   
    
}