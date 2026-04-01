import React, { useState, useEffect, useMemo } from 'react';
import {
  FiSearch,
  FiTrash2,
  FiAlertCircle,
  FiCheckCircle,
  FiCalendar,
  FiBookOpen,
  FiX,
  FiRefreshCw,
  FiDownload,
  FiEye,
  FiStar,
  FiFilter,
  FiChevronDown,
  FiChevronUp,
} from 'react-icons/fi';
import api from '../services/api';

const ManageExams = () => {
  const [papers, setPapers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterTrade, setFilterTrade] = useState('');
  const [filterVIP, setFilterVIP] = useState('all');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedPapers, setSelectedPapers] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const years = useMemo(
    () => [...new Set(papers.map((p) => p.year))].sort((a, b) => b - a),
    [papers],
  );

  const trades = useMemo(
    () =>
      [...new Set(papers.filter((p) => p.trade).map((p) => p.trade))].sort(),
    [papers],
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const categoriesResponse = await api.get('/categories');
      console.log('Categories response:', categoriesResponse.data);
      
      if (Array.isArray(categoriesResponse.data)) {
        setCategories(categoriesResponse.data.filter((cat) => cat.enabled !== false));
      } else if (categoriesResponse.data?.data && Array.isArray(categoriesResponse.data.data)) {
        setCategories(categoriesResponse.data.data.filter((cat) => cat.enabled !== false));
      } else {
        setCategories([]);
      }

      await fetchPapers();
    } catch (error) {
      console.error('Error loading data:', error);
      setMessage({
        type: 'error',
        text: 'Failed to load data. Please refresh the page.',
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } finally {
      setLoading(false);
    }
  };

  const fetchPapers = async () => {
    try {
      // ✅ Use high limit to get ALL papers
      const response = await api.get('/papers?limit=10000&page=1');
      console.log('Papers response:', response.data);
      
      let papersData = [];
      if (Array.isArray(response.data)) {
        papersData = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        papersData = response.data.data;
      }
      
      setPapers(papersData);
      console.log(`✅ Loaded ${papersData.length} papers (total: ${response.data?.pagination?.total || papersData.length})`);
    } catch (error) {
      console.error('Error fetching papers:', error);
      setPapers([]);
    }
  };

  const handleDelete = async (id, filename) => {
    if (!confirm(`Are you sure you want to delete "${filename}"?`)) return;

    try {
      await api.delete(`/papers/${id}`);
      setMessage({ type: 'success', text: 'Paper deleted successfully!' });
      await fetchPapers();
      setSelectedPapers([]);
      setSelectAll(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Delete error:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Delete failed' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm('Delete ALL papers? This cannot be undone!')) return;

    try {
      const promises = papers.map((paper) => api.delete(`/papers/${paper._id}`));
      await Promise.all(promises);
      setMessage({ type: 'success', text: 'All papers deleted successfully!' });
      await fetchPapers();
      setSelectedPapers([]);
      setSelectAll(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Bulk delete error:', error);
      setMessage({ type: 'error', text: 'Bulk delete failed' });
    }
  };

  const handleSelectPaper = (id) => {
    setSelectedPapers((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id],
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedPapers([]);
    } else {
      setSelectedPapers(filteredPapers.map((p) => p._id));
    }
    setSelectAll(!selectAll);
  };

  const handleDeleteSelected = async () => {
    if (selectedPapers.length === 0) return;
    if (!confirm(`Delete ${selectedPapers.length} selected paper(s)?`)) return;

    try {
      const promises = selectedPapers.map((id) => api.delete(`/papers/${id}`));
      await Promise.all(promises);
      setMessage({
        type: 'success',
        text: `${selectedPapers.length} paper(s) deleted successfully!`,
      });
      setSelectedPapers([]);
      setSelectAll(false);
      await fetchPapers();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Delete selected error:', error);
      setMessage({ type: 'error', text: 'Bulk delete failed' });
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    await fetchPapers();
    setLoading(false);
    setMessage({ type: 'success', text: 'Papers refreshed!' });
    setTimeout(() => setMessage({ type: '', text: '' }), 2000);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterCategory('');
    setFilterYear('');
    setFilterTrade('');
    setFilterVIP('all');
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filteredPapers = useMemo(() => {
    let filtered = papers.filter((paper) => {
      const matchesSearch =
        paper.filename?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        paper.title?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        !filterCategory || paper.category === filterCategory;
      const matchesYear = !filterYear || paper.year === parseInt(filterYear);
      const matchesTrade = !filterTrade || paper.trade === filterTrade;
      const matchesVIP =
        filterVIP === 'all' ||
        (filterVIP === 'vip' && paper.isVIPOnly) ||
        (filterVIP === 'free' && !paper.isVIPOnly);
      return (
        matchesSearch &&
        matchesCategory &&
        matchesYear &&
        matchesTrade &&
        matchesVIP
      );
    });

    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === 'year') {
        aVal = a.year || 0;
        bVal = b.year || 0;
      } else if (sortField === 'createdAt') {
        aVal = new Date(a.createdAt);
        bVal = new Date(b.createdAt);
      } else if (sortField === 'filename') {
        aVal = (a.filename || a.title || '').toLowerCase();
        bVal = (b.filename || b.title || '').toLowerCase();
      } else if (sortField === 'category') {
        aVal = getCategoryDisplayName(a.category).toLowerCase();
        bVal = getCategoryDisplayName(b.category).toLowerCase();
      } else if (sortField === 'trade') {
        aVal = (a.trade || '').toLowerCase();
        bVal = (b.trade || '').toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [papers, searchTerm, filterCategory, filterYear, filterTrade, filterVIP, sortField, sortOrder]);

  const getCategoryDisplayName = (categoryId) => {
    const category = categories.find((c) => c._id === categoryId || c.id === categoryId);
    return category ? category.name : categoryId || 'Unknown';
  };

  const hasActiveFilters = searchTerm || filterCategory || filterYear || filterTrade || filterVIP !== 'all';

  const getSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? (
      <FiChevronUp className='w-4 h-4 inline ml-1' />
    ) : (
      <FiChevronDown className='w-4 h-4 inline ml-1' />
    );
  };

  const exportToCSV = () => {
    const headers = ['Filename', 'Category', 'Trade', 'Year', 'VIP Only', 'Uploaded'];
    const rows = filteredPapers.map((paper) => [
      paper.filename || paper.title,
      getCategoryDisplayName(paper.category),
      paper.trade || '-',
      paper.year,
      paper.isVIPOnly ? 'Yes' : 'No',
      new Date(paper.createdAt).toLocaleDateString(),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `exam_papers_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className='min-h-screen bg-white'>
      <div className='max-w-7xl mx-auto px-4 py-8'>
        {/* Header */}
        <div className='flex justify-between items-center mb-8 flex-wrap gap-4'>
          <div>
            <h1 className='text-3xl font-bold text-black mb-2'>Manage Exams</h1>
            <p className='text-gray-600'>
              View, search, filter, and delete exam papers
            </p>
          </div>
          <div className='flex gap-2'>
            {filteredPapers.length > 0 && (
              <button
                onClick={exportToCSV}
                className='flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition'
              >
                <FiDownload className='w-4 h-4' />
                Export CSV
              </button>
            )}
            <button
              onClick={handleRefresh}
              className='flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition'
            >
              <FiRefreshCw className='w-4 h-4' />
              Refresh
            </button>
          </div>
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
          {/* Toolbar */}
          <div className='flex flex-wrap gap-4 mb-6'>
            <div className='flex-1 min-w-[200px]'>
              <div className='relative'>
                <FiSearch className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                <input
                  type='text'
                  placeholder='Search by filename...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition'
                />
              </div>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition ${
                showFilters
                  ? 'bg-gray-100 border-gray-400'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <FiFilter className='w-4 h-4' />
              Filters
              {hasActiveFilters && (
                <span className='w-2 h-2 bg-blue-500 rounded-full'></span>
              )}
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className='flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition'
              >
                <FiX className='w-4 h-4' />
                Clear Filters
              </button>
            )}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg'>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition bg-white'
              >
                <option value=''>All Categories</option>
                {categories.map((cat) => (
                  <option key={cat._id || cat.id} value={cat._id || cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              {years.length > 0 && (
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition bg-white'
                >
                  <option value=''>All Years</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              )}

              {trades.length > 0 && (
                <select
                  value={filterTrade}
                  onChange={(e) => setFilterTrade(e.target.value)}
                  className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition bg-white'
                >
                  <option value=''>All Trades</option>
                  {trades.map((trade) => (
                    <option key={trade} value={trade}>
                      {trade}
                    </option>
                  ))}
                </select>
              )}

              <select
                value={filterVIP}
                onChange={(e) => setFilterVIP(e.target.value)}
                className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition bg-white'
              >
                <option value='all'>All Papers</option>
                <option value='vip'>VIP Only</option>
                <option value='free'>Free Papers</option>
              </select>
            </div>
          )}

          {/* Action Buttons */}
          <div className='flex flex-wrap gap-4 mb-6'>
            {selectedPapers.length > 0 && (
              <button
                onClick={handleDeleteSelected}
                className='flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition'
              >
                <FiTrash2 className='w-4 h-4' />
                Delete Selected ({selectedPapers.length})
              </button>
            )}

            {papers.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className='flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition'
              >
                <FiTrash2 className='w-4 h-4' />
                Delete All ({papers.length})
              </button>
            )}
          </div>

          {/* Stats Cards */}
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
            <div className='bg-gray-50 rounded-lg p-4 text-center border border-gray-200'>
              <span className='block text-2xl font-bold text-black'>{papers.length}</span>
              <span className='text-sm text-gray-600'>Total Papers</span>
            </div>
            <div className='bg-gray-50 rounded-lg p-4 text-center border border-gray-200'>
              <span className='block text-2xl font-bold text-black'>{filteredPapers.length}</span>
              <span className='text-sm text-gray-600'>Showing</span>
            </div>
            <div className='bg-gray-50 rounded-lg p-4 text-center border border-gray-200'>
              <span className='block text-2xl font-bold text-black'>{papers.filter((p) => p.isVIPOnly).length}</span>
              <span className='text-sm text-gray-600'>VIP Papers</span>
            </div>
            <div className='bg-gray-50 rounded-lg p-4 text-center border border-gray-200'>
              <span className='block text-2xl font-bold text-black'>{papers.filter((p) => !p.isVIPOnly).length}</span>
              <span className='text-sm text-gray-600'>Free Papers</span>
            </div>
          </div>

          {/* Papers Table */}
          {loading ? (
            <div className='flex items-center justify-center py-12'>
              <div className='text-center'>
                <div className='w-12 h-12 border-4 border-gray-200 rounded-full animate-spin border-t-black mx-auto'></div>
                <p className='mt-4 text-gray-600'>Loading papers...</p>
              </div>
            </div>
          ) : filteredPapers.length === 0 ? (
            <div className='text-center py-12'>
              <FiSearch className='w-12 h-12 text-gray-400 mx-auto mb-4' />
              <p className='text-gray-500'>No papers found</p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className='mt-4 text-sm text-black underline hover:no-underline'>
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead className='bg-gray-50 border-b border-gray-200'>
                  <tr>
                    <th className='px-4 py-3 text-left'>
                      <input
                        type='checkbox'
                        checked={selectAll && filteredPapers.length > 0}
                        onChange={handleSelectAll}
                        className='w-4 h-4 cursor-pointer'
                      />
                    </th>
                    <th className='px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:text-black' onClick={() => handleSort('filename')}>
                      Filename {getSortIcon('filename')}
                    </th>
                    <th className='px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:text-black' onClick={() => handleSort('category')}>
                      Category {getSortIcon('category')}
                    </th>
                    <th className='px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:text-black' onClick={() => handleSort('trade')}>
                      Trade {getSortIcon('trade')}
                    </th>
                    <th className='px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:text-black' onClick={() => handleSort('year')}>
                      Year {getSortIcon('year')}
                    </th>
                    <th className='px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:text-black' onClick={() => handleSort('createdAt')}>
                      Uploaded {getSortIcon('createdAt')}
                    </th>
                    <th className='px-4 py-3 text-left text-sm font-semibold text-gray-700'>VIP</th>
                    <th className='px-4 py-3 text-left text-sm font-semibold text-gray-700'>Actions</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-100'>
                  {filteredPapers.map((paper) => (
                    <tr key={paper._id} className='hover:bg-gray-50 transition'>
                      <td className='px-4 py-3'>
                        <input
                          type='checkbox'
                          checked={selectedPapers.includes(paper._id)}
                          onChange={() => handleSelectPaper(paper._id)}
                          className='w-4 h-4 cursor-pointer'
                        />
                      </td>
                      <td className='px-4 py-3 text-sm text-gray-900 max-w-xs truncate'>
                        {paper.filename || paper.title}
                      </td>
                      <td className='px-4 py-3'>
                        <span className='inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700'>
                          <FiBookOpen className='w-3 h-3' />
                          {getCategoryDisplayName(paper.category)}
                        </span>
                      </td>
                      <td className='px-4 py-3 text-sm text-gray-600'>{paper.trade || '-'}</td>
                      <td className='px-4 py-3'>
                        <span className='inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700'>
                          <FiCalendar className='w-3 h-3' />
                          {paper.year}
                        </span>
                      </td>
                      <td className='px-4 py-3 text-sm text-gray-500'>
                        {new Date(paper.createdAt).toLocaleDateString()}
                      </td>
                      <td className='px-4 py-3'>
                        {paper.isVIPOnly ? (
                          <span className='inline-flex items-center gap-1 text-xs text-yellow-600'>
                            <FiStar className='w-3 h-3' />
                            VIP
                          </span>
                        ) : (
                          <span className='text-xs text-gray-400'>Free</span>
                        )}
                      </td>
                      <td className='px-4 py-3'>
                        <div className='flex gap-2'>
                          <a
                            href={`${api.defaults.baseURL}/api/papers/view/${paper._id}`}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='p-1 text-gray-400 hover:text-blue-600 transition'
                            title='View Paper'
                          >
                            <FiEye className='w-5 h-5' />
                          </a>
                          <button
                            onClick={() => handleDelete(paper._id, paper.filename || paper.title)}
                            className='p-1 text-gray-400 hover:text-red-600 transition'
                            title='Delete paper'
                          >
                            <FiTrash2 className='w-5 h-5' />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageExams;
