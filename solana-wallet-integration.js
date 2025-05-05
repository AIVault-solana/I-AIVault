// solana-wallet-integration.js
// I-AIVault Solana wallet integration

// Main variables
let walletAddress = null;
let walletConnected = false;
let nftCollections = {
    main: "FnZF8hYakziPRJLNLVu6NSoXDQVgRUcX54yVLnZg1uyo" // NFT collection address
}; 
let membershipTiers = {
    silver: { name: "Silver Membership", price: 1, collectionAddress: "FnZF8hYakziPRJLNLVu6NSoXDQVgRUcX54yVLnZg1uyo" },
    gold: { name: "Gold Membership", price: 5, collectionAddress: "FnZF8hYakziPRJLNLVu6NSoXDQVgRUcX54yVLnZg1uyo" },
    platinum: { name: "Platinum Membership", price: 15, collectionAddress: "FnZF8hYakziPRJLNLVu6NSoXDQVgRUcX54yVLnZg1uyo" }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeWalletButtons();
    initializeModals();
    initializeNFTButtons();
    populateNFTGallery();
    checkWalletOnLoad();
});

// Initialize wallet buttons
function initializeWalletButtons() {
    // Add event listeners to all "Connect Wallet" buttons
    const walletButtons = [
        document.getElementById('connect-wallet-btn'),
        document.getElementById('connect-wallet-nav'),
        document.getElementById('cta-connect-wallet'),
        document.getElementById('check-access-btn')
    ];

    walletButtons.forEach(button => {
        if (button) {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                openWalletModal();
            });
        }
    });

    // Phantom wallet connection button
    const phantomButton = document.getElementById('connect-phantom');
    if (phantomButton) {
        phantomButton.addEventListener('click', () => connectPhantomWallet());
    }

    // Solflare wallet connection button
    const solflareButton = document.getElementById('connect-solflare');
    if (solflareButton) {
        solflareButton.addEventListener('click', () => connectSolflareWallet());
    }
}

// Initialize modals
function initializeModals() {
    // Wallet modal close button
    const closeWalletModal = document.getElementById('close-wallet-modal');
    if (closeWalletModal) {
        closeWalletModal.addEventListener('click', () => {
            document.getElementById('wallet-modal').classList.remove('active');
        });
    }

    // NFT modal close button
    const closeNftModal = document.getElementById('close-nft-modal');
    if (closeNftModal) {
        closeNftModal.addEventListener('click', () => {
            document.getElementById('nft-modal').classList.remove('active');
        });
    }

    // NFT purchase button
    const purchaseButton = document.getElementById('purchase-nft');
    if (purchaseButton) {
        purchaseButton.addEventListener('click', () => purchaseSelectedNFT());
    }
}

// Initialize NFT buttons
function initializeNFTButtons() {
    // Add event listeners to membership card "Purchase" buttons
    const nftButtons = document.querySelectorAll('.membership-card .btn');
    nftButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const tier = button.getAttribute('data-tier');
            const price = button.getAttribute('data-price');
            openNFTModal(tier, price);
        });
    });
}

// Open wallet modal
function openWalletModal() {
    const modal = document.getElementById('wallet-modal');
    if (modal) {
        modal.classList.add('active');
        updateWalletStatus();
    }
}

// Open NFT purchase modal
function openNFTModal(tier, price) {
    if (!walletConnected) {
        showNotification('Please connect your wallet first.', 'warning');
        openWalletModal();
        return;
    }

    const modal = document.getElementById('nft-modal');
    const tierSpan = document.getElementById('selected-tier');
    const priceSpan = document.getElementById('selected-price');

    if (modal && tierSpan && priceSpan) {
        tierSpan.textContent = membershipTiers[tier]?.name || tier;
        priceSpan.textContent = price;
        
        // Add data attributes to purchase button
        const purchaseButton = document.getElementById('purchase-nft');
        if (purchaseButton) {
            purchaseButton.setAttribute('data-tier', tier);
            purchaseButton.setAttribute('data-price', price);
        }
        
        modal.classList.add('active');
    }
}

