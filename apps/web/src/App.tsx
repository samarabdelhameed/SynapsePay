import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Marketplace from './pages/Marketplace';
import AgentDetails from './pages/AgentDetails';
import Dashboard from './pages/Dashboard';
import CreateAgent from './pages/CreateAgent';
import Settings from './pages/Settings';
import Devices from './pages/Devices';
import DeviceControl from './pages/DeviceControl';
import TransactionSuccess from './pages/TransactionSuccess';

function App() {
    return (
        <>
            <Toaster
                position="top-right"
                toastOptions={{
                    style: {
                        background: '#16161F',
                        color: '#fff',
                        border: '1px solid #2A2A35',
                    },
                    success: {
                        iconTheme: {
                            primary: '#14F195',
                            secondary: '#16161F',
                        },
                    },
                    error: {
                        iconTheme: {
                            primary: '#FF6B35',
                            secondary: '#16161F',
                        },
                    },
                }}
            />
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<Home />} />
                    <Route path="marketplace" element={<Marketplace />} />
                    <Route path="agent/:id" element={<AgentDetails />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="create-agent" element={<CreateAgent />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="devices" element={<Devices />} />
                    <Route path="devices/:deviceId" element={<DeviceControl />} />
                    <Route path="tx/success" element={<TransactionSuccess />} />
                </Route>
            </Routes>
        </>
    );
}

export default App;
