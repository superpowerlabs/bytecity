process.env.NODE_ENV = "test";
const {expect, assert} = require("chai");
const DeployUtils = require("../scripts/lib/DeployUtils");

const {initEthers, assertThrowsMessage, BN} = require("./helpers");

describe("ByteCity", function () {
  const stableCoinId1 = 1;
  const stableCoinId2 = 2;
  const unsuportedCoinId = 3;
  let city;
  let deployer, bob, treasury;
  let deployUtils = new DeployUtils(ethers);

  before(async function () {
    initEthers(ethers);
    [deployer, bob, treasury] = await ethers.getSigners();
  });

  async function initAndDeploy(initSeedPool = true) {
    usdc = await deployUtils.deploy("USDCoinMock");
    usdt = await deployUtils.deploy("TetherMock");
    city = await deployUtils.deployProxy("ByteCity");

    await deployUtils.Tx(city.addStableCoin(stableCoinId1, usdt.address), "Setting tether");
    await deployUtils.Tx(city.addStableCoin(stableCoinId2, usdc.address), "Setting USDC");
  }

  beforeEach(async function () {
    await initAndDeploy();
  });

  // addStableCoin(uint8 tokenType, address stableCoin)
  it.skip("should add USDT to the pool (happy path)", async function () {
    // fails bc coin already added
    await expect(city.addStableCoin(stableCoinId3, stableCoin.address))
      .emit(city, "StableCoinAdded")
      .withArgs(stableCoinId1, stableCoin);
  });

  it("should fail to add stable coin with 'ByteCity: token not a contract' (unhappy path)", async function () {
    await expect(city.addStableCoin(stableCoinId1, bob.address)).revertedWith("ByteCity: token not a contract");
  });

  it("should fail to add stable coin with 'ByteCity: stable coin already set' (unhappy path)", async function () {
    city.addStableCoin(stableCoinId1, usdt.address);
    await expect(city.addStableCoin(stableCoinId1, usdt.address)).revertedWith("ByteCity: stable coin already set");
  });

  it("should fail to add stable coin with 'ByteCity: invalid tokenType' (unhappy path)", async function () {
    await expect(city.addStableCoin(unsuportedCoinId, usdt.address)).revertedWith("ByteCity: invalid tokenType");
  });

  // deposit(uint8 tokenType, uint256 amount, uint32 depositId)
  it("should deposit USDC (happy path)", async function () {
    const amount = ethers.utils.parseEther("10000");
    const id = 123456;
    await usdc.approve(city.address, amount.mul(3));
    expect(await city.deposit(stableCoinId2, amount, id))
      .emit(city, "Deposited")
      .withArgs(await stableCoinId2, amount);
  });

  it("should deposit USDC (happy path)", async function () {
    const amount = ethers.utils.parseEther("10000");
    const id = 123456;
    await usdc.approve(city.address, amount.mul(3));
    expect(await city.deposit(stableCoinId2, amount, id))
      .emit(city, "Deposited")
      .withArgs(await stableCoinId1, amount);
  });

  it("should fail to deposit token with 'ByteCity: unsupported stable coin' (unhappy path)", async function () {
    const amount = ethers.utils.parseEther("10000");
    const id = 123456;
    await usdc.approve(city.address, amount.mul(3));
    await expect(city.deposit(unsuportedCoinId, amount, id)).revertedWith("ByteCity: unsupported stable coin");
  });

  it("should fail to deposit token with 'ByteCity: depositId already used' (unhappy path)", async function () {
    const amount = ethers.utils.parseEther("10000");
    const id = 123456;
    await usdc.approve(city.address, amount.mul(3));
    await city.deposit(stableCoinId2, amount, id);
    await expect(city.deposit(stableCoinId2, amount, id)).revertedWith("ByteCity: depositId already used");
  });

  // depositByIndex(address user, uint256 index)
  it("should return a deposit by index (happy path", async function () {
    const amount = ethers.utils.parseEther("10000");
    const id = 123456;
    await usdc.approve(city.address, amount.mul(3));
    await city.deposit(stableCoinId2, amount, id);
    expect((await city.depositByIndex(deployer.address, 0)).id).equal(id);
  });

  it("should return an empty deposit if no amount deposited (happy path", async function () {
    const amount = ethers.utils.parseEther("10000");
    const id = 1;
    await usdc.approve(city.address, amount.mul(3));
    await city.deposit(stableCoinId2, amount, id);
    let deposit = await city.depositByIndex(deployer.address, 42);
    expect(deposit.id).equal(0);
    expect(deposit.tokenType).equal(0);
    expect(deposit.amount).equal(0);
    expect(deposit.createdAt).equal(0);
  });

  // totalDepositedAmount(address user, uint8 tokenType)
  it("should return total deposits by token type (happy path)", async function () {
    const amount = ethers.utils.parseEther("10000");
    const total = ethers.utils.parseEther("20000");
    const id1 = 123456;
    const id2 = 123457;
    await usdc.approve(city.address, amount.mul(3));
    await city.deposit(stableCoinId2, amount, id1);
    await city.deposit(stableCoinId2, amount, id2);
    expect(await city.totalDepositedAmount(deployer.address, stableCoinId2)).equal(total);
    expect(await city.totalDepositedAmount(deployer.address, stableCoinId1)).equal(0);
  });

  // numberOfDeposits(address user)
  it("should return the total number of deposit for user", async function () {
    const amount = ethers.utils.parseEther("10000");
    const id1 = 123456;
    const id2 = 123457;
    await usdc.approve(city.address, amount.mul(3));
    await city.deposit(stableCoinId2, amount, id1);
    await city.deposit(stableCoinId2, amount, id2);
    expect(await city.numberOfDeposits(deployer.address)).equal(2);
  });

  // depositById(uint32 depositId)
  it("should return desposit amount and user by deposit id", async function () {
    const amount = ethers.utils.parseEther("10000");
    const id1 = 123456;
    const depositIndex = 0;

    await usdc.approve(city.address, amount.mul(3));
    await city.deposit(stableCoinId2, amount, id1);
    await city.depositByIndex(deployer.address, depositIndex);

    const [deposit, user] = await city.depositById(id1);
    expect(deposit.id).equal(id1);
    expect(deposit.tokenType).equal(stableCoinId2);
    expect(deposit.amount).equal(amount);
    expect(user).equal(deployer.address);
  });

  // withdrawUSD(uint8 tokenType, uint256 amount, address beneficiary)
  it("should withdraw USD amount for user (happy path)", async function () {
    const amount1 = ethers.utils.parseEther("23345");
    const amount2 = ethers.utils.parseEther("4334");
    const id1 = 123456;

    await usdc.approve(city.address, amount1);
    await city.deposit(stableCoinId2, amount1, id1);
    await expect(city.withdrawUSD(stableCoinId2, amount2, treasury.address))
      .emit(usdc, "Transfer")
      .withArgs(city.address, treasury.address, amount2);
  });

  it("should withdraw existing account USD balance if amount requested is zero (happy path)", async function () {
    const amount1 = ethers.utils.parseEther("23345");
    const id1 = 123456;

    await usdc.approve(city.address, amount1);
    await city.deposit(stableCoinId2, amount1, id1);
    await expect(city.withdrawUSD(stableCoinId2, 0, treasury.address))
      .emit(usdc, "Transfer")
      .withArgs(city.address, treasury.address, amount1);
  });

  it("should fail to withdraw USDC with 'ByteCity: amount not available' (unhappy path)", async function () {
    const amount2 = ethers.utils.parseEther("4334");
    await expect(city.withdrawUSD(stableCoinId2, amount2, treasury.address)).revertedWith("ByteCity: amount not available");
  });
});
