// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

interface IUser {
  event USDDeposited(address user, uint8 tokenType, uint128 amount, uint64 depositId);

  struct USDDeposit {
    uint64 id;
    uint8 tokenType;
    uint128 amount;
    uint32 createdAt;
    // 7 bytes available for more data
  }

  struct User {
    mapping(uint8 => uint128) amounts;
    USDDeposit[] deposits;
  }

  struct DepositInfo {
    address user;
    uint16 index;
  }
}
