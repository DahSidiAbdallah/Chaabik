import React, { useState, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, ChevronDown, Loader } from 'lucide-react';
import { categories } from '../data';

interface SearchBarProps {
  onSearch: (query: string) => void;
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  isSearching?: boolean;
}

export function SearchBar({ onSearch, selectedCategory, onSelectCategory, isSearching = false }: SearchBarProps) {
  const { t } = useTranslation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  
  const selectedCategoryName = selectedCategory 
    ? t(`categories.${categories.find(c => c.id === selectedCategory)?.name}`)
    : t('header.allCategories');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearch(inputValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    onSearch(e.target.value);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row w-full gap-2">
      <div className="relative flex-grow">
        <input
          type="text"
          placeholder={t('header.search')}
          className="w-full p-3 pl-10 text-gray-800 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={inputValue}
          onChange={handleInputChange}
        />
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="w-5 h-5 text-gray-400" />
        </div>
      </div>
      
      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md flex items-center justify-center min-w-[100px]"
        disabled={isSearching || !inputValue.trim()}
      >
        {isSearching ? (
          <Loader className="w-5 h-5 animate-spin" />
        ) : (
          t('search.button', 'Search')
        )}
      </button>
    </form>
  );
}