// Connect Phantom wallet
async function connectPhantomWallet() {
    if (window.phantom?.solana) {
        try {
            const provider = window.phantom.solana;
            const response = await provider.connect();
            handleWalletConnection(response.publicKey.toString());
        } catch (error) {
            console.error("Phantom wallet connection error:", error);
            showNotification('Failed to connect wallet.', 'error');
        }
    } else {
        showNotification('Phantom wallet extension not installed. Please install it and try again.', 'warning');
        window.open('https://phantom.app/', '_blank');
    }
}

// Connect Solflare wallet
async function connectSolflareWallet() {
    if (window.solflare) {
        try {
            const provider = window.solflare;
            const response = await provider.connect();
            handleWalletConnection(response.publicKey.toString());
        } catch (error) {
            console.error("Solflare wallet connection error:", error);
            showNotification('Failed to connect wallet.', 'error');
        }
    } else {
        showNotification('Solflare wallet extension not installed. Please install it and try again.', 'warning');
        window.open('https://solflare.com/', '_blank');
    }
}

// Handle wallet connection
function handleWalletConnection(publicKey) {
    walletAddress = publicKey;
    walletConnected = true;
    
    // Save wallet address (session storage)
    sessionStorage.setItem('walletAddress', publicKey);
    
    // Update UI
    updateWalletStatus();
    
    // Close modal
    document.getElementById('wallet-modal').classList.remove('active');
    
    // Check for NFT ownership
    checkNFTOwnership();
    
    // Show notification
    showNotification('Wallet connected successfully.', 'success');
}

// Update wallet connection status
function updateWalletStatus() {
    const statusElement = document.getElementById('wallet-status');
    
    if (statusElement) {
        if (walletConnected && walletAddress) {
            statusElement.className = 'wallet-status wallet-connected';
            statusElement.innerHTML = `
                <p>Wallet connected</p>
                <p>Address: ${formatWalletAddress(walletAddress)}</p>
                <button class="btn" id="disconnect-wallet">Disconnect</button>
            `;
            
            // Add event listener to disconnect button
            const disconnectButton = document.getElementById('disconnect-wallet');
            if (disconnectButton) {
                disconnectButton.addEventListener('click', disconnectWallet);
            }
        } else {
            statusElement.className = 'wallet-status wallet-disconnected';
            statusElement.innerHTML = '<p>No wallet connected</p>';
        }
    }
    
    // Update members-only content
    updateMemberContent();
}

// Disconnect wallet
function disconnectWallet() {
    walletAddress = null;
    walletConnected = false;
    
    // Remove wallet address from session storage
    sessionStorage.removeItem('walletAddress');
    
    // Update UI
    updateWalletStatus();
    
    // Show notification
    showNotification('Wallet disconnected.', 'warning');
}

// Check wallet on page load
function checkWalletOnLoad() {
    const savedAddress = sessionStorage.getItem('walletAddress');
    
    if (savedAddress) {
        walletAddress = savedAddress;
        walletConnected = true;
        updateWalletStatus();
        checkNFTOwnership();
    }
}

// Check NFT ownership
async function checkNFTOwnership() {
    if (!walletConnected || !walletAddress) {
        return;
    }
    
    try {
        // Show loading notification
        showNotification('Checking NFT ownership...', 'info');
        
        // Check membership status via API
        const membershipStatus = await window.apiClient.checkMembershipStatus(walletAddress);
        
        if (membershipStatus.isMember && membershipStatus.tier) {
            // Update member status
            updateMemberStatus(membershipStatus.tier);
            
            // Display user's owned NFTs
            if (membershipStatus.nfts && membershipStatus.nfts.length > 0) {
                displayUserNFTs(membershipStatus.nfts);
            }
        } else {
            showNotification('You do not own any I-AIVault membership NFTs.', 'warning');
        }
    } catch (error) {
        console.error('NFT ownership check error:', error);
        showNotification('Error checking NFTs.', 'error');
    }
}

// Update member status
function updateMemberStatus(tier) {
    // Save current membership tier
    sessionStorage.setItem('memberTier', tier);
    
    // Update members-only content
    updateMemberContent();
    
    // Show notification
    showNotification(`You own a ${membershipTiers[tier]?.name || tier} NFT.`, 'success');
}

