import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, ChevronDown } from 'lucide-react';
import { categories } from '../data';

interface SearchBarProps {
  onSearch: (query: string) => void;
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export function SearchBar({ onSearch, selectedCategory, onSelectCategory }: SearchBarProps) {
  const { t } = useTranslation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  
  const selectedCategoryName = selectedCategory 
    ? t(`categories.${categories.find(c => c.id === selectedCategory)?.name}`)
    : t('header.allCategories');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(inputValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    onSearch(e.target.value);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full flex items-center">
      <div className="relative">
        <button
          type="button"
          className="h-12 px-4 bg-yellow-50 text-gray-700 border border-r-0 border-yellow-200 rounded-l-lg hover:bg-yellow-100 focus:outline-none flex items-center justify-center gap-2 min-w-[160px]"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <span className="truncate">{selectedCategoryName}</span>
          <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
        </button>
        
        {isDropdownOpen && (
          <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-lg shadow-lg border border-yellow-200 py-1 z-50">
            <button
              type="button"
              className={`w-full text-left px-4 py-2 hover:bg-yellow-50 ${!selectedCategory ? 'text-blue-600 font-medium' : 'text-gray-700'}`}
              onClick={() => {
                onSelectCategory(null);
                setIsDropdownOpen(false);
              }}
            >
              {t('header.allCategories')}
            </button>
            {categories.map((category) => (
              <button
                type="button"
                key={category.id}
                className={`w-full text-left px-4 py-2 hover:bg-yellow-50 ${selectedCategory === category.id ? 'text-blue-600 font-medium' : 'text-gray-700'}`}
                onClick={() => {
                  onSelectCategory(category.id);
                  setIsDropdownOpen(false);
                }}
              >
                {t(`categories.${category.name}`)}
              </button>
            ))}
          </div>
        )}
      </div>
      
      <div className="relative flex-grow">
        <input
          type="text"
          placeholder={t('header.search')}
          className="w-full h-12 px-4 pl-12 border-t border-b border-yellow-200 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-colors text-gray-900 bg-white placeholder-gray-400"
          value={inputValue}
          onChange={handleInputChange}
          style={{ borderRadius: 0 }}
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
      </div>
      <button 
        type="submit" 
        className="h-12 flex items-center justify-center px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-r-lg font-semibold border border-l-0 border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
      >
        {t('search.submit', 'Rechercher')}
      </button>
    </form>
  );
}