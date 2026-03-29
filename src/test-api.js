import api from './services/api';

const testAPI = async () => {
  console.log('🔍 Testing API connection...');

  // Test health endpoint
  try {
    const health = await api.get('/health');
    console.log('✅ Health check:', health.data);
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
  }

  // Test categories endpoint
  try {
    const categories = await api.get('/categories');
    console.log('✅ Categories:', categories.data);
  } catch (error) {
    console.error('❌ Categories fetch failed:', error.message);
  }

  // Test trades endpoint
  try {
    const trades = await api.get('/trades');
    console.log('✅ Trades:', trades.data);
  } catch (error) {
    console.error('❌ Trades fetch failed:', error.message);
  }

  // Test papers endpoint
  try {
    const papers = await api.get('/papers');
    console.log('✅ Papers count:', papers.data.data?.length || 0);
  } catch (error) {
    console.error('❌ Papers fetch failed:', error.message);
  }
};

// Run test
testAPI();
