require("dotenv").config();
const hre = require("hardhat");
const ethers = hre.ethers;

const DeployUtils = require("./lib/DeployUtils");
let deployUtils;

async function main() {
  deployUtils = new DeployUtils(ethers);
  const [deployer] = await ethers.getSigners();
  const usdc = await deployUtils.attach("USDCoinMock");
  const usdt = await deployUtils.attach("TetherMock");
  const city = await deployUtils.deployProxy("ByteCity");

  await deployUtils.Tx(city.addStableCoin(1, usdt.address), "Setting tether")
  await deployUtils.Tx(city.addStableCoin(2, usdc.address), "Setting USDC");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
