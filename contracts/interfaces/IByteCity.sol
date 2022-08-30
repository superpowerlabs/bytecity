// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "./IUser.sol";
import "./IBadgeData.sol";

interface IByteCity is IUser {
  event StableCoinAdded(uint8 tokenType, address stableCoin);
  event BadgeSet(address badge);

  function setBadge(address badge_) external;

  function addStableCoin(uint8 tokenType, address stableCoin) external;

  function deposit(
    uint8 tokenType,
    uint256 amount,
    uint64 depositId
  ) external;

  // To just check if a deposit exists, check something like
  // depositByIndex(user, index).tokenType != 0
  function depositByIndex(address user, uint256 index) external view returns (USDDeposit memory);

  function totalDepositedAmount(address user, uint8 tokenType) external view returns (uint128);

  function numberOfDeposits(address user) external view returns (uint256);

  // To just check if the deposit exists, check something like
  // depositById(depositId).tokenType != 0
  function depositById(uint64 depositId) external view returns (USDDeposit memory, address user);

  function withdrawUSD(
    uint8 tokenType,
    uint256 amount,
    address beneficiary
  ) external;

  function updateBadgeAttributes(
    uint256 tokenId,
    IBadgeData.BadgeAttributes calldata attributes,
    uint256 randomNonce,
    bytes calldata signature0,
    bytes calldata signature1
  ) external;

  function getBadgeAttributes(uint256 tokenId) external view returns (IBadgeData.BadgeAttributes memory);

  function attributesOf(address _token, uint256 tokenId) external view returns (string memory);
}
