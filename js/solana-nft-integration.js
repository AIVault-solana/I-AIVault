// solana-nft-integration.js
// I-AIVault NFT integration and verification code 
// Using Solana Web3.js for NFT ownership verification and transactions

// Note: Make sure to include Solana Web3.js library in HTML
// <script src="https://cdnjs.cloudflare.com/ajax/libs/solana-web3.js/1.73.0/index.min.js"></script>

// Solana connection setup
const solanaConnection = new solanaWeb3.Connection(
    "https://api.mainnet-beta.solana.com", // Mainnet (use https://api.testnet.solana.com for testnet)
    "confirmed" // Commitment level
);

// Collection and NFT information
const NFT_COLLECTION_ADDRESS = "FnZF8hYakziPRJLNLVu6NSoXDQVgRUcX54yVLnZg1uyo"; // User-provided address
const TREASURY_WALLET = ""; // Payment receiving wallet address (to be set)

// NFT ownership verification function
async function checkNFTOwnership(walletAddress) {
    if (!walletAddress) {
        console.error("No wallet address provided");
        return null;
    }

    try {
        console.log(`Checking NFT ownership for address: ${walletAddress}`);
        
        // Create Solana public key
        const publicKey = new solanaWeb3.PublicKey(walletAddress);
        
        // Get user's token accounts
        const tokenAccounts = await solanaConnection.getParsedTokenAccountsByOwner(
            publicKey,
            { programId: new solanaWeb3.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA") }
        );
        
        // Check for NFT ownership and tier
        let highestTier = null;
        let tierValues = { silver: 1, gold: 2, platinum: 3 };
        
        for (const account of tokenAccounts.value) {
            const tokenInfo = account.account.data.parsed.info;
            const mint = tokenInfo.mint;
            const amount = tokenInfo.tokenAmount.uiAmount;
            
            // Only check tokens with amount > 0 (NFTs typically have amount 1)
            if (amount > 0) {
                // Here you would query metadata to determine NFT's tier
                // With Metaplex SDK in a real implementation
                
                // Test code - replace with actual implementation
                let tier = await checkNFTMetadataForTier(mint);
                
                // Keep track of highest tier NFT
                if (tier && (!highestTier || tierValues[tier] > tierValues[highestTier])) {
                    highestTier = tier;
                }
            }
        }
        
        return highestTier;
    } catch (error) {
        console.error("Error checking NFT ownership:", error);
        return null;
    }
}

// Check NFT metadata for tier (test implementation - replace with actual)
async function checkNFTMetadataForTier(mintAddress) {
    try {
        // In a real implementation, you would use Metaplex SDK to query metadata
        
        // Test implementation - return random tier
        const tiers = ['silver', 'gold', 'platinum'];
        const randomIndex = Math.floor(Math.random() * 3);
        return tiers[randomIndex];
    } catch (error) {
        console.error("Error checking metadata:", error);
        return null;
    }
}

// NFT purchase function
async function purchaseNFT(tier, price) {
    if (!walletConnected || !walletAddress) {
        showNotification('Please connect your wallet first.', 'warning');
        return false;
    }
    
    if (!TREASURY_WALLET) {
        showNotification('Treasury wallet not configured.', 'error');
        return false;
    }
    
    try {
        console.log(`Processing ${tier} membership NFT purchase... Price: ${price} SOL`);
        
        // Check for Solana wallet provider
        const provider = window.phantom?.solana || window.solflare;
        if (!provider) {
            showNotification('No compatible Solana wallet found.', 'error');
            return false;
        }
        
        // Create transaction (SOL transfer)
        const connection = new solanaWeb3.Connection(
            "https://api.mainnet-beta.solana.com",
            "confirmed"
        );
        
        const fromPubkey = new solanaWeb3.PublicKey(walletAddress);
        const toPubkey = new solanaWeb3.PublicKey(TREASURY_WALLET);
        
        // Convert SOL to lamports (1 SOL = 10^9 lamports)
        const lamports = price * 1000000000;
        
        // Create transaction
        const transaction = new solanaWeb3.Transaction().add(
            solanaWeb3.SystemProgram.transfer({
                fromPubkey,
                toPubkey,
                lamports
            })
        );
        
        // Get recent blockhash
        const { blockhash } = await connection.getRecentBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = fromPubkey;
        
        // Request signature
        const signedTransaction = await provider.signTransaction(transaction);
        
        // Send transaction
        const signature = await connection.sendRawTransaction(signedTransaction.serialize());
        
        // Confirm transaction
        await connection.confirmTransaction(signature);
        
        console.log("Transaction successful:", signature);
        showNotification(`${price} SOL payment complete. Minting NFT...`, 'success');
        
        // Request NFT minting (would call backend API)
        const mintResult = await requestNFTMinting(walletAddress, tier);
        
        if (mintResult) {
            showNotification(`${membershipTiers[tier].name} NFT successfully minted!`, 'success');
            updateMemberStatus(tier);
            return true;
        } else {
            showNotification('NFT minting failed. Please contact support.', 'error');
            return false;
        }
    } catch (error) {
        console.error("NFT purchase error:", error);
        showNotification('Transaction failed: ' + error.message, 'error');
        return false;
    }
}

// NFT minting request function (would call backend API)
async function requestNFTMinting(walletAddress, tier) {
    // In real implementation, would call backend API to mint NFT
    
    // Test implementation - always succeed
    return new Promise(resolve => {
        setTimeout(() => resolve(true), 2000);
    });
}

// Get NFT collection info
async function fetchNFTCollectionInfo() {
    try {
        // In real implementation, would query collection metadata
        
        // Test implementation
        return {
            name: "I-AIVault Membership",
            symbol: "IAIV",
            description: "I-AIVault platform membership NFT collection providing tiered benefits.",
            image: "/api/placeholder/400/400",
            external_url: "https://i-aivault.com",
            total_supply: 1000
        };
    } catch (error) {
        console.error("Error fetching collection info:", error);
        return null;
    }
}

// Get NFTs for sale
async function fetchNFTsForSale() {
    try {
        // In real implementation, would call API or query available NFTs
        
        // Test implementation
        return [
            { 
                id: "nft1",
                name: "I-AIVault Silver Membership #001", 
                tier: "silver", 
                price: 1, 
                image: "/api/placeholder/280/280", 
                description: "Silver tier membership NFT providing basic community access." 
            },
            { 
                id: "nft2",
                name: "I-AIVault Gold Membership #001", 
                tier: "gold", 
                price: 5, 
                image: "/api/placeholder/280/280", 
                description: "Gold tier membership NFT providing premium benefits and special perks." 
            },
            { 
                id: "nft3",
                name: "I-AIVault Platinum Membership #001", 
                tier: "platinum", 
                price: 15, 
                image: "/api/placeholder/280/280", 
                description: "Platinum tier membership NFT providing VIP benefits and exclusive content." 
            }
        ];
    } catch (error) {
        console.error("Error fetching NFTs for sale:", error);
        return [];
    }
}

// Get user owned NFTs
async function fetchUserNFTs(walletAddress) {
    if (!walletAddress) {
        return [];
    }
    
    try {
        // In real implementation, would query user's NFTs
        
        // Test implementation
        return [
            { 
                id: "owned1",
                name: "I-AIVault Gold Membership #042", 
                tier: "gold", 
                image: "/api/placeholder/280/280", 
                description: "Gold tier membership NFT providing premium benefits and special perks." 
            }
        ];
    } catch (error) {
        console.error("Error fetching user NFTs:", error);
        return [];
    }
}

// Initialize NFT displays
async function initializeNFTDisplays() {
    // Load and display NFTs for sale
    const nftsForSale = await fetchNFTsForSale();
    populateNFTGallery(nftsForSale);
    
    // Load and display collection info
    const collectionInfo = await fetchNFTCollectionInfo();
    updateCollectionInfo(collectionInfo);
    
    // If wallet connected, load user NFTs
    if (walletConnected && walletAddress) {
        const userNFTs = await fetchUserNFTs(walletAddress);
        displayUserNFTs(userNFTs);
    }
}

// Update collection info
function updateCollectionInfo(collectionInfo) {
    // Update UI with collection info
    console.log("Collection info:", collectionInfo);
}

// Export functions
window.solanaIntegration = {
    checkNFTOwnership,
    purchaseNFT,
    fetchNFTCollectionInfo,
    fetchNFTsForSale,
    fetchUserNFTs,
    initializeNFTDisplays
};
