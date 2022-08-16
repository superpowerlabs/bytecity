require("dotenv").config();
const hre = require("hardhat");
const ethers = hre.ethers;

const DeployUtils = require("./lib/DeployUtils");
let deployUtils;

async function main() {
  deployUtils = new DeployUtils(ethers);
  const [deployer] = await ethers.getSigners();
  const usdc = await deployUtils.deploy("USDCoinMock");
  const usdt = await deployUtils.deploy("TetherMock");
  const city = await deployUtils.deployProxy("ByteCity");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
