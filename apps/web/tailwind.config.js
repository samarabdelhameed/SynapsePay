/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // Solana Brand Colors
                solana: {
                    purple: '#9945FF',
                    green: '#14F195',
                    gradient: 'linear-gradient(90deg, #9945FF 0%, #14F195 100%)',
                },
                // SynapsePay Custom Colors
                synapse: {
                    orange: '#FF6B35',
                    'orange-dark': '#E85A2A',
                    'orange-light': '#FF8C5A',
                    purple: '#9945FF',
                    'purple-dark': '#7B3ACC',
                    'purple-light': '#B366FF',
                    cyan: '#00D4FF',
                    pink: '#FF0080',
                    green: '#14F195',
                },
                // Dark Theme
                dark: {
                    bg: '#0A0A0F',
                    'bg-secondary': '#12121A',
                    'bg-tertiary': '#1A1A25',
                    card: '#16161F',
                    'card-hover': '#1E1E2A',
                    border: '#2A2A35',
                    'border-light': '#3A3A45',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                display: ['Outfit', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            animation: {
                'glow': 'glow 2s ease-in-out infinite alternate',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'float': 'float 6s ease-in-out infinite',
                'spin-slow': 'spin 8s linear infinite',
                'gradient': 'gradient 8s ease infinite',
                'slide-up': 'slideUp 0.5s ease-out',
                'slide-down': 'slideDown 0.5s ease-out',
                'slide-in-right': 'slideInRight 0.5s ease-out',
                'fade-in': 'fadeIn 0.5s ease-out',
                'scale-in': 'scaleIn 0.3s ease-out',
                'bounce-in': 'bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                'shimmer': 'shimmer 2s linear infinite',
            },
            keyframes: {
                glow: {
                    '0%': { boxShadow: '0 0 20px rgba(153, 69, 255, 0.5)' },
                    '100%': { boxShadow: '0 0 40px rgba(255, 107, 53, 0.5)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
                gradient: {
                    '0%, 100%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                slideDown: {
                    '0%': { transform: 'translateY(-20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                slideInRight: {
                    '0%': { transform: 'translateX(20px)', opacity: '0' },
                    '100%': { transform: 'translateX(0)', opacity: '1' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                scaleIn: {
                    '0%': { transform: 'scale(0.9)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
                bounceIn: {
                    '0%': { transform: 'scale(0.3)', opacity: '0' },
                    '50%': { transform: 'scale(1.05)' },
                    '70%': { transform: 'scale(0.9)' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
                'solana-gradient': 'linear-gradient(90deg, #9945FF 0%, #14F195 100%)',
                'synapse-gradient': 'linear-gradient(135deg, #FF6B35 0%, #9945FF 50%, #14F195 100%)',
                'dark-gradient': 'linear-gradient(180deg, #0A0A0F 0%, #12121A 100%)',
            },
            boxShadow: {
                'glow-orange': '0 0 40px rgba(255, 107, 53, 0.3)',
                'glow-purple': '0 0 40px rgba(153, 69, 255, 0.3)',
                'glow-green': '0 0 40px rgba(20, 241, 149, 0.3)',
                'card': '0 4px 20px rgba(0, 0, 0, 0.3)',
                'card-hover': '0 8px 40px rgba(153, 69, 255, 0.2)',
            },
            backdropBlur: {
                xs: '2px',
            },
        },
    },
    plugins: [],
};
