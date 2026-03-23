
    # ==================== NFT ACCESS CREDENTIALS ====================
    
    def mint_access_nft(
        self,
        recipient_address: str,
        access_level: str = "read",
        expiration_days: Optional[int] = None,
        revocable: bool = True,
        metadata_uri: str = ""
    ) -> int:
        """
        Mint an NFT access credential for another agent/human
        
        This creates an NFT that grants the holder access to your memories.
        The recipient can use this NFT to retrieve your encrypted memories.
        
        Args:
            recipient_address: Ethereum address to receive the NFT
            access_level: "read", "write", or "admin"
            expiration_days: How long access lasts (None = forever)
            revocable: Whether you can revoke this credential later
            metadata_uri: Custom metadata URI for the NFT
            
        Returns:
            token_id: The ID of the minted NFT
            
        Example:
            # Grant read access for 30 days
            token_id = client.mint_access_nft(
                recipient_address="0x1234...",
                access_level="read",
                expiration_days=30
            )
            
            # Grant admin access forever (non-revocable)
            token_id = client.mint_access_nft(
                recipient_address="0x5678...",
                access_level="admin",
                revocable=False
            )
        """
        # Calculate expiration timestamp
        expiration = 0
        if expiration_days:
            expiration = int((datetime.now() + timedelta(days=expiration_days)).timestamp())
        
        # Validate access level
        if access_level not in ["read", "write", "admin"]:
            raise ValueError("access_level must be 'read', 'write', or 'admin'")
        
        # TODO: Call MemoryAccessNFT.issueCredential()
        # This would use web3.py to interact with the contract
        
        print(f"Minting NFT access credential:")
        print(f"  Recipient: {recipient_address}")
        print(f"  Access Level: {access_level}")
        print(f"  Expiration: {expiration_days if expiration_days else 'never'}")
        print(f"  Revocable: {revocable}")
        
        # Placeholder - return mock token ID
        return 1
    
    def batch_mint_access_nfts(
        self,
        recipient_addresses: List[str],
        access_level: str = "read",
        expiration_days: Optional[int] = None,
        revocable: bool = True
    ) -> List[int]:
        """
        Mint multiple NFT access credentials at once
        
        Useful for granting access to a team or group of agents.
        
        Args:
            recipient_addresses: List of Ethereum addresses
            access_level: Access level for all credentials
            expiration_days: Expiration for all credentials
            revocable: Whether credentials are revocable
            
        Returns:
            token_ids: List of minted NFT IDs
        """
        token_ids = []
        for address in recipient_addresses:
            token_id = self.mint_access_nft(
                recipient_address=address,
                access_level=access_level,
                expiration_days=expiration_days,
                revocable=revocable
            )
            token_ids.append(token_id)
        return token_ids
    
    def revoke_access_nft(self, token_id: int, reason: str = "") -> bool:
        """
        Revoke an NFT access credential
        
        Only works if the credential was minted with revocable=True.
        This burns the NFT and removes access.
        
        Args:
            token_id: ID of the NFT to revoke
            reason: Reason for revocation (logged on-chain)
            
        Returns:
            True if successfully revoked
        """
        # TODO: Call MemoryAccessNFT.revokeCredential()
        print(f"Revoking NFT credential #{token_id}")
        print(f"Reason: {reason}")
        return True
    
    def renew_access_nft(self, token_id: int, new_expiration_days: int) -> bool:
        """
        Extend the expiration of an NFT access credential
        
        Args:
            token_id: ID of the NFT to renew
            new_expiration_days: New expiration from now
            
        Returns:
            True if successfully renewed
        """
        new_expiration = int((datetime.now() + timedelta(days=new_expiration_days)).timestamp())
        # TODO: Call MemoryAccessNFT.renewCredential()
        print(f"Renewing NFT credential #{token_id}")
        print(f"New expiration: {new_expiration_days} days from now")
        return True
    
    def check_nft_access(
        self,
        holder_address: str,
        required_level: str = "read"
    ) -> bool:
        """
        Check if an address has valid NFT-based access to your memories
        
        Args:
            holder_address: Address to check
            required_level: Minimum access level required
            
        Returns:
            True if holder has valid access NFT
        """
        # TODO: Call MemoryAccessNFT.hasAccess()
        print(f"Checking NFT access for {holder_address}")
        print(f"Required level: {required_level}")
        return True  # Placeholder
    
    def list_my_credentials(self) -> List[Dict[str, Any]]:
        """
        List all NFT access credentials you hold (access granted to you)
        
        Returns:
            List of credential details including:
            - token_id
            - target_participant (whose memories you can access)
            - access_level
            - expiration
            - issuer
        """
        # TODO: Query NFT contract for tokens owned by this address
        return []
    
    def list_issued_credentials(self) -> List[Dict[str, Any]]:
        """
        List all NFT access credentials you've issued to others
        
        Returns:
            List of credential details for NFTs you've minted
        """
        # TODO: Query events from NFT contract
        return []
    
    def get_credential_details(self, token_id: int) -> Dict[str, Any]:
        """
        Get details about a specific access credential NFT
        
        Args:
            token_id: NFT token ID
            
        Returns:
            Credential details including access level, expiration, etc.
        """
        # TODO: Call MemoryAccessNFT.credentials(token_id)
        return {
            "token_id": token_id,
            "target_participant": self.participant_id,
            "access_level": "read",
            "expiration": 0,
            "revocable": True,
            "issued_at": int(datetime.now().timestamp())
        }
    
    def transfer_credential(self, token_id: int, to_address: str) -> bool:
        """
        Transfer an NFT access credential to another address
        
        WARNING: This gives the recipient the same access you had.
        Only transfer to trusted parties.
        
        Args:
            token_id: NFT to transfer
            to_address: Recipient address
            
        Returns:
            True if transfer successful
        """
        # TODO: Call NFT contract transfer function
        print(f"Transferring NFT #{token_id} to {to_address}")
        print("WARNING: Recipient will have access to the target's memories!")
        return True


# Example usage with NFT features
if __name__ == "__main__":
    # Initialize client
    client = MemoryVaultClient(
        api_key="sk-synth-...",
        participant_id="b6a33669...",
        tee_endpoint="https://venice.tee/memoryvault",
        nft_contract_address="0x..."
    )
    
    # Store a memory
    cid = client.store_memory(
        data="Learned about ERC-8004 identity binding today",
        expiration_days=365,
        distribute=True,
        shard_count=3
    )
    print(f"Memory stored: {cid}")
    
    # Grant NFT access to another agent
    token_id = client.mint_access_nft(
        recipient_address="0x1234567890abcdef...",
        access_level="read",
        expiration_days=30,
        revocable=True
    )
    print(f"Access NFT minted: #{token_id}")
    
    # Batch grant access to a team
    team_addresses = [
        "0xaaa...",
        "0xbbb...",
        "0xccc..."
    ]
    token_ids = client.batch_mint_access_nfts(
        recipient_addresses=team_addresses,
        access_level="write",
        expiration_days=90
    )
    print(f"Team access granted: {token_ids}")
    
    # List credentials you hold
    my_creds = client.list_my_credentials()
    print(f"You have access to {len(my_creds)} agents' memories")
    
    # List credentials you've issued
    issued = client.list_issued_credentials()
    print(f"You've issued {len(issued)} access credentials")
