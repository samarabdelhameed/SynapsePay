import React, { useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import type { Adapter } from '@solana/wallet-adapter-base';
import App from './App';
import './index.css';

// Import wallet adapter styles
import '@solana/wallet-adapter-react-ui/styles.css';

// Extend Window interface for wallet detection
declare global {
    interface Window {
        phantom?: {
            solana?: {
                isPhantom?: boolean;
            };
        };
    }
}

// Wallet Context Provider Component
function WalletContextProvider({ children }: { children: React.ReactNode }) {
    // Configure network
    const network = (import.meta.env.VITE_SOLANA_NETWORK || 'devnet') as 'devnet' | 'mainnet-beta';
    const endpoint = useMemo(() => {
        // Try multiple RPC endpoints for better reliability
        const customRpc = import.meta.env.VITE_SOLANA_RPC_URL;
        if (customRpc) return customRpc;
        
        // Use alternative devnet endpoints for better performance
        if (network === 'devnet') {
            return 'https://devnet.helius-rpc.com/?api-key=demo';
        }
        
        return clusterApiUrl(network);
    }, [network]);

    // Configure wallets with proper error handling
    const wallets = useMemo(() => {
        const walletAdapters: Adapter[] = [];
        
        try {
            // Add Phantom wallet adapter
            walletAdapters.push(new PhantomWalletAdapter());
        } catch (error) {
            console.warn('Failed to initialize Phantom wallet:', error);
        }

        try {
            // Add Solflare wallet adapter
            walletAdapters.push(new SolflareWalletAdapter());
        } catch (error) {
            console.warn('Failed to initialize Solflare wallet:', error);
        }

        return walletAdapters;
    }, []);

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    {children}
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <BrowserRouter
            future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
            }}
        >
            <WalletContextProvider>
                <App />
            </WalletContextProvider>
        </BrowserRouter>
    </React.StrictMode>
);
