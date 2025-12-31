import { useState, useEffect, useRef } from 'react';
import {
    Menu, X, ChevronRight, ExternalLink,
    Mail, Video, Calendar, Presentation,
    Wind, Droplets, Zap, Cpu, Camera,
    Shield, Globe, Brain,
    CheckCircle, Sparkles, Bot, Network,
} from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

// Placeholder for logo - replace with your actual import
import cereforge from '../../assets/cereForge.png';

const LandingPage = () => {
    useDocumentTitle(
        "Cereforge | The Operating System for African Innovation", 
        "Forging Intelligence into Innovation. We build resilient AI infrastructure and autonomous hardware systems, fusing Materials Engineering with Software Architecture.",
        "/"
    );
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const bgRef = useRef<HTMLDivElement>(null);
    const droneRef = useRef<HTMLDivElement>(null);

    const [telemetry, setTelemetry] = useState({
        alt: 124,
        spd: 18,
        bat: 94,
        lat: '6.465',
        lng: '3.406'
    });

    // Parallax Scroll Effect
    useEffect(() => {
        const handleScroll = () => {
            if (bgRef.current) {
                bgRef.current.style.transform = `translateY(${window.scrollY * 0.15}px)`;
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // FIX 1: Optimized Telemetry - Only runs when drone section is in view
    useEffect(() => {
        let interval: NodeJS.Timeout;
        
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        interval = setInterval(() => {
                            setTelemetry(prev => ({
                                alt: prev.alt + (Math.random() > 0.5 ? 1 : -1),
                                spd: Math.max(0, prev.spd + (Math.random() > 0.5 ? 2 : -2)),
                                bat: Math.max(10, prev.bat - (Math.random() > 0.9 ? 1 : 0)),
                                lat: (6.465 + Math.random() * 0.001).toFixed(3),
                                lng: (3.406 + Math.random() * 0.001).toFixed(3)
                            }));
                        }, 800);
                    } else {
                        clearInterval(interval);
                    }
                });
            },
            { threshold: 0.1 }
        );

        if (droneRef.current) {
            observer.observe(droneRef.current);
        }

        return () => {
            clearInterval(interval);
            observer.disconnect();
        };
    }, []);

    return (
        <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-orange-500 selection:text-white overflow-x-hidden">

            {/* NAVIGATION */}
            <nav className="fixed top-6 w-full z-50 px-4 pointer-events-none">
                <div className="max-w-7xl mx-auto flex justify-center pointer-events-auto">
                    {/* Desktop Pill */}
                    <div className="hidden md:flex items-center space-x-1 pl-4 pr-2 py-2 rounded-full border border-white/10 bg-zinc-900/80 backdrop-blur-md shadow-2xl ring-1 ring-white/5">
                        <div className="flex items-center mr-6 pl-2 space-x-2">
                            <img src={cereforge} alt="Cereforge Logo" className="w-6 h-6" />
                            <div className="flex items-center">
                                <div className="relative inline-block mr-1">
                                    <div className="absolute inset-0 bg-white/10 backdrop-blur-md rounded-lg transform -skew-x-12 border border-white/20"></div>
                                    <span className="text-blue-500 relative z-10 px-3 py-1 font-bold text-2xl tracking-tight">CERE</span>
                                </div>
                                <span className="text-white font-bold text-2xl tracking-tight">FORGE</span>
                            </div>
                        </div>

                        <div className="flex items-center space-x-1">
                            <a href="#ai-suite" className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-all">AI Suite</a>
                            <a href="#hardware" className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-all">Hardware</a>
                            <a href="#services" className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-all">Services</a>
                        </div>

                        <div className="w-px h-5 bg-white/10 mx-3"></div>

                        <a href="/login" className="px-5 py-2 text-sm font-medium text-white hover:text-orange-400 transition-colors">Login</a>
                        <a href="/get-started" className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white px-5 py-2 rounded-full text-sm font-bold transition-all shadow-[0_0_15px_rgba(234,88,12,0.3)] hover:shadow-[0_0_25px_rgba(234,88,12,0.5)]">
                            <Sparkles className="w-3 h-3" aria-hidden="true" />
                            <span>Start Project</span>
                        </a>
                    </div>

                    {/* Mobile Header */}
                    <div className="md:hidden w-full flex justify-between items-center px-4 py-3 rounded-2xl border border-white/10 bg-zinc-900/90 backdrop-blur-md">
                        <div className="flex items-center space-x-2">
                            <img src={cereforge} alt="Cereforge Logo" className="w-8 h-8" />
                            <div className="flex items-center">
                                <div className="relative inline-block mr-1">
                                    <div className="absolute inset-0 bg-white/10 backdrop-blur-md rounded-lg transform -skew-x-12 border border-white/20"></div>
                                    <span className="text-blue-500 relative z-10 px-3 py-1 font-bold text-2xl tracking-tight">CERE</span>
                                </div>
                                <span className="text-white font-bold text-2xl tracking-tight">FORGE</span>
                            </div>
                        </div>
                        <button 
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
                            className="text-white"
                            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                            aria-expanded={mobileMenuOpen}
                        >
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {/* FIX 2: Improved Mobile Menu with proper overlay */}
                {mobileMenuOpen && (
                    <>
                        <div 
                            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                            onClick={() => setMobileMenuOpen(false)}
                            aria-hidden="true"
                        ></div>
                        <div className="md:hidden fixed top-24 left-4 right-4 p-4 rounded-2xl bg-zinc-900 border border-white/10 shadow-2xl pointer-events-auto z-50 animate-in slide-in-from-top-4 duration-200">
                            <div className="flex flex-col space-y-3">
                                <a href="#ai-suite" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-zinc-300 hover:text-white transition-colors">AI Suite</a>
                                <a href="#hardware" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-zinc-300 hover:text-white transition-colors">Hardware</a>
                                <a href="#services" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-zinc-300 hover:text-white transition-colors">Services</a>
                                <a href="/login" className="text-lg font-medium text-zinc-300 hover:text-white transition-colors">Login</a>
                                <a href="/get-started" className="bg-orange-600 text-center py-3 rounded-xl font-bold text-white hover:bg-orange-700 transition-colors">Start Your Project</a>
                            </div>
                        </div>
                    </>
                )}
            </nav>

            {/* HERO SECTION */}
            <section className="relative pt-40 pb-20 lg:pt-52 lg:pb-32 overflow-hidden flex flex-col items-center justify-center min-h-[85vh]">

                <div ref={bgRef} className="absolute inset-0 pointer-events-none opacity-40 transition-transform duration-75 ease-out will-change-transform">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px]"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[100px]"></div>
                </div>

                {/* FIX 3: Responsive rotating rings */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
                    <div className="w-[min(800px,90vw)] h-[min(800px,90vw)] border border-white/5 rounded-full animate-[spin_60s_linear_infinite] opacity-30 border-dashed"></div>
                    <div className="absolute w-[min(600px,70vw)] h-[min(600px,70vw)] border border-orange-500/10 rounded-full animate-[spin_40s_linear_infinite_reverse] opacity-40"></div>
                </div>

                <div className="relative z-10 text-center max-w-5xl mx-auto px-4">
                    <div className="relative mb-12 group inline-block">
                        <div className="absolute inset-0 bg-orange-500/20 blur-[60px] rounded-full group-hover:bg-orange-500/30 transition-all duration-700"></div>
                        <img
                            src={cereforge}
                            alt="Cereforge Logo"
                            className="relative w-32 h-32 md:w-48 md:h-48 object-contain mx-auto drop-shadow-[0_0_25px_rgba(255,255,255,0.15)] animate-in zoom-in duration-700"
                        />
                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                            <div className="flex items-center space-x-2 bg-white/5 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" aria-hidden="true"></div>
                                <span className="text-xs font-mono text-zinc-400">AI SYSTEM ONLINE</span>
                            </div>
                        </div>
                    </div>

                    <h1 className="text-3xl md:text-5xl lg:text-6xl text-white font-bold tracking-tight mb-8 animate-in slide-in-from-bottom-4 fade-in duration-700 delay-100">
                        The Operating System for <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">African Innovation</span>
                    </h1>

                    <p className="text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed text-base md:text-xl animate-in slide-in-from-bottom-4 fade-in duration-700 delay-200">
                        Everything we build is powered by Artificial Intelligence.
                        From water-resistant drones to neural SaaS platforms.
                        <br className="hidden md:block" />
                        <span className="text-zinc-500 text-sm mt-3 block font-mono">Materials Engineering × Software Architecture</span>
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-in slide-in-from-bottom-4 fade-in duration-700 delay-300">
                        <a href="/get-started" className="group relative bg-white text-black px-8 py-4 rounded-full font-bold transition-all hover:bg-zinc-200 flex items-center space-x-2 w-full sm:w-auto justify-center hover:scale-105">
                            <Sparkles className="w-4 h-4 text-orange-600" aria-hidden="true" />
                            <span>Start Your Project</span>
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                        </a>
                        <a href="#ai-suite" className="px-8 py-4 rounded-full font-medium text-zinc-400 hover:text-white border border-transparent hover:border-white/10 transition-all w-full sm:w-auto justify-center flex hover:bg-white/5">
                            Explore Ecosystem
                        </a>
                    </div>
                </div>
            </section>

            {/* AI SAAS ECOSYSTEM */}
            <section id="ai-suite" className="py-24 bg-zinc-950 border-y border-white/5 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <span className="text-orange-500 font-mono text-sm tracking-widest uppercase flex items-center gap-2">
                                <Brain className="w-4 h-4" aria-hidden="true" /> AI Powered Suite
                            </span>
                            <h2 className="text-3xl md:text-4xl font-bold text-white mt-2">The Digital Forge</h2>
                            <p className="text-zinc-400 mt-2 max-w-2xl">A unified ecosystem where every tool acts as an intelligent agent.</p>
                        </div>
                        <div className="mt-4 md:mt-0">
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-900/20 text-blue-400 text-xs font-mono border border-blue-500/20">
                                <Bot className="w-3 h-3 mr-2" aria-hidden="true" /> Neural Engine v2.0
                            </span>
                        </div>
                    </div>

                    {/* FIX 4: Improved grid responsiveness */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                        <div className="sm:col-span-2 md:row-span-2 bg-zinc-900 rounded-3xl p-6 md:p-8 border border-white/5 hover:border-orange-500/30 transition-all group relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="relative z-10 h-full flex flex-col">
                                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6">
                                    <Mail className="w-6 h-6 text-blue-400" aria-hidden="true" />
                                </div>
                                <h3 className="text-xl md:text-2xl font-bold mb-3">AI Editor & Outreach</h3>
                                <p className="text-zinc-400 text-sm leading-relaxed mb-8 max-w-sm">
                                    More than text. Send AI-personalized emails directly from the web app.
                                    Drag & drop <strong>Live Charts</strong>, <strong>Stickers</strong>, and <strong>GIFs</strong>.
                                    The editor predicts your story before you finish typing.
                                </p>
                                <div className="mt-auto bg-black/50 rounded-xl border border-white/10 p-4 backdrop-blur-sm transform translate-y-2 group-hover:translate-y-0 transition-transform">
                                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
                                        <div className="text-xs text-zinc-500">To: <span className="text-zinc-300">partners@cereforge.com</span></div>
                                        <div className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded">AI Optimized</div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="w-full h-2 bg-zinc-800 rounded animate-pulse"></div>
                                        <div className="flex gap-2">
                                            <div className="w-1/2 h-20 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded border border-white/5 flex items-center justify-center text-xs text-zinc-600 font-mono">[Live Chart]</div>
                                            <div className="w-1/2 space-y-2">
                                                <div className="w-full h-2 bg-zinc-800 rounded"></div>
                                                <div className="w-3/4 h-2 bg-zinc-800 rounded"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="sm:col-span-1 md:row-span-2 bg-zinc-900 rounded-3xl p-6 border border-white/5 hover:border-orange-500/30 transition-all flex flex-col group">
                            <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center mb-4">
                                <Video className="w-5 h-5 text-green-400" aria-hidden="true" />
                            </div>
                            <h3 className="text-lg font-bold mb-2">Cereforge Meet</h3>
                            <p className="text-sm text-zinc-400 mb-6 flex-grow">
                                AI-driven compression algorithms designed for <strong>African infrastructure</strong>.
                                Crystal clear video even on low-bandwidth networks.
                            </p>
                            <div className="bg-black/40 rounded-lg p-3 border border-white/5">
                                <div className="flex justify-between items-center text-xs text-zinc-500 mb-2">
                                    <span>Bandwidth</span>
                                    <span className="text-green-500">Saved 40%</span>
                                </div>
                                <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                                    <div className="bg-green-500 w-[60%] h-full"></div>
                                </div>
                            </div>
                        </div>

                        <div className="sm:col-span-1 md:row-span-1 bg-zinc-900 rounded-3xl p-6 border border-white/5 hover:border-orange-500/30 transition-all">
                            <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4">
                                <Presentation className="w-5 h-5 text-purple-400" aria-hidden="true" />
                            </div>
                            <h3 className="text-base font-bold mb-1">AI Storyline</h3>
                            <p className="text-xs text-zinc-400">
                                Upload a PDF, get a video presentation. Record yourself alongside AI-generated slides.
                            </p>
                        </div>

                        <div className="sm:col-span-1 md:row-span-1 bg-zinc-900 rounded-3xl p-6 border border-white/5 hover:border-orange-500/30 transition-all">
                            <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center mb-4">
                                <Calendar className="w-5 h-5 text-yellow-400" aria-hidden="true" />
                            </div>
                            <h3 className="text-base font-bold mb-1">Smart Calendar</h3>
                            <p className="text-xs text-zinc-400">
                                Auto-scheduling powered by neural intent.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* HARDWARE SECTION */}
            <section id="hardware" ref={droneRef} className="py-24 bg-black relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
                        <div>
                            <div className="flex items-center space-x-2 mb-6">
                                <span className="h-px w-12 bg-orange-500"></span>
                                <span className="text-orange-500 font-mono tracking-widest uppercase text-sm">Hardware Division</span>
                            </div>

                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                                Project <span className="text-white">AeTRACK-V</span><br />
                                <span className="text-zinc-600">The Eye of Africa</span>
                            </h2>
                            <p className="text-base md:text-lg text-zinc-400 mb-8 leading-relaxed">
                                We aren't just software. We are building the future of autonomous surveillance.
                                A minimalist, AI-piloted drone designed specifically for the African environment.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                                <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5 hover:bg-zinc-900 transition-colors">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <Droplets className="w-5 h-5 text-blue-500" aria-hidden="true" />
                                        <h4 className="font-bold text-white">IP67 Waterproof</h4>
                                    </div>
                                    <p className="text-xs text-zinc-500">Hydrophobic chassis designed for heavy tropical rain.</p>
                                </div>

                                <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5 hover:bg-zinc-900 transition-colors">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <Wind className="w-5 h-5 text-gray-400" aria-hidden="true" />
                                        <h4 className="font-bold text-white">High-Wind Stable</h4>
                                    </div>
                                    <p className="text-xs text-zinc-500">Independent high-torque motors for stability in storms.</p>
                                </div>

                                <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5 hover:bg-zinc-900 transition-colors">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <Camera className="w-5 h-5 text-red-500" aria-hidden="true" />
                                        <h4 className="font-bold text-white">4x 360° Vision</h4>
                                    </div>
                                    <p className="text-xs text-zinc-500">Four independent cameras. Complete situational awareness.</p>
                                </div>

                                <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5 hover:bg-zinc-900 transition-colors">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <Cpu className="w-5 h-5 text-purple-500" aria-hidden="true" />
                                        <h4 className="font-bold text-white">Neural Flight Core</h4>
                                    </div>
                                    <p className="text-xs text-zinc-500">On-board AI for autonomous pathfinding and object tracking.</p>
                                </div>
                            </div>

                            <div className="mt-8 pt-8 border-t border-white/10">
                                <p className="text-sm font-mono text-orange-500 mb-2">USE CASES:</p>
                                <div className="flex flex-wrap gap-2">
                                    <span className="px-3 py-1 rounded-full bg-zinc-800 text-xs text-zinc-300 border border-white/5">Football Broadcasting</span>
                                    <span className="px-3 py-1 rounded-full bg-zinc-800 text-xs text-zinc-300 border border-white/5">Agricultural Surveying</span>
                                    <span className="px-3 py-1 rounded-full bg-zinc-800 text-xs text-zinc-300 border border-white/5">Security</span>
                                </div>
                            </div>
                        </div>

                        {/* FIX 5: Responsive drone HUD */}
                        <div className="relative h-[400px] md:h-[500px] w-full bg-zinc-900 rounded-3xl border border-white/10 flex items-center justify-center overflow-hidden group">

                            <div className="absolute top-4 left-4 w-8 md:w-12 h-8 md:h-12 border-t-2 border-l-2 border-orange-500/50 rounded-tl-lg"></div>
                            <div className="absolute top-4 right-4 w-8 md:w-12 h-8 md:h-12 border-t-2 border-r-2 border-orange-500/50 rounded-tr-lg"></div>
                            <div className="absolute bottom-4 left-4 w-8 md:w-12 h-8 md:h-12 border-b-2 border-l-2 border-orange-500/50 rounded-bl-lg"></div>
                            <div className="absolute bottom-4 right-4 w-8 md:w-12 h-8 md:h-12 border-b-2 border-r-2 border-orange-500/50 rounded-br-lg"></div>

                            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,.2)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%]"></div>

                            <div className="absolute top-0 w-full h-1 bg-orange-500/50 shadow-[0_0_20px_rgba(234,88,12,0.5)] animate-[scan_3s_ease-in-out_infinite]"></div>

                            <div className="relative z-10 text-center p-4 md:p-8 backdrop-blur-sm bg-black/20 rounded-2xl border border-white/5">
                                <Network className="w-12 md:w-16 h-12 md:h-16 text-zinc-600 mx-auto mb-4" aria-hidden="true" />
                                <div className="text-2xl md:text-4xl font-bold text-white/20 tracking-widest uppercase mb-2">AeTRACK-V</div>
                                <div className="inline-flex items-center space-x-2 bg-orange-500/10 text-orange-500 px-3 py-1 rounded text-xs font-mono border border-orange-500/20">
                                    <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" aria-hidden="true"></span>
                                    <span>LIVE FEED DISCONNECTED</span>
                                </div>
                            </div>

                            <div className="absolute bottom-4 md:bottom-6 left-4 md:left-6 font-mono text-[10px] text-zinc-500 space-y-1 text-left">
                                <div className="flex gap-2 md:gap-4">
                                    <span className="text-orange-500">ALT:</span> {telemetry.alt}m
                                </div>
                                <div className="flex gap-2 md:gap-4">
                                    <span className="text-orange-500">SPD:</span> {telemetry.spd} km/h
                                </div>
                                <div className="flex gap-2 md:gap-4">
                                    <span className="text-orange-500">BAT:</span> {telemetry.bat}%
                                </div>
                            </div>

                            <div className="absolute bottom-4 md:bottom-6 right-4 md:right-6 font-mono text-[10px] text-zinc-500 text-right">
                                <div>LAT: {telemetry.lat}</div>
                                <div>LNG: {telemetry.lng}</div>
                                <div className="text-orange-500 mt-1 animate-pulse">Scanning...</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* SERVICES & PHILOSOPHY */}
            <section id="services" className="py-24 bg-zinc-950 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">Born from the Forge</h2>
                        <p className="text-lg md:text-xl text-zinc-400 max-w-3xl mx-auto leading-relaxed">
                            Our unique edge comes from the fusion of <span className="text-white">Software Engineering</span> and <span className="text-white">Materials & Metallurgical Engineering</span>.
                            We apply the laws of physical resilience to digital AI infrastructure.
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 mb-24">
                        <div className="bg-zinc-900 p-6 md:p-8 rounded-2xl border border-white/5 hover:bg-black transition-colors group">
                            <Brain className="w-10 h-10 text-blue-500 mb-6 group-hover:scale-110 transition-transform" aria-hidden="true" />
                            <h3 className="text-xl font-bold text-white mb-3">Neural Integration</h3>
                            <p className="text-zinc-400 text-sm">We don't just build apps. We build systems that learn. AI integration into legacy hardware.</p>
                        </div>
                        <div className="bg-zinc-900 p-6 md:p-8 rounded-2xl border border-white/5 hover:bg-black transition-colors group">
                            <Shield className="w-10 h-10 text-gray-400 mb-6 group-hover:scale-110 transition-transform" aria-hidden="true" />
                            <h3 className="text-xl font-bold text-white mb-3">Metallurgical Resilience</h3>
                            <p className="text-zinc-400 text-sm">Engineering-grade reliability. Systems built to withstand high stress, just like our alloys.</p>
                        </div>
                        <div className="bg-zinc-900 p-6 md:p-8 rounded-2xl border border-white/5 hover:bg-black transition-colors group">
                            <Zap className="w-10 h-10 text-orange-500 mb-6 group-hover:scale-110 transition-transform" aria-hidden="true" />
                            <h3 className="text-xl font-bold text-white mb-3">Rapid Deployment</h3>
                            <p className="text-zinc-400 text-sm">African innovation meeting global standards. We forge MVPs in record time.</p>
                        </div>
                    </div>

                    {/* PARTNER CTA */}
                    <div className="relative overflow-hidden bg-gradient-to-r from-zinc-900 to-black border border-white/10 rounded-3xl p-8 md:p-12">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/10 rounded-full blur-[80px]"></div>

                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                            <div>
                                <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">Build With Cereforge</h3>
                                <p className="text-zinc-400 mb-6 max-w-xl">
                                    Access our ecosystem. We build complete AI software solutions, SaaS platforms, and hardware integrations for partners.
                                    <br /><span className="text-white font-semibold">Get your first complete solution in 30 days.</span>
                                </p>
                                <ul className="space-y-2">
                                    <li className="flex items-center text-zinc-300 text-sm">
                                        <CheckCircle className="w-4 h-4 text-orange-500 mr-3 flex-shrink-0" aria-hidden="true" />
                                        Web & Mobile Applications (AI Powered)
                                    </li>
                                    <li className="flex items-center text-zinc-300 text-sm">
                                        <CheckCircle className="w-4 h-4 text-orange-500 mr-3 flex-shrink-0" aria-hidden="true" />
                                        Hardware System Web Integration
                                    </li>
                                </ul>
                            </div>
                            <div className="flex-shrink-0 text-center w-full md:w-auto">
                                <a href="/get-started" className="block w-full md:w-auto bg-white text-black text-lg font-bold px-8 py-4 rounded-xl hover:bg-zinc-200 transition-all transform hover:scale-105 shadow-xl mb-2">
                                    Become a Partner
                                </a>
                                <span className="text-xs text-zinc-500">Limited slots for Q1 2025</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* MEDIA SECTION */}
            <section id="vision" className="py-24 bg-black">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4">Inside the Forge</h2>
                        <p className="text-zinc-400">Watch our story. Meet the minds behind the machines.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="bg-zinc-900/50 rounded-2xl p-4 border border-white/10 hover:border-orange-500/30 transition-all group">
                            <div className="aspect-video bg-black rounded-lg mb-4 overflow-hidden relative">
                                <iframe
                                    width="100%"
                                    height="100%"
                                    src="https://www.youtube.com/embed/I5bS0Fr8ds4?si=S0VYgDkcCoyWAs2A"
                                    title="Get to Know Cereforge"
                                    className="opacity-80 group-hover:opacity-100 transition-opacity"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            </div>
                            <h3 className="text-lg font-bold text-white">Get to Know Cereforge</h3>
                            <p className="text-sm text-zinc-500">Reshaping intelligent infrastructure.</p>
                        </div>

                        <div className="bg-zinc-900/50 rounded-2xl p-4 border border-white/10 hover:border-orange-500/30 transition-all group">
                            <div className="aspect-video bg-black rounded-lg mb-4 overflow-hidden relative">
                                <iframe
                                    width="100%"
                                    height="100%"
                                    src="https://www.youtube.com/embed/uWDWHXMtQIg?si=FjQDGqMKyRADdNe3"
                                    title="Meet the Cereforge Team"
                                    className="opacity-80 group-hover:opacity-100 transition-opacity"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            </div>
                            <h3 className="text-lg font-bold text-white">Meet the Team</h3>
                            <p className="text-sm text-zinc-500">The vision behind the forge.</p>
                        </div>
                    </div>

                    <div className="text-center mt-12">
                        <a 
                            href="https://youtube.com/@cereforge" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-2 text-zinc-400 hover:text-orange-500 transition-colors"
                        >
                            <ExternalLink className="w-4 h-4" aria-hidden="true" />
                            <span>Visit YouTube Channel</span>
                        </a>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="bg-zinc-900 border-t border-white/10 py-8 text-sm">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div className="col-span-2 md:col-span-1">
                            <div className="flex items-center space-x-2 mb-4">
                                <img src={cereforge} alt="Cereforge Logo" className="w-6 h-6 grayscale hover:grayscale-0 transition-all" />
                                <span className="text-zinc-100 font-bold">CEREFORGE</span>
                            </div>
                            <p className="text-zinc-500 max-w-xs text-xs leading-relaxed">
                                Forging Intelligence into Innovation. <br />
                                Born from Materials Engineering & AI.
                            </p>
                        </div>

                        <div>
                            <h4 className="font-bold text-white mb-4">Ecosystem</h4>
                            <ul className="space-y-2 text-zinc-400 text-xs">
                                <li><a href="#ai-suite" className="hover:text-orange-500 transition-colors">AI Intelligent Editor</a></li>
                                <li><a href="#ai-suite" className="hover:text-orange-500 transition-colors">Cereforge Meet</a></li>
                                <li><a href="#ai-suite" className="hover:text-orange-500 transition-colors">AI Storyline</a></li>
                                <li><a href="#hardware" className="hover:text-orange-500 transition-colors">AeTrack-V Drone</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-white mb-4">Company</h4>
                            <ul className="space-y-2 text-zinc-400 text-xs">
                                <li><a href="/get-started" className="hover:text-orange-500 transition-colors">Start a Project</a></li>
                                <li><a href="/login" className="hover:text-orange-500 transition-colors">Partner Login</a></li>
                                <li><a href="/calendar" className="hover:text-orange-500 transition-colors">Calendar</a></li>
                                <li><a href="#vision" className="hover:text-orange-500 transition-colors">About Us</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-white mb-4">Connect</h4>
                            <div className="flex space-x-4 mb-4">
                                <a 
                                    href="https://x.com/cereforge" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-zinc-400 hover:text-white transition-colors"
                                    aria-label="Visit Cereforge on X (Twitter)"
                                >
                                    <Globe className="w-4 h-4" aria-hidden="true" />
                                </a>
                                <a 
                                    href="https://linkedin.com/company/cereforge" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-zinc-400 hover:text-white transition-colors"
                                    aria-label="Visit Cereforge on LinkedIn"
                                >
                                    <Shield className="w-4 h-4" aria-hidden="true" />
                                </a>
                            </div>
                            <p className="text-zinc-600 text-xs">Lagos • Global</p>
                        </div>
                    </div>

                    <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-zinc-600 text-xs gap-4">
                        <p>&copy; 2024 Cereforge Systems. All rights reserved.</p>
                        <div className="flex space-x-6">
                            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;