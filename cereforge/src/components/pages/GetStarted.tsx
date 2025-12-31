import { useState } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import ConsultationBooking from '@/components/calendar/ConsultationBooking';
import {
    ChevronRight,
    Upload,
    X,
    CheckCircle,
    User,
    Mail,
    Phone,
    Building,
    Globe,
    Linkedin,
    Calendar,
    ArrowLeft,
    Home
} from 'lucide-react';
import cereforge from '../../assets/cereForge.png';
import { useGetStarted } from '@/hooks/useGetStarted';
import { Loader2, AlertCircle } from 'lucide-react'; // If not already imported


// Define interfaces for type safety
interface FormData {
    // Section 1: Personal & Company Info
    fullName: string;
    email: string;
    phone: string;
    companyName: string;
    companyWebsite: string;
    linkedinProfile: string;

    // Section 2: Project Overview
    projectTitle: string;
    projectDescription: string;
    projectStage: string;
    solutionType: string;

    // Section 3: Uploads (file objects)
    projectBrief: File | null;
    referenceImages: File | null;
    profilePhoto: File | null;

    // Section 4: Timeline & Budget
    startDate: string;
    completionDate: string;
    budgetRange: string;

    // Section 5: Collaboration Preferences
    hasInternalTeam: string;
    scheduleCall: string;

    // Section 6: Legal & Consent
    termsAccepted: boolean;
    contactConsent: boolean;
}

interface FileUploadProps {
    label: string;
    description?: string;
    file: File | null;
    onFileSelect: (file: File | null) => void;
    accept?: string;
    required?: boolean;
}

