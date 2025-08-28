// routes/newsRoutes.js - Secure News API Proxy
const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');
const rateLimit = require('express-rate-limit');
const router = express.Router();

// Initialize cache (5 minutes TTL)
const newsCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

// NewsAPI Configuration
const NEWS_API_KEY = process.env.NEWS_API_KEY;
const NEWS_API_BASE = 'https://newsapi.org/v2';

// Rate limiting middleware
const newsRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many news requests, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all news routes
router.use(newsRateLimit);

// ✅ Get Top Headlines
router.get('/headlines', async (req, res) => {
  try {
    console.log('📰 Headlines request:', req.query);
    
    const {
      category = 'general',
      country = 'us',
      page = 1,
      pageSize = 20
    } = req.query;

    // Validate category
    const validCategories = ['business', 'entertainment', 'general', 'health', 'science', 'sports', 'technology'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category',
        validCategories
      });
    }

    // Create cache key
    const cacheKey = `headlines_${category}_${country}_${page}_${pageSize}`;
    
    // Check cache first
    const cachedData = newsCache.get(cacheKey);
    if (cachedData) {
      console.log('📋 Cache hit for headlines');
      return res.json({
        success: true,
        data: cachedData,
        cached: true,
        cacheTime: new Date().toISOString()
      });
    }

    // Build API URL
    const url = `${NEWS_API_BASE}/top-headlines`;
    const params = {
      apiKey: NEWS_API_KEY,
      category,
      country,
      page: parseInt(page),
      pageSize: Math.min(parseInt(pageSize), 100) // Max 100 articles
    };

    console.log('🔍 Fetching headlines from NewsAPI...');
    const response = await axios.get(url, { 
      params,
      timeout: 10000 // 10 second timeout
    });

    if (response.data.status === 'ok') {
      // Filter out invalid articles
      const validArticles = response.data.articles.filter(article => 
        article.title && 
        article.title !== '[Removed]' && 
        article.description &&
        article.urlToImage
      );

      const responseData = {
        ...response.data,
        articles: validArticles,
        totalResults: validArticles.length
      };

      // Cache the response
      newsCache.set(cacheKey, responseData);

      res.json({
        success: true,
        data: responseData,
        cached: false,
        fetchTime: new Date().toISOString()
      });

      console.log('✅ Headlines fetched successfully:', validArticles.length, 'articles');
    } else {
      throw new Error(response.data.message || 'NewsAPI returned error');
    }

  } catch (error) {
    console.error('❌ Headlines error:', error.message);
    
    if (error.response?.status === 429) {
      return res.status(429).json({
        success: false,
        message: 'NewsAPI rate limit exceeded',
        retryAfter: '1 hour'
      });
    }

    if (error.response?.status === 401) {
      return res.status(500).json({
        success: false,
        message: 'News service temporarily unavailable'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to fetch news headlines',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ✅ Search News
router.get('/search', async (req, res) => {
  try {
    console.log('🔍 Search request:', req.query);
    
    const {
      q,
      page = 1,
      pageSize = 20,
      sortBy = 'publishedAt',
      language = 'en'
    } = req.query;

    // Validate search query
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }

    // Validate sortBy
    const validSortBy = ['relevancy', 'popularity', 'publishedAt'];
    if (!validSortBy.includes(sortBy)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid sortBy parameter',
        validOptions: validSortBy
      });
    }

    // Create cache key
    const cacheKey = `search_${encodeURIComponent(q)}_${page}_${pageSize}_${sortBy}_${language}`;
    
    // Check cache first
    const cachedData = newsCache.get(cacheKey);
    if (cachedData) {
      console.log('📋 Cache hit for search');
      return res.json({
        success: true,
        data: cachedData,
        cached: true,
        cacheTime: new Date().toISOString()
      });
    }

    // Build API URL
    const url = `${NEWS_API_BASE}/everything`;
    const params = {
      apiKey: NEWS_API_KEY,
      q: q.trim(),
      page: parseInt(page),
      pageSize: Math.min(parseInt(pageSize), 100),
      sortBy,
      language
    };

    console.log('🔍 Searching news from NewsAPI...');
    const response = await axios.get(url, { 
      params,
      timeout: 10000
    });

    if (response.data.status === 'ok') {
      // Filter out invalid articles
      const validArticles = response.data.articles.filter(article => 
        article.title && 
        article.title !== '[Removed]' && 
        article.description &&
        article.urlToImage
      );

      const responseData = {
        ...response.data,
        articles: validArticles,
        totalResults: Math.min(response.data.totalResults, validArticles.length)
      };

      // Cache the response
      newsCache.set(cacheKey, responseData);

      res.json({
        success: true,
        data: responseData,
        cached: false,
        fetchTime: new Date().toISOString()
      });

      console.log('✅ Search completed successfully:', validArticles.length, 'articles');
    } else {
      throw new Error(response.data.message || 'NewsAPI returned error');
    }

  } catch (error) {
    console.error('❌ Search error:', error.message);
    
    if (error.response?.status === 429) {
      return res.status(429).json({
        success: false,
        message: 'NewsAPI rate limit exceeded',
        retryAfter: '1 hour'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to search news',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ✅ Get News Sources
router.get('/sources', async (req, res) => {
  try {
    console.log('📡 Sources request:', req.query);
    
    const {
      category,
      language = 'en',
      country = 'us'
    } = req.query;

    // Create cache key
    const cacheKey = `sources_${category || 'all'}_${language}_${country}`;
    
    // Check cache first (longer cache for sources - 1 hour)
    const cachedData = newsCache.get(cacheKey);
    if (cachedData) {
      console.log('📋 Cache hit for sources');
      return res.json({
        success: true,
        data: cachedData,
        cached: true,
        cacheTime: new Date().toISOString()
      });
    }

    // Build API URL
    const url = `${NEWS_API_BASE}/sources`;
    const params = {
      apiKey: NEWS_API_KEY,
      language,
      country
    };

    if (category) {
      params.category = category;
    }

    console.log('🔍 Fetching sources from NewsAPI...');
    const response = await axios.get(url, { 
      params,
      timeout: 10000
    });

    if (response.data.status === 'ok') {
      // Cache for longer (1 hour)
      newsCache.set(cacheKey, response.data, 3600);

      res.json({
        success: true,
        data: response.data,
        cached: false,
        fetchTime: new Date().toISOString()
      });

      console.log('✅ Sources fetched successfully:', response.data.sources.length, 'sources');
    } else {
      throw new Error(response.data.message || 'NewsAPI returned error');
    }

  } catch (error) {
    console.error('❌ Sources error:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch news sources',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ✅ Health check for news service
router.get('/health', (req, res) => {
  const cacheStats = newsCache.getStats();
  
  res.json({
    success: true,
    service: 'News Proxy Service',
    status: 'Active',
    timestamp: new Date().toISOString(),
    cache: {
      keys: cacheStats.keys,
      hits: cacheStats.hits,
      misses: cacheStats.misses,
      hitRate: cacheStats.keys > 0 ? (cacheStats.hits / (cacheStats.hits + cacheStats.misses) * 100).toFixed(2) + '%' : '0%'
    },
    rateLimit: {
      windowMs: '15 minutes',
      maxRequests: 100,
      message: 'Rate limiting active'
    }
  });
});

// ✅ Clear cache endpoint (for admin use)
router.post('/clear-cache', (req, res) => {
  try {
    const cacheKeys = newsCache.keys();
    newsCache.flushAll();
    
    res.json({
      success: true,
      message: 'News cache cleared successfully',
      clearedKeys: cacheKeys.length,
      timestamp: new Date().toISOString()
    });

    console.log('🗑️ News cache cleared:', cacheKeys.length, 'keys removed');
  } catch (error) {
    console.error('❌ Cache clear error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache',
      error: error.message
    });
  }
});

module.exports = router;