// Update members-only content
function updateMemberContent() {
    const lockedContent = document.getElementById('locked-content');
    const memberArea = document.getElementById('members-area');
    
    if (!lockedContent) return;
    
    if (walletConnected) {
        const memberTier = sessionStorage.getItem('memberTier');
        
        if (memberTier) {
            // Show tier-specific content
            lockedContent.innerHTML = getMemberContent(memberTier);
            
            // Highlight member menu item
            if (memberArea) {
                memberArea.style.color = 'var(--accent-color)';
            }
        }
    } else {
        // Restore default locked content
        lockedContent.innerHTML = `
            <div class="locked-icon">🔒</div>
            <h3>Access Restricted</h3>
            <p>You must own a membership NFT to view this content.</p>
            <p>Connect your wallet to verify access rights.</p>
            <a href="#" class="btn" id="check-access-btn">Check Access</a>
        `;
        
        // Add event listener to check access button
        const checkAccessBtn = document.getElementById('check-access-btn');
        if (checkAccessBtn) {
            checkAccessBtn.addEventListener('click', (e) => {
                e.preventDefault();
                openWalletModal();
            });
        }
        
        // Reset member menu item style
        if (memberArea) {
            memberArea.style.color = '';
        }
    }
}

// Get tier-specific member content
function getMemberContent(tier) {
    // Return different content based on tier
    switch(tier) {
        case 'platinum':
            return `
                <h3>Platinum Membership</h3>
                <p>Welcome, Platinum member! You have access to our highest tier benefits.</p>
                <div class="feature-card">
                    <h4>VIP Community Access</h4>
                    <p>Join our exclusive forum and real-time chat.</p>
                    <a href="#" class="btn">Enter</a>
                </div>
                <div class="feature-card">
                    <h4>1:1 Dedicated Consulting</h4>
                    <p>Schedule your personal investment consultation.</p>
                    <a href="#" class="btn">Book Now</a>
                </div>
            `;
        case 'gold':
            return `
                <h3>Gold Membership</h3>
                <p>Welcome, Gold member! You have access to premium benefits.</p>
                <div class="feature-card">
                    <h4>Premium Community Access</h4>
                    <p>Join our gold members-only forum.</p>
                    <a href="#" class="btn">Enter</a>
                </div>
                <div class="feature-card">
                    <h4>In-depth Investment Reports</h4>
                    <p>View weekly market analysis reports.</p>
                    <a href="#" class="btn">View</a>
                </div>
            `;
        case 'silver':
            return `
                <h3>Silver Membership</h3>
                <p>Welcome, Silver member! You have access to basic benefits.</p>
                <div class="feature-card">
                    <h4>Basic Community Access</h4>
                    <p>Join our silver members forum.</p>
                    <a href="#" class="btn">Enter</a>
                </div>
                <div class="feature-card">
                    <h4>Monthly Newsletter</h4>
                    <p>Check out our latest newsletter.</p>
                    <a href="#" class="btn">View</a>
                </div>
            `;
        default:
            return `
                <div class="locked-icon">⚠️</div>
                <h3>Membership Error</h3>
                <p>Unable to verify membership tier. Please try again.</p>
                <a href="#" class="btn" id="check-access-btn">Verify Again</a>
            `;
    }
}

