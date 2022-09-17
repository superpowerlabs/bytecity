process.env.NODE_ENV = "test";
const {expect, assert} = require("chai");
const DeployUtils = require("../scripts/lib/DeployUtils");

const {initEthers, assertThrowsMessage, BN} = require("./helpers");

describe("Badge", function () {
  let badge;
  let deployer, minter;
  let deployUtils = new DeployUtils(ethers);
  const addresses = [];

  before(async function () {
    initEthers(ethers);
    [deployer, minter] = await ethers.getSigners();
    for (let i = 0; i < 50; i++) {
      addresses.push(ethers.Wallet.createRandom().address);
    }
  });

  async function initAndDeploy(initSeedPool = true) {
    badge = await deployUtils.deployProxy("Badge", "ByteCity Badge", "BCB", "https://meta.mob.land/badges");
    await badge.setMinter(minter.address);
  }

  beforeEach(async function () {
    await initAndDeploy();
  });

  it("should mint 40 badges", async function () {
    for (let i = 0; i < 30; i++) {
      let addrs = addresses.slice(i, i + 30);
      await badge.connect(minter).batchMint(addrs);
    }
    for (let i = 0; i < addresses.length; i += 5) {
      expect(await badge.ownerOf(i + 1)).equal(addresses[i]);
    }
  });
});
