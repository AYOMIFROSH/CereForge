import React, { useState } from 'react';
import { X, Clock, Video, CheckCircle, User, Mail, Building, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs, { Dayjs } from 'dayjs';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

interface ConsultationBookingProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConsultationBooking: React.FC<ConsultationBookingProps> = ({ isOpen, onClose }) => {
  useDocumentTitle(
    "Cereforge - Discovery Consultation Booking",
    " Discovery, Consultation, Technical Review, Follow-up Meeting",
    "/Consultation "
  );
  const [step, setStep] = useState(1);
  const [consultationType, setConsultationType] = useState<'discovery' | 'technical' | 'follow-up'>('discovery');
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    projectDescription: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Generate available dates (next 30 business days)
  const getAvailableDates = (): Dayjs[] => {
    const dates: Dayjs[] = [];
    let currentDate = dayjs().add(1, 'day');

    while (dates.length < 20) {
      if (currentDate.day() !== 0 && currentDate.day() !== 6) {
        dates.push(currentDate);
      }
      currentDate = currentDate.add(1, 'day');
    }
    return dates;
  };

  // Generate time slots
  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00'
  ];

  const consultationTypes = [
    {
      id: 'discovery' as const,
      title: 'Discovery Call',
      duration: '30 minutes',
      description: 'Initial project discussion and requirements gathering',
      icon: '🎯',
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'technical' as const,
      title: 'Technical Review',
      duration: '60 minutes',
      description: 'Deep dive into technical architecture and implementation',
      icon: '⚙️',
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'follow-up' as const,
      title: 'Follow-up Meeting',
      duration: '30 minutes',
      description: 'Progress review and next steps discussion',
      icon: '📊',
      color: 'from-orange-500 to-orange-600'
    }
  ];

  const handleSubmit = () => {
    console.log('Booking submitted:', {
      type: consultationType,
      date: selectedDate?.format('YYYY-MM-DD'),
      time: selectedTime,
      ...formData
    });
    setIsSubmitted(true);
  };

  const resetForm = () => {
    setStep(1);
    setConsultationType('discovery');
    setSelectedDate(null);
    setSelectedTime('');
    setFormData({ name: '', email: '', company: '', projectDescription: '' });
    setIsSubmitted(false);
  };

  if (!isOpen) return null;

  if (isSubmitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-12 h-12 text-green-600" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Consultation Booked!</h2>
          <p className="text-gray-600 mb-2">
            Your {consultationTypes.find(t => t.id === consultationType)?.title.toLowerCase()} has been scheduled for:
          </p>
          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <p className="font-semibold text-blue-900">
              {selectedDate?.format('dddd, MMMM D, YYYY')}
            </p>
            <p className="text-blue-700">{selectedTime}</p>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            We've sent a confirmation email to <strong>{formData.email}</strong> with meeting details and calendar invite.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all"
            >
              Done
            </button>
            <button
              onClick={resetForm}
              className="w-full px-6 py-3 text-blue-600 hover:bg-blue-50 font-semibold rounded-xl transition-all"
            >
              Book Another Consultation
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-800 to-blue-900 px-6 py-5 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Video className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Schedule Consultation</h2>
              <p className="text-blue-200 text-sm">Book a meeting with our team</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </motion.button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {[1, 2, 3, 4].map((num) => (
              <React.Fragment key={num}>
                <div className="flex flex-col items-center">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all
                      ${step >= num ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}
                    `}
                  >
                    {num}
                  </div>
                  <span className="text-xs mt-1 text-gray-600 hidden sm:block">
                    {num === 1 && 'Type'}
                    {num === 2 && 'Date'}
                    {num === 3 && 'Time'}
                    {num === 4 && 'Details'}
                  </span>
                </div>
                {num < 4 && <div className={`flex-1 h-1 mx-2 ${step > num ? 'bg-blue-600' : 'bg-gray-200'}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 min-h-[400px]">
          <AnimatePresence mode="wait">
            {/* Step 1: Consultation Type */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-6">Choose Consultation Type</h3>
                {consultationTypes.map((type) => (
                  <motion.div
                    key={type.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setConsultationType(type.id)}
                    className={`
                      p-6 rounded-xl border-2 cursor-pointer transition-all
                      ${consultationType === type.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                      }
                    `}
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`w-14 h-14 bg-gradient-to-br ${type.color} rounded-xl flex items-center justify-center text-2xl`}>
                        {type.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-lg font-bold text-gray-900">{type.title}</h4>
                          <span className="text-sm font-semibold text-gray-600">{type.duration}</span>
                        </div>
                        <p className="text-gray-600">{type.description}</p>
                      </div>
                      {consultationType === type.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center"
                        >
                          <CheckCircle className="w-5 h-5 text-white" />
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Step 2: Date Selection */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h3 className="text-xl font-bold text-gray-900 mb-6">Select Date</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto">
                  {getAvailableDates().map((date) => (
                    <motion.button
                      key={date.format('YYYY-MM-DD')}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedDate(date)}
                      className={`
                        p-4 rounded-xl border-2 transition-all text-center
                        ${selectedDate?.format('YYYY-MM-DD') === date.format('YYYY-MM-DD')
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                        }
                      `}
                    >
                      <div className="text-sm font-semibold text-gray-600">{date.format('ddd')}</div>
                      <div className="text-2xl font-bold text-gray-900">{date.format('D')}</div>
                      <div className="text-sm text-gray-600">{date.format('MMM')}</div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3: Time Selection */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h3 className="text-xl font-bold text-gray-900 mb-2">Select Time</h3>
                <p className="text-gray-600 mb-6">{selectedDate?.format('dddd, MMMM D, YYYY')}</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {timeSlots.map((time) => (
                    <motion.button
                      key={time}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedTime(time)}
                      className={`
                        px-4 py-3 rounded-xl border-2 font-semibold transition-all
                        ${selectedTime === time
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-blue-300 text-gray-700'
                        }
                      `}
                    >
                      <Clock className="w-4 h-4 inline mr-1" />
                      {time}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 4: Contact Details */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-6">Your Details</h3>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Building className="w-4 h-4 inline mr-1" />
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    placeholder="Your company name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Project Description
                  </label>
                  <textarea
                    value={formData.projectDescription}
                    onChange={(e) => setFormData({ ...formData, projectDescription: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none"
                    placeholder="Brief description of your project or what you'd like to discuss"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between rounded-b-2xl">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className={`
              flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all
              ${step === 1
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Back</span>
          </button>

          {step < 4 ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 1 && !consultationType) ||
                (step === 2 && !selectedDate) ||
                (step === 3 && !selectedTime)
              }
              className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Next</span>
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmit}
              disabled={!formData.name || !formData.email}
              className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="w-5 h-5" />
              <span>Confirm Booking</span>
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ConsultationBooking;