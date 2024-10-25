// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract OldToken is ERC20 {
    constructor() ERC20("OldToken", "OLD_TOKEN") {
        _mint(msg.sender, 100000000000000 ether);
    }

    function burn(uint256 value) external {
        _burn(msg.sender, value);
    }

    function mint(address from, uint256 value) external {
        _mint(from, value);
    }
}
