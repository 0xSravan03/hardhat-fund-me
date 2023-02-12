const { getNamedAccounts, ethers } = require("hardhat")

async function main() {
    const { deployer } = await getNamedAccounts()
    const fundMe = await ethers.getContract("FundMe", deployer)
    const fundInContract = await ethers.provider.getBalance(fundMe.address)
    console.log(`Fund in Contract = ${fundInContract.toString()}`)
    console.log("Withdrawing.....")
    const transactionResponse = await fundMe.withdraw()
    const transactionReceipt = await transactionResponse.wait(1)
    console.log("Withdraw Completed...")
    const fundInContractAfterWithdraw = await ethers.provider.getBalance(
        fundMe.address
    )
    console.log(
        `Fund in Contract After Withdraw = ${fundInContractAfterWithdraw.toString()}`
    )
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error)
        process.exit(1)
    })
