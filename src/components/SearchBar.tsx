import React, { useState, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Loader } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isSearching?: boolean;
}

export function SearchBar({ onSearch, isSearching = false }: SearchBarProps) {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('');
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSearch(inputValue);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row w-full gap-2">
      <div className="relative flex-grow">
        <input
          type="text"
          placeholder={t('header.search')}
          className="w-full p-3 pl-10 text-gray-800 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
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