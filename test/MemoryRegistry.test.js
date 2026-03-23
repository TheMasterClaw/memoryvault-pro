const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MemoryRegistry", function () {
  let MemoryRegistry;
  let MemoryAccessNFT;
  let registry;
  let nft;
  let owner;
  let user1;
  let user2;
  let addrs;

  beforeEach(async function () {
    // Get signers
    [owner, user1, user2, ...addrs] = await ethers.getSigners();

    // Deploy MemoryAccessNFT first (required for MemoryRegistry)
    const MemoryAccessNFTFactory = await ethers.getContractFactory("MemoryAccessNFT");
    nft = await MemoryAccessNFTFactory.deploy(
      "Memory Access Credential",
      "MAC",
      ethers.ZeroAddress // Will update after registry deployment
    );
    await nft.waitForDeployment();

    // Deploy MemoryRegistry
    const MemoryRegistryFactory = await ethers.getContractFactory("MemoryRegistry");
    registry = await MemoryRegistryFactory.deploy(await nft.getAddress());
    await registry.waitForDeployment();

    // Update MemoryRegistry address in NFT contract
    await nft.updateRegistry(await registry.getAddress());
  });

  describe("Deployment", function () {
    it("Should deploy with correct NFT contract address", async function () {
      expect(await registry.accessNFT()).to.equal(await nft.getAddress());
    });

    it("Should have NFT access enabled by default", async function () {
      expect(await registry.nftAccessEnabled()).to.equal(true);
    });

    it("Should set the right owner", async function () {
      expect(await registry.owner()).to.equal(await owner.getAddress());
    });
  });

  describe("Memory Storage", function () {
    it("Should store a memory entry", async function () {
      const participantId = ethers.encodeBytes32String("user1");
      const cid = "QmTestCID123";
      const encryptionKeyHash = ethers.ZeroHash;
      const expiration = 0;
      const isShard = false;
      const totalShards = 0;
      const shardCids = [];

      const tx = await registry.storeMemory(
        participantId,
        cid,
        encryptionKeyHash,
        expiration,
        isShard,
        totalShards,
        shardCids
      );
      
      const receipt = await tx.wait();
      expect(receipt.status).to.equal(1);
      
      // Verify event was emitted
      await expect(tx)
        .to.emit(registry, "MemoryStored")
        .withArgs(participantId, cid, await time.latest(), isShard);
    });

    it("Should reject empty CID", async function () {
      const participantId = ethers.encodeBytes32String("user1");
      
      await expect(
        registry.storeMemory(
          participantId,
          "",
          ethers.ZeroHash,
          0,
          false,
          0,
          []
        )
      ).to.be.revertedWith("Empty CID");
    });

    it("Should reject duplicate CID", async function () {
      const participantId = ethers.encodeBytes32String("user1");
      const cid = "QmTestCID123";

      await registry.storeMemory(
        participantId,
        cid,
        ethers.ZeroHash,
        0,
        false,
        0,
        []
      );

      await expect(
        registry.storeMemory(
          participantId,
          cid,
          ethers.ZeroHash,
          0,
          false,
          0,
          []
        )
      ).to.be.revertedWith("CID already exists");
    });

    it("Should track memory count correctly", async function () {
      const participantId = ethers.encodeBytes32String("user1");
      
      expect(await registry.getMemoryCount(participantId)).to.equal(0);

      await registry.storeMemory(
        participantId,
        "QmTest1",
        ethers.ZeroHash,
        0,
        false,
        0,
        []
      );

      expect(await registry.getMemoryCount(participantId)).to.equal(1);

      await registry.storeMemory(
        participantId,
        "QmTest2",
        ethers.ZeroHash,
        0,
        false,
        0,
        []
      );

      expect(await registry.getMemoryCount(participantId)).to.equal(2);
    });
  });

  describe("Memory Retrieval", function () {
    let participantId;
    let cid;

    beforeEach(async function () {
      participantId = ethers.encodeBytes32String("user1");
      cid = "QmTestCID123";

      await registry.storeMemory(
        participantId,
        cid,
        ethers.ZeroHash,
        0,
        false,
        0,
        []
      );
    });

    it("Should retrieve memory by owner", async function () {
      const memory = await registry.retrieveMemory(participantId, 0, participantId);
      
      expect(memory.cid).to.equal(cid);
      expect(memory.isShard).to.equal(false);
    });

    it("Should reject invalid memory ID", async function () {
      await expect(
        registry.retrieveMemory(participantId, 999, participantId)
      ).to.be.revertedWith("Invalid memory ID");
    });

    it("Should reject unauthorized access", async function () {
      const unauthorizedUser = ethers.encodeBytes32String("unauthorized");
      
      await expect(
        registry.retrieveMemory(participantId, 0, unauthorizedUser)
      ).to.be.reverted;
    });

    it("Should reject expired memories", async function () {
      const expiredParticipantId = ethers.encodeBytes32String("expiredUser");
      const expiredCid = "QmExpired";
      const expirationTime = Math.floor(Date.now() / 1000) - 1000; // Past time

      await registry.storeMemory(
        expiredParticipantId,
        expiredCid,
        ethers.ZeroHash,
        expirationTime,
        false,
        0,
        []
      );

      await expect(
        registry.retrieveMemory(expiredParticipantId, 0, expiredParticipantId)
      ).to.be.revertedWith("Memory expired");
    });
  });

  describe("Delegations", function () {
    let ownerId;
    let delegateId;

    beforeEach(async function () {
      ownerId = ethers.encodeBytes32String("owner");
      delegateId = ethers.encodeBytes32String("delegate");

      await registry.storeMemory(
        ownerId,
        "QmTest",
        ethers.ZeroHash,
        0,
        false,
        0,
        []
      );
    });

    it("Should grant delegation", async function () {
      const latestBlock = await ethers.provider.getBlock('latest');
      const expiration = latestBlock.timestamp + 86400; // 1 day from blockchain time

      await expect(registry.grantDelegation(ownerId, delegateId, expiration))
        .to.emit(registry, "DelegationGranted")
        .withArgs(ownerId, delegateId, expiration);
    });

    it("Should allow delegate to access memory", async function () {
      const latestBlock = await ethers.provider.getBlock('latest');
      const expiration = latestBlock.timestamp + 86400;
      await registry.grantDelegation(ownerId, delegateId, expiration);

      const memory = await registry.retrieveMemory(ownerId, 0, delegateId);
      expect(memory.cid).to.equal("QmTest");
    });

    it("Should reject expired delegations", async function () {
      const latestBlock = await ethers.provider.getBlock('latest');
      const expiration = latestBlock.timestamp + 86400;
      await registry.grantDelegation(ownerId, delegateId, expiration);

      // Fast forward time
      await network.provider.send("evm_increaseTime", [86500]);
      await network.provider.send("evm_mine");

      await expect(
        registry.retrieveMemory(ownerId, 0, delegateId)
      ).to.be.reverted;
    });

    it("Should revoke delegation", async function () {
      const latestBlock = await ethers.provider.getBlock('latest');
      const expiration = latestBlock.timestamp + 86400;
      await registry.grantDelegation(ownerId, delegateId, expiration);

      await expect(registry.revokeDelegation(ownerId, delegateId))
        .to.emit(registry, "DelegationRevoked")
        .withArgs(ownerId, delegateId);

      await expect(
        registry.retrieveMemory(ownerId, 0, delegateId)
      ).to.be.reverted;
    });
  });

  describe("Access Control", function () {
    it("Should allow owner to update NFT contract", async function () {
      const newNftAddress = await addrs[0].getAddress();
      
      await expect(registry.setAccessNFT(newNftAddress))
        .to.emit(registry, "NFTContractUpdated")
        .withArgs(newNftAddress);
    });

    it("Should allow owner to toggle NFT access", async function () {
      await expect(registry.setNFTAccessEnabled(false))
        .to.emit(registry, "NFTAccessToggled")
        .withArgs(false);

      expect(await registry.nftAccessEnabled()).to.equal(false);
    });

    it("Should reject non-owner from updating NFT contract", async function () {
      await expect(
        registry.connect(user1).setAccessNFT(await addrs[0].getAddress())
      ).to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount");
    });
  });

  describe("Get Memories", function () {
    it("Should return all memories for participant", async function () {
      const participantId = ethers.encodeBytes32String("user1");
      
      await registry.storeMemory(
        participantId,
        "QmTest1",
        ethers.ZeroHash,
        0,
        false,
        0,
        []
      );

      await registry.storeMemory(
        participantId,
        "QmTest2",
        ethers.ZeroHash,
        0,
        true,
        3,
        []
      );

      const memories = await registry.getMemories(participantId);
      
      expect(memories.length).to.equal(2);
      expect(memories[0].cid).to.equal("QmTest1");
      expect(memories[1].cid).to.equal("QmTest2");
      expect(memories[1].isShard).to.equal(true);
    });
  });
});

// Helper function for time
time = {
  latest: async () => {
    const block = await ethers.provider.getBlock('latest');
    return block.timestamp;
  }
};
