const {assert, expect} = require("chai");
const ethers = require("ethers");

const Helpers = {
  initEthers(ethers0) {
    this.ethers = ethers0;
  },

  async assertThrowsMessage(promise, message) {
    const notThrew = "It did not throw";
    try {
      await promise;
      throw new Error(notThrew);
    } catch (e) {
      const isTrue = e.message.indexOf(message) > -1;
      if (!isTrue) {
        console.error("Expected:", message);
        console.error("Received:", e.message);
        if (e.message !== notThrew) {
          console.error();
          console.error(e);
        }
      }
      assert.isTrue(isTrue);
    }
  },

  async getTimestamp() {
    return (await this.ethers.provider.getBlock()).timestamp;
  },

  async increaseBlockTimestampBy(offset) {
    await this.ethers.provider.send("evm_increaseTime", [offset]);
    await this.ethers.provider.send("evm_mine");
  },


  BN(s, zeros = 0) {
    return ethers.BigNumber.from((s || 0).toString() + "0".repeat(zeros));
  },

  async sleep(millis) {
    // eslint-disable-next-line no-undef
    return new Promise((resolve) => setTimeout(resolve, millis));
  },

  expectEqualAsEther(a, b) {
    a = ethers.utils.formatEther(a.toString()).split(".")[0];
    b = ethers.utils.formatEther(b.toString()).split(".")[0];
    expect(a).equal(b);
  },

  getInt(val) {
    return parseInt(ethers.utils.formatEther(val.toString()));
  },

  randomNonce() {
    return Math.random().toString().split(".")[1];
  },

  async signPackedData(
      hash,
      // hardhat account #4, starting from #0
      privateKey = "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a"
  ) {
    const signingKey = new this.ethers.utils.SigningKey(privateKey);
    const signedDigest = signingKey.signDigest(hash);
    return this.ethers.utils.joinSignature(signedDigest);
  },

};

module.exports = Helpers;
