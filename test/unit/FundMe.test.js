const { deployments, ethers, getNamedAccounts, network } = require("hardhat")
const { assert, expect } = require("chai")
const {developmentChain } = require("../../helper-hardhat-config")

!developmentChain.includes(network.name) 
	? describe.skip 
	: describe("FundMe", async function () {
	
		let fundMe
		let deployer
		let mockV3Aggregator
		const sendValue =  ethers.parseEther("2") //2ETH
	
		beforeEach(async function () {
		
			deployer = (await getNamedAccounts()).deployer
			await deployments.fixture(["all"])
			fundMe = await ethers.getContract("FundMe", deployer)
			mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer)
	
		})
	
	
		describe("constructor", async function () {
			it("sets the aggregator addresses correctly", async function () {
				const response = await fundMe.getPriceFeed()
				console.log("response" + response)
				assert.equal(response, mockV3Aggregator.target)
			})
	
		})
	
	
		
	
		describe("fund", async function () {
			it("Fails if you don't send enough eth", async function () {
				expect(fundMe.fund({value: 0})).to.be.revertedWith("You need to spend more ETH!")
			})
			it("update the amount funded data structure", async function() {
				await fundMe.fund({value: sendValue })
				const response = await fundMe.getAddressToAmountFunded(deployer)
				assert.equal(response.toString(), sendValue.toString())
			})
			it("adds funder to array of funders", async function () {
				await fundMe.fund({value : sendValue})
				const funders = await fundMe.getFunder(0)
				assert.equal(funders, deployer)
			})
		})
	
		describe("withdraw", async function () {
			beforeEach(async function () {
				await fundMe.fund({value: sendValue})
			})
	
			it(" withdraw ETh from a single founder", async function () {
				//arrange
				const startingFundMeBalance = await ethers.provider.getBalance(fundMe.target)
				const startingDeployerBalance = await ethers.provider.getBalance(deployer)
	
				//act
				const transactionResponse = await fundMe.withdraw()
				const transactionReceipt = await transactionResponse.wait(1)
				const { gasUsed, gasPrice } = transactionReceipt
				const gasCost = gasUsed * gasPrice
	
				const endingFundMeBalance = await ethers.provider.getBalance(fundMe.target)
				const endingDeployerBalance = await ethers.provider.getBalance(deployer)
	
				//assert
				assert.equal(endingFundMeBalance,0)
				assert.equal(
					(startingFundMeBalance + startingDeployerBalance).toString(), 
					(endingDeployerBalance + gasCost).toString()
				)
			})
			it("allows us to withdraw with multiple funder", async function () {
				//Arrange
				const accounts = await ethers.getSigners()
				for(let i=1; i<6; i++) {
					const fundMeConnectedContract = await fundMe.connect( accounts[i])
					await fundMeConnectedContract.fund({value: sendValue})
				}
				const startingFundMeBalance = await ethers.provider.getBalance(fundMe.target)
				const startingDeployerBalance = await ethers.provider.getBalance(deployer)
	
				//act
				const transactionResponse = await fundMe.withdraw()
				const transactionReceipt = await transactionResponse.wait(1)
				const { gasUsed, gasPrice } = transactionReceipt
				const gasCost = gasUsed * gasPrice
	
				//Assert
				const endingFundMeBalance = await ethers.provider.getBalance(fundMe.target)
				const endingDeployerBalance = await ethers.provider.getBalance(deployer)
	
				assert.equal(endingFundMeBalance,0)
				assert.equal(
					(startingFundMeBalance + startingDeployerBalance).toString(), 
					(endingDeployerBalance + gasCost).toString()
				)
	
				//make sure that the funders are reset properly
				expect(fundMe.getFunder(0)).to.be.reverted
	
				for(let i=1; i<6; i++){
					assert.equal(await fundMe.getAddressToAmountFunded(accounts[i].address), 0)
				}
			})
	
			it("Only allows the owner to withdraw", async function() {
				const accounts = await ethers.getSigners()
				const attacker = accounts[1]
				const attackerConnectedContract = await fundMe.connect(attacker)
				expect(attackerConnectedContract.withdraw()).to.be.revertedWith("FundMe__NotOwner")
			})
	
			it("CheaperWithdraw testing...", async function () {
				//Arrange
				const accounts = await ethers.getSigners()
				for(let i=1; i<6; i++) {
					const fundMeConnectedContract = await fundMe.connect( accounts[i])
					await fundMeConnectedContract.fund({value: sendValue})
				}
				const startingFundMeBalance = await ethers.provider.getBalance(fundMe.target)
				const startingDeployerBalance = await ethers.provider.getBalance(deployer)
	
				//act
				const transactionResponse = await fundMe.cheaperWithdraw()
				const transactionReceipt = await transactionResponse.wait(1)
				const { gasUsed, gasPrice } = transactionReceipt
				const gasCost = gasUsed * gasPrice
	
				//Assert
				const endingFundMeBalance = await ethers.provider.getBalance(fundMe.target)
				const endingDeployerBalance = await ethers.provider.getBalance(deployer)
	
				assert.equal(endingFundMeBalance,0)
				assert.equal(
					(startingFundMeBalance + startingDeployerBalance).toString(), 
					(endingDeployerBalance + gasCost).toString()
				)
	
				//make sure that the funders are reset properly
				expect(fundMe.getFunder(0)).to.be.reverted
	
				for(let i=1; i<6; i++){
					assert.equal(await fundMe.getAddressToAmountFunded(accounts[i].address), 0)
				}
			})
	
		})
	
	})
