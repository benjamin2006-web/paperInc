import React, { useState, useEffect } from 'react';
import {
  FiPlus,
  FiX,
  FiRefreshCw,
  FiAlertCircle,
  FiCheckCircle,
  FiInfo,
} from 'react-icons/fi';
import api from '../services/api';

const ManageTrades = () => {
  const [trades, setTrades] = useState({});
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [newTrade, setNewTrade] = useState('');
  const [newTradeAbbr, setNewTradeAbbr] = useState('');
  const [showAbbrInput, setShowAbbrInput] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // Load categories and trades from database
  const loadData = async () => {
    setLoading(true);
    try {
      // Load categories first
      const categoriesResponse = await api.get('/categories');
      if (categoriesResponse.data && Array.isArray(categoriesResponse.data)) {
        setCategories(
          categoriesResponse.data.filter((cat) => cat.enabled !== false),
        );

        // Set first category as selected if available
        if (categoriesResponse.data.length > 0) {
          setSelectedCategory(categoriesResponse.data[0].id);
        }
      }

      // Load trades
      const tradesResponse = await api.get('/trades');
      if (tradesResponse.data && Object.keys(tradesResponse.data).length > 0) {
        setTrades(tradesResponse.data);
      } else {
        // Initialize empty trades object with categories
        const emptyTrades = {};
        categoriesResponse.data.forEach((cat) => {
          emptyTrades[cat.id] = [];
        });
        setTrades(emptyTrades);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setMessage({
        type: 'error',
        text: 'Failed to load data from database. Please try again.',
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Save trades to database
  const saveTradesToDatabase = async (updatedTrades) => {
    setSaving(true);
    try {
      await api.post('/trades', updatedTrades);
      return true;
    } catch (error) {
      console.error('Error saving trades:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const generateAbbreviation = (fullName) => {
    if (!fullName) return 'TRADE';
    const words = fullName.split(' ');
    if (words.length === 1) {
      return fullName.substring(0, 4).toUpperCase();
    }
    return words
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 5);
  };

  const handleAddTrade = async () => {
    if (!selectedCategory) {
      setMessage({ type: 'error', text: 'Please select a category first' });
      return;
    }

    if (!newTrade.trim()) {
      setMessage({ type: 'error', text: 'Please enter a trade name' });
      return;
    }

    const tradeName = newTrade.trim();
    const tradeAbbr = newTradeAbbr.trim() || generateAbbreviation(tradeName);
    const currentTrades = trades[selectedCategory] || [];

    if (currentTrades.find((t) => t.full === tradeName)) {
      setMessage({ type: 'error', text: 'Trade already exists!' });
      return;
    }

    const updatedTrades = {
      ...trades,
      [selectedCategory]: [
        ...currentTrades,
        { full: tradeName, abbr: tradeAbbr },
      ].sort((a, b) => a.full.localeCompare(b.full)),
    };

    try {
      await saveTradesToDatabase(updatedTrades);
      setTrades(updatedTrades);
      setNewTrade('');
      setNewTradeAbbr('');
      setShowAbbrInput(false);
      setMessage({
        type: 'success',
        text: `Trade "${tradeName}" (${tradeAbbr}) added successfully!`,
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to save trade to database. Please try again.',
      });
    }

    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleRemoveTrade = async (tradeToRemove) => {
    if (!selectedCategory) return;

    if (!confirm(`Are you sure you want to remove "${tradeToRemove.full}"?`))
      return;

    const currentTrades = trades[selectedCategory] || [];
    const updatedTradesList = currentTrades.filter(
      (t) => t.full !== tradeToRemove.full,
    );

    const updatedTrades = {
      ...trades,
      [selectedCategory]: updatedTradesList,
    };

    try {
      await saveTradesToDatabase(updatedTrades);
      setTrades(updatedTrades);
      setMessage({
        type: 'success',
        text: `Trade "${tradeToRemove.full}" removed successfully!`,
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to remove trade from database. Please try again.',
      });
    }

    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const getCategoryDisplayName = (categoryId) => {
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.name : categoryId;
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-white flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-12 h-12 border-4 border-gray-200 rounded-full animate-spin border-t-black mx-auto'></div>
          <p className='mt-4 text-gray-600'>Loading trades...</p>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className='min-h-screen bg-white flex items-center justify-center'>
        <div className='text-center'>
          <FiAlertCircle className='w-12 h-12 text-gray-400 mx-auto mb-4' />
          <h2 className='text-xl font-semibold text-gray-900 mb-2'>
            No Categories Found
          </h2>
          <p className='text-gray-600 mb-4'>
            Please add categories first before managing trades.
          </p>
          <button
            onClick={() => (window.location.href = '/admin/manage-categories')}
            className='px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition'
          >
            Go to Manage Categories
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-white'>
      <div className='max-w-5xl mx-auto px-4 py-8'>
        {/* Header */}
        <div className='flex justify-between items-center mb-8'>
          <div>
            <h1 className='text-3xl font-bold text-black mb-2'>
              Manage Trades
            </h1>
            <p className='text-gray-600'>
              Add and remove trades for each category
            </p>
          </div>
          {saving && (
            <div className='flex items-center gap-2 text-sm text-gray-500'>
              <div className='w-4 h-4 border-2 border-gray-300 rounded-full animate-spin border-t-black'></div>
              Saving...
            </div>
          )}
        </div>

        {/* Message Alerts */}
        {message.text && (
          <div
            className={`mb-6 p-4 rounded-lg border flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {message.type === 'success' ? (
              <FiCheckCircle className='w-5 h-5 flex-shrink-0' />
            ) : (
              <FiAlertCircle className='w-5 h-5 flex-shrink-0' />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Main Container */}
        <div className='border border-gray-200 rounded-xl p-6'>
          {/* Category Selector */}
          <div className='mb-6'>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Select Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className='w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition bg-white'
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Add Trade Section */}
          {selectedCategory && (
            <div className='mb-8 p-5 bg-gray-50 rounded-lg border border-gray-200'>
              <h3 className='text-lg font-semibold text-black mb-4'>
                Add New Trade to {getCategoryDisplayName(selectedCategory)}
              </h3>
              <div className='flex flex-col gap-3'>
                <div className='flex flex-col sm:flex-row gap-3'>
                  <input
                    type='text'
                    placeholder='Enter trade name (e.g., Electrical Installation)...'
                    value={newTrade}
                    onChange={(e) => setNewTrade(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === 'Enter' &&
                      !showAbbrInput &&
                      setShowAbbrInput(true)
                    }
                    className='flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition'
                  />
                  <button
                    type='button'
                    onClick={() => setShowAbbrInput(!showAbbrInput)}
                    className='flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition'
                  >
                    <FiInfo className='w-4 h-4' />
                    {showAbbrInput ? 'Cancel Abbreviation' : 'Add Abbreviation'}
                  </button>
                  <button
                    type='button'
                    onClick={handleAddTrade}
                    disabled={saving}
                    className='flex items-center justify-center gap-2 px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    <FiPlus className='w-5 h-5' />
                    Add Trade
                  </button>
                </div>

                {showAbbrInput && (
                  <div className='animate-in fade-in duration-200'>
                    <label className='block text-sm font-medium text-gray-600 mb-1'>
                      Abbreviation (optional)
                    </label>
                    <input
                      type='text'
                      placeholder={`e.g., ${generateAbbreviation(newTrade || 'TRADE')}`}
                      value={newTradeAbbr}
                      onChange={(e) =>
                        setNewTradeAbbr(e.target.value.toUpperCase())
                      }
                      className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition'
                    />
                    <p className='text-xs text-gray-500 mt-1'>
                      Leave empty to auto-generate abbreviation
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Trades List Section */}
          {selectedCategory && (
            <div>
              <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4'>
                <h3 className='text-lg font-semibold text-black'>
                  Existing Trades ({trades[selectedCategory]?.length || 0})
                </h3>
              </div>

              {trades[selectedCategory]?.length === 0 ? (
                <div className='text-center py-12 border-2 border-dashed border-gray-200 rounded-lg'>
                  <p className='text-gray-500'>
                    No trades found. Add some trades!
                  </p>
                </div>
              ) : (
                <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                  {trades[selectedCategory]?.map((trade) => (
                    <div
                      key={trade.full}
                      className='group flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition'
                    >
                      <div className='flex-1'>
                        <div className='flex items-center gap-2 flex-wrap'>
                          <span className='text-gray-900 text-sm font-medium'>
                            {trade.full}
                          </span>
                          <span className='text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full'>
                            {trade.abbr}
                          </span>
                        </div>
                      </div>
                      <button
                        type='button'
                        onClick={() => handleRemoveTrade(trade)}
                        disabled={saving}
                        className='p-1 text-gray-400 hover:text-red-600 transition disabled:opacity-50'
                        title='Remove trade'
                      >
                        <FiX className='w-4 h-4' />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageTrades;
