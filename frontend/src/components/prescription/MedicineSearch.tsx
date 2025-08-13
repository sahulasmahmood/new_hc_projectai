import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Clock, Package } from 'lucide-react';
import api from '@/lib/api';

interface InventoryItem {
  id: number;
  name: string;
  code: string;
  category: string;
  unit: string;
  stock: number;
  dosage: string;
  frequency: string;
  duration: string;
  type: string;
  displayName: string;
  isFrequent?: boolean;
}

interface MedicineSearchProps {
  onSelectMedicine: (item: InventoryItem) => void;
  placeholder?: string;
  doctorId?: string;
}

const MedicineSearch: React.FC<MedicineSearchProps> = ({
  onSelectMedicine,
  placeholder = "Search inventory items (medicines, syringes, devices, etc.)...",
  doctorId
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<InventoryItem[]>([]);
  const [frequentMedicines, setFrequentMedicines] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<{name: string, count: number}[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categoryMedicines, setCategoryMedicines] = useState<InventoryItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch frequent medicines and categories on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch categories
        const categoriesResponse = await api.get('/medicines/categories');
        setCategories(categoriesResponse.data.slice(0, 6)); // Top 6 categories

        // Fetch frequent medicines if doctorId provided
        if (doctorId) {
          const frequentResponse = await api.get(`/medicines/frequent?doctorId=${doctorId}&limit=5`);
          setFrequentMedicines(frequentResponse.data);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };

    fetchInitialData();
  }, [doctorId]);

  // Search inventory items as user types
  useEffect(() => {
    const searchInventoryItems = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const response = await api.get(`/medicines/search?q=${encodeURIComponent(searchQuery)}&limit=8`);
        setSearchResults(response.data);
        setShowDropdown(true);
        setActiveIndex(-1);
      } catch (error) {
        console.error('Error searching inventory items:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchInventoryItems, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Fetch items by category
  const fetchCategoryMedicines = async (category: string) => {
    try {
      const response = await api.get(`/medicines/category?category=${encodeURIComponent(category)}&limit=10`);
      setCategoryMedicines(response.data);
      setSelectedCategory(category);
    } catch (error) {
      console.error('Error fetching category items:', error);
    }
  };

  // Handle item selection
  const handleSelectMedicine = (item: InventoryItem) => {
    onSelectMedicine(item);
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
    setSelectedCategory('');
    setCategoryMedicines([]);
    searchInputRef.current?.focus();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => (prev > 0 ? prev - 1 : searchResults.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && searchResults[activeIndex]) {
          handleSelectMedicine(searchResults[activeIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setActiveIndex(-1);
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => searchQuery.length >= 2 && setShowDropdown(true)}
            className="pl-10 pr-4"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showDropdown && searchResults.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-y-auto">
            {searchResults.map((item, index) => (
              <div
                key={item.id}
                className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-blue-50 ${
                  index === activeIndex ? 'bg-blue-50' : ''
                }`}
                onClick={() => handleSelectMedicine(item)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.displayName}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      <span className="inline-flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        Stock: {item.stock} {item.unit}
                      </span>
                      <span className="ml-3">{item.category}</span>
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-600">
                    <div>{item.type}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recently Used Items */}
      {frequentMedicines.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Recently Prescribed</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {frequentMedicines.map((item, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleSelectMedicine({...item, displayName: item.name})}
                className="text-xs h-8"
              >
                <Plus className="h-3 w-3 mr-1" />
                {item.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Inventory Categories */}
      {categories.length > 0 && (
        <div>
          <div className="text-sm font-medium text-gray-700 mb-2">Quick Categories</div>
          <div className="flex flex-wrap gap-2 mb-3">
            {categories.map((category) => (
              <Badge
                key={category.name}
                variant={selectedCategory === category.name ? "default" : "outline"}
                className="cursor-pointer hover:bg-blue-100"
                onClick={() => fetchCategoryMedicines(category.name)}
              >
                {category.name} ({category.count})
              </Badge>
            ))}
          </div>

          {/* Category Items */}
          {selectedCategory && categoryMedicines.length > 0 && (
            <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
              <div className="text-sm font-medium mb-2">{selectedCategory} Items</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {categoryMedicines.map((item) => (
                  <Button
                    key={item.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSelectMedicine(item)}
                    className="justify-start text-xs h-8 p-2"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    <span className="truncate">{item.displayName}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MedicineSearch;