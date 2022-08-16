// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

// Author: Francesco Sullo <francesco@sullo.co>
// (c) 2022+ SuperPower Labs Inc.

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./interfaces/IERC20Receiver.sol";
import "./interfaces/IByteCity.sol";
import "./utils/Constants.sol";

contract ByteCity is IERC20Receiver, IByteCity, Constants, Initializable, OwnableUpgradeable, UUPSUpgradeable {
  using AddressUpgradeable for address;
  using SafeMathUpgradeable for uint256;

  mapping(uint8 => address) private _stableCoins;
  mapping(uint32 => DepositInfo) private _depositsById;
  mapping(address => User) private _users;

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() initializer {}

  // solhint-disable-next-line
  function initialize() public initializer {
    __Ownable_init();
  }

  function _authorizeUpgrade(address newImplementation) internal virtual override onlyOwner {}

  function onERC20Received(
    address,
    address,
    uint256,
    bytes calldata
  ) external pure override returns (bytes4) {
    return this.onERC20Received.selector;
  }

  function addStableCoin(uint8 tokenType, address stableCoin) external override onlyOwner {
    require(stableCoin.isContract(), "ByteCity: token not a contract");
    require(_stableCoins[tokenType] == address(0), "ByteCity: stable coin already set");
    require(tokenType > 0 && tokenType < USDC + 1, "ByteCity: invalid tokenType");
    _stableCoins[tokenType] = stableCoin;
    emit StableCoinAdded(tokenType, stableCoin);
  }

  function deposit(
    uint8 tokenType,
    uint128 amount,
    uint32 depositId
  ) external override {
    require(_stableCoins[tokenType] != address(0), "ByteCity: unsupported stable coin");
    _users[_msgSender()].amounts[tokenType] += amount;
    _depositsById[depositId] = DepositInfo({index: uint16(_users[_msgSender()].deposits.length), user: _msgSender()});
    _users[_msgSender()].deposits.push(
      USDDeposit({id: depositId, tokenType: tokenType, amount: amount, createdAt: uint32(block.timestamp)})
    );
    emit USDDeposited(_msgSender(), tokenType, amount, depositId);
    // this will fail if spend not approved
    IERC20(_stableCoins[tokenType]).transferFrom(_msgSender(), address(this), amount);
  }

  function depositByIndex(address user, uint256 index) public view override returns (USDDeposit memory) {
    return _users[user].deposits[index];
  }

  function totalDepositedAmount(address user, uint8 tokenType) external view override returns (uint128) {
    return _users[user].amounts[tokenType];
  }

  function depositsAmount(address user) external view override returns (uint256) {
    return _users[user].deposits.length;
  }

  function depositById(uint32 depositId) external view override returns (USDDeposit memory) {
    DepositInfo memory info = _depositsById[depositId];
    return depositByIndex(info.user, uint256(info.index));
  }

  function withdrawUSD(
    uint8 tokenType,
    uint256 amount,
    address beneficiary
  ) external override onlyOwner {
    IERC20 token = IERC20(_stableCoins[tokenType]);
    uint256 balance = token.balanceOf(address(this));
    require(amount < balance + 1, "ByteCity: amount not available");
    if (amount == 0) {
      amount = balance;
    }
    token.transferFrom(address(this), beneficiary, amount);
  }
}