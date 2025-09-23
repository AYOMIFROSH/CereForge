import { useState, useEffect } from 'react';
import { ChevronRight, ExternalLink, Brain, Zap, Shield, Users, Menu, X } from 'lucide-react';
import cereforge from '../assets/cereForge.png'

// Define the Project interface
interface Project {
    id: number;
    name: string;
    phrase: string;
    description: string;
    tech: string[];
    impact: string;
    results: string;
    image: string;
    liveUrl: string;
}

const LandingPage = () => {
    const [cardsSpread, setCardsSpread] = useState<boolean>(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [email, setEmail] = useState<string>('');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

    // Auto-reset cards to stack when scrolling away from projects section
    useEffect(() => {
        let ticking = false;

        const handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const projectsSection = document.getElementById('projects');
                    if (projectsSection) {
                        const rect = projectsSection.getBoundingClientRect();
                        const isInView = rect.top < window.innerHeight && rect.bottom > 0;

                        // If user scrolled away from projects section and cards are spread
                        if (!isInView && cardsSpread && !selectedProject) {
                            setCardsSpread(false);
                        }
                    }
                    ticking = false;
                });
                ticking = true;
            }
        };

        // Use passive listener for better performance
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [cardsSpread, selectedProject]);

    // Sample projects data
    const projects: Project[] = [
        {
            id: 1,
            name: "Neural Infrastructure Platform",
            phrase: "AI-Powered Infrastructure",
            description: "Advanced neural network system for intelligent infrastructure management combining IoT sensors with machine learning algorithms. This platform revolutionizes how we monitor and maintain critical infrastructure through predictive analytics and real-time optimization.",
            tech: ["Python", "TensorFlow", "React", "PostgreSQL", "AWS IoT"],
            impact: "40% reduction in system downtime",
            results: "Deployed across 15 manufacturing facilities, monitoring 500+ sensors in real-time",
            image: "/api/placeholder/400/300",
            liveUrl: "https://neural-platform.cereforge.com"
        },
        {
            id: 2,
            name: "Robotic Assembly Controller",
            phrase: "Hardware Integration",
            description: "Microcontroller firmware for precision robotic arm assembly with real-time sensor fusion and adaptive control systems. Features advanced PID control algorithms and machine learning-based error correction for industrial automation.",
            tech: ["C++", "Arduino", "Sensor Fusion", "PID Control", "ROS"],
            impact: "95% assembly accuracy rate",
            results: "Integrated into 8 production lines, handling 10,000+ assemblies daily",
            image: "/api/placeholder/400/300",
            liveUrl: "https://robotic-controller.cereforge.com"
        },
        {
            id: 3,
            name: "Smart Manufacturing Suite",
            phrase: "Digital Transformation",
            description: "Complete manufacturing digitization platform with predictive maintenance, quality control, and production optimization. Includes real-time dashboards, automated reporting, and AI-powered decision support systems.",
            tech: ["Node.js", "React", "MongoDB", "AWS IoT", "Docker"],
            impact: "30% increase in efficiency",
            results: "Transformed 12 manufacturing facilities, saving $2.3M annually",
            image: "/api/placeholder/400/300",
            liveUrl: "https://manufacturing-suite.cereforge.com"
        },
        {
            id: 4,
            name: "AI-Powered Quality Control",
            phrase: "Computer Vision",
            description: "Advanced computer vision system for automated quality inspection using deep learning models. Detects defects with higher accuracy than human inspectors while maintaining consistent quality standards.",
            tech: ["Python", "OpenCV", "TensorFlow", "FastAPI", "Redis"],
            impact: "99.2% defect detection accuracy",
            results: "Inspected 50M+ products, prevented 15K defective units from shipping",
            image: "/api/placeholder/400/300",
            liveUrl: "https://quality-control.cereforge.com"
        },
        {
            id: 5,
            name: "Blockchain Supply Chain",
            phrase: "Distributed Systems",
            description: "Decentralized supply chain management platform ensuring transparency and traceability from raw materials to end consumers. Implements smart contracts for automated compliance and payments.",
            tech: ["Solidity", "Web3.js", "React", "Node.js", "IPFS"],
            impact: "100% supply chain transparency",
            results: "Tracking 25M+ products across 200+ suppliers globally",
            image: "/api/placeholder/400/300",
            liveUrl: "https://supply-chain.cereforge.com"
        }
    ];

    const handleStackClick = (): void => {
        if (!cardsSpread) {
            setCardsSpread(true);
        }
    };

    const handleProjectClick = (project: Project): void => {
        if (cardsSpread) {
            setSelectedProject(project);
        }
    };

    const handleCloseProject = (): void => {
        setSelectedProject(null);
    };

    const handleBackToStack = (): void => {
        setCardsSpread(false);
        setSelectedProject(null);
    };

    return (
        <div className="min-h-screen bg-gray-50 overflow-x-hidden" style={{ scrollBehavior: 'smooth' }}>
            {/* Navigation Header */}
            <nav className="fixed top-4 w-full z-50 px-4">
                <div className="max-w-7xl mx-auto">
                    {/* Desktop Navigation */}
                    <div className="hidden sm:flex justify-center items-center h-16">
                        <div className="flex items-center space-x-4 sm:space-x-8 rounded-full px-4 sm:px-8 py-2 shadow-lg border border-white/20 backdrop-blur-sm bg-blue-900/40">
                            <a href="#home" className="text-white hover:text-orange-500 font-medium transition-colors text-sm sm:text-base">Home</a>
                            <a href="#about" className="text-white hover:text-orange-500 font-medium transition-colors text-sm sm:text-base">About</a>
                            <a href="#team" className="text-white hover:text-orange-500 font-medium transition-colors text-sm sm:text-base">Cereforge</a>
                            <a href="#projects" className="text-white hover:text-orange-500 font-medium transition-colors text-sm sm:text-base">Projects</a>
                            <a
                                href="/login"
                                className="bg-blue-800 text-white px-3 sm:px-4 py-2 rounded-full hover:bg-blue-900 transition-colors text-sm sm:text-base"
                            >
                                Login
                            </a>
                        </div>
                    </div>

                    {/* Mobile Navigation */}
                    <div className="sm:hidden">
                        <div className="flex justify-between items-center h-16 rounded-full px-6 py-2 shadow-lg border border-white/20 backdrop-blur-sm bg-blue-900/40">
                            {/* Logo */}
                            <div className="flex items-center space-x-2">
                                <img src={cereforge} alt="Cereforge Logo – AI Software and Hardware Solutions" className="w-8 h-8" />
                                <div className="relative inline-block">
                                    {/* Sleek transparent blur background */}
                                    <div className="absolute inset-0 bg-white/20 backdrop-blur-sm rounded-lg transform -skew-x-12 shadow-lg border border-white/30"></div>
                                    <span className="text-blue-900 relative z-10 px-3 py-1 font-bold text-lg">CERE</span>
                                </div>
                                <span className="text-white font-bold text-lg">FORGE</span>
                            </div>

                            {/* Hamburger Menu Button */}
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="text-white hover:text-white-500 transition-colors p-2"
                                aria-label="Toggle mobile menu"
                            >
                                {isMobileMenuOpen ? (
                                    <X className="w-6 h-6" />
                                ) : (
                                    <Menu className="w-6 h-6" />
                                )}
                            </button>
                        </div>

                        {/* Mobile Menu Dropdown */}
                        {isMobileMenuOpen && (
                            <div className="absolute top-full left-4 right-4 mt-2 rounded-2xl shadow-lg border border-white/20 backdrop-blur-sm bg-blue-900/95 overflow-hidden animate-in slide-in-from-top duration-300">
                                <div className="py-4">
                                    <a
                                        href="#home"
                                        className="block px-6 py-3 text-white hover:text-orange-500 hover:bg-blue-800/50 font-medium transition-colors"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        Home
                                    </a>
                                    <a
                                        href="#about"
                                        className="block px-6 py-3 text-white hover:text-orange-500 hover:bg-blue-800/50 font-medium transition-colors"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        About
                                    </a>
                                    <a
                                        href="#team"
                                        className="block px-6 py-3 text-white hover:text-orange-500 hover:bg-blue-800/50 font-medium transition-colors"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        Cereforge
                                    </a>
                                    <a
                                        href="#projects"
                                        className="block px-6 py-3 text-white hover:text-orange-500 hover:bg-blue-800/50 font-medium transition-colors"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        Projects
                                    </a>
                                    <div className="px-6 py-3">
                                        <a
                                            href="/login"
                                            className="block w-full text-center bg-blue-800 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            Login
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section id="home" className="pt-24 pb-8 min-h-screen flex items-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="flex items-center space-x-4 mb-6">
                                <img src={cereforge} alt="Cereforge Logo – AI Software and Hardware Solutions" className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-white/10 p-2" />
                                <div>
                                    <h1 className="text-3xl sm:text-4xl font-bold relative">
                                        <span className="relative inline-block">
                                            {/* Sleek transparent blur background */}
                                            <div className="absolute inset-0 bg-white/20 backdrop-blur-sm rounded-lg transform -skew-x-12 shadow-lg border border-white/30"></div>
                                            <span className="text-blue-900 relative z-10 px-2 sm:px-4 py-1 text-2xl sm:text-4xl">CERE</span>
                                        </span>
                                        <span className="text-white text-2xl sm:text-4xl">FORGE</span>
                                    </h1>
                                    <p className="text-blue-200 text-sm sm:text-lg">Forging Intelligence into Innovation</p>
                                </div>
                            </div>

                            <h2 className="text-2xl sm:text-4xl lg:text-6xl font-bold mb-6 leading-tight">
                                Turn Ideas Into <span className="text-orange-500">Innovation</span>
                            </h2>

                            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                                We build complete software solutions, firmware, and websites. From concept to deployment -
                                <span className="text-orange-400 font-semibold"> your first complete software solution in 30 days</span>.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 mb-12">
                                <button
                                    onClick={() => window.location.href = '/get-started'}
                                    className="inset-0 bg-white/20 shadow-lg border border-white/20  backdrop-blur-sm hover:blue-900/40 text-white px-8 py-2 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
                                >                                    <span className="text-orange-500">Start Your Project</span>
                                    <ChevronRight className=" text-orange-400 w-5 h-5" />
                                </button>

                            </div>

                            <div className="grid grid-cols-3 gap-8 text-center">
                                <div>
                                    <div className="text-3xl font-bold text-orange-400">30</div>
                                    <div className="text-blue-200">Days to Launch</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-orange-400">100%</div>
                                    <div className="text-blue-200">Custom Solutions</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-orange-400">24/7</div>
                                    <div className="text-blue-200">Support</div>
                                </div>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                                <h3 className="text-2xl font-bold mb-6">What We Build</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-3">
                                        <Brain className="w-6 h-6 text-orange-400" />
                                        <span>AI-Powered Software Solutions</span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <Zap className="w-6 h-6 text-orange-400" />
                                        <span>Hardware Integration Systems</span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <Shield className="w-6 h-6 text-orange-400" />
                                        <span>Resilient Infrastructure</span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <Users className="w-6 h-6 text-orange-400" />
                                        <span>Complete SaaS Platforms</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section id="about" className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Edge</h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Born from the fusion of Software Engineering and Materials & Metallurgical Engineering.
                            We bring unique perspectives to digital innovation.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="text-center p-8 rounded-xl bg-gray-50 hover:bg-blue-50 transition-colors">
                            <div className="w-16 h-16 bg-blue-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Brain className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Intelligence</h3>
                            <p className="text-gray-600">AI-driven solutions that learn, adapt, and optimize your business processes.</p>
                        </div>

                        <div className="text-center p-8 rounded-xl bg-gray-50 hover:bg-blue-50 transition-colors">
                            <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Shield className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Resilience</h3>
                            <p className="text-gray-600">Engineering-grade reliability with materials science precision.</p>
                        </div>

                        <div className="text-center p-8 rounded-xl bg-gray-50 hover:bg-blue-50 transition-colors">
                            <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Zap className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Innovation</h3>
                            <p className="text-gray-600">African innovation meeting global standards with cutting-edge technology.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* YouTube Video Section */}
            <section id="team" className="py-20 bg-gray-900 text-white relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-900/50 to-transparent"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">Step Inside Cereforge</h2>
                        <p className="text-xl text-gray-300">Watch our story. Meet the minds behind the forge.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all">
                            <div className="aspect-video bg-gray-800 rounded-lg mb-4 relative overflow-hidden group cursor-pointer">
                                <iframe
                                    width="100%"
                                    height="100%"
                                    src="https://www.youtube.com/embed/r37mZJOossY?si=DkdR7zdulvmW580Q"
                                    title="Get to Know Cereforge"
                                    style={{ border: "0" }}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="rounded-lg"
                                ></iframe>
                            </div>
                            <h3 className="text-xl font-bold mb-2">Get to Know Cereforge</h3>
                            <p className="text-gray-300 text-sm">Discover how Cereforge is reshaping intelligent infrastructure.</p>
                        </div>

                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all">
                            <div className="aspect-video bg-gray-800 rounded-lg mb-4 relative overflow-hidden group cursor-pointer">
                                <iframe
                                    width="100%"
                                    height="100%"
                                    src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                                    title="Meet the Cereforge Team"
                                    style={{ border: "0" }}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="rounded-lg"
                                ></iframe>
                            </div>
                            <h3 className="text-xl font-bold mb-2">Meet the Cereforge Team</h3>
                            <p className="text-gray-300 text-sm">Hear from our founder on the vision behind the forge.</p>
                        </div>
                    </div>

                    <div className="text-center mt-8">
                        <a
                            href="https://youtube.com/@cereforge"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold transition-all"
                        >
                            <ExternalLink className="w-5 h-5" />
                            <span>Visit Our YouTube Channel</span>
                        </a>
                    </div>
                </div>
            </section>

            {/* Project Showcase - Updated with New Layout Logic */}
            <section id="projects" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Projects</h2>
                        <p className="text-xl text-gray-600">Innovation unlocked, one project at a time.</p>
                        {!cardsSpread && (
                            <p className="text-gray-500 mt-4">Click the stack to explore our projects</p>
                        )}
                        {cardsSpread && !selectedProject && (
                            <button
                                onClick={handleBackToStack}
                                className="mt-4 bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105"
                            >
                                ← Back to Stack View
                            </button>
                        )}
                    </div>

                    <div className="flex flex-col gap-12">
                        {!selectedProject ? (
                            // Project Cards Stack/Grid - Only show when no project is selected
                            <div className="relative transition-all duration-700 ease-in-out">
                                {!cardsSpread ? (
                                    // Stack View
                                    <div className="relative h-96 flex items-center justify-center">
                                        {projects.map((project, index) => (
                                            <div
                                                key={project.id}
                                                onClick={handleStackClick}
                                                className="absolute bg-white rounded-xl shadow-lg border-2 border-gray-200 hover:border-blue-300 cursor-pointer transition-all duration-500 ease-out w-80 h-48 p-6 hover:shadow-xl"
                                                style={{
                                                    transform: `rotate(${(index - 2) * 5}deg) translate(${index * 10}px, ${index * 5}px)`,
                                                    zIndex: projects.length - index,
                                                    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                                                }}
                                            >
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg transition-transform duration-300 hover:scale-110">
                                                        {project.name.charAt(0)}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="font-bold text-gray-900 text-lg truncate">{project.name}</h3>
                                                        <p className="text-sm text-gray-600">{project.phrase}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-center transition-opacity duration-500">
                                            <div className="bg-blue-800 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                                                {projects.length} Projects
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    // Grid View
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-700">
                                        {projects.map((project, index) => (
                                            <div
                                                key={project.id}
                                                onClick={() => handleProjectClick(project)}
                                                className="bg-white rounded-xl shadow-lg border-2 border-gray-200 hover:border-blue-300 cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-xl p-6"
                                                style={{
                                                    animationDelay: `${index * 100}ms`,
                                                    animation: 'slideInUp 0.6s ease-out forwards'
                                                }}
                                            >
                                                <div className="space-y-4">
                                                    <div className="w-full h-32 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl transition-transform duration-300 hover:scale-105">
                                                        {project.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-gray-900 text-lg mb-2">{project.name}</h3>
                                                        <p className="text-sm text-gray-600 mb-3">{project.phrase}</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {project.tech.slice(0, 3).map(tech => (
                                                                <span key={tech} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs transition-colors duration-200 hover:bg-blue-200">
                                                                    {tech}
                                                                </span>
                                                            ))}
                                                            {project.tech.length > 3 && (
                                                                <span className="text-gray-500 text-xs">+{project.tech.length - 3}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            // Project Details View - Takes over the entire section when a project is selected
                            <div className="bg-white rounded-xl shadow-xl border p-4 sm:p-8 min-h-[500px] animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-8 h-full">
                                    {/* Project Icon - Top Left */}
                                    <div className="lg:col-span-1 flex justify-center lg:justify-start">
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl sm:text-2xl animate-in zoom-in duration-300 delay-100">
                                            {selectedProject.name.charAt(0)}
                                        </div>
                                    </div>

                                    {/* Project Details - Right Side */}
                                    <div className="lg:col-span-3">
                                        <div className="flex flex-col h-full animate-in slide-in-from-right duration-500 delay-200">
                                            {/* Header */}
                                            <div className="mb-4 sm:mb-6 text-center lg:text-left">
                                                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">{selectedProject.name}</h3>
                                                <p className="text-orange-600 font-medium text-base sm:text-lg">{selectedProject.phrase}</p>
                                            </div>

                                            {/* Description */}
                                            <p className="text-gray-700 mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base">{selectedProject.description}</p>

                                            {/* Technologies */}
                                            <div className="mb-4 sm:mb-6">
                                                <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Technologies Used:</h4>
                                                <div className="flex flex-wrap gap-1 sm:gap-2">
                                                    {selectedProject.tech.map((tech, index) => (
                                                        <span
                                                            key={tech}
                                                            className="bg-blue-100 text-blue-800 px-2 sm:px-3 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 hover:bg-blue-200 hover:scale-105"
                                                            style={{
                                                                animationDelay: `${index * 50}ms`,
                                                                animation: 'slideInUp 0.4s ease-out forwards'
                                                            }}
                                                        >
                                                            {tech}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Impact */}
                                            <div className="mb-4 sm:mb-6">
                                                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Impact:</h4>
                                                <p className="text-orange-600 font-semibold text-base sm:text-lg">{selectedProject.impact}</p>
                                            </div>

                                            {/* Results */}
                                            <div className="mb-6 sm:mb-8">
                                                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Results:</h4>
                                                <p className="text-gray-700 text-sm sm:text-base">{selectedProject.results}</p>
                                            </div>

                                            {/* Buttons - Responsive Layout */}
                                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center sm:justify-end mt-auto animate-in slide-in-from-bottom duration-500 delay-300">
                                                <button
                                                    onClick={handleCloseProject}
                                                    className="px-4 sm:px-6 py-2 sm:py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 text-sm sm:text-base"
                                                >
                                                    Close
                                                </button>
                                                <button
                                                    onClick={() => window.open(selectedProject.liveUrl, '_blank')}
                                                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2 hover:shadow-lg text-sm sm:text-base"
                                                >
                                                    <span>Visit Project</span>
                                                    <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-blue-900 text-white py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div>
                            <h3 className="text-lg font-bold mb-3">Company</h3>
                            <ul className="space-y-2">
                                <li><a href="#" className="text-blue-200 hover:text-orange-400 transition-colors">About Cereforge</a></li>
                                <li><a href="#" className="text-blue-200 hover:text-orange-400 transition-colors">Careers</a></li>
                                <li><a href="#" className="text-blue-200 hover:text-orange-400 transition-colors">Contact Us</a></li>
                                <li><a href="#" className="text-blue-200 hover:text-orange-400 transition-colors">Privacy Policy</a></li>
                                <li><a href="#" className="text-blue-200 hover:text-orange-400 transition-colors">Terms of Service</a></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold mb-3">Blog</h3>
                            <p className="text-blue-200 mb-3">Explore our insights</p>
                            <a href="#" className="text-orange-400 hover:text-orange-300 transition-colors">Visit Blog →</a>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold mb-3">Follow the forge. Stay inspired.</h3>
                            <div className="flex flex-wrap gap-4 mb-3">
                                <a href="https://facebook.com/cereforge" className="text-blue-200 hover:text-orange-400 transition-colors">Facebook</a>
                                <a href="https://instagram.com/cereforge" className="text-blue-200 hover:text-orange-400 transition-colors">Instagram</a>
                                <a href="https://x.com/cereforge" className="text-blue-200 hover:text-orange-400 transition-colors">X</a>
                                <a href="https://linkedin.com/company/cereforge" className="text-blue-200 hover:text-orange-400 transition-colors">LinkedIn</a>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold mb-3">Newsletter</h3>
                            <p className="text-blue-200 text-sm mb-3">Get updates on innovation, engineering, and AI.</p>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter email"
                                    className="flex-1 px-4 py-2 rounded-lg sm:rounded-r-none text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400 min-w-0"
                                />
                                <button className="bg-orange-500 hover:bg-orange-600 px-6 py-2 rounded-lg sm:rounded-l-none font-semibold transition-colors whitespace-nowrap">
                                    Subscribe
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-blue-800 mt-6 pt-4 text-center text-blue-200">
                        <p>&copy; 2024 Cereforge. All rights reserved. Forging Intelligence into Innovation.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;