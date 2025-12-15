import React, { useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import App from './App';
import './index.css';

// Import wallet adapter styles
import '@solana/wallet-adapter-react-ui/styles.css';

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

    // Empty wallets array - let Standard Wallet detection handle all wallets automatically
    // This prevents duplicate wallet entries and warnings like:
    // "Phantom was registered as a Standard Wallet"
    const wallets = useMemo(() => [], []);

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
