import React, { useState, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';
import api from '@/lib/api';

interface GstRate {
  id: number;
  name: string;
  rate: number;
  description?: string;
  category?: string;
  isActive: boolean;
}

interface GstSelectorProps {
  selectedGstId?: number | null;
  onGstChange: (gstRate: GstRate | null) => void;
  category?: string; // Filter by category
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const GstSelector: React.FC<GstSelectorProps> = ({
  selectedGstId,
  onGstChange,
  category,
  placeholder = "Select GST rate (optional)",
  className = "",
  disabled = false
}) => {
  const [gstRates, setGstRates] = useState<GstRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchActiveGstRates();
  }, []);

  const fetchActiveGstRates = async () => {
    try {
      const response = await api.get('/gst/active');
      console.log('Fetched GST rates:', response.data); // Debug log
      setGstRates(response.data);
    } catch (error) {
      console.error('Error fetching GST rates:', error);
    } finally {
      setLoading(false);
    }
  };

  // Show all GST rates regardless of category for flexibility
  const filteredGstRates = gstRates;

  const selectedGst = gstRates.find(gst => gst.id === selectedGstId);

  const handleGstSelect = (gstRate: GstRate | null) => {
    onGstChange(gstRate);
    setIsOpen(false);
  };

  if (loading) {
    return (
      <div className={`relative ${className}`}>
        <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-500">Loading GST rates...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md text-left flex items-center justify-between ${
          disabled 
            ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
            : 'bg-white hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
        }`}
      >
        <span className={selectedGst ? 'text-gray-900' : 'text-gray-500'}>
          {selectedGst ? (
            <span className="flex items-center justify-between w-full">
              <span>{selectedGst.name}</span>
              <span className="text-sm text-gray-600">({selectedGst.rate}%)</span>
            </span>
          ) : (
            placeholder
          )}
        </span>
        <div className="flex items-center gap-1">
          {selectedGst && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleGstSelect(null);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {/* No GST option */}
          <button
            type="button"
            onClick={() => handleGstSelect(null)}
            className={`w-full px-3 py-2 text-left hover:bg-gray-50 ${
              !selectedGst ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>No GST</span>
              <span className="text-sm text-gray-500">(0%)</span>
            </div>
          </button>

          {filteredGstRates.length > 0 ? (
            filteredGstRates.map((gstRate) => (
              <button
                key={gstRate.id}
                type="button"
                onClick={() => handleGstSelect(gstRate)}
                className={`w-full px-3 py-2 text-left hover:bg-gray-50 ${
                  selectedGstId === gstRate.id ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{gstRate.name}</div>
                    {gstRate.description && (
                      <div className="text-xs text-gray-500 truncate">{gstRate.description}</div>
                    )}
                    {gstRate.category && (
                      <div className="text-xs text-blue-600 bg-blue-50 px-1 rounded mt-1 inline-block">
                        {gstRate.category}
                      </div>
                    )}
                  </div>
                  <span className="text-sm text-gray-600 font-medium">
                    {gstRate.rate}%
                  </span>
                </div>
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-gray-500 text-sm">
              No GST rates available
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GstSelector;