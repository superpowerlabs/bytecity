const {expect, assert} = require("chai");

const {
  initEthers,
  BN,
} = require("./helpers");

const {upgrades} = require("hardhat");

// tests to be fixed

function normalize(val, n = 18) {
  return "" + val + '0'.repeat(n);
}

describe("#Integration test", function () {
  let ByteCity, byteCity;
  let USDC, usdc;
  let USDT, usdt;
  let deployer, validator, bob, alice, fred, treasury;

  before(async function () {
    initEthers(ethers);
    [deployer, bob, alice, fred, validator, treasury] = await ethers.getSigners();
    ByteCity = await ethers.getContractFactory("ByteCity");
    USDT = await ethers.getContractFactory("TetherMock");
    USDC = await ethers.getContractFactory("USDCoinMock");
  });

  async function initAndDeploy(initSeedPool = true) {

  }

  beforeEach(async function () {
    await initAndDeploy();
  });

  it("should manage the full flow", async function () {
    const amount = ethers.utils.parseEther("10000");

  });
});
