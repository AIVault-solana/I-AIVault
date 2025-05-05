// api-client.js
// I-AIVault 백엔드 API와 통신하는 클라이언트 모듈

// API 기본 URL
const API_BASE_URL = 'http://localhost:3000/api'; // 개발 환경
// const API_BASE_URL = 'https://api.i-aivault.com/api'; // 프로덕션 환경

// 기본 Fetch 옵션
const defaultOptions = {
    headers: {
        'Content-Type': 'application/json'
    }
};

/**
 * API 요청 래퍼 함수
 * @param {string} endpoint - API 엔드포인트
 * @param {Object} options - fetch 옵션
 * @returns {Promise<any>} - API 응답
 */
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const fetchOptions = { ...defaultOptions, ...options };
    
    try {
        const response = await fetch(url, fetchOptions);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Unknown error occurred.');
        }
        
        return data;
    } catch (error) {
        console.error(`API Request Error (${endpoint}):`, error);
        throw error;
    }
}

// API 모듈 내보내기
window.apiClient = {
    // NFT 컬렉션 정보 조회
    getCollectionInfo: async function() {
        return apiRequest('/collection');
    },
    
    // 판매 중인 NFT 목록 조회
    getNFTsForSale: async function() {
        const response = await apiRequest('/nfts/for-sale');
        return response.nfts;
    },
    
    // 사용자 소유 NFT 목록 조회
    getUserNFTs: async function(walletAddress) {
        if (!walletAddress) {
            throw new Error('Wallet address required.');
        }
        
        const response = await apiRequest(`/nfts/user/${walletAddress}`);
        return response.nfts;
    },
    
    // 멤버십 상태 확인
    checkMembershipStatus: async function(walletAddress) {
        if (!walletAddress) {
            return { 
                isMember: false, 
                tier: null 
            };
        }
        
        try {
            const nfts = await this.getUserNFTs(walletAddress);
            
            if (!nfts || nfts.length === 0) {
                return { 
                    isMember: false, 
                    tier: null 
                };
            }
            
            // 가장 높은 등급의 NFT 찾기
            const tierValues = { silver: 1, gold: 2, platinum: 3 };
            let highestTier = 'silver';
            
            nfts.forEach(nft => {
                const nftTier = nft.tier?.toLowerCase();
                if (nftTier && tierValues[nftTier] > tierValues[highestTier]) {
                    highestTier = nftTier;
                }
            });
            
            return {
                isMember: true,
                tier: highestTier,
                nfts: nfts
            };
        } catch (error) {
            console.error('Membership status check error:', error);
            return { 
                isMember: false, 
                tier: null,
                error: error.message
            };
        }
    },
    
    // NFT 구매 요청
    purchaseNFT: async function(walletAddress, tier, transactionSignature) {
        if (!walletAddress || !tier || !transactionSignature) {
            throw new Error('Missing required information.');
        }
        
        return apiRequest('/nfts/purchase', {
            method: 'POST',
            body: JSON.stringify({
                walletAddress,
                tier,
                transactionSignature
            })
        });
    }
};
