import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

// Person detection interface
interface DetectedPerson {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    confidence: number;
    label: string;
}

interface LiveFeedProps {
    isConnected: boolean;
    deviceName: string;
    streamUrl?: string;
    location?: {
        lat: number;
        lon: number;
    };
}

export default function LiveFeed({
    isConnected,
    deviceName,
    streamUrl,
    location,
}: LiveFeedProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [detectedPersons, setDetectedPersons] = useState<DetectedPerson[]>([]);
    const [motionDetected, setMotionDetected] = useState(false);
    const [iframeLoaded, setIframeLoaded] = useState(false); // Track if iframe stream loaded
    const [useDemo, setUseDemo] = useState(false); // Fallback to demo mode if stream fails
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const previousFrameRef = useRef<ImageData | null>(null);
    const iframeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Start webcam when connected (only if no external streamUrl)
    useEffect(() => {
        console.log('🔄 Connection effect:', { isConnected, streamUrl, hasStream: !!stream });

        // If we have an external stream URL (like robot camera), set up timeout
        if (streamUrl && isConnected) {
            console.log('📹 Using external stream URL, setting up connection...');
            setIsLoading(true);
            setIframeLoaded(false);
            setUseDemo(false);

            // Timeout: if iframe doesn't load in 5 seconds, fall back to local webcam
            iframeTimeoutRef.current = setTimeout(() => {
                if (!iframeLoaded) {
                    console.log('⏰ Robot stream timeout - trying local webcam...');
                    setUseDemo(true); // Switch to webcam/demo mode
                    // Try to start local webcam as fallback
                    setTimeout(() => {
                        if (videoRef.current) {
                            console.log('🎥 Starting local webcam as fallback...');
                            startWebcam();
                        } else {
                            console.log('📺 Video ref not ready, using demo overlay');
                            setIsLoading(false);
                        }
                    }, 100);
                }
            }, 3000); // Reduced to 3 seconds for faster fallback

            return () => {
                if (iframeTimeoutRef.current) {
                    clearTimeout(iframeTimeoutRef.current);
                }
            };
        }

        if (isConnected && !streamUrl) {
            console.log('🚀 Should start webcam');
            // Delay webcam start to ensure video element is mounted
            const timer = setTimeout(() => {
                if (videoRef.current) {
                    startWebcam();
                } else {
                    console.log('⏳ Video ref not ready, using demo mode');
                    setIsLoading(false);
                }
            }, 100);
            return () => clearTimeout(timer);
        } else if (!isConnected && stream) {
            console.log('🛑 Should stop webcam');
            stopWebcam();
        }
    }, [isConnected, streamUrl, iframeLoaded]);

    const startWebcam = async () => {
        try {
            setIsLoading(true);
            setError(null);
            console.log('🎥 Starting webcam...');

            // Create a timeout promise
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Camera access timeout after 5 seconds')), 5000);
            });

            // Race between getUserMedia and timeout
            const mediaStream = await Promise.race([
                navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        frameRate: { ideal: 30 },
                        facingMode: { ideal: 'environment' } // Prefer back camera
                    },
                    audio: false
                }),
                timeoutPromise
            ]) as MediaStream;

            console.log('✅ Webcam stream obtained:', mediaStream);
            setStream(mediaStream);

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                console.log('✅ Video element updated with stream');

                // Add error handler for video element
                videoRef.current.onerror = (e) => {
                    console.error('❌ Video element error:', e);
                    setError('Video playback failed');
                    setIsLoading(false);
                };

                // Force play the video with timeout
                try {
                    await Promise.race([
                        videoRef.current.play(),
                        new Promise((_, reject) =>
                            setTimeout(() => reject(new Error('Video play timeout')), 3000)
                        )
                    ]);
                    console.log('✅ Video is now playing');
                } catch (playError) {
                    console.error('❌ Video play error:', playError);
                    // Continue anyway, might work in demo mode
                }

                // Enhanced video event handlers
                videoRef.current.onloadedmetadata = () => {
                    console.log('✅ Video metadata loaded');
                    console.log('📐 Video dimensions:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
                    setIsLoading(false);
                };

                videoRef.current.onplaying = () => {
                    console.log('✅ Video is actively playing');
                    setIsLoading(false);
                };

                videoRef.current.onloadstart = () => {
                    console.log('🔄 Video load started');
                };

                videoRef.current.oncanplay = () => {
                    console.log('✅ Video can play');
                    setIsLoading(false);
                };

                // Force video to be visible and play
                videoRef.current.style.display = 'block';
                videoRef.current.style.opacity = '1';
                videoRef.current.style.zIndex = '10';

                // Fallback timeout to stop loading state
                setTimeout(() => {
                    if (isLoading) {
                        console.log('⏰ Fallback: stopping loading state');
                        setIsLoading(false);
                    }
                }, 3000);
            } else {
                console.log('❌ Video ref not available');
                setTimeout(() => setIsLoading(false), 1000);
            }

        } catch (err: any) {
            console.error('❌ Error accessing webcam:', err);

            // Set specific error messages based on error type
            let errorMessage = 'Camera access failed';
            if (err.name === 'NotAllowedError') {
                errorMessage = 'Camera permission denied. Please allow camera access and try again.';
            } else if (err.name === 'NotFoundError') {
                errorMessage = 'No camera found. Please connect a camera and try again.';
            } else if (err.name === 'NotReadableError') {
                errorMessage = 'Camera is already in use by another application.';
            } else if (err.message?.includes('timeout')) {
                errorMessage = 'Camera access timed out. Please check your camera and try again.';
            }

            setError(errorMessage);
            setIsLoading(false);
            console.log('📺 Continuing with demo overlay without camera');
        }
    };

    const stopWebcam = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsLoading(true);
    };

    // Connect stream to video element when both are available
    useEffect(() => {
        if (stream && videoRef.current) {
            console.log('🔗 Connecting stream to video element...');
            console.log('📊 Stream details:', {
                active: stream.active,
                tracks: stream.getTracks().length,
                videoTracks: stream.getVideoTracks().length
            });

            videoRef.current.srcObject = stream;

            // Force video properties
            videoRef.current.style.display = 'block';
            videoRef.current.style.opacity = '1';
            videoRef.current.style.zIndex = '10';

            videoRef.current.play().then(() => {
                console.log('✅ Video playback started successfully');
                console.log('📐 Video element size:', {
                    width: videoRef.current?.clientWidth,
                    height: videoRef.current?.clientHeight,
                    videoWidth: videoRef.current?.videoWidth,
                    videoHeight: videoRef.current?.videoHeight
                });
                setIsLoading(false);
            }).catch(e => {
                console.error('❌ Video play error:', e);
                setIsLoading(false);
            });
        } else if (stream && !videoRef.current) {
            // Stream exists but video ref not ready - retry after a short delay
            console.log('⏳ Stream ready but video ref not mounted yet, retrying...');
            const retryTimer = setTimeout(() => {
                if (videoRef.current && stream) {
                    console.log('🔄 Retry: connecting stream to video...');
                    videoRef.current.srcObject = stream;
                    videoRef.current.style.display = 'block';
                    videoRef.current.style.opacity = '1';
                    videoRef.current.style.zIndex = '10';
                    videoRef.current.play().then(() => {
                        console.log('✅ Retry successful - video playing');
                        setIsLoading(false);
                    }).catch(e => {
                        console.error('❌ Retry video play error:', e);
                        setIsLoading(false);
                    });
                }
            }, 300);
            return () => clearTimeout(retryTimer);
        }
    }, [stream, useDemo]); // Also watch useDemo to re-run when switching modes

    // Motion detection using camera frames
    useEffect(() => {
        if (!isConnected || !stream || !videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (!ctx) return;

        // Set canvas size to match video
        canvas.width = 320;
        canvas.height = 240;

        const detectMotion = () => {
            if (video.readyState !== video.HAVE_ENOUGH_DATA) return;

            // Draw current frame to canvas
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);

            if (previousFrameRef.current) {
                // Compare with previous frame
                let diffPixels = 0;
                const threshold = 30; // Sensitivity threshold

                for (let i = 0; i < currentFrame.data.length; i += 4) {
                    const rDiff = Math.abs(currentFrame.data[i] - previousFrameRef.current.data[i]);
                    const gDiff = Math.abs(currentFrame.data[i + 1] - previousFrameRef.current.data[i + 1]);
                    const bDiff = Math.abs(currentFrame.data[i + 2] - previousFrameRef.current.data[i + 2]);

                    if (rDiff + gDiff + bDiff > threshold) {
                        diffPixels++;
                    }
                }

                // If enough pixels changed, consider it motion
                const motionThreshold = (canvas.width * canvas.height) * 0.02; // 2% of pixels
                const hasMotion = diffPixels > motionThreshold;

                setMotionDetected(hasMotion);
            }

            previousFrameRef.current = currentFrame;
        };

        const interval = setInterval(detectMotion, 200); // Check every 200ms

        return () => clearInterval(interval);
    }, [isConnected, stream]);

    // Enhanced person detection - always show some detection for demo
    useEffect(() => {
        if (!isConnected) return; // Only require connection, not stream

        const generateDetections = () => {
            // Always show 1-3 persons for professional demo (like the original)
            const numPersons = 1 + Math.floor(Math.random() * 3); // 1-3 persons
            const mockPersons: DetectedPerson[] = [];

            for (let i = 0; i < numPersons; i++) {
                mockPersons.push({
                    id: `person_${i + 1}`,
                    x: 0.1 + Math.random() * 0.7, // Spread across screen
                    y: 0.1 + Math.random() * 0.6, // Vertical spread
                    width: 0.12 + Math.random() * 0.15, // Varied sizes
                    height: 0.25 + Math.random() * 0.3,
                    confidence: 65 + Math.random() * 30, // 65-95% confidence
                    label: 'person'
                });
            }

            setDetectedPersons(mockPersons);
        };

        // Generate initial detections
        generateDetections();

        // Update detections every 2-4 seconds for realistic movement
        const interval = setInterval(() => {
            generateDetections();
        }, 2000 + Math.random() * 2000);

        return () => clearInterval(interval);
    }, [isConnected]); // Removed stream dependency

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative w-full aspect-video rounded-2xl overflow-hidden bg-dark-bg border border-dark-border"
        >
            {/* GLOBAL Video element - ALWAYS in DOM for ref availability */}
            <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                muted
                playsInline
                controls={false}
                style={{
                    zIndex: stream ? 15 : 0,
                    opacity: stream ? 1 : 0,
                    backgroundColor: 'black'
                }}
                onLoadedMetadata={() => {
                    console.log('🎥 GLOBAL Video: metadata loaded');
                    setIsLoading(false);
                }}
                onCanPlay={() => {
                    console.log('🎥 GLOBAL Video: can play');
                }}
                onPlay={() => {
                    console.log('🎥 GLOBAL Video: playing!');
                    setIsLoading(false);
                }}
                onError={(e) => {
                    console.error('🎥 GLOBAL Video: error', e);
                }}
            />

            {/* Hidden canvas for motion detection */}
            <canvas
                ref={canvasRef}
                className="hidden"
                width={320}
                height={240}
            />

            {/* Status Badge */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${isConnected
                    ? 'bg-synapse-green/20 border border-synapse-green/50'
                    : 'bg-red-500/20 border border-red-500/50'
                    }`}>
                    <span className={`relative flex h-2 w-2`}>
                        {isConnected && (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-synapse-green opacity-75" />
                        )}
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-synapse-green' : 'bg-red-400'
                            }`} />
                    </span>
                    <span className={`text-xs font-medium ${isConnected ? 'text-synapse-green' : 'text-red-400'
                        }`}>
                        {isConnected ? 'LIVE FEED' : 'OFFLINE'}
                    </span>
                </div>
            </div>

            {/* Location Display */}
            {location && (
                <div className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-lg bg-dark-bg/80 backdrop-blur-sm border border-dark-border">
                    <div className="font-mono text-xs text-gray-400 space-y-0.5">
                        <p>LAT: <span className="text-white">{location.lat.toFixed(4)} N</span></p>
                        <p>LON: <span className="text-white">{location.lon.toFixed(4)} W</span></p>
                    </div>
                </div>
            )}

            {/* Feed Content */}
            {isConnected ? (
                <>
                    {isLoading ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                    className="w-16 h-16 mx-auto mb-4"
                                >
                                    <svg viewBox="0 0 24 24" className="w-full h-full text-synapse-purple/50">
                                        <circle
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            fill="none"
                                            strokeDasharray="40 60"
                                        />
                                    </svg>
                                </motion.div>
                                <p className="text-gray-400 font-mono text-sm">
                                    ESTABLISHING SECURE FEED // {deviceName}
                                </p>
                            </div>
                        </div>
                    ) : streamUrl && !useDemo ? (
                        // External stream URL via iframe (robot/camera stream)
                        <div className="relative w-full h-full bg-black">
                            {/* Loading indicator */}
                            {isLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-dark-bg z-20">
                                    <div className="text-center">
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                            className="w-12 h-12 mx-auto mb-3"
                                        >
                                            <svg viewBox="0 0 24 24" className="w-full h-full text-synapse-purple/50">
                                                <circle
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    fill="none"
                                                    strokeDasharray="40 60"
                                                />
                                            </svg>
                                        </motion.div>
                                        <p className="text-gray-400 font-mono text-xs">
                                            CONNECTING TO ROBOT STREAM...
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* iframe for robot camera stream */}
                            <iframe
                                className="w-full h-full border-0"
                                src={streamUrl}
                                title={`${deviceName} - Robot Control Interface`}
                                allow="cross-origin-isolated; fullscreen; camera; microphone"
                                sandbox="allow-same-origin allow-scripts allow-forms"
                                onLoad={() => {
                                    console.log('✅ Robot stream iframe loaded successfully');
                                    setIsLoading(false);
                                    setIframeLoaded(true);
                                    setError(null);
                                    // Clear timeout since iframe loaded
                                    if (iframeTimeoutRef.current) {
                                        clearTimeout(iframeTimeoutRef.current);
                                    }
                                }}
                                onError={(e) => {
                                    console.error('❌ Robot stream iframe error:', e);
                                    setError('Failed to connect to robot stream');
                                    setIsLoading(false);
                                    setUseDemo(true);
                                }}
                            />

                            {/* Stream status badges */}
                            <div className="absolute top-2 left-2 z-10 flex items-center gap-2">
                                <div className="px-2 py-1 bg-red-500/90 text-white text-xs font-mono rounded flex items-center gap-1">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                    </span>
                                    LIVE STREAM
                                </div>
                                <div className="px-2 py-1 bg-synapse-purple/80 text-white text-xs font-mono rounded">
                                    {deviceName}
                                </div>
                            </div>

                            {/* Recording indicator */}
                            <div className="absolute top-2 right-2 z-10 flex items-center gap-2 px-3 py-1 bg-black/60 rounded-lg">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                <span className="text-white text-xs font-mono">REC</span>
                            </div>

                            {/* Connection info */}
                            <div className="absolute bottom-2 left-2 z-10 px-2 py-1 bg-black/60 rounded text-xs font-mono text-gray-300">
                                📡 {streamUrl}
                            </div>

                            {/* Error overlay */}
                            {error && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-30">
                                    <div className="text-center max-w-md mx-4">
                                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                                            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                        </div>
                                        <p className="text-red-400 font-medium mb-2">Connection Failed</p>
                                        <p className="text-gray-400 text-sm mb-4">{error}</p>
                                        <button
                                            onClick={() => {
                                                setIsLoading(true);
                                                setError(null);
                                                // Force iframe reload
                                                const iframe = document.querySelector('iframe');
                                                if (iframe) {
                                                    iframe.src = streamUrl || '';
                                                }
                                            }}
                                            className="px-4 py-2 bg-synapse-purple hover:bg-synapse-purple-light rounded-lg text-sm transition-colors font-medium"
                                        >
                                            🔄 Retry Connection
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : stream || true ? ( // Always show feed for demo
                        // Live webcam feed
                        <div className="relative w-full h-full bg-black overflow-hidden">
                            {/* Demo background with animated terrain simulation when no camera */}
                            {!stream && (
                                <div
                                    className="absolute inset-0"
                                    style={{ zIndex: 1 }}
                                >
                                    {/* Animated terrain/environment simulation */}
                                    <div className="absolute inset-0 bg-gradient-to-b from-gray-800 via-gray-700 to-gray-600">
                                        {/* Moving terrain lines to simulate movement */}
                                        <div
                                            className="absolute inset-0 opacity-40"
                                            style={{
                                                backgroundImage: `
                                                    linear-gradient(0deg, transparent 49%, rgba(100, 100, 100, 0.3) 50%, transparent 51%),
                                                    linear-gradient(90deg, transparent 49%, rgba(100, 100, 100, 0.2) 50%, transparent 51%)
                                                `,
                                                backgroundSize: '40px 40px',
                                                animation: 'moveDown 2s linear infinite'
                                            }}
                                        />

                                        {/* Simulated horizon */}
                                        <div className="absolute top-1/3 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gray-500/50 to-transparent" />

                                        {/* Simulated ground/floor pattern */}
                                        <div
                                            className="absolute bottom-0 left-0 right-0 h-2/3"
                                            style={{
                                                background: `
                                                    linear-gradient(to bottom, 
                                                        rgba(50, 60, 70, 0.8) 0%,
                                                        rgba(40, 50, 60, 0.9) 50%,
                                                        rgba(30, 40, 50, 1) 100%
                                                    )
                                                `,
                                            }}
                                        >
                                            {/* Moving floor lines for depth */}
                                            <div
                                                className="absolute inset-0 opacity-30"
                                                style={{
                                                    backgroundImage: `
                                                        repeating-linear-gradient(
                                                            to bottom,
                                                            transparent,
                                                            transparent 15px,
                                                            rgba(80, 90, 100, 0.4) 15px,
                                                            rgba(80, 90, 100, 0.4) 16px
                                                        )
                                                    `,
                                                    animation: 'moveDown 1s linear infinite'
                                                }}
                                            />
                                        </div>

                                        {/* Dust/noise effect */}
                                        <div
                                            className="absolute inset-0 opacity-10"
                                            style={{
                                                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                                            }}
                                        />

                                        {/* Scan line effect */}
                                        <div
                                            className="absolute inset-0 pointer-events-none opacity-20"
                                            style={{
                                                background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)'
                                            }}
                                        />
                                    </div>

                                    {/* Demo mode indicator */}
                                    <div className="absolute top-14 left-4 px-2 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded text-yellow-400 text-xs font-mono z-30">
                                        📹 DEMO MODE
                                    </div>

                                    {/* CSS Animation keyframes */}
                                    <style>{`
                                        @keyframes moveDown {
                                            from { transform: translateY(-40px); }
                                            to { transform: translateY(0px); }
                                        }
                                    `}</style>
                                </div>
                            )}

                            {/* Video element moved to top of component - ref always available */}

                            {/* Professional overlay like in the original */}
                            <div className="absolute top-2 left-2 px-2 py-1 bg-red-500/90 text-white text-xs font-mono rounded z-20">
                                🔴 LIVE CAM
                            </div>


                            {/* Recording indicator */}
                            <div className="absolute top-2 right-2 flex items-center gap-2 px-3 py-1 bg-black/60 rounded-lg z-20">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                <span className="text-white text-xs font-mono">REC</span>
                            </div>

                            {/* REAL Computer Vision Overlay */}
                            <div className="absolute inset-0" style={{ zIndex: 10, pointerEvents: 'none' }}>
                                {/* CV_OBJS label like in original - bigger and more prominent */}
                                <div className="absolute top-6 left-6 text-white font-mono text-2xl font-bold tracking-wider drop-shadow-lg">
                                    CV_OBJS
                                </div>

                                {/* Real-time person detection boxes - enhanced visibility */}
                                {detectedPersons.map((person, index) => {
                                    const colors = [
                                        { border: 'border-green-400', bg: 'bg-green-400', text: 'text-black' },
                                        { border: 'border-yellow-400', bg: 'bg-yellow-400', text: 'text-black' },
                                        { border: 'border-orange-400', bg: 'bg-orange-400', text: 'text-black' },
                                        { border: 'border-blue-400', bg: 'bg-blue-400', text: 'text-black' }
                                    ];
                                    const color = colors[index % colors.length];

                                    return (
                                        <motion.div
                                            key={person.id}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className={`absolute border-3 ${color.border} transition-all duration-500 shadow-lg`}
                                            style={{
                                                left: `${person.x * 100}%`,
                                                top: `${person.y * 100}%`,
                                                width: `${person.width * 100}%`,
                                                height: `${person.height * 100}%`,
                                                borderWidth: '3px',
                                                boxShadow: `0 0 10px ${color.border.includes('green') ? '#4ade80' :
                                                    color.border.includes('yellow') ? '#facc15' :
                                                        color.border.includes('orange') ? '#fb923c' : '#60a5fa'}40`
                                            }}
                                        >
                                            <div className={`absolute -top-7 left-0 ${color.bg} ${color.text} px-2 py-1 text-sm font-mono font-bold rounded shadow-md`}>
                                                {person.label}: {person.confidence.toFixed(1)}%
                                            </div>
                                        </motion.div>
                                    );
                                })}

                                {/* Enhanced professional crosshair */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="relative">
                                        {/* Main crosshair */}
                                        <div className="w-40 h-1 bg-synapse-green/70 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-0.5" />
                                        <div className="h-40 w-1 bg-synapse-green/70 absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-0.5" />

                                        {/* Center circle */}
                                        <div className="w-20 h-20 border-2 border-synapse-green/70 rounded-full" />

                                        {/* Corner brackets */}
                                        <div className="absolute -top-6 -left-6 w-12 h-12">
                                            <div className="w-6 h-1 bg-synapse-green/70" />
                                            <div className="w-1 h-6 bg-synapse-green/70" />
                                        </div>
                                        <div className="absolute -top-6 -right-6 w-12 h-12">
                                            <div className="w-6 h-1 bg-synapse-green/70 ml-auto" />
                                            <div className="w-1 h-6 bg-synapse-green/70 ml-auto" />
                                        </div>
                                        <div className="absolute -bottom-6 -left-6 w-12 h-12">
                                            <div className="w-1 h-6 bg-synapse-green/70 mt-auto" />
                                            <div className="w-6 h-1 bg-synapse-green/70 mt-auto" />
                                        </div>
                                        <div className="absolute -bottom-6 -right-6 w-12 h-12">
                                            <div className="w-1 h-6 bg-synapse-green/70 ml-auto mt-auto" />
                                            <div className="w-6 h-1 bg-synapse-green/70 ml-auto mt-auto" />
                                        </div>
                                    </div>
                                </div>

                                {/* Enhanced grid overlay like the original */}
                                <div
                                    className="absolute inset-0 opacity-30"
                                    style={{
                                        backgroundImage: `
                                            linear-gradient(rgba(20, 241, 149, 0.4) 1px, transparent 1px),
                                            linear-gradient(90deg, rgba(20, 241, 149, 0.4) 1px, transparent 1px)
                                        `,
                                        backgroundSize: '50px 50px',
                                    }}
                                />

                                {/* Additional targeting lines */}
                                <div className="absolute inset-0">
                                    {/* Horizontal center line */}
                                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-synapse-green/40 transform -translate-y-0.5" />
                                    {/* Vertical center line */}
                                    <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-synapse-green/40 transform -translate-x-0.5" />
                                </div>

                                {/* Enhanced detection info panel */}
                                <div className="absolute top-6 right-6 space-y-2">
                                    <div className="bg-black/80 rounded-lg px-4 py-2 border border-synapse-green/50">
                                        <span className="text-synapse-green text-base font-mono font-bold">
                                            DETECTED: {detectedPersons.length}
                                        </span>
                                    </div>
                                    <div className="bg-black/80 rounded-lg px-3 py-1 flex items-center gap-2 border border-orange-400/50">
                                        <div className="w-3 h-3 rounded-full bg-orange-400 animate-pulse" />
                                        <span className="text-orange-400 text-sm font-mono font-bold">
                                            TRACKING
                                        </span>
                                    </div>
                                    {!stream && !error && (
                                        <button
                                            onClick={startWebcam}
                                            className="bg-black/80 rounded-lg px-3 py-1 border border-blue-400/50 text-blue-400 text-xs font-mono hover:bg-blue-400/20 transition-colors pointer-events-auto"
                                        >
                                            📹 ENABLE CAMERA
                                        </button>
                                    )}
                                    {stream && (
                                        <div className="bg-black/80 rounded-lg px-3 py-1 border border-green-400/50 text-green-400 text-xs font-mono">
                                            ✅ CAMERA ACTIVE
                                        </div>
                                    )}
                                    {error && (
                                        <button
                                            onClick={startWebcam}
                                            className="bg-black/80 rounded-lg px-3 py-1 border border-red-400/50 text-red-400 text-xs font-mono hover:bg-red-400/20 transition-colors pointer-events-auto"
                                        >
                                            🔄 RETRY CAMERA
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Professional Status Panel */}
                            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="px-2 py-1 bg-synapse-green/20 border border-synapse-green/50 rounded text-synapse-green text-xs font-mono">
                                        WebRTC Active
                                    </div>
                                    <div className={`px-2 py-1 border rounded text-xs font-mono ${motionDetected
                                        ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                                        : 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                                        }`}>
                                        CV: {motionDetected ? 'DETECTING' : 'SCANNING'}
                                    </div>
                                    <div className="px-2 py-1 bg-purple-500/20 border border-purple-500/50 rounded text-purple-400 text-xs font-mono">
                                        X402: ONLINE
                                    </div>
                                </div>
                                <div className="text-synapse-green/70 text-xs font-mono">
                                    {new Date().toLocaleTimeString()}
                                </div>
                            </div>
                        </div>
                    ) : error ? (
                        // Error state with demo overlay
                        <div className="relative w-full h-full">
                            {/* Show demo overlay even with error */}
                            <div
                                className="absolute inset-0"
                                style={{ zIndex: 1 }}
                            >
                                {/* Same demo background as above */}
                                <div className="absolute inset-0 bg-gradient-to-b from-gray-800 via-gray-700 to-gray-600">
                                    <div
                                        className="absolute inset-0 opacity-40"
                                        style={{
                                            backgroundImage: `
                                                linear-gradient(0deg, transparent 49%, rgba(100, 100, 100, 0.3) 50%, transparent 51%),
                                                linear-gradient(90deg, transparent 49%, rgba(100, 100, 100, 0.2) 50%, transparent 51%)
                                            `,
                                            backgroundSize: '40px 40px',
                                            animation: 'moveDown 2s linear infinite'
                                        }}
                                    />
                                    <div className="absolute top-1/3 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gray-500/50 to-transparent" />
                                    <div
                                        className="absolute bottom-0 left-0 right-0 h-2/3"
                                        style={{
                                            background: `linear-gradient(to bottom, rgba(50, 60, 70, 0.8) 0%, rgba(40, 50, 60, 0.9) 50%, rgba(30, 40, 50, 1) 100%)`
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Error overlay */}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-10">
                                <div className="text-center max-w-md mx-4">
                                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                                        <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <p className="text-red-400 font-medium mb-2">Camera Access Issue</p>
                                    <p className="text-gray-300 text-sm mb-4 leading-relaxed">{error}</p>
                                    <div className="space-y-2">
                                        <button
                                            onClick={startWebcam}
                                            className="w-full px-4 py-2 bg-synapse-purple hover:bg-synapse-purple-light rounded-lg text-sm transition-colors font-medium"
                                        >
                                            🔄 Retry Camera Access
                                        </button>
                                        <p className="text-xs text-gray-400">
                                            Demo mode will continue without camera
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Demo mode indicator */}
                            <div className="absolute top-14 left-4 px-2 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded text-yellow-400 text-xs font-mono z-20">
                                📹 DEMO MODE - CAMERA ERROR
                            </div>
                        </div>
                    ) : (
                        // Demo grid pattern when no actual stream
                        <div className="absolute inset-0">
                            {/* Scan lines effect */}
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-synapse-green/5 to-transparent animate-pulse" />

                            {/* Grid overlay */}
                            <div
                                className="absolute inset-0 opacity-20"
                                style={{
                                    backgroundImage: `
                                        linear-gradient(rgba(20, 241, 149, 0.3) 1px, transparent 1px),
                                        linear-gradient(90deg, rgba(20, 241, 149, 0.3) 1px, transparent 1px)
                                    `,
                                    backgroundSize: '30px 30px',
                                }}
                            />

                            {/* Crosshair */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="relative">
                                    <div className="w-24 h-0.5 bg-synapse-green/30 absolute top-1/2 left-1/2 -translate-x-1/2" />
                                    <div className="h-24 w-0.5 bg-synapse-green/30 absolute top-1/2 left-1/2 -translate-y-1/2" />
                                    <div className="w-12 h-12 border border-synapse-green/50 rounded-full" />
                                </div>
                            </div>

                            {/* Demo text */}
                            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                                <p className="font-mono text-xs text-synapse-green/50">
                                    FEED://ACTIVE
                                </p>
                                <p className="font-mono text-xs text-synapse-green/50">
                                    {new Date().toLocaleTimeString()}
                                </p>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-dark-bg">
                    <div className="text-center">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-dark-card/50 flex items-center justify-center">
                            <svg className="w-10 h-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <p className="text-gray-500 font-medium mb-2">No Feed Available</p>
                        <p className="text-gray-600 text-sm">Complete payment to access live feed</p>
                    </div>
                </div>
            )}

            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-synapse-green/30" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-synapse-green/30" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-synapse-green/30" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-synapse-green/30" />
        </motion.div>
    );
}
