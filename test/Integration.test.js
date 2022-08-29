process.env.NODE_ENV = "test";
const {expect, assert} = require("chai");
const DeployUtils = require("../scripts/lib/DeployUtils");


const {
  initEthers,
    assertThrowsMessage,
  BN,
} = require("./helpers");

const {upgrades} = require("hardhat");

// tests to be fixed

function normalize(val, n = 18) {
  return "" + val + '0'.repeat(n);
}

describe("#Integration test", function () {
  let city;
  let usdc;
  let usdt;
  let deployer, validator, bob, alice, fred, treasury;
  let deployUtils = new DeployUtils(ethers);

  before(async function () {
    initEthers(ethers);
    [deployer, bob, alice, fred, validator, treasury] = await ethers.getSigners();
  });

  async function initAndDeploy(initSeedPool = true) {
    usdc = await deployUtils.deploy("USDCoinMock");
    usdt = await deployUtils.deploy("TetherMock");
    city = await deployUtils.deployProxy("ByteCity");

    await deployUtils.Tx(city.addStableCoin(1, usdt.address), "Setting tether")
    await deployUtils.Tx(city.addStableCoin(2, usdc.address), "Setting USDC");
  }

  beforeEach(async function () {
    await initAndDeploy();
  });

  it("should manage the full flow", async function () {
    const amount = ethers.utils.parseEther("10000");
    await usdc.approve(city.address, amount.mul(3));
    const id = 1846735;
    await city.deposit(2, amount, id);
    expect((await city.depositByIndex(deployer.address, 0)).id).equal(id)

    await expect(city.deposit(2, amount, id)).revertedWith("ByteCity: depositId already used")

    await usdt.approve(city.address, amount);
    const id2 = 2846735;
    await city.deposit(1, amount, id2);
    expect((await city.depositByIndex(deployer.address, 1)).id).equal(id2)
    expect((await city.depositById(id2))[0].id).equal(id2)
    expect((await city.depositById(id2))[1]).equal(deployer.address)

    expect((await city.depositById(3726354))[0].id).equal(0)

    expect(await city.numberOfDeposits(deployer.address)).equal(2)

    expect(await city.numberOfDeposits(fred.address)).equal(0)

  });
});
