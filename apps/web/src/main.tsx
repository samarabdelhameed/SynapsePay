import React, { useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import App from './App';
import './index.css';

// Import wallet adapter styles
import '@solana/wallet-adapter-react-ui/styles.css';

// Wallet Context Provider Component
function WalletContextProvider({ children }: { children: React.ReactNode }) {
    // Configure network
    const network = (import.meta.env.VITE_SOLANA_NETWORK || 'devnet') as 'devnet' | 'mainnet-beta';
    const endpoint = useMemo(() =>
        import.meta.env.VITE_SOLANA_RPC_URL || clusterApiUrl(network),
        [network]
    );

    // Configure wallets
    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter(),
        ],
        []
    );

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
        <BrowserRouter>
            <WalletContextProvider>
                <App />
            </WalletContextProvider>
        </BrowserRouter>
    </React.StrictMode>
);
