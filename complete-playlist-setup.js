const fs = require('fs');

console.log('🚀 Starting complete playlist setup...');

// Read current server.js
const serverPath = 'c:\\Users\\ZLATAN\\Documents\\FastPast\\server.js';
let content = fs.readFileSync(serverPath, 'utf8');

// 1. Add dotenv at the top
if (!content.startsWith("require('dotenv')")) {
    console.log('✅ Adding dotenv configuration...');
    content = "require('dotenv').config();\n" + content;
}

// 2. Add API key rotation after app.use setup
const apiRotationCode = `
// YouTube API key rotation system (supports up to 10 keys)
let apiKeyIndex = 0;
const apiKeys = [
  process.env.YOUTUBE_API_KEY_1,
  process.env.YOUTUBE_API_KEY_2,
  process.env.YOUTUBE_API_KEY_3,
  process.env.YOUTUBE_API_KEY_4,
  process.env.YOUTUBE_API_KEY_5,
  process.env.YOUTUBE_API_KEY_6,
  process.env.YOUTUBE_API_KEY_7,
  process.env.YOUTUBE_API_KEY_8,
  process.env.YOUTUBE_API_KEY_9,
  process.env.YOUTUBE_API_KEY_10
].filter(key => key && key !== 'YOUR_API_KEY_HERE');

function getNextApiKey() {
  if (apiKeys.length === 0) return null;
  return apiKeys[apiKeyIndex];
}

function rotateApiKey() {
  apiKeyIndex = (apiKeyIndex + 1) % apiKeys.length;
  logger.info('Rotated to next API key', { newIndex: apiKeyIndex, totalKeys: apiKeys.length });
}
`;

// 3. Add playlist endpoint
const playlistEndpoint = `
// YouTube Playlist endpoint with automatic key rotation
app.post("/get-playlist-videos", async (req, res) => {
  try {
    const { playlistUrl, pageToken } = req.body;
    
    if (!playlistUrl) {
      return res.status(400).json({ error: "Playlist URL required" });
    }
    
    const playlistIdMatch = playlistUrl.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    if (!playlistIdMatch) {
      return res.status(400).json({ error: "Invalid playlist URL" });
    }
    
    const playlistId = playlistIdMatch[1];
    
    let lastError = null;
    let attempts = 0;
    const maxAttempts = apiKeys.length;
    
    while (attempts < maxAttempts) {
      const apiKey = getNextApiKey();
      
      if (!apiKey) {
        return res.status(503).json({ 
          error: "No YouTube API keys configured. Please add API keys to .env file." 
        });
      }
      
      try {
        const baseUrl = 'https://www.googleapis.com/youtube/v3/playlistItems';
        const params = new URLSearchParams({
          part: 'snippet',
          playlistId: playlistId,
          maxResults: '50',
          key: apiKey
        });
        
        if (pageToken) {
          params.append('pageToken', pageToken);
        }
        
        const apiUrl = \`\${baseUrl}?\${params.toString()}\`;
        
        logger.info('Fetching playlist videos', { 
          playlistId, 
          hasPageToken: !!pageToken,
          apiKeyIndex,
          totalKeys: apiKeys.length
        });
        
        const axios = require('axios');
        const response = await axios.get(apiUrl);
        
        if (!response.data || !response.data.items) {
          throw new Error('Invalid response from YouTube API');
        }
        
        const videos = response.data.items.map(item => ({
          id: item.snippet.resourceId.videoId,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || ''
        }));
        
        logger.info('Playlist videos fetched successfully', { 
          playlistId, 
          videosCount: videos.length,
          hasNextPage: !!response.data.nextPageToken,
          apiKeyIndex
        });
        
        return res.json({
          videos,
          nextPageToken: response.data.nextPageToken || null,
          totalResults: response.data.pageInfo?.totalResults || videos.length
        });
        
      } catch (error) {
        lastError = error;
        
        if (error.response?.status === 403) {
          const errorData = error.response.data;
          const isQuotaError = errorData?.error?.errors?.some(
            e => e.reason === 'quotaExceeded' || e.reason === 'rateLimitExceeded'
          );
          
          if (isQuotaError && attempts < maxAttempts - 1) {
            logger.warn('API key quota exceeded, rotating to next key', { 
              currentIndex: apiKeyIndex,
              attempts: attempts + 1,
              remainingKeys: maxAttempts - attempts - 1
            });
            rotateApiKey();
            attempts++;
            continue;
          }
        }
        
        break;
      }
    }
    
    logger.error('All API keys failed', { 
      error: lastError?.message,
      response: lastError?.response?.data,
      totalKeysAttempted: attempts + 1
    });
    
    if (lastError?.response?.status === 403) {
      return res.status(403).json({ 
        error: "All API keys have exceeded quota. Please try again tomorrow." 
      });
    }
    
    if (lastError?.response?.status === 404) {
      return res.status(404).json({ 
        error: "Playlist not found or is private." 
      });
    }
    
    res.status(500).json({ 
      error: "Failed to fetch playlist videos",
      details: lastError?.message 
    });
    
  } catch (error) {
    logger.error('Playlist fetch error', { error: error.message });
    res.status(500).json({ 
      error: "Failed to fetch playlist videos",
      details: error.message 
    });
  }
});
`;

// Find insertion points
const lines = content.split('\n');

// Insert API rotation after app.use("/js"...)
const jsUseIdx = lines.findIndex(l => l.includes('app.use("/js"'));
if (jsUseIdx > 0 && !content.includes('apiKeys =')) {
    console.log('✅ Adding API key rotation system...');
    lines.splice(jsUseIdx + 1, 0, apiRotationCode);
}

// Insert playlist endpoint before function streamProcessToResponse
const streamIdx = lines.findIndex(l => l.includes('function streamProcessToResponse'));
if (streamIdx > 0 && !content.includes('get-playlist-videos')) {
    console.log('✅ Adding playlist endpoint...');
    lines.splice(streamIdx, 0, playlistEndpoint);
}

// Write back
fs.writeFileSync(serverPath, lines.join('\n'), 'utf8');

console.log('\n✅ Backend setup complete!');
console.log('📋 Summary:');
console.log('   - Dotenv: Configured');
console.log('   - API Keys: 10-key rotation system added');
console.log('   - Endpoint: /get-playlist-videos ready');
console.log('\n🎯 Next step: Add JavaScript to Web/script.js (see manual_code_changes.md Section 5)');
console.log('   Then restart: pm2 restart fastpast');
