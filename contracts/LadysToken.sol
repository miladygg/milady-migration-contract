// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract LadysToken is ERC20, Ownable {
    bool public limited; // Limit flag
    uint256 public maxHoldingAmount; // Max holding cap
    uint256 public minHoldingAmount; // Min holding cap
    address public uniswapV2Pair; // Address of uniwapV2 pair

    mapping(address => bool) public blacklists;

    constructor(
        address _pool,
        address _airdropDistributor,
        address _grants,
        address _liquidityProvider,
        address _treasury
    ) ERC20("Milady", "LADYS") Ownable(msg.sender) {
        _mint(_pool, 834720834720835 * 1 ether); // 49.39% for swap pool
        _mint(_airdropDistributor, 253500000000000 * 1 ether); // 15% for airdrop
        _mint(_grants, 316169165279165 * 1 ether); // 18.71% for grants on layer 2
        _mint(_liquidityProvider, 169000000000000 * 1 ether); // 10% for liquidity provider
        _mint(_treasury, 116610000000000 * 1 ether); // 6.9% for treasury
    }

    /**
     * Allow admin to set rule when user holding token
     * @param _limited Limited flag
     * @param _uniswapV2Pair Address of uniswapV2 pair
     * @param _maxHoldingAmount Max holding amount cap
     * @param _minHoldingAmount Min holding amount cap
     */
    function setRule(
        bool _limited,
        address _uniswapV2Pair,
        uint256 _maxHoldingAmount,
        uint256 _minHoldingAmount
    ) external onlyOwner {
        require(_maxHoldingAmount > _minHoldingAmount, "Holding amount");

        limited = _limited;
        uniswapV2Pair = _uniswapV2Pair;
        maxHoldingAmount = _maxHoldingAmount;
        minHoldingAmount = _minHoldingAmount;
    }

    /**
     * Allow admin to blacklist wallet address
     * @param _address Wallet address
     * @param _isBlacklisting Blacklist flag
     */
    function blacklist(
        address _address,
        bool _isBlacklisting
    ) external onlyOwner {
        require(_address != address(0), "Zero Address");
        blacklists[_address] = _isBlacklisting;
    }

    /**
     * Override function transfer to execute _beforeTokenTransfer hook
     * @param to To address
     * @param value Amount of token to transfer
     */
    function transfer(
        address to,
        uint256 value
    ) public virtual override returns (bool) {
        address spender = _msgSender();
        _beforeTokenTransfer(spender, to, value);
        _transfer(spender, to, value);
        return true;
    }

    /**
     * Override function transferFrom to execute _beforeTokenTransfer hook
     * @param from From address
     * @param to To address
     * @param value Amount of token to transfer
     */
    function transferFrom(
        address from,
        address to,
        uint256 value
    ) public virtual override returns (bool) {
        address spender = _msgSender();
        _beforeTokenTransfer(from, to, value);
        _spendAllowance(from, spender, value);
        _transfer(from, to, value);
        return true;
    }

    /**
     * Hook that execute after transfer token
     * @param from From address
     * @param to To address
     * @param amount Amount of token to transfer
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual {
        require(!blacklists[to] && !blacklists[from], "Blacklisted");

        if (limited && from == uniswapV2Pair) {
            require(
                super.balanceOf(to) + amount <= maxHoldingAmount &&
                    super.balanceOf(to) + amount >= minHoldingAmount,
                "Forbid"
            );
        }
    }

    function burn(uint256 value) external {
        _burn(msg.sender, value);
    }
}
