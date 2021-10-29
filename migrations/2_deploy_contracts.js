const bid = artifacts.require("../contracts/bid.sol");

module.exports = function (deployer) {
  deployer.deploy(bid);
};