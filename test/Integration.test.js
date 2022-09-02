process.env.NODE_ENV = "test";
const {expect, assert} = require("chai");
const DeployUtils = require("../scripts/lib/DeployUtils");

const {initEthers, assertThrowsMessage, signPackedData, randomNonce, BN} = require("./helpers");

const {upgrades} = require("hardhat");

// tests to be fixed

function normalize(val, n = 18) {
  return "" + val + "0".repeat(n);
}

describe("#Integration test", function () {
  let city;
  let usdc;
  let usdt;
  let badge;
  let deployer, validator0, validator1, bob, alice, fred, treasury;
  let deployUtils = new DeployUtils(ethers);

  let validator0PK = "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a";
  let validator1PK = "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba";

  before(async function () {
    initEthers(ethers);
    [deployer, bob, alice, fred, validator0, validator1, treasury] = await ethers.getSigners();
  });

  async function initAndDeploy(initSeedPool = true) {
    usdc = await deployUtils.deploy("USDCoinMock");
    usdt = await deployUtils.deploy("TetherMock");
    city = await deployUtils.deployProxy("ByteCity");
    await deployUtils.Tx(city.addStableCoin(1, usdt.address), "Setting tether");
    await deployUtils.Tx(city.addStableCoin(2, usdc.address), "Setting USDC");

    badge = await deployUtils.deployProxy("Badge", "ByteCity Badge", "BCB", "https://meta.mob.land/byte-city-badges");
    await deployUtils.Tx(badge.setCity(city.address), "Setting City");
    await deployUtils.Tx(badge.setMinter(deployer.address), "Setting minter");

    expect(await city.setValidator(0, validator0.address))
      .emit(city, "ValidatorSet")
      .withArgs(0, validator0.address);
    expect(await city.setValidator(1, validator1.address))
      .emit(city, "ValidatorSet")
      .withArgs(1, validator1.address);
  }

  beforeEach(async function () {
    await initAndDeploy();
  });

  it("should manage the full flow", async function () {
    const amount = ethers.utils.parseEther("10000");
    await usdc.approve(city.address, amount.mul(3));
    const id = 1846735;
    await city.deposit(2, amount, id);
    expect((await city.depositByIndex(deployer.address, 0)).id).equal(id);

    await expect(city.deposit(2, amount, id)).revertedWith("ByteCity: depositId already used");

    await usdt.approve(city.address, amount);
    const id2 = 2846735;
    await city.deposit(1, amount, id2);
    expect((await city.depositByIndex(deployer.address, 1)).id).equal(id2);
    expect((await city.depositById(id2))[0].id).equal(id2);
    expect((await city.depositById(id2))[1]).equal(deployer.address);

    expect((await city.depositById(3726354))[0].id).equal(0);

    expect(await city.numberOfDeposits(deployer.address)).equal(2);

    expect(await city.numberOfDeposits(fred.address)).equal(0);
  });

  it("should mint badges and verify them", async function () {
    await badge.batchMint([bob.address, alice.address, fred.address]);
    expect(await badge.balanceOf(bob.address)).equal(1);
    expect(await badge.balanceOf(alice.address)).equal(1);
    expect(await badge.balanceOf(fred.address)).equal(1);
    expect(await badge.ownerOf(1)).equal(bob.address);
    expect(await badge.ownerOf(2)).equal(alice.address);
    expect(await badge.ownerOf(3)).equal(fred.address);

    expect(await badge.ownedBy(bob.address)).equal(1);
    expect(await badge.ownedBy(alice.address)).equal(2);
    expect(await badge.ownedBy(fred.address)).equal(3);

    expect(badge.connect(bob).transferFrom(bob.address, treasury.address, 1)).revertedWith("Badge: forbidden");

    await badge.batchMint([bob.address]);
    expect(await badge.balanceOf(bob.address)).equal(1);

    let nonce = randomNonce();
    const attributes = {
      level: 2,
    };
    let hash = await city.hashBadgeAttributes(1, attributes, nonce);
    let signature0 = signPackedData(hash, validator0PK);
    let signature1 = signPackedData(hash, validator1PK);

    expect(await city.setBadge(badge.address))
      .emit(city, "BadgeSet")
      .withArgs(badge.address);

    expect(await city.updateBadgeAttributes(1, attributes, nonce, signature0, signature1))
      .emit(badge, "AttributesUpdated")
      .withArgs(1);

    expect(await badge.attributesOf(1, city.address, 0)).equal(2);

    expect(await city.attributesOf(badge.address, 1)).equal("uint8 level:2");
  });
});
