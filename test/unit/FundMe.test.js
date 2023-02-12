const { deployments, getNamedAccounts, ethers, network } = require("hardhat")
const { assert, expect } = require("chai")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", function () {
          let fundMe
          let mockV3Aggregator
          let deployer
          const sendValue = ethers.utils.parseEther("1") // 1000000000000000000 wei

          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              fundMe = await ethers.getContract("FundMe", deployer)
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
          })

          describe("constructor", function () {
              it("sets the aggregator addresses correctly", async function () {
                  const response = await fundMe.getPriceFeed()
                  assert.equal(response, mockV3Aggregator.address)
              })

              it("deployer and owner address must be same", async function () {
                  const owner = await fundMe.getOwner()
                  assert.equal(deployer, owner)
              })
          })

          describe("fund", function () {
              it("Should fail if don't send enough ETH", async function () {
                  await expect(fundMe.fund()).to.be.reverted
              })

              it("should update amount funded data structure", async function () {
                  await fundMe.fund({ value: sendValue }) // funding contract
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  )
                  assert.equal(response.toString(), sendValue.toString())
              })

              it("add funders to array of funders", async function () {
                  await fundMe.fund({ value: sendValue })
                  const funderAddress = await fundMe.getFunder(0)
                  assert.equal(funderAddress, deployer)
              })
          })

          describe("withdraw", function () {
              beforeEach(async function () {
                  await fundMe.fund({ value: ethers.utils.parseEther("2") })
              })

              it("Owner should able to withdraw ETH from a single funder", async function () {
                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMe.address)

                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer)

                  const tx = await fundMe.withdraw() // cost gas from deployer
                  const txReceipt = await tx.wait(1)

                  const endingFundMeBalance = await ethers.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer)

                  const { gasUsed, effectiveGasPrice } = txReceipt
                  // gasCost = gasUsed * effectiveGasPrice ()
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  assert.equal(endingFundMeBalance, "0")
                  assert.equal(
                      startingDeployerBalance
                          .add(startingFundMeBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  )
              })

              it("allow owner to withdraw fund if there are multiple funders", async function () {
                  const accounts = await ethers.getSigners() // hardhat helper function that retrive accounts

                  for (let i = 1; i <= 5; i++) {
                      const newContractInstance = await fundMe.connect(
                          accounts[i]
                      ) // connecting each account with fundMe contract
                      await newContractInstance.fund({
                          value: ethers.utils.parseEther(i.toString()),
                      }) // funding contract
                  }

                  const startingFundMeBalance =
                      await ethers.provider.getBalance(fundMe.address)

                  const startingDeployerBalance =
                      await ethers.provider.getBalance(deployer)

                  const tx = await fundMe.withdraw()
                  const txReceipt = await tx.wait(1)

                  const endingFundMeBalance = await ethers.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await ethers.provider.getBalance(deployer)

                  const { gasUsed, effectiveGasPrice } = txReceipt
                  // gasCost = gasUsed * effectiveGasPrice ()
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  assert.equal(endingFundMeBalance, "0")
                  assert.equal(
                      startingDeployerBalance
                          .add(startingFundMeBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  )

                  await expect(fundMe.getFunder(0)).to.be.reverted // checking if the funders array is resetted after withdrawing amount

                  // checking if all funded address is mapping to 0 after withdrawal
                  for (let i = 0; i <= 5; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })

              it("only allow the owner to withdraw amount", async function () {
                  const [, unknownUser] = await ethers.getSigners() // taking second account from hardhat n/w because first account is our deployer
                  const contractInstance = await fundMe.connect(unknownUser) // connecting account to contract

                  await expect(
                      contractInstance.withdraw()
                  ).to.be.to.be.revertedWithCustomError(
                      contractInstance,
                      "FundMe__NotOwner"
                  ) // reverting with custom error
              })
          })
      })
