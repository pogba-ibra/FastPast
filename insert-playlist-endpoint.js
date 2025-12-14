const fs = require('fs');

// Read the server.js file
const serverPath = 'c:\\\\Users\\\\ZLATAN\\\\Documents\\\\FastPast\\\\server.js';
let content = fs.readFileSync(serverPath, 'utf8');

// The playlist endpoint code to insert
const playlistCode = `
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

// Find the line with "function streamProcessToResponse"
const lines = content.split('\\n');
const targetIndex = lines.findIndex(line => line.includes('function streamProcessToResponse'));

if (targetIndex === -1) {
    console.error('ERROR: Could not find insertion point');
    process.exit(1);
}

// Insert the playlist code before that line
lines.splice(targetIndex, 0, playlistCode);

// Write back to file
fs.writeFileSync(serverPath, lines.join('\\n'), 'utf8');

console.log('✅ Playlist endpoint added successfully at line ' + targetIndex);
console.log('   Total API keys configured: 10');
console.log('   Endpoint: POST /get-playlist-videos');
