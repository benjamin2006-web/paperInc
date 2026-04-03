
// src/pages/CategoriesPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CategorySelector from '../components/CategorySelector';
import UserLayout from '../components/UserLayout';

const CategoriesPage = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState(null);

  const handleSelectCategory = (category) => {
    setSelectedCategory(category);
    // Navigate to home with category parameter
    navigate(`/?category=${category._id || category.id}`);
  };

  const handleSearch = (query) => {
    if (query) {
      navigate(`/?search=${encodeURIComponent(query)}`);
    }
  };

  return (
    <UserLayout onSearch={handleSearch}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <CategorySelector
            categories={[]}
            onSelectCategory={handleSelectCategory}
            loading={false}
          />
        </div>
      </div>
    </UserLayout>
  );
};

export default CategoriesPage;
