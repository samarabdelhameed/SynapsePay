import { useEffect, useRef } from 'react';

export default function AnimatedBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        const setSize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        setSize();
        window.addEventListener('resize', setSize);

        // Particles
        const particles: Array<{
            x: number;
            y: number;
            vx: number;
            vy: number;
            size: number;
            color: string;
            alpha: number;
        }> = [];

        const colors = ['#FF6B35', '#9945FF', '#14F195', '#00D4FF'];

        // Create particles
        for (let i = 0; i < 50; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 3 + 1,
                color: colors[Math.floor(Math.random() * colors.length)],
                alpha: Math.random() * 0.5 + 0.1,
            });
        }

        // Animation loop
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw connections
            particles.forEach((p1, i) => {
                particles.slice(i + 1).forEach((p2) => {
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 150) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(153, 69, 255, ${0.1 * (1 - distance / 150)})`;
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                });
            });

            // Draw and update particles
            particles.forEach((p) => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.alpha;
                ctx.fill();
                ctx.globalAlpha = 1;

                // Update position
                p.x += p.vx;
                p.y += p.vy;

                // Bounce off walls
                if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
            });

            requestAnimationFrame(animate);
        };

        const animationId = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('resize', setSize);
            cancelAnimationFrame(animationId);
        };
    }, []);

    return (
        <>
            {/* Canvas for particle animation */}
            <canvas
                ref={canvasRef}
                className="fixed inset-0 z-0 pointer-events-none"
            />

            {/* Gradient orbs */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                {/* Top-left purple orb */}
                <div
                    className="absolute -top-40 -left-40 w-96 h-96 bg-synapse-purple/20 rounded-full blur-3xl animate-pulse-slow"
                    style={{ animationDelay: '0s' }}
                />

                {/* Top-right orange orb */}
                <div
                    className="absolute -top-20 right-20 w-80 h-80 bg-synapse-orange/15 rounded-full blur-3xl animate-pulse-slow"
                    style={{ animationDelay: '2s' }}
                />

                {/* Center green orb */}
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-synapse-green/5 rounded-full blur-3xl animate-pulse-slow"
                    style={{ animationDelay: '4s' }}
                />

                {/* Bottom-left cyan orb */}
                <div
                    className="absolute bottom-20 left-40 w-72 h-72 bg-synapse-cyan/10 rounded-full blur-3xl animate-float"
                    style={{ animationDelay: '1s' }}
                />

                {/* Bottom-right purple orb */}
                <div
                    className="absolute bottom-40 right-20 w-64 h-64 bg-synapse-purple/15 rounded-full blur-3xl animate-float"
                    style={{ animationDelay: '3s' }}
                />
            </div>

            {/* Noise texture overlay */}
            <div
                className="fixed inset-0 z-0 pointer-events-none opacity-[0.015]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
            />
        </>
    );
}
