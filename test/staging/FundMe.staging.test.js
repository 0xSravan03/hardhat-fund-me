const { assert } = require("chai")
const { ethers, getNamedAccounts, deployments, network } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", function () {
          let fundMe
          let deployer
          const sendValue = ethers.utils.parseEther("1")
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              fundMe = await ethers.getContract("FundMe", deployer) // here we are not deploying our contract (we assue it is already deployed and take it)
          })

          it("allow owner to fund and withdraw", async function () {
              await fundMe.fund({ value: sendValue })
              await fundMe.withdraw()
              const endingBalance = await ethers.provider.getBalance(
                  fundMe.address
              )
              assert.equal(endingBalance, "0")
          })
      })
