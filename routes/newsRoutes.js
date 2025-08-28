// routes/newsRoutes.js - Vercel-Optimized News API Proxy
const express = require('express');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const router = express.Router();

// ✅ VERCEL FIX: Simple in-memory cache (per function instance)
// Note: Cache will reset on cold starts, but that's acceptable for serverless
let newsCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

// Simple cache helper functions
const getFromCache = (key) => {
  const item = newsCache.get(key);
  if (!item) return null;
  
  if (Date.now() > item.expiry) {
    newsCache.delete(key);
    return null;
  }
  
  return item.data;
};

const setToCache = (key, data, ttl = CACHE_TTL) => {
  // Limit cache size to prevent memory issues
  if (newsCache.size > 50) {
    const firstKey = newsCache.keys().next().value;
    newsCache.delete(firstKey);
  }
  
  newsCache.set(key, {
    data,
    expiry: Date.now() + ttl
  });
};

// Clear expired cache entries periodically
const clearExpiredCache = () => {
  const now = Date.now();
  for (const [key, item] of newsCache.entries()) {
    if (now > item.expiry) {
      newsCache.delete(key);
    }
  }
};

// NewsAPI Configuration
const NEWS_API_KEY = process.env.NEWS_API_KEY;
const NEWS_API_BASE = 'https://newsapi.org/v2';

// ✅ VERCEL FIX: More permissive rate limiting for serverless
const newsRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Increased limit for serverless
  message: {
    success: false,
    message: 'Too many news requests, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting in development
    return process.env.NODE_ENV === 'development';
  }
});

// Apply rate limiting to all news routes
router.use(newsRateLimit);

// ✅ VERCEL FIX: Environment validation middleware
router.use((req, res, next) => {
  if (!NEWS_API_KEY) {
    console.error('❌ NEWS_API_KEY environment variable not set');
    return res.status(500).json({
      success: false,
      message: 'News service configuration error',
      error: 'Service temporarily unavailable'
    });
  }
  next();
});

