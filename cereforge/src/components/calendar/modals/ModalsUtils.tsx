// src/components/calendar/modals/ModalUtils.tsx
import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================
// BASE MODAL WRAPPER
// ============================================

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

export const BaseModal: React.FC<BaseModalProps> = ({
  isOpen,
  children,
  size = 'md',
  className = ''
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-3xl',
    full: 'max-w-7xl'
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className={`bg-white rounded-2xl shadow-2xl w-full ${sizeClasses[size]} ${className} my-8`}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// ============================================
// MODAL HEADER
// ============================================

interface ModalHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onClose: () => void;
  actions?: React.ReactNode;
  gradient?: string;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({
  title,
  subtitle,
  icon,
  onClose,
  actions,
  gradient = 'from-blue-800 to-blue-900'
}) => {
  return (
    <div className={`bg-gradient-to-r ${gradient} px-6 py-4 flex items-center justify-between sticky top-0 z-10 rounded-t-2xl`}>
      <div className="flex items-center space-x-3">
        {icon && (
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-xl font-bold text-white">{title}</h2>
          {subtitle && <p className="text-blue-200 text-sm">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {actions}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClose}
          className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  );
};

// ============================================
// MODAL FOOTER
// ============================================

interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const ModalFooter: React.FC<ModalFooterProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between sticky bottom-0 rounded-b-2xl ${className}`}>
      {children}
    </div>
  );
};

// ============================================
// CONFIRMATION MODAL
// ============================================

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  icon: React.ReactNode;
  iconBgColor?: string;
  confirmText?: string;
  confirmColor?: string;
  cancelText?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  icon,
  iconBgColor = 'bg-blue-100',
  confirmText = 'Confirm',
  confirmColor = 'bg-blue-600 hover:bg-blue-700',
  cancelText = 'Cancel'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
      >
        <div className="text-center mb-6">
          <div className={`w-16 h-16 ${iconBgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
            {icon}
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600">{message}</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 px-4 py-3 ${confirmColor} text-white font-semibold rounded-xl transition-colors`}
          >
            {confirmText}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ============================================
// CHOICE MODAL (Multiple Options)
// ============================================

interface ChoiceOption {
  label: string;
  value: string;
  icon?: React.ReactNode;
  color?: string;
}

interface ChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  title: string;
  message: string;
  options: ChoiceOption[];
  icon?: React.ReactNode;
  showCancel?: boolean;
}

export const ChoiceModal: React.FC<ChoiceModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  title,
  message,
  options,
  icon,
  showCancel = true
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
      >
        <div className="text-center mb-6">
          {icon && (
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {icon}
            </div>
          )}
          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600">{message}</p>
        </div>
        <div className="space-y-3">
          {options.map((option) => (
            <motion.button
              key={option.value}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onSelect(option.value);
                onClose();
              }}
              className={`w-full px-6 py-3 ${option.color || 'bg-blue-600 hover:bg-blue-700'} text-white font-semibold rounded-xl transition-all flex items-center justify-center space-x-2`}
            >
              {option.icon}
              <span>{option.label}</span>
            </motion.button>
          ))}
          {showCancel && (
            <button
              onClick={onClose}
              className="w-full text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors py-2"
            >
              Cancel
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// ============================================
// SCROLLABLE CONTENT WRAPPER
// ============================================

interface ScrollableContentProps {
  children: React.ReactNode;
  maxHeight?: string;
  className?: string;
}

export const ScrollableContent: React.FC<ScrollableContentProps> = ({
  children,
  maxHeight = 'calc(90vh - 160px)',
  className = ''
}) => {
  return (
    <div 
      className={`overflow-y-auto ${className}`}
      style={{ maxHeight }}
    >
      {children}
    </div>
  );
};