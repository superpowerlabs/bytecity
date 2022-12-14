// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

// Authors: Francesco Sullo <francesco@sullo.co>

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract Signable is Initializable, OwnableUpgradeable {
  using AddressUpgradeable for address;
  using ECDSAUpgradeable for bytes32;

  event ValidatorSet(uint256 id, address validator);

  mapping(uint256 => address) public validators;

  // solhint-disable-next-line
  function __Signable_init() internal initializer {
    __Ownable_init();
  }

  function setValidator(uint256 id, address validator) external onlyOwner {
    require(validator != address(0), "Signable: address zero not allowed");
    validators[id] = validator;
    emit ValidatorSet(id, validator);
  }

  /** @dev how to use it:
    require(
      isSignedByValidator(0, encodeForSignature(to, tokenType, lockedFrom, lockedUntil, mainIndex, tokenAmountOrID), signature),
      "WormholeBridge: invalid signature"
    );
  */

  // this is called internally and externally by the web3 app to test a validation
  function isSignedByValidator(
    uint256 id,
    bytes32 hash,
    bytes memory signature
  ) public view returns (bool) {
    return validators[id] != address(0) && validators[id] == hash.recover(signature);
  }
}
