import React, { useState } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PublicHolidayFilterProps {
  showHolidays: boolean;
  onToggleHolidays: () => void;
  selectedCountry: string;
  onSelectCountry: (countryCode: string) => void;
}

const COUNTRIES = [
  { code: 'NG', name: 'Nigeria' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IN', name: 'India' },
];

const PublicHolidayFilter: React.FC<PublicHolidayFilterProps> = ({
  showHolidays,
  onToggleHolidays,
  selectedCountry,
  onSelectCountry
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const currentCountryName = COUNTRIES.find(c => c.code === selectedCountry)?.name || selectedCountry;

  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 mt-4">
      <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
        <Globe className="w-4 h-4 text-gray-500" />
        Public Holidays
      </h3>

      {/* Toggle Checkbox */}
      <motion.label
        whileHover={{ x: 4 }}
        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-all mb-3"
      >
        <div className="relative">
          <input
            type="checkbox"
            checked={showHolidays}
            onChange={onToggleHolidays}
            className="sr-only"
          />
          <div
            className={`
              w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all
              ${showHolidays ? 'border-transparent bg-green-600' : 'border-gray-300 bg-transparent'}
            `}
          >
            {showHolidays && <Check className="w-3.5 h-3.5 text-white" />}
          </div>
        </div>
        <span className="text-sm font-medium text-gray-700 select-none">Show Holidays</span>
      </motion.label>

      {/* Country Selector */}
      <AnimatePresence>
        {showHolidays && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-full flex items-center justify-between px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-blue-400 hover:text-blue-600 transition-all"
              >
                <span className="truncate">{currentCountryName}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                  {COUNTRIES.map((country) => (
                    <button
                      key={country.code}
                      onClick={() => {
                        onSelectCountry(country.code);
                        setShowDropdown(false);
                      }}
                      className={`
                        w-full text-left px-3 py-2 text-xs hover:bg-blue-50 transition-colors
                        ${selectedCountry === country.code ? 'text-blue-600 font-bold bg-blue-50' : 'text-gray-700'}
                      `}
                    >
                      {country.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PublicHolidayFilter;