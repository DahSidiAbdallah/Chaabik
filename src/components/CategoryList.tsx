import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Category } from '../types';
import * as LucideIcons from 'lucide-react';
import { ChevronDown } from 'lucide-react';

interface CategoryItemProps {
  category: Category;
  isSelected: boolean;
  onClick: () => void;
  onSubcategorySelect: (subcategoryId: string) => void;
}

function CategoryItem({ category, isSelected, onClick, onSubcategorySelect }: CategoryItemProps) {
  const { t } = useTranslation();
  const IconComponent = LucideIcons[category.icon as keyof typeof LucideIcons];
  const [showSubcategories, setShowSubcategories] = useState(false);
  
  const handleClick = () => {
    onClick();
    setShowSubcategories(!showSubcategories);
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className={`flex flex-col items-center p-4 rounded-lg transition-all w-full ${
          isSelected
            ? 'bg-yellow-100 text-yellow-800'
            : 'hover:bg-yellow-50 text-gray-600'
        }`}
      >
        <div className="flex items-center gap-2">
          {IconComponent && <IconComponent className="w-6 h-6" />}
          <ChevronDown className={`w-4 h-4 transition-transform ${showSubcategories ? 'rotate-180' : ''}`} />
        </div>
        <span className="text-sm font-medium mt-2">{t(`categories.${category.name}`)}</span>
      </button>

      {showSubcategories && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {category.subcategories.map((subcategory) => (
            <button
              key={subcategory.id}
              onClick={() => onSubcategorySelect(subcategory.id)}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-yellow-50 transition-colors"
            >
              {t(`subcategories.${subcategory.name}`)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface CategoryListProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  onSubcategorySelect: (subcategoryId: string) => void;
}

export function CategoryList({
  categories,
  selectedCategory,
  onSelectCategory,
  onSubcategorySelect,
}: CategoryListProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4">
      {categories.map((category) => (
        <CategoryItem
          key={category.id}
          category={category}
          isSelected={selectedCategory === category.id}
          onClick={() => onSelectCategory(
            selectedCategory === category.id ? null : category.id
          )}
          onSubcategorySelect={onSubcategorySelect}
        />
      ))}
    </div>
  );
}