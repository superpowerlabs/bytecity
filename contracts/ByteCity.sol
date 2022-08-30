// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

// Author: Francesco Sullo <francesco@sullo.co>
// (c) 2022+ SuperPower Labs Inc.

import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "soliutils/contracts/UUPSUpgradableTemplate.sol";

import "./interfaces/IERC20Receiver.sol";
import "./interfaces/IByteCity.sol";
import "./interfaces/IBadgeData.sol";
import "./interfaces/IBadge.sol";
import "./utils/Constants.sol";
import "./utils/Signable.sol";

//import "hardhat/console.sol";

contract ByteCity is IERC20Receiver, IByteCity, Constants, Signable, UUPSUpgradableTemplate {
  using AddressUpgradeable for address;
  using SafeMathUpgradeable for uint256;

  mapping(uint8 => address) private _stableCoins;
  mapping(uint64 => DepositInfo) private _depositsById;
  mapping(address => User) private _users;
  IBadge public badge;
  mapping(bytes32 => uint8) private _usedSignatures;

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() initializer {}

  // solhint-disable-next-line
  function initialize() public initializer {
    __Ownable_init();
  }

  function onERC20Received(
    address,
    address,
    uint256,
    bytes calldata
  ) external pure override returns (bytes4) {
    return this.onERC20Received.selector;
  }

  function setBadge(address badge_) external virtual override onlyOwner {
    require(badge_.isContract(), "Badge: badge_ not a contract");
    badge = IBadge(badge_);
    emit BadgeSet(badge_);
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
    uint256 amount,
    uint64 depositId
  ) external override {
    require(_stableCoins[tokenType] != address(0), "ByteCity: unsupported stable coin");
    require(_depositsById[depositId].user == address(0), "ByteCity: depositId already used");
    _users[_msgSender()].amounts[tokenType] += uint128(amount);
    _depositsById[depositId] = DepositInfo({index: uint16(_users[_msgSender()].deposits.length), user: _msgSender()});
    _users[_msgSender()].deposits.push(
      USDDeposit({id: depositId, tokenType: tokenType, amount: uint128(amount), createdAt: uint32(block.timestamp)})
    );
    emit USDDeposited(_msgSender(), tokenType, uint128(amount), depositId);
    // this will fail if spend not approved
    IERC20(_stableCoins[tokenType]).transferFrom(_msgSender(), address(this), uint128(amount));
  }

  function depositByIndex(address user, uint256 index) public view override returns (USDDeposit memory) {
    if (_users[user].deposits.length <= index) {
      USDDeposit memory emptyDeposit;
      return emptyDeposit;
    } else {
      return _users[user].deposits[index];
    }
  }

  function totalDepositedAmount(address user, uint8 tokenType) external view override returns (uint128) {
    return _users[user].amounts[tokenType];
  }

  function numberOfDeposits(address user) external view override returns (uint256) {
    return _users[user].deposits.length;
  }

  function depositById(uint64 depositId) external view override returns (USDDeposit memory, address user) {
    DepositInfo memory info = _depositsById[depositId];
    return (depositByIndex(info.user, uint256(info.index)), info.user);
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
    token.transfer(beneficiary, amount);
  }

  function updateBadgeAttributes(
    uint256 tokenId,
    IBadgeData.BadgeAttributes calldata attributes,
    uint256 randomNonce,
    bytes calldata signature0,
    bytes calldata signature1
  ) external {
    require(
      isSignedByValidator(0, hashBadgeAttributes(tokenId, attributes, randomNonce), signature0),
      "GamePool: invalid signature0"
    );
    require(
      isSignedByValidator(1, hashBadgeAttributes(tokenId, attributes, randomNonce), signature1),
      "GamePool: invalid signature1"
    );
    _saveSignatureAsUsed(signature0);
    _saveSignatureAsUsed(signature1);
    badge.updateAttributes(tokenId, 0, uint256(attributes.level));
  }

  function getBadgeAttributes(uint256 tokenId) external view returns (IBadgeData.BadgeAttributes memory) {
    uint256 attributes = badge.attributesOf(tokenId, address(this), 0);
    return IBadgeData.BadgeAttributes({level: uint8(attributes)});
  }

  function attributesOf(address _token, uint256 tokenId) external view override returns (string memory) {
    if (_token == address(badge)) {
      uint256 attributes = badge.attributesOf(tokenId, address(this), 0);
      if (attributes != 0) {
        return string(abi.encodePacked("uint8 level:", StringsUpgradeable.toString(uint8(attributes))));
      }
    }
    return "";
  }

  function _saveSignatureAsUsed(bytes memory _signature) internal {
    bytes32 key = keccak256(abi.encodePacked(_signature));
    require(_usedSignatures[key] == 0, "ByteCity: signature already used");
    _usedSignatures[key] = 1;
  }

  function hashBadgeAttributes(
    uint256 tokenId,
    IBadgeData.BadgeAttributes calldata attributes,
    uint256 randomNonce
  ) public view returns (bytes32) {
    return
      keccak256(
        abi.encodePacked(
          "\x19\x01", // EIP-191
          block.chainid,
          tokenId,
          attributes.level,
          randomNonce
        )
      );
  }
}
