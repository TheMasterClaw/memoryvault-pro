const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log('===============================================');
  console.log('🚀 Deploying MemoryVault Pro Contracts');
  console.log('===============================================');
  console.log('Deployer:', deployer.address);
  console.log('Network:', network.name);
  console.log('Chain ID:', (await ethers.provider.getNetwork()).chainId);
  console.log('Balance:', ethers.formatEther(await deployer.provider.getBalance(deployer.address)), 'ETH');
  console.log('');

  // Step 1: Deploy MemoryAccessNFT first (MemoryRegistry needs its address)
  console.log('📜 Step 1: Deploying MemoryAccessNFT...');
  const MemoryAccessNFT = await ethers.getContractFactory('MemoryAccessNFT');
  const memoryAccessNFT = await MemoryAccessNFT.deploy(
    'MemoryVault Access',  // name
    'MVAULT',              // symbol
    ethers.ZeroAddress     // memoryRegistry - will update after deploying registry
  );
  
  await memoryAccessNFT.waitForDeployment();
  const nftAddress = await memoryAccessNFT.getAddress();
  console.log('✅ MemoryAccessNFT deployed to:', nftAddress);
  console.log('   Transaction:', memoryAccessNFT.deploymentTransaction().hash);
  console.log('');

  // Step 2: Deploy MemoryRegistry with NFT address
  console.log('📜 Step 2: Deploying MemoryRegistry...');
  const MemoryRegistry = await ethers.getContractFactory('MemoryRegistry');
  const memoryRegistry = await MemoryRegistry.deploy(nftAddress);
  
  await memoryRegistry.waitForDeployment();
  const registryAddress = await memoryRegistry.getAddress();
  console.log('✅ MemoryRegistry deployed to:', registryAddress);
  console.log('   Transaction:', memoryRegistry.deploymentTransaction().hash);
  console.log('');

  // Step 3: Update MemoryAccessNFT with MemoryRegistry address
  console.log('📜 Step 3: Linking contracts...');
  const updateTx = await memoryAccessNFT.updateRegistry(registryAddress);
  await updateTx.wait();
  console.log('✅ MemoryAccessNFT linked to MemoryRegistry');
  console.log('');

  // Step 4: Verify on BaseScan (if API key provided)
  console.log('📜 Step 4: Contract Verification');
  console.log('Run these commands to verify on BaseScan:');
  console.log(`npx hardhat verify --network ${network.name} ${nftAddress} "MemoryVault Access" "MVAULT" ${registryAddress}`);
  console.log(`npx hardhat verify --network ${network.name} ${registryAddress} ${nftAddress}`);
  console.log('');

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      MemoryAccessNFT: {
        address: nftAddress,
        transactionHash: memoryAccessNFT.deploymentTransaction().hash,
        args: ['MemoryVault Access', 'MVAULT', ethers.ZeroAddress]
      },
      MemoryRegistry: {
        address: registryAddress,
        transactionHash: memoryRegistry.deploymentTransaction().hash,
        args: [nftAddress]
      }
    }
  };

  const deploymentPath = path.join(__dirname, '..', `deployment-${network.name}.json`);
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  
  // Also create/update .env with contract addresses
  const envPath = path.join(__dirname, '..', '.env');
  let envContent = fs.readFileSync(envPath, 'utf8');
  envContent = envContent.replace(/MEMORY_REGISTRY_ADDRESS=.*/, `MEMORY_REGISTRY_ADDRESS=${registryAddress}`);
  envContent = envContent.replace(/NFT_CONTRACT_ADDRESS=.*/, `NFT_CONTRACT_ADDRESS=${nftAddress}`);
  fs.writeFileSync(envPath, envContent);

  console.log('===============================================');
  console.log('✨ Deployment Complete!');
  console.log('===============================================');
  console.log('MemoryAccessNFT:', nftAddress);
  console.log('MemoryRegistry:', registryAddress);
  console.log('Deployment info saved to:', deploymentPath);
  console.log('.env file updated with contract addresses');
  console.log('');

  return deploymentInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  });