// ✅ Get Top Headlines - Vercel Optimized
router.get('/headlines', async (req, res) => {
  try {
    console.log('📰 Headlines request:', req.query);
    
    // Clear expired cache entries
    clearExpiredCache();
    
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

    // Validate and limit pageSize for Vercel
    const limitedPageSize = Math.min(parseInt(pageSize), 50); // Reduced for serverless
    const limitedPage = Math.max(1, Math.min(parseInt(page), 5)); // Limit pages

    // Create cache key
    const cacheKey = `headlines_${category}_${country}_${limitedPage}_${limitedPageSize}`;
    
    // Check cache first
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
      console.log('📋 Cache hit for headlines');
      return res.status(200).json({
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
      page: limitedPage,
      pageSize: limitedPageSize
    };

    console.log('🔍 Fetching headlines from NewsAPI...');
    
    // ✅ VERCEL FIX: Shorter timeout for serverless
    const response = await axios.get(url, { 
      params,
      timeout: 8000, // 8 second timeout (reduced)
      headers: {
        'User-Agent': 'Payana-News-Proxy/1.0'
      }
    });

    if (response.data.status === 'ok') {
      // Filter out invalid articles
      const validArticles = response.data.articles.filter(article => 
        article.title && 
        article.title !== '[Removed]' && 
        article.description &&
        article.urlToImage &&
        article.url
      );

      const responseData = {
        ...response.data,
        articles: validArticles,
        totalResults: validArticles.length
      };

      // Cache the response
      setToCache(cacheKey, responseData);

      res.status(200).json({
        success: true,
        data: responseData,
        cached: false,
        fetchTime: new Date().toISOString(),
        source: 'NewsAPI'
      });

      console.log('✅ Headlines fetched successfully:', validArticles.length, 'articles');
    } else {
      throw new Error(response.data.message || 'NewsAPI returned error');
    }

  } catch (error) {
    console.error('❌ Headlines error:', error.message);
    
    if (error.code === 'ECONNABORTED') {
      return res.status(408).json({
        success: false,
        message: 'Request timeout - please try again',
        retryAfter: '30 seconds'
      });
    }
    
    if (error.response?.status === 429) {
      return res.status(429).json({
        success: false,
        message: 'NewsAPI rate limit exceeded',
        retryAfter: '1 hour'
      });
    }

    if (error.response?.status === 401) {
      console.error('❌ NewsAPI authentication failed');
      return res.status(500).json({
        success: false,
        message: 'News service temporarily unavailable'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to fetch news headlines',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Service temporarily unavailable',
      timestamp: new Date().toISOString()
    });
  }
});

// ✅ Search News - Vercel Optimized
router.get('/search', async (req, res) => {
  try {
    console.log('🔍 Search request:', req.query);
    
    // Clear expired cache entries
    clearExpiredCache();
    
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

    // Validate and limit for Vercel
    const limitedPageSize = Math.min(parseInt(pageSize), 50);
    const limitedPage = Math.max(1, Math.min(parseInt(page), 3)); // Limit search pages more strictly
    const sanitizedQuery = q.trim().substring(0, 100); // Limit query length

    // Create cache key
    const cacheKey = `search_${encodeURIComponent(sanitizedQuery)}_${limitedPage}_${limitedPageSize}_${sortBy}_${language}`;
    
    // Check cache first
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
      console.log('📋 Cache hit for search');
      return res.status(200).json({
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
      q: sanitizedQuery,
      page: limitedPage,
      pageSize: limitedPageSize,
      sortBy,
      language
    };

    console.log('🔍 Searching news from NewsAPI...');
    const response = await axios.get(url, { 
      params,
      timeout: 8000,
      headers: {
        'User-Agent': 'Payana-News-Proxy/1.0'
      }
    });

    if (response.data.status === 'ok') {
      // Filter out invalid articles
      const validArticles = response.data.articles.filter(article => 
        article.title && 
        article.title !== '[Removed]' && 
        article.description &&
        article.urlToImage &&
        article.url
      );

      const responseData = {
        ...response.data,
        articles: validArticles,
        totalResults: Math.min(response.data.totalResults, validArticles.length)
      };

      // Cache the response
      setToCache(cacheKey, responseData);

      res.status(200).json({
        success: true,
        data: responseData,
        cached: false,
        fetchTime: new Date().toISOString(),
        source: 'NewsAPI'
      });

      console.log('✅ Search completed successfully:', validArticles.length, 'articles');
    } else {
      throw new Error(response.data.message || 'NewsAPI returned error');
    }

  } catch (error) {
    console.error('❌ Search error:', error.message);
    
    if (error.code === 'ECONNABORTED') {
      return res.status(408).json({
        success: false,
        message: 'Search timeout - please try again',
        retryAfter: '30 seconds'
      });
    }
    
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
      error: process.env.NODE_ENV === 'development' ? error.message : 'Service temporarily unavailable',
      timestamp: new Date().toISOString()
    });
  }
});

// ✅ Get News Sources - Vercel Optimized
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
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
      console.log('📋 Cache hit for sources');
      return res.status(200).json({
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
      timeout: 8000,
      headers: {
        'User-Agent': 'Payana-News-Proxy/1.0'
      }
    });

    if (response.data.status === 'ok') {
      // Cache for longer (1 hour)
      setToCache(cacheKey, response.data, 60 * 60 * 1000);

      res.status(200).json({
        success: true,
        data: response.data,
        cached: false,
        fetchTime: new Date().toISOString(),
        source: 'NewsAPI'
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
      error: process.env.NODE_ENV === 'development' ? error.message : 'Service temporarily unavailable',
      timestamp: new Date().toISOString()
    });
  }
});

// ✅ Health check for news service - Vercel Optimized
router.get('/health', (req, res) => {
  try {
    // Clean up expired cache entries
    clearExpiredCache();
    
    const cacheStats = {
      totalKeys: newsCache.size,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime()
    };
    
    res.status(200).json({
      success: true,
      service: 'News Proxy Service (Vercel)',
      status: 'Active',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      cache: {
        keys: cacheStats.totalKeys,
        type: 'in-memory',
        note: 'Cache resets on cold starts (serverless)'
      },
      rateLimit: {
        windowMs: '15 minutes',
        maxRequests: process.env.NODE_ENV === 'development' ? 'unlimited' : 200,
        message: 'Rate limiting active'
      },
      newsApiStatus: NEWS_API_KEY ? 'configured' : 'missing',
      memory: {
        used: `${Math.round(cacheStats.memoryUsage.heapUsed / 1024 / 1024)}MB`,
        total: `${Math.round(cacheStats.memoryUsage.heapTotal / 1024 / 1024)}MB`
      },
      uptime: `${Math.floor(cacheStats.uptime / 60)}m ${Math.floor(cacheStats.uptime % 60)}s`
    });
  } catch (error) {
    console.error('❌ Health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
});

// ✅ Clear cache endpoint - Vercel Optimized
router.post('/clear-cache', (req, res) => {
  try {
    const cacheSize = newsCache.size;
    newsCache.clear();
    
    res.status(200).json({
      success: true,
      message: 'News cache cleared successfully',
      clearedKeys: cacheSize,
      timestamp: new Date().toISOString(),
      note: 'Cache will rebuild on next requests'
    });

    console.log('🗑️ News cache cleared:', cacheSize, 'keys removed');
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
