require("dotenv").config();
const hre = require("hardhat");
const ethers = hre.ethers;

const DeployUtils = require("./lib/DeployUtils");
const {expect} = require("chai");
let deployUtils;

const validator0 = "0x6dD5F7e5F830570b82e7e24343a588Bd834223E1";
const validator1 = "0xBf614820801BD289fb2eEA45400a5C7a1D30a6C3";

async function main() {
  deployUtils = new DeployUtils(ethers);

  const usdc = await deployUtils.attach("USDCoinMock");
  const usdt = await deployUtils.attach("TetherMock");

  const city = await deployUtils.deployProxy("ByteCity");
  await deployUtils.Tx(city.addStableCoin(1, usdt.address), "Setting Tether");
  await deployUtils.Tx(city.addStableCoin(2, usdc.address), "Setting USDC");

  await deployUtils.Tx(city.setValidator(0, validator0), "Set validator 0");
  await deployUtils.Tx(city.setValidator(1, validator1), "Set validator 1");

  const badge = await deployUtils.deployProxy("Badge", "ByteCity Badge", "BCB", "https://meta.mob.land/badges");

  await deployUtils.Tx(badge.setCity(city.address), "Setting City");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
