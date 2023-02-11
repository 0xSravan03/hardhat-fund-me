//SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "./PriceConverter.sol"; // Library

// custom errors
error FundMe__NotOwner();
error FundMe__NotEnoughMoneySent();
error FundMe__TransferFailed();

/**
 * @title Contract for Crowd Funding
 * @author Sravan
 * @notice This is a sample crowd funding contract
 * @dev This impements price feeds as library
 */
contract FundMe {
    using PriceConverter for uint256; // using library.(Type declarations)

    // State Variables
    uint256 public constant MINIMUM_USD = 50 * 1e18;

    address payable public immutable i_owner;

    AggregatorV3Interface public priceFeed;

    address[] public funders; // holds address of account who calls fund function.

    mapping(address => uint256) public addressToAmount;

    // only owner modifier
    modifier onlyOwner() {
        //require(msg.sender == i_owner, "Not Owner");
        if (msg.sender != i_owner) {
            revert FundMe__NotOwner();
        }
        _;
    }

    constructor(address priceFeedAddress) {
        i_owner = payable(msg.sender); // setting owner of the contract.
        priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    // these functions catch the eth which is sent not using fund function and redirect to fund function
    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }

    /**
     * @notice This function funds this contract
     */
    function fund() public payable {
        //require(msg.value.getConversionRate() >= MINIMUM_USD, "not enough money");
        if (msg.value.getConversionRate(priceFeed) < MINIMUM_USD) {
            revert FundMe__NotEnoughMoneySent();
        }

        funders.push(msg.sender);
        addressToAmount[msg.sender] += msg.value; // mapping address to amount sent.
    }

    /**
     * @notice This function allow owner of the contract to withdraw funds
     */
    function withdraw() public onlyOwner {
        // resetting map
        for (uint256 i = 0; i < funders.length; i++) {
            addressToAmount[funders[i]] = 0;
        }

        // resetting array
        funders = new address[](0);

        // withdraw fund
        (bool callSuccess, ) = i_owner.call{value: address(this).balance}("");
        //require(callSuccess, "Failed");
        if (!callSuccess) {
            revert FundMe__TransferFailed();
        }
    }
}
