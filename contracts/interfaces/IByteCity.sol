// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "./IUser.sol";

interface IByteCity is IUser {
  function addStableCoin(uint8 tokenType, address stableCoin) external;

  function deposit(
    uint8 tokenType,
    uint128 amount,
    uint32 depositId
  ) external;

  // To just check if a deposit exists, check something like
  // depositByIndex(user, index).tokenType != 0
  function depositByIndex(address user, uint256 index) external view returns (USDDeposit memory);

  function totalDepositedAmount(address user, uint8 tokenType) external view returns (uint128);

  function depositsAmount(address user) external view returns (uint256);

  // To just check if the deposit exists, check something like
  // depositById(depositId).tokenType != 0
  function depositById(uint32 depositId) external view returns (USDDeposit memory);

  function withdrawUSD(
    uint8 tokenType,
    uint256 amount,
    address beneficiary
  ) external;
}
