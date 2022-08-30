// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

// Author: Francesco Sullo <francesco@superpower.io>
// (c) Superpower Labs Inc.

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "soliutils/contracts/UUPSUpgradableTemplate.sol";

import "../interfaces/IBadge.sol";

//import "hardhat/console.sol";

contract Badge is IBadge, Initializable, ERC721Upgradeable, OwnableUpgradeable, UUPSUpgradableTemplate {
  using AddressUpgradeable for address;

  string private _baseTokenURI;
  bool private _baseTokenURIFrozen;
  uint256 private _nextTokenId;

  address public city;
  address public minter;

  mapping(uint256 => mapping(address => mapping(uint256 => uint256))) internal _tokenAttributes;

  modifier onlyCity() {
    require(city != address(0) && _msgSender() == city, "Badge: not the city");
    _;
  }

  modifier onlyMinter() {
    require(minter != address(0) && _msgSender() == minter, "Badge: forbidden");
    _;
  }

  modifier tokenExists(uint256 id) {
    require(_exists(id), "Badge: token does not exist");
    _;
  }

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() initializer {}

  function initialize(
    string memory name,
    string memory symbol,
    string memory tokenUri
  ) public initializer {
    __ERC721_init(name, symbol);
    __Ownable_init();
    _baseTokenURI = tokenUri;
    _nextTokenId = 1;
  }

  function _authorizeUpgrade(address newImplementation) internal override onlyOwner {
    emit ImplementationUpgraded(newImplementation);
  }

  function attributesOf(
    uint256 _id,
    address _player,
    uint256 _index
  ) external view override returns (uint256) {
    return _tokenAttributes[_id][_player][_index];
  }

  function initializeAttributesFor(uint256, address) external override {
    // we allow only the city to use the badge
    revert("Badge: only city is authorized on this badge");
  }

  function updateAttributes(
    uint256 _id,
    uint256 _index,
    uint256 _attributes
  ) external override {
    require(_tokenAttributes[_id][_msgSender()][0] != 0, "Badge: player not authorized");
    // notice that if the playes set the attributes to zero, it de-authorize itself
    // and not more changes will be allowed until the NFT owner authorize it again
    _tokenAttributes[_id][_msgSender()][_index] = _attributes;
  }

  function supportsInterface(bytes4 interfaceId) public view override(ERC721Upgradeable) returns (bool) {
    return super.supportsInterface(interfaceId);
  }

  function _baseURI() internal view virtual override returns (string memory) {
    return _baseTokenURI;
  }

  function updateTokenURI(string memory uri) external override onlyOwner {
    require(!_baseTokenURIFrozen, "Badge: baseTokenUri has been frozen");
    // after revealing, this allows to set up a final uri
    _baseTokenURI = uri;
    emit TokenURIUpdated(uri);
  }

  function freezeTokenURI() external override onlyOwner {
    _baseTokenURIFrozen = true;
    emit TokenURIFrozen();
  }

  function contractURI() public view override returns (string memory) {
    return string(abi.encodePacked(_baseTokenURI, "0"));
  }

  function setCity(address city_) external virtual override onlyOwner {
    require(city_.isContract(), "Badge: city_ not a contract");
    city = city_;
    emit CitySet(city_);
  }

  function setMinter(address minter_) external virtual override onlyOwner {
    require(minter_ != address(0), "Badge: minter_ cannot be zeroAddress");
    minter = minter_;
    emit MinterSet(minter_);
  }

  function nextTokenId() external view override returns (uint256) {
    return _nextTokenId;
  }

  function batchMint(address[] memory to) external override onlyMinter {
    for (uint256 i = 0; i < to.length; i++) {
      // we allow only 1 badge for user
      if (this.balanceOf(to[i]) == 0) {
        _safeMint(to[i], _nextTokenId);
        // initialize the on-chain attributes
        _tokenAttributes[_nextTokenId][city][0] = 1;
        emit AttributesInitializedFor(_nextTokenId++, city);
      }
    }
  }

  // manage not transferability

  function approve(address, uint256) public override {
    revert("Badge: cannot be approved");
  }

  function setApprovalForAll(address, bool) public override {
    revert("Badge: cannot be approved");
  }

  function getApproved(uint256) public view override returns (address) {
    return address(0);
  }

  function isApprovedForAll(address, address) public view override returns (bool) {
    return false;
  }

  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 tokenId
  )
    internal
    override(ERC721Upgradeable)
    // only minter can make the initial transfer from address0
    onlyMinter
  {
    super._beforeTokenTransfer(from, to, tokenId);
  }
}
