const hre = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Get the fee recipient address from environment variables
  const feeRecipient = process.env.FEE_RECIPIENT_ADDRESS;
  if (!feeRecipient) {
    console.error("FEE_RECIPIENT_ADDRESS not set in .env file");
    process.exit(1);
  }

  // Deploy the JarSystem contract
  const JarSystem = await hre.ethers.getContractFactory("JarSystem");
  const jarSystem = await JarSystem.deploy(feeRecipient);

  await jarSystem.deploymentTransaction().wait();

  console.log("JarSystem deployed to:", jarSystem.target);
  console.log("Network:", hre.network.name);

  // Wait for a few block confirmations, then verify
  console.log("Waiting for block confirmations...");
  await new Promise((resolve) => setTimeout(resolve, 30000)); // 30 seconds delay

  // Verify contract on Etherscan
  console.log("Verifying contract on block explorer...");
  try {
    await hre.run("verify:verify", {
      address: jarSystem.target,
      constructorArguments: [feeRecipient],
    });
    console.log("Contract verified successfully");
  } catch (error) {
    console.error("Error verifying contract:", error);
  }

  return jarSystem.target;
}

main()
  .then((deployedAddress) => {
    console.log("Deployment completed. Contract address:", deployedAddress);
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });