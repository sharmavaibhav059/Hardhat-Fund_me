const { network } = require("hardhat")
const {networkConfig, developmentChain} = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

function deployFunc() {
  console.log("HI")
}

//module.exports.default = deployFunc

//module.exports = async (hre) => {
//  const {getNamedAccounts, deployments} = hre
//}

module.exports = async ({getNamedAccounts, deployments}) => {
  const {deploy, log} = deployments
  const {deployer} = await getNamedAccounts()
  const chainId = network.config.chainId


  let ethUsdPriceFeedAddress
  if(developmentChain.includes(network.name)) {
    const ethUsdAggregator = await deployments.get("MockV3Aggregator")
    ethUsdPriceFeedAddress = ethUsdAggregator.address
  } else {
    ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
  }

  //const ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
  //if the contract doesn't exist, we depoly a minimal version of 
  //for our local testing
  
  const args =  [ethUsdPriceFeedAddress]
  const fundMe = await deploy("FundMe", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  }
  )
  if(!developmentChain.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    
    await verify(fundMe.address, args)

  }
  log("----------------------------------")
}

module.exports.tags = ["all", "fundme"]
