// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./IToken.sol";

contract Swap is Ownable {
    address public oldToken;
    address public newToken;

    event SwapExecuted(address user, uint256 amount);

    constructor(address _oldToken) Ownable(msg.sender) {
        require(_oldToken != address(0), "Zero address");
        oldToken = _oldToken;
    }

    /**
     * Set old token
     * @param _oldToken address of new token
     */
    function setOldToken(address _oldToken) external onlyOwner {
        require(_oldToken != address(0), "Zero address");
        oldToken = _oldToken;
    }

    /**
     * Set new token
     * @param _newToken address of new token
     */
    function setNewToken(address _newToken) external onlyOwner {
        require(_newToken != address(0), "Zero address");
        newToken = _newToken;
    }

    /**
     * Swap old token for new token
     * @param _amount Amount of olf token want to swap
     */
    function swap(uint256 _amount) external {
        require(_amount > 0, "Invalid amount");
        require(
            IToken(oldToken).transferFrom(msg.sender, address(this), _amount),
            "Transfer failed"
        );
        IToken(oldToken).burn(_amount);
        IToken(newToken).transfer(msg.sender, _amount);
        emit SwapExecuted(msg.sender, _amount);
    }

    /**
     * Withdraw ERC20 token stored inside smart contract
     * @param _token Address of token owner want to withdraw
     */
    function withdrawToken(address _token) external onlyOwner {
        IToken(_token).transfer(
            msg.sender,
            IToken(_token).balanceOf(address(this))
        );
    }

    fallback() external {}

    receive() external payable {}
}
