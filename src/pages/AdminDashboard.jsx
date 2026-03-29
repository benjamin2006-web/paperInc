import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiUpload,
  FiChevronRight,
  FiChevronDown,
  FiCheck,
  FiX,
  FiStar,
  FiAlertCircle,
  FiDownload,
  FiTrash2,
  FiPlus,
  FiFile,
} from 'react-icons/fi';
import api from '../services/api';
import { compressPDF } from '../utils/compressPDF';
import { chunkedUpload } from '../utils/chunkedUpload';

const AdminDashboard = () => {
  const [papers, setPapers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tradesData, setTradesData] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadStage, setUploadStage] = useState({});
  const [files, setFiles] = useState([]);
  const [formData, setFormData] = useState({
    category: '',
    trades: [],
    years: [],
    isVIPOnly: false,
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showTrades, setShowTrades] = useState(false);
  const [showYears, setShowYears] = useState(false);
  const navigate = useNavigate();

  // Generate years from 2000 to current year
  const years = Array.from(
    { length: new Date().getFullYear() - 2000 + 1 },
    (_, i) => 2000 + i,
  ).reverse();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadData();
  }, [navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const categoriesResponse = await api.get('/categories');
      if (categoriesResponse.data && Array.isArray(categoriesResponse.data)) {
        setCategories(
          categoriesResponse.data.filter((cat) => cat.enabled !== false),
        );
      }

      const tradesResponse = await api.get('/trades');
      if (tradesResponse.data) {
        setTradesData(tradesResponse.data);
      }

      const papersResponse = await api.get('/papers');
      setPapers(papersResponse.data.data);
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

  const handleCategoryChange = (e) => {
    const category = e.target.value;
    setFormData((prev) => ({
      ...prev,
      category,
      trades: [],
    }));
    setShowTrades(false);
  };

  const handleTradeToggle = (trade) => {
    setFormData((prev) => ({
      ...prev,
      trades: prev.trades.includes(trade)
        ? prev.trades.filter((t) => t !== trade)
        : [...prev.trades, trade],
    }));
  };

  const handleYearToggle = (year) => {
    setFormData((prev) => ({
      ...prev,
      years: prev.years.includes(year)
        ? prev.years.filter((y) => y !== year)
        : [...prev.years, year],
    }));
  };

  const handleSelectAllTrades = () => {
    if (formData.category && tradesData[formData.category]) {
      const allTrades = tradesData[formData.category].map((t) => t.full);
      if (formData.trades.length === allTrades.length) {
        setFormData((prev) => ({ ...prev, trades: [] }));
      } else {
        setFormData((prev) => ({ ...prev, trades: [...allTrades] }));
      }
    }
  };

  const handleSelectAllYears = () => {
    if (formData.years.length === years.length) {
      setFormData((prev) => ({ ...prev, years: [] }));
    } else {
      setFormData((prev) => ({ ...prev, years: [...years] }));
    }
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const newFiles = selectedFiles.map((file) => ({
      id: Date.now() + Math.random() + file.name,
      file: file,
      name: file.name,
      size: file.size,
      status: 'pending',
      progress: 0,
      error: null,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (fileId) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const clearAllFiles = () => {
    setFiles([]);
    document.getElementById('pdf-input').value = '';
  };

  const uploadSingleFile = async (fileItem, index) => {
    try {
      setFiles((prev) =>
        prev.map((f, i) =>
          i === index ? { ...f, status: 'compressing', progress: 0 } : f,
        ),
      );

      let fileToUpload = fileItem.file;
      const fileSizeMB = fileToUpload.size / (1024 * 1024);

      // Compress if file is large
      if (fileToUpload.size > 5 * 1024 * 1024) {
        setFiles((prev) =>
          prev.map((f, i) =>
            i === index ? { ...f, status: 'compressing' } : f,
          ),
        );
        fileToUpload = await compressPDF(fileToUpload, 5);
      }

      const uploadData = new FormData();
      uploadData.append('pdf', fileToUpload);
      uploadData.append('category', formData.category);
      uploadData.append('trades', JSON.stringify(formData.trades));
      uploadData.append('years', JSON.stringify(formData.years));
      uploadData.append('isVIPOnly', formData.isVIPOnly);

      setFiles((prev) =>
        prev.map((f, i) =>
          i === index ? { ...f, status: 'uploading', progress: 0 } : f,
        ),
      );

      const response = await api.post('/papers', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          setFiles((prev) =>
            prev.map((f, i) =>
              i === index ? { ...f, progress: percentCompleted } : f,
            ),
          );
        },
        timeout: 120000,
      });

      setFiles((prev) =>
        prev.map((f, i) =>
          i === index
            ? {
                ...f,
                status: 'success',
                progress: 100,
                result: response.data,
              }
            : f,
        ),
      );

      return response.data;
    } catch (error) {
      setFiles((prev) =>
        prev.map((f, i) =>
          i === index
            ? {
                ...f,
                status: 'error',
                error: error.response?.data?.message || 'Upload failed',
              }
            : f,
        ),
      );
      throw error;
    }
  };

  const handleMultipleUpload = async () => {
    if (files.length === 0) {
      setMessage({
        type: 'error',
        text: 'Please select at least one PDF file',
      });
      return;
    }

    if (!formData.category) {
      setMessage({ type: 'error', text: 'Please select a category' });
      return;
    }

    if (formData.years.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one year' });
      return;
    }

    const categoryHasTrades =
      tradesData[formData.category] && tradesData[formData.category].length > 0;
    if (categoryHasTrades && formData.trades.length === 0) {
      setMessage({
        type: 'error',
        text: 'Please select at least one trade for this category',
      });
      return;
    }

    setUploading(true);
    setMessage({ type: 'info', text: `Uploading ${files.length} files...` });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < files.length; i++) {
      try {
        await uploadSingleFile(files[i], i);
        successCount++;
        setMessage({
          type: 'info',
          text: `Uploaded ${successCount}/${files.length} files...`,
        });
      } catch (error) {
        failCount++;
        console.error(`Failed to upload ${files[i].name}:`, error);
      }
    }

    // Refresh papers list
    const papersResponse = await api.get('/papers');
    setPapers(papersResponse.data.data);

    setMessage({
      type: successCount > 0 ? 'success' : 'error',
      text: `Upload complete! ${successCount} successful, ${failCount} failed.`,
    });

    // Clear files after successful uploads
    if (successCount > 0) {
      setFiles([]);
      document.getElementById('pdf-input').value = '';
      setFormData((prev) => ({
        ...prev,
        category: '',
        trades: [],
        years: [],
        isVIPOnly: false,
      }));
    }

    setTimeout(() => {
      setUploading(false);
      setMessage({ type: '', text: '' });
    }, 5000);
  };

  const getCategoryDisplayName = (categoryId) => {
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.name : categoryId;
  };

  const getTradesForCategory = (categoryId) => {
    if (!tradesData[categoryId]) return [];
    return tradesData[categoryId];
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className='text-xs text-gray-500'>Pending</span>;
      case 'compressing':
        return (
          <span className='text-xs text-blue-500 animate-pulse'>
            Compressing...
          </span>
        );
      case 'uploading':
        return (
          <span className='text-xs text-yellow-500 animate-pulse'>
            Uploading...
          </span>
        );
      case 'success':
        return <span className='text-xs text-green-500'>✓ Complete</span>;
      case 'error':
        return <span className='text-xs text-red-500'>✗ Failed</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-white flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-12 h-12 border-4 border-gray-200 rounded-full animate-spin border-t-black mx-auto'></div>
          <p className='mt-4 text-gray-600'>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-white'>
      <div className='max-w-6xl mx-auto px-4 py-8'>
        {/* Header */}
        <h1 className='text-3xl font-bold text-black mb-2'>Admin Dashboard</h1>
        <p className='text-gray-600 mb-8'>Upload and manage exam papers</p>

        {/* Network Speed Warning */}
        <div className='mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg'>
          <div className='flex items-start gap-2'>
            <FiAlertCircle className='w-5 h-5 text-yellow-600 mt-0.5' />
            <div>
              <p className='text-sm text-yellow-800 font-medium'>
                Multiple File Upload Tips:
              </p>
              <ul className='text-xs text-yellow-700 mt-1 space-y-1'>
                <li>• Select multiple PDF files at once</li>
                <li>
                  • Files larger than 5MB will be compressed automatically
                </li>
                <li>• Upload progress shown for each file</li>
                <li>
                  • All files use the same category, trades, and years settings
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Message Alerts */}
        {message.text && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              message.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : message.type === 'warning'
                  ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                  : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <div className='flex items-center gap-2'>
              {message.type === 'success' ? (
                <FiCheck className='w-5 h-5' />
              ) : message.type === 'warning' ? (
                <FiAlertCircle className='w-5 h-5' />
              ) : (
                <FiX className='w-5 h-5' />
              )}
              <span>{message.text}</span>
            </div>
          </div>
        )}

        {/* Upload Form */}
        <div className='border border-gray-200 rounded-xl p-6 mb-8'>
          <h2 className='text-xl font-semibold text-black mb-6'>
            Upload New Papers
          </h2>

          <div className='space-y-6'>
            {/* Category Select */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Category *
              </label>
              <select
                value={formData.category}
                onChange={handleCategoryChange}
                required
                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition'
              >
                <option value=''>Select Category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Trades Dropdown */}
            {formData.category &&
              getTradesForCategory(formData.category).length > 0 && (
                <div>
                  <button
                    type='button'
                    onClick={() => setShowTrades(!showTrades)}
                    className='w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg hover:border-gray-400 transition'
                  >
                    <span className='text-gray-700'>
                      Trades ({formData.trades.length} selected)
                    </span>
                    {showTrades ? (
                      <FiChevronDown className='w-5 h-5 text-gray-500' />
                    ) : (
                      <FiChevronRight className='w-5 h-5 text-gray-500' />
                    )}
                  </button>

                  {showTrades && (
                    <div className='mt-2 border border-gray-200 rounded-lg p-4 bg-gray-50 max-h-64 overflow-y-auto'>
                      <label className='flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer'>
                        <input
                          type='checkbox'
                          checked={
                            formData.trades.length ===
                            getTradesForCategory(formData.category).length
                          }
                          onChange={handleSelectAllTrades}
                          className='w-4 h-4'
                        />
                        <span className='font-medium text-sm'>
                          Select All Trades
                        </span>
                      </label>
                      {getTradesForCategory(formData.category).map((trade) => (
                        <label
                          key={trade.full}
                          className='flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer'
                        >
                          <input
                            type='checkbox'
                            checked={formData.trades.includes(trade.full)}
                            onChange={() => handleTradeToggle(trade.full)}
                            className='w-4 h-4'
                          />
                          <span className='text-sm'>
                            {trade.full}{' '}
                            <span className='text-xs text-gray-500'>
                              ({trade.abbr})
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

            {/* Years Dropdown */}
            <div>
              <button
                type='button'
                onClick={() => setShowYears(!showYears)}
                className='w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg hover:border-gray-400 transition'
              >
                <span className='text-gray-700'>
                  Years ({formData.years.length} selected)
                </span>
                {showYears ? (
                  <FiChevronDown className='w-5 h-5 text-gray-500' />
                ) : (
                  <FiChevronRight className='w-5 h-5 text-gray-500' />
                )}
              </button>

              {showYears && (
                <div className='mt-2 border border-gray-200 rounded-lg p-4 bg-gray-50 max-h-64 overflow-y-auto'>
                  <label className='flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer'>
                    <input
                      type='checkbox'
                      checked={formData.years.length === years.length}
                      onChange={handleSelectAllYears}
                      className='w-4 h-4'
                    />
                    <span className='font-medium text-sm'>
                      Select All Years
                    </span>
                  </label>
                  <div className='grid grid-cols-4 gap-1 mt-2'>
                    {years.map((year) => (
                      <label
                        key={year}
                        className='flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer'
                      >
                        <input
                          type='checkbox'
                          checked={formData.years.includes(year)}
                          onChange={() => handleYearToggle(year)}
                          className='w-4 h-4'
                        />
                        <span className='text-sm'>{year}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* VIP Only Toggle */}
            <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200'>
              <input
                type='checkbox'
                id='vipOnly'
                checked={formData.isVIPOnly}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    isVIPOnly: e.target.checked,
                  }))
                }
                className='w-5 h-5 text-black focus:ring-black'
              />
              <label
                htmlFor='vipOnly'
                className='flex items-center gap-2 cursor-pointer'
              >
                <FiStar className='w-5 h-5 text-yellow-500' />
                <span className='text-sm font-medium text-gray-700'>
                  VIP Only - Only VIP users can access this paper
                </span>
              </label>
            </div>

            {/* File Input */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                PDF Files * (Select multiple)
              </label>
              <input
                type='file'
                id='pdf-input'
                accept='.pdf'
                onChange={handleFileSelect}
                multiple
                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200'
              />
              <p className='text-xs text-gray-500 mt-1'>
                Select one or multiple PDF files. All files will use the same
                category, trades, and years settings.
              </p>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className='border border-gray-200 rounded-lg overflow-hidden'>
                <div className='bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center'>
                  <h3 className='text-sm font-medium text-gray-700'>
                    Selected Files ({files.length})
                  </h3>
                  <button
                    type='button'
                    onClick={clearAllFiles}
                    className='text-xs text-red-600 hover:text-red-800 flex items-center gap-1'
                  >
                    <FiTrash2 className='w-3 h-3' />
                    Clear All
                  </button>
                </div>
                <div className='max-h-64 overflow-y-auto'>
                  {files.map((file, index) => (
                    <div
                      key={file.id}
                      className='flex items-center justify-between p-3 border-b border-gray-100 hover:bg-gray-50'
                    >
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2'>
                          <FiFile className='w-4 h-4 text-gray-400' />
                          <span className='text-sm text-gray-900 truncate'>
                            {file.name}
                          </span>
                          <span className='text-xs text-gray-500'>
                            ({formatFileSize(file.size)})
                          </span>
                        </div>
                        {file.status === 'uploading' && (
                          <div className='mt-1'>
                            <div className='w-full bg-gray-200 rounded-full h-1'>
                              <div
                                className='bg-black h-1 rounded-full transition-all'
                                style={{ width: `${file.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                        {file.error && (
                          <p className='text-xs text-red-500 mt-1'>
                            {file.error}
                          </p>
                        )}
                      </div>
                      <div className='flex items-center gap-3'>
                        {getStatusBadge(file.status)}
                        <button
                          type='button'
                          onClick={() => removeFile(file.id)}
                          className='text-gray-400 hover:text-red-600'
                          disabled={file.status === 'uploading'}
                        >
                          <FiX className='w-4 h-4' />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Progress Summary */}
            {uploading && files.some((f) => f.status === 'uploading') && (
              <div className='mt-4 p-3 bg-blue-50 rounded-lg'>
                <p className='text-sm text-blue-700 text-center'>
                  Uploading {files.filter((f) => f.status === 'success').length}{' '}
                  of {files.length} files...
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type='button'
              onClick={handleMultipleUpload}
              disabled={uploading || files.length === 0}
              className='w-full flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed'
            >
              <FiUpload className='w-5 h-5' />
              {uploading ? 'Uploading...' : `Upload ${files.length} File(s)`}
            </button>
          </div>
        </div>

        {/* Papers List */}
        {papers.length > 0 && (
          <div className='border border-gray-200 rounded-xl p-6'>
            <h2 className='text-xl font-semibold text-black mb-4 flex items-center gap-2'>
              Recent Papers ({papers.length})
              <span className='text-xs bg-gray-100 px-2 py-1 rounded-full'>
                {papers.filter((p) => p.isVIPOnly).length} VIP Only
              </span>
            </h2>
            <div className='space-y-2 max-h-96 overflow-y-auto'>
              {papers.slice(0, 10).map((paper) => (
                <div
                  key={paper._id}
                  className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'
                >
                  <div>
                    <p className='text-sm font-medium text-gray-900'>
                      {paper.filename || paper.title}
                      {paper.isVIPOnly && (
                        <span className='ml-2 inline-flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full'>
                          <FiStar className='w-3 h-3' />
                          VIP Only
                        </span>
                      )}
                    </p>
                    <p className='text-xs text-gray-500'>
                      {getCategoryDisplayName(paper.category)}{' '}
                      {paper.trade && `• ${paper.trade}`} • {paper.year}
                    </p>
                  </div>
                </div>
              ))}
              {papers.length > 10 && (
                <p className='text-center text-sm text-gray-500 mt-2'>
                  And {papers.length - 10} more...
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
