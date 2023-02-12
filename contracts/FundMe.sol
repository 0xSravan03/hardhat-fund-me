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

    address payable private immutable i_owner;

    AggregatorV3Interface private s_priceFeed;

    address[] private s_funders; // holds address of account who calls fund function.

    mapping(address => uint256) private s_addressToAmount;

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
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
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
        if (msg.value.getConversionRate(s_priceFeed) < MINIMUM_USD) {
            revert FundMe__NotEnoughMoneySent();
        }

        s_funders.push(msg.sender);
        s_addressToAmount[msg.sender] += msg.value; // mapping address to amount sent.
    }

    /**
     * @notice This function allow owner of the contract to withdraw funds
     */
    function withdraw() public onlyOwner {
        // resetting map

        /*
        This function cost more gas because everytime loop runs it read s_funders value,
        which is a storage variable. Read from storage required more gas. 
        */

        // for (uint256 i = 0; i < s_funders.length; i++) {
        //     s_addressToAmount[s_funders[i]] = 0;
        // }

        /*
        Here we are storing s_funders storage variable to a memory variable so that reading
        from storage is no longer required.
        below when for loop runs it take address from memory funders and reset mapping.
        Read from memory required less gas.
        note: Mapping can't be in memory
         */
        address[] memory funders = s_funders;

        for (uint256 i = 0; i < funders.length; i++) {
            s_addressToAmount[funders[i]] = 0;
        }

        // resetting array
        s_funders = new address[](0);

        // withdraw fund
        (bool callSuccess, ) = i_owner.call{value: address(this).balance}("");
        //require(callSuccess, "Failed");
        if (!callSuccess) {
            revert FundMe__TransferFailed();
        }
    }

    // These functions won't cost any gas because they are not modifying the state of the blockchain.
    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunder(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getAddressToAmountFunded(
        address funder
    ) public view returns (uint256) {
        return s_addressToAmount[funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}
