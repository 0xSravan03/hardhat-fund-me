# Hardhat Fund Me

<p>This project allow people to fund the contract and only the owner of the contract can withdraw the funds.<p>


# Getting Started

## Requirements

- [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- [Nodejs](https://nodejs.org/en/)
- [yarn](https://yarnpkg.com/getting-started/install) or `npm`

## Quickstart

```
git clone https://github.com/sravantp03/hardhat-fund-me
cd hardhat-fund-me
yarn
```

# Usage

Deploy:

```
yarn hardhat deploy
```

Deploy to Goerli Testnet(configure network details in .env file): 

```
yarn hardhat deploy --network goerli
```


## Testing

```
yarn hardhat test
```

### Test Coverage

```
yarn hardhat coverage
```

## Scripts

After deploy to a testnet or local net, you can run the scripts. 

```
yarn hardhat run scripts/fund.js
```

or
```
yarn hardhat run scripts/withdraw.js
```

## Estimate gas

You can estimate how much gas things cost by running:

```
yarn hardhat test
```

And you'll see and output file called `gas-report.txt`