const GetStarted = () => {
    useDocumentTitle(
        "Cereforge - Get Started",
        "Cereforge - Project Onboarding Form ",
        "/Get Started"
    );

    const [currentStep, setCurrentStep] = useState<number>(1);
    const [formData, setFormData] = useState<FormData>({
        fullName: '',
        email: '',
        phone: '',
        companyName: '',
        companyWebsite: '',
        linkedinProfile: '',
        projectTitle: '',
        projectDescription: '',
        projectStage: '',
        solutionType: '',
        projectBrief: null,
        referenceImages: null,
        profilePhoto: null,
        startDate: '',
        completionDate: '',
        budgetRange: '',
        hasInternalTeam: '',
        scheduleCall: '',
        termsAccepted: false,
        contactConsent: false
    });

    const { submitApplication, isSubmitting, isUploadingFiles, uploadProgress, validationErrors: submissionError } = useGetStarted();

    const [selectedCurrency, setSelectedCurrency] = useState<string>('₦');
    const [showCurrencyDropdown, setShowCurrencyDropdown] = useState<boolean>(false);
    const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
    const [dragActive, setDragActive] = useState<string>('');
    const [showConsultationModal, setShowConsultationModal] = useState<boolean>(false);

    const currencies = [
        { symbol: '$', name: 'USD' },
        { symbol: '₦', name: 'NGN' },
        { symbol: '£', name: 'GBP' },
        { symbol: '€', name: 'EUR' }
    ];

    const totalSteps = 6;

    const handleConsultationClick = () => {
        setShowConsultationModal(true);
    };

    const handleInputChange = (field: keyof FormData, value: string | boolean | File | null): void => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const FileUpload: React.FC<FileUploadProps> = ({
        label,
        description,
        file,
        onFileSelect,
        accept = ".pdf,.docx,.pptx,.jpg,.jpeg,.png",
        required = false
    }) => {
        const handleDragOver = (e: React.DragEvent) => {
            e.preventDefault();
            setDragActive(label);
        };

        const handleDragLeave = (e: React.DragEvent) => {
            e.preventDefault();
            setDragActive('');
        };

        const handleDrop = (e: React.DragEvent) => {
            e.preventDefault();
            setDragActive('');
            const files = e.dataTransfer.files;
            if (files && files[0]) {
                onFileSelect(files[0]);
            }
        };

        const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            if (files && files[0]) {
                onFileSelect(files[0]);
            }
        };

        return (
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
                {description && (
                    <p className="text-sm text-gray-500">{description}</p>
                )}
                <div
                    className={`border-2 border-dashed rounded-lg p-4 sm:p-6 text-center transition-all duration-200 cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 ${dragActive === label ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                        } ${file ? 'border-green-400 bg-green-50' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById(`file-${label.replace(/\s+/g, '-').toLowerCase()}`)?.click()}
                >
                    <input
                        id={`file-${label.replace(/\s+/g, '-').toLowerCase()}`}
                        type="file"
                        accept={accept}
                        onChange={handleFileChange}
                        className="hidden"
                    />

                    {file ? (
                        <div className="flex items-center justify-center space-x-2 sm:space-x-3">
                            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-green-700 truncate">{file.name}</p>
                                <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onFileSelect(null);
                                }}
                                className="text-red-500 hover:text-red-700 transition-colors p-1"
                            >
                                <X className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mx-auto" />
                            <div>
                                <p className="text-xs sm:text-sm text-gray-600">
                                    <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
                                </p>
                                <p className="text-xs text-gray-500">Max file size: 10MB</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const handleNext = () => {
        if (currentStep < totalSteps) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate that we're on the final step
        if (currentStep !== totalSteps) {
            handleNext();
            return;
        }

        // Convert date to ISO datetime format if provided
        let idealStartDateISO = '';
        if (formData.startDate) {
            try {
                const dateObj = new Date(formData.startDate + 'T00:00:00');
                idealStartDateISO = dateObj.toISOString();
            } catch (error) {
                console.error('Invalid date format:', error);
            }
        }

        // Submit to backend with files
        const success = await submitApplication(
            {
                // Personal & Company Info
                fullName: formData.fullName,
                email: formData.email,
                phone: formData.phone,
                companyName: formData.companyName,
                companyWebsite: formData.companyWebsite || '',
                linkedinProfile: formData.linkedinProfile || '',

                // Project Overview
                projectTitle: formData.projectTitle,
                projectDescription: formData.projectDescription,
                projectStage: formData.projectStage,
                solutionType: formData.solutionType,

                // Timeline & Budget
                idealStartDate: idealStartDateISO,
                budgetRange: formData.budgetRange,
                currency: selectedCurrency,

                // Collaboration Preferences
                hasInternalTeam: formData.hasInternalTeam === 'yes',
                scheduleCall: formData.scheduleCall === 'yes',

                // Legal & Consent
                termsAccepted: formData.termsAccepted,
                contactConsent: formData.contactConsent
            },
            // Files (optional - will be uploaded if provided)
            {
                projectBrief: formData.projectBrief,
                referenceImages: formData.referenceImages,
                profilePhoto: formData.profilePhoto
            }
        );

        if (success) {
            console.log('Application submitted successfully!');
            setShowConfirmation(true);
        } else if (submissionError) {
            console.error('Submission error:', submissionError);
        }
    };

    const getStepTitle = (): string => {
        switch (currentStep) {
            case 1: return 'Personal & Company Information';
            case 2: return 'Project Overview';
            case 3: return 'Project Documents';
            case 4: return 'Timeline & Budget';
            case 5: return 'Collaboration Preferences';
            case 6: return 'Terms & Consent';
            default: return 'Get Started';
        }
    };

    if (showConfirmation) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Thank You!</h2>
                    <p className="text-gray-600 mb-6 text-sm sm:text-base">
                        Your project submission has been received. We'll reach out within 48 hours to discuss your project in detail.
                    </p>
                    <div className="space-y-3">
                        <button
                            onClick={handleConsultationClick}
                            className="w-full bg-blue-800 hover:bg-blue-900 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 text-sm sm:text-base"
                        >
                            Schedule Call Now
                        </button>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors text-sm sm:text-base"
                        >
                            Back to Home
                        </button>
                    </div>
                </div>

                {/* Consultation Modal */}
                {showConsultationModal && (
                    <ConsultationBooking
                        isOpen={showConsultationModal}
                        onClose={() => setShowConsultationModal(false)}
                        mode="popup"
                    />
                )}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 overflow-x-hidden">
            {/* Updated Navigation Header with Progress Bar */}
            <nav className="fixed top-4 w-full z-50 px-4">
                <div className="max-w-7xl mx-auto">
                    {/* Desktop Navigation with Progress */}
                    <div className="hidden sm:flex flex-col items-center space-y-3">
                        <div className="flex items-center space-x-6 rounded-full px-6 py-2 shadow-lg border border-white/20 backdrop-blur-sm bg-blue-900/40">
                            <div className="flex items-center space-x-1">
                                <img src={cereforge} alt="Cereforge Logo – AI Software and Hardware Solutions" className="w-8 h-8" />
                                <div className="relative inline-block">
                                    <div className="absolute inset-0 bg-white/20 backdrop-blur-sm rounded-lg transform -skew-x-12 shadow-lg border border-white/30"></div>
                                    <span className="text-blue-900 relative z-10 px-3 py-1 font-bold text-lg">CERE</span>
                                </div>
                                <span className="text-white font-bold text-lg">FORGE</span>
                            </div>

                            {/* Progress section in header */}
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                    <span className="text-white text-sm font-medium">Step {currentStep} of {totalSteps}</span>
                                    <div className="w-32 bg-white/20 rounded-full h-2">
                                        <div
                                            className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => window.location.href = '/'}
                                className="text-white hover:text-orange-500 transition-colors p-1"
                                aria-label="Back to Home"
                            >
                                <Home className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Mobile Navigation with Progress */}
                    <div className="sm:hidden">
                        <div className="flex justify-between items-center rounded-full px-4 py-2 shadow-lg border border-white/20 backdrop-blur-sm bg-blue-900/40">
                            {/* Logo */}
                            <div className="flex items-center space-x-2">
                                <img src={cereforge} alt="Cereforge Logo – AI Software and Hardware Solutions" className="w-6 h-6" />
                                <div className="relative inline-block">
                                    <div className="absolute inset-0 bg-white/20 backdrop-blur-sm rounded-lg transform -skew-x-12 shadow-lg border border-white/30"></div>
                                    <span className="text-blue-900 relative z-10 px-2 py-1 font-bold text-sm">CERE</span>
                                </div>
                                <span className="text-white font-bold text-sm">FORGE</span>
                            </div>

                            {/* Progress in the middle */}
                            <div className="flex-1 mx-4">
                                <div className="flex items-center justify-center mb-1">
                                    <span className="text-white text-xs font-medium">Step {currentStep}/{totalSteps}</span>
                                </div>
                                <div className="w-full bg-white/20 rounded-full h-1.5">
                                    <div
                                        className="bg-orange-500 h-1.5 rounded-full transition-all duration-300"
                                        style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Home button */}
                            <button
                                onClick={() => window.location.href = '/'}
                                className="text-white hover:text-orange-500 transition-colors p-1"
                                aria-label="Back to Home"
                            >
                                <Home className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Form Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 mt-28 sm:mt-38">
                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8">
                    <div className="mb-6 sm:mb-8">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{getStepTitle()}</h2>
                        <p className="text-sm sm:text-base text-gray-600">Please fill in all required information to help us understand your project better.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Step 1: Personal & Company Info */}
                        {currentStep === 1 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Full Name <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                                        <input
                                            type="text"
                                            value={formData.fullName}
                                            onChange={(e) => handleInputChange('fullName', e.target.value)}
                                            className="w-full pl-8 sm:pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                                            placeholder="Enter your full name"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email Address <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => handleInputChange('email', e.target.value)}
                                            className="w-full pl-8 sm:pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                                            placeholder="Enter your email address"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Phone Number <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => handleInputChange('phone', e.target.value)}
                                            className="w-full pl-8 sm:pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                                            placeholder="Enter your phone number"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Company Name <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                                        <input
                                            type="text"
                                            value={formData.companyName}
                                            onChange={(e) => handleInputChange('companyName', e.target.value)}
                                            className="w-full pl-8 sm:pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                                            placeholder="Enter your company name"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Company Website
                                    </label>
                                    <div className="relative">
                                        <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                                        <input
                                            type="url"
                                            value={formData.companyWebsite}
                                            onChange={(e) => handleInputChange('companyWebsite', e.target.value)}
                                            className="w-full pl-8 sm:pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                                            placeholder="https://yourcompany.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        LinkedIn Profile
                                    </label>
                                    <div className="relative">
                                        <Linkedin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                                        <input
                                            type="url"
                                            value={formData.linkedinProfile}
                                            onChange={(e) => handleInputChange('linkedinProfile', e.target.value)}
                                            className="w-full pl-8 sm:pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                                            placeholder="https://linkedin.com/in/yourprofile"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Project Overview */}
                        {currentStep === 2 && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Project Title <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.projectTitle}
                                        onChange={(e) => handleInputChange('projectTitle', e.target.value)}
                                        className="w-full px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                                        placeholder="Give your project a descriptive title"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Brief Description of the Project <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={formData.projectDescription}
                                        onChange={(e) => handleInputChange('projectDescription', e.target.value)}
                                        rows={4}
                                        className="w-full px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                                        placeholder="Describe your project in detail - what problem does it solve, who is it for, what are your goals?"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            What stage is your project in? <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={formData.projectStage}
                                            onChange={(e) => handleInputChange('projectStage', e.target.value)}
                                            className="w-full px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                                            required
                                        >
                                            <option value="">Select project stage</option>
                                            <option value="idea">Idea</option>
                                            <option value="prototype">Prototype</option>
                                            <option value="mvp">MVP</option>
                                            <option value="scaling">Scaling</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            What type of solution are you seeking? <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={formData.solutionType}
                                            onChange={(e) => handleInputChange('solutionType', e.target.value)}
                                            className="w-full px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                                            required
                                        >
                                            <option value="">Select solution type</option>
                                            <option value="software">Software Engineering</option>
                                            <option value="hardware">Hardware Engineering</option>
                                            <option value="ai">AI/Intelligent Systems</option>
                                            <option value="fullstack">Full-stack Innovation</option>
                                            <option value="web">Web Development</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Uploads */}
                        {currentStep === 3 && (
                            <div className="space-y-6">
                                <FileUpload
                                    label="Upload Project Brief"
                                    description="PDF, DOCX, or PPTX format"
                                    file={formData.projectBrief}
                                    onFileSelect={(file) => handleInputChange('projectBrief', file)}
                                    accept=".pdf,.docx,.pptx"
                                />

                                <FileUpload
                                    label="Upload Reference Images or Sketches"
                                    description="Images that help explain your project vision"
                                    file={formData.referenceImages}
                                    onFileSelect={(file) => handleInputChange('referenceImages', file)}
                                    accept=".jpg,.jpeg,.png,.pdf"
                                />

                                <FileUpload
                                    label="Upload Your Profile Photo or Company Logo"
                                    description="Recommended for better personalization"
                                    file={formData.profilePhoto}
                                    onFileSelect={(file) => handleInputChange('profilePhoto', file)}
                                    accept=".jpg,.jpeg,.png"
                                />
                            </div>
                        )}

                        {/* Step 4: Timeline & Budget */}
                        {currentStep === 4 && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Ideal Start Date <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                                            <input
                                                type="date"
                                                value={formData.startDate}
                                                onChange={(e) => handleInputChange('startDate', e.target.value)}
                                                className="w-full pl-8 sm:pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Project Budget <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        {/* Currency Selector */}
                                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                                            <button
                                                type="button"
                                                onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                                                className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <span className="font-medium text-lg">{selectedCurrency}</span>
                                                <ChevronRight className={`w-3 h-3 transform transition-transform ${showCurrencyDropdown ? 'rotate-90' : ''}`} />
                                            </button>

                                            {showCurrencyDropdown && (
                                                <div className="absolute top-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg py-1 min-w-[100px] z-20">
                                                    {currencies.map((currency) => (
                                                        <button
                                                            key={currency.name}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedCurrency(currency.symbol);
                                                                setShowCurrencyDropdown(false);
                                                            }}
                                                            className="w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors flex items-center justify-between text-sm"
                                                        >
                                                            <span className="font-medium">{currency.symbol}</span>
                                                            <span className="text-xs text-gray-500">{currency.name}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <input
                                            type="text"
                                            value={formData.budgetRange}
                                            onChange={(e) => handleInputChange('budgetRange', e.target.value)}
                                            className="w-full pl-16 sm:pl-20 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                                            placeholder="Enter your project budget"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 5: Collaboration Preferences */}
                        {currentStep === 5 && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-4">
                                        Do you have an internal tech team? <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0">
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="hasInternalTeam"
                                                value="yes"
                                                checked={formData.hasInternalTeam === 'yes'}
                                                onChange={(e) => handleInputChange('hasInternalTeam', e.target.value)}
                                                className="mr-2"
                                                required
                                            />
                                            <span className="text-sm sm:text-base">Yes</span>
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="hasInternalTeam"
                                                value="no"
                                                checked={formData.hasInternalTeam === 'no'}
                                                onChange={(e) => handleInputChange('hasInternalTeam', e.target.value)}
                                                className="mr-2"
                                                required
                                            />
                                            <span className="text-sm sm:text-base">No</span>
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-4">
                                        Would you like to schedule a discovery call? <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0">
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="scheduleCall"
                                                value="yes"
                                                checked={formData.scheduleCall === 'yes'}
                                                onChange={(e) => handleInputChange('scheduleCall', e.target.value)}
                                                className="mr-2"
                                                required
                                            />
                                            <span className="text-sm sm:text-base">Yes</span>
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="scheduleCall"
                                                value="no"
                                                checked={formData.scheduleCall === 'no'}
                                                onChange={(e) => handleInputChange('scheduleCall', e.target.value)}
                                                className="mr-2"
                                                required
                                            />
                                            <span className="text-sm sm:text-base">No</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Add Consultation option when user selects "Yes" for scheduling call */}
                                {formData.scheduleCall === 'yes' && (
                                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <p className="text-sm text-blue-700 mb-3">
                                            You can schedule a discovery call now or after submitting the form.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={handleConsultationClick}
                                            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                                        >
                                            <Calendar className="w-4 h-4" />
                                            <span>Schedule Call Now</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 6: Legal & Consent */}
                        {currentStep === 6 && (
                            <div className="space-y-6">
                                <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Legal & Consent</h3>

                                    <div className="space-y-4">
                                        <label className="flex items-start space-x-3">
                                            <input
                                                type="checkbox"
                                                checked={formData.termsAccepted}
                                                onChange={(e) => handleInputChange('termsAccepted', e.target.checked)}
                                                className="mt-1 flex-shrink-0"
                                                required
                                            />
                                            <span className="text-sm text-gray-700">
                                                I agree to Cereforge's <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a> and <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a> <span className="text-red-500">*</span>
                                            </span>
                                        </label>

                                        <label className="flex items-start space-x-3">
                                            <input
                                                type="checkbox"
                                                checked={formData.contactConsent}
                                                onChange={(e) => handleInputChange('contactConsent', e.target.checked)}
                                                className="mt-1 flex-shrink-0"
                                                required
                                            />
                                            <span className="text-sm text-gray-700">
                                                I consent to be contacted by the Cereforge team regarding my project <span className="text-red-500">*</span>
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 pt-6 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={handlePrevious}
                                disabled={currentStep === 1}
                                className={`flex items-center justify-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base ${currentStep === 1
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700 transform hover:scale-105'
                                    }`}
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span>Previous</span>
                            </button>

                            {currentStep < totalSteps ? (
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    className="flex items-center justify-center space-x-2 bg-blue-800 hover:bg-blue-900 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 text-sm sm:text-base"
                                >
                                    <span>Next</span>
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`flex items-center justify-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 text-sm sm:text-base ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                >
                                    {isUploadingFiles ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Uploading Files ({uploadProgress}%)...</span>
                                        </>
                                    ) : isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Submitting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Start Your Project</span>
                                            <ChevronRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </form>
                    {/* // Add error display after the form (optional): */}
                    {submissionError && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center space-x-2 text-red-600">
                                <AlertCircle className="w-5 h-5" />
                                <p className="font-medium">Submission Failed</p>
                            </div>

                            {/* Support both string and array error shapes */}
                            {Array.isArray(submissionError) ? (
                                <ul className="mt-1 space-y-1 text-sm text-red-600 list-disc list-inside">
                                    {submissionError.map((err, idx) => (
                                        <li key={idx}>
                                            {err.field ? <span className="font-medium">{err.field}: </span> : null}
                                            <span>{err.message}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-red-600 mt-1">{submissionError}</p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Consultation Modal */}
            {showConsultationModal && (
                <ConsultationBooking
                    isOpen={showConsultationModal}
                    onClose={() => setShowConsultationModal(false)}
                    mode="popup"
                />
            )}
        </div>
    );
};

export default GetStarted;