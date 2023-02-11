const { deployments, getNamedAccounts, ethers, network } = require("hardhat")
const { assert, expect } = require("chai")

describe("FundMe", function () {
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
            const response = await fundMe.priceFeed()
            assert.equal(response, mockV3Aggregator.address)
        })

        it("deployer and owner address must be same", async function () {
            const owner = await fundMe.i_owner()
            assert.equal(deployer, owner)
        })
    })

    describe("fund", function () {
        it("Should fail if don't send enough ETH", async function () {
            await expect(fundMe.fund()).to.be.reverted
        })

        it("should update amount funded data structure", async function () {
            await fundMe.fund({ value: sendValue }) // funding contract
            const response = await fundMe.addressToAmount(deployer)
            assert.equal(response.toString(), sendValue.toString())
        })

        it("add funders to array of funders", async function () {
            await fundMe.fund({ value: sendValue })
            const funderAddress = await fundMe.funders(0)
            assert.equal(funderAddress, deployer)
        })
    })
})