// Populate NFT gallery
async function populateNFTGallery() {
    const nftDisplay = document.getElementById('nft-display');
    
    if (!nftDisplay) return;
    
    try {
        // Show loading message
        nftDisplay.innerHTML = '<div class="loading">Loading NFT data...</div>';
        
        // Get NFTs for sale from API
        const nftsForSale = await window.apiClient.getNFTsForSale();
        
        // Clear container
        nftDisplay.innerHTML = '';
        
        if (!nftsForSale || nftsForSale.length === 0) {
            nftDisplay.innerHTML = '<div class="no-nfts">No NFTs currently for sale.</div>';
            return;
        }
        
        // Create and add NFT cards
        nftsForSale.forEach(nft => {
            const nftCard = document.createElement('div');
            nftCard.className = 'nft-card';
            
            nftCard.innerHTML = `
                <img src="${nft.image}" alt="${nft.name}" class="nft-image">
                <div class="nft-info">
                    <h3>${nft.name}</h3>
                    <div class="nft-price">${nft.price} SOL</div>
                    <p class="nft-desc">${nft.description}</p>
                    <a href="#" class="btn" data-nft-id="${nft.id}" data-tier="${nft.tier}" data-price="${nft.price}">Purchase</a>
                </div>
            `;
            
            nftDisplay.appendChild(nftCard);
            
            // Add event listener to purchase button
            const buyButton = nftCard.querySelector('.btn');
            buyButton.addEventListener('click', (e) => {
                e.preventDefault();
                const nftId = buyButton.getAttribute('data-nft-id');
                const tier = buyButton.getAttribute('data-tier');
                const price = buyButton.getAttribute('data-price');
                openNFTModal(tier, price);
            });
        });
    } catch (error) {
        console.error('NFT gallery loading error:', error);
        nftDisplay.innerHTML = '<div class="error">Error loading NFT data.</div>';
    }
}

// Purchase selected NFT
async function purchaseSelectedNFT() {
    const purchaseButton = document.getElementById('purchase-nft');
    
    if (!purchaseButton) return;
    
    const tier = purchaseButton.getAttribute('data-tier');
    const price = parseFloat(purchaseButton.getAttribute('data-price'));
    
    if (!walletConnected) {
        showNotification('Please connect your wallet first.', 'warning');
        document.getElementById('nft-modal').classList.remove('active');
        openWalletModal();
        return;
    }
    
    // Update UI to show purchase in progress
    purchaseButton.textContent = 'Processing...';
    purchaseButton.disabled = true;
    
    try {
        // Get Solana wallet provider
        const provider = window.phantom?.solana || window.solflare;
        if (!provider) {
            throw new Error('No compatible Solana wallet found.');
        }
        
        showNotification('Creating transaction...', 'info');
        
        // Set up Solana connection
        const connection = new solanaWeb3.Connection(
            "https://api.mainnet-beta.solana.com",
            "confirmed"
        );
        
        // Treasury wallet address (collection address for now)
        const TREASURY_WALLET = "FnZF8hYakziPRJLNLVu6NSoXDQVgRUcX54yVLnZg1uyo";
        
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
        showNotification('Please confirm in your wallet...', 'info');
        const signedTransaction = await provider.signTransaction(transaction);
        
        // Send transaction
        showNotification('Sending transaction...', 'info');
        const signature = await connection.sendRawTransaction(signedTransaction.serialize());
        
        // Confirm transaction
        await connection.confirmTransaction(signature);
        
        console.log("Transaction successful:", signature);
        showNotification(`${price} SOL payment complete. Minting NFT...`, 'success');
        
        // Request NFT minting via API
        const result = await window.apiClient.purchaseNFT(walletAddress, tier, signature);
        
        // Success handler
        showNotification(`${membershipTiers[tier]?.name || tier} NFT purchased successfully!`, 'success');
        updateMemberStatus(tier);
        
        // Close modal
        document.getElementById('nft-modal').classList.remove('active');
        
        // Refresh NFT ownership check
        setTimeout(() => {
            checkNFTOwnership();
        }, 2000);
        
    } catch (error) {
        console.error("NFT purchase error:", error);
        showNotification('NFT purchase failed: ' + error.message, 'error');
    } finally {
        // Restore UI
        purchaseButton.textContent = 'Purchase';
        purchaseButton.disabled = false;
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    
    if (notification) {
        // Remove existing classes
        notification.className = 'notification';
        
        // Add type-specific class
        notification.classList.add(type);
        
        // Set message
        notification.textContent = message;
        
        // Show notification
        notification.classList.add('active');
        
        // Hide after 3 seconds
        setTimeout(() => {
            notification.classList.remove('active');
        }, 3000);
    }
}

// Format wallet address (first 4 + ... + last 4 characters)
function formatWalletAddress(address) {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

// Display user's owned NFTs
function displayUserNFTs(nfts) {
    // This function could be implemented to show user's NFTs in a separate section
    console.log("User's NFTs:", nfts);
}
