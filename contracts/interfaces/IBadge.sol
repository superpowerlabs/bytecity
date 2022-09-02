// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

// Author: Francesco Sullo <francesco@superpower.io>

import "@ndujalabs/attributable/contracts/IAttributable.sol";

interface IBadge is IAttributable {
  event CitySet(address city);
  event MinterSet(address minter);
  event TokenURIFrozen();
  event TokenURIUpdated(string uri);

  function setCity(address city_) external;

  function setMinter(address minter_) external;

  function updateTokenURI(string memory uri) external;

  function freezeTokenURI() external;

  function contractURI() external view returns (string memory);

  function nextTokenId() external view returns (uint256);

  function batchMint(address[] memory to) external;

  function ownedBy(address owner) external view returns (uint256);
}
