const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MemoryAccessNFT", function () {
  let MemoryAccessNFT;
  let nft;
  let owner;
  let user1;
  let user2;
  let addrs;
  let registryAddress;

  beforeEach(async function () {
    [owner, user1, user2, ...addrs] = await ethers.getSigners();
    registryAddress = await addrs[0].getAddress();

    const MemoryAccessNFTFactory = await ethers.getContractFactory("MemoryAccessNFT");
    nft = await MemoryAccessNFTFactory.deploy(
      "Memory Access Credential",
      "MAC",
      registryAddress
    );
    await nft.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right name and symbol", async function () {
      expect(await nft.name()).to.equal("Memory Access Credential");
      expect(await nft.symbol()).to.equal("MAC");
    });

    it("Should set the right owner", async function () {
      expect(await nft.owner()).to.equal(await owner.getAddress());
    });

    it("Should set the registry address", async function () {
      expect(await nft.memoryRegistry()).to.equal(registryAddress);
    });
  });

  describe("Credential Issuance", function () {
    it("Should issue a credential NFT", async function () {
      const recipient = await user1.getAddress();
      const targetParticipant = ethers.encodeBytes32String("target");
      const expiration = Math.floor(Date.now() / 1000) + 86400;
      const accessLevel = "read";
      const metadataURI = "";
      const revocable = true;

      const tx = await nft.issueCredential(
        recipient,
        targetParticipant,
        expiration,
        accessLevel,
        metadataURI,
        revocable
      );
      
      const receipt = await tx.wait();
      expect(receipt.status).to.equal(1);
      
      // Verify credential was issued to correct recipient
      expect(await nft.ownerOf(0)).to.equal(recipient);
    });

    it("Should reject empty access level", async function () {
      await expect(
        nft.issueCredential(
          await user1.getAddress(),
          ethers.encodeBytes32String("target"),
          0,
          "",
          "",
          true
        )
      ).to.be.revertedWith("Access level required");
    });

    it("Should reject invalid access level", async function () {
      await expect(
        nft.issueCredential(
          await user1.getAddress(),
          ethers.encodeBytes32String("target"),
          0,
          "invalid",
          "",
          true
        )
      ).to.be.revertedWith("Invalid access level");
    });

    it("Should increment token IDs", async function () {
      const recipient1 = await user1.getAddress();
      const recipient2 = await user2.getAddress();
      const targetParticipant = ethers.encodeBytes32String("target");

      await nft.issueCredential(recipient1, targetParticipant, 0, "read", "", true);
      await nft.issueCredential(recipient2, targetParticipant, 0, "write", "", true);

      expect(await nft.ownerOf(0)).to.equal(recipient1);
      expect(await nft.ownerOf(1)).to.equal(recipient2);
    });
  });

  describe("Access Levels", function () {
    beforeEach(async function () {
      const targetParticipant = ethers.encodeBytes32String("target");
      
      // Issue credentials with different access levels
      await nft.issueCredential(await user1.getAddress(), targetParticipant, 0, "read", "", true);
      await nft.issueCredential(await user2.getAddress(), targetParticipant, 0, "write", "", true);
      await nft.issueCredential(await addrs[0].getAddress(), targetParticipant, 0, "admin", "", true);
    });

    it("Should verify read access", async function () {
      const targetParticipant = ethers.encodeBytes32String("target");
      const hasAccess = await nft.hasAccess(await user1.getAddress(), targetParticipant, "read");
      expect(hasAccess).to.equal(true);
    });

    it("Should verify write access includes read", async function () {
      const targetParticipant = ethers.encodeBytes32String("target");
      
      // User2 has write access, should be able to read
      const hasReadAccess = await nft.hasAccess(await user2.getAddress(), targetParticipant, "read");
      expect(hasReadAccess).to.equal(true);

      const hasWriteAccess = await nft.hasAccess(await user2.getAddress(), targetParticipant, "write");
      expect(hasWriteAccess).to.equal(true);
    });

    it("Should verify admin access includes all levels", async function () {
      const targetParticipant = ethers.encodeBytes32String("target");
      const admin = await addrs[0].getAddress();

      expect(await nft.hasAccess(admin, targetParticipant, "read")).to.equal(true);
      expect(await nft.hasAccess(admin, targetParticipant, "write")).to.equal(true);
      expect(await nft.hasAccess(admin, targetParticipant, "admin")).to.equal(true);
    });

    it("Should deny access to users without credentials", async function () {
      const targetParticipant = ethers.encodeBytes32String("target");
      const noCredentialUser = await addrs[1].getAddress();

      const hasAccess = await nft.hasAccess(noCredentialUser, targetParticipant, "read");
      expect(hasAccess).to.equal(false);
    });

    it("Should deny read access when write is required", async function () {
      const targetParticipant = ethers.encodeBytes32String("target");
      
      // User1 has read access only
      const hasWriteAccess = await nft.hasAccess(await user1.getAddress(), targetParticipant, "write");
      expect(hasWriteAccess).to.equal(false);
    });
  });

  describe("Expiration", function () {
    it("Should reject expired credentials", async function () {
      const recipient = await user1.getAddress();
      const targetParticipant = ethers.encodeBytes32String("target");
      const expiration = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

      await nft.issueCredential(recipient, targetParticipant, expiration, "read", "", true);

      // Fast forward time
      await network.provider.send("evm_increaseTime", [7200]); // 2 hours
      await network.provider.send("evm_mine");

      const hasAccess = await nft.hasAccess(recipient, targetParticipant, "read");
      expect(hasAccess).to.equal(false);
    });

    it("Should accept non-expiring credentials (expiration = 0)", async function () {
      const recipient = await user1.getAddress();
      const targetParticipant = ethers.encodeBytes32String("target");

      await nft.issueCredential(recipient, targetParticipant, 0, "read", "", true);

      // Fast forward time significantly
      await network.provider.send("evm_increaseTime", [31536000]); // 1 year
      await network.provider.send("evm_mine");

      const hasAccess = await nft.hasAccess(recipient, targetParticipant, "read");
      expect(hasAccess).to.equal(true);
    });
  });

  describe("Revocation", function () {
    it("Should revoke a revocable credential", async function () {
      const recipient = await user1.getAddress();
      const targetParticipant = ethers.encodeBytes32String("target");

      await nft.issueCredential(recipient, targetParticipant, 0, "read", "", true);

      await expect(nft.revokeCredential(0, "Test revocation"))
        .to.emit(nft, "CredentialRevoked")
        .withArgs(0, targetParticipant, "Test revocation");

      await expect(nft.ownerOf(0)).to.be.reverted;
    });

    it("Should not revoke non-revocable credentials", async function () {
      const recipient = await user1.getAddress();
      const targetParticipant = ethers.encodeBytes32String("target");

      await nft.issueCredential(recipient, targetParticipant, 0, "read", "", false);

      await expect(nft.revokeCredential(0, "Should fail"))
        .to.be.revertedWith("Credential is not revocable");
    });

    it("Should only allow owner or issuer to revoke", async function () {
      const recipient = await user1.getAddress();
      const targetParticipant = ethers.encodeBytes32String("target");

      await nft.issueCredential(recipient, targetParticipant, 0, "read", "", true);

      // Random user should not be able to revoke
      await expect(
        nft.connect(user2).revokeCredential(0, "Unauthorized")
      ).to.be.revertedWith("Not authorized to revoke");
    });
  });

  describe("Batch Operations", function () {
    it("Should batch issue credentials", async function () {
      const recipients = [await user1.getAddress(), await user2.getAddress()];
      const targetParticipant = ethers.encodeBytes32String("target");

      await nft.batchIssueCredentials(
        recipients,
        targetParticipant,
        0,
        "read",
        true
      );

      expect(await nft.balanceOf(await user1.getAddress())).to.equal(1);
      expect(await nft.balanceOf(await user2.getAddress())).to.equal(1);
    });
  });

  describe("Query Functions", function () {
    beforeEach(async function () {
      const targetParticipant = ethers.encodeBytes32String("target");
      await nft.issueCredential(await user1.getAddress(), targetParticipant, 0, "read", "", true);
      await nft.issueCredential(await user1.getAddress(), targetParticipant, 0, "write", "", true);
    });

    it("Should get all credentials by owner", async function () {
      const [tokenIds, creds] = await nft.getCredentialsByOwner(await user1.getAddress());

      expect(tokenIds.length).to.equal(2);
      expect(creds.length).to.equal(2);
      expect(creds[0].accessLevel).to.equal("read");
      expect(creds[1].accessLevel).to.equal("write");
    });
  });

  describe("Registry Update", function () {
    it("Should allow owner to update registry address", async function () {
      const newRegistry = await addrs[1].getAddress();

      await expect(nft.updateRegistry(newRegistry))
        .to.emit(nft, "RegistryUpdated")
        .withArgs(newRegistry);

      expect(await nft.memoryRegistry()).to.equal(newRegistry);
    });

    it("Should reject non-owner from updating registry", async function () {
      await expect(
        nft.connect(user1).updateRegistry(await addrs[1].getAddress())
      ).to.be.revertedWithCustomError(nft, "OwnableUnauthorizedAccount");
    });
  });
});
