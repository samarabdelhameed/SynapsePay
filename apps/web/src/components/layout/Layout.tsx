import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import AnimatedBackground from './AnimatedBackground';

export default function Layout() {
    return (
        <div className="min-h-screen bg-dark-bg relative overflow-hidden">
            {/* Animated Background */}
            <AnimatedBackground />

            {/* Content */}
            <div className="relative z-10">
                <Navbar />
                <div className="flex">
                    <Sidebar />
                    <main className="flex-1 ml-20 lg:ml-64 p-6 pt-24">
                        <Outlet />
                    </main>
                </div>
            </div>
        </div>
    );
}
