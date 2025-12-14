/* eslint-disable */
// YouTube Playlist endpoint
app.post("/get-playlist-videos", async (req, res) => {
    try {
        const { playlistUrl, pageToken } = req.body;

        if (!playlistUrl) {
            return res.status(400).json({ error: "Playlist URL required" });
        }

        // Extract playlist ID from URL
        const playlistIdMatch = playlistUrl.match(/[?&]list=([a-zA-Z0-9_-]+)/);
        if (!playlistIdMatch) {
            return res.status(400).json({ error: "Invalid playlist URL" });
        }

        const playlistId = playlistIdMatch[1];

        // Get API key from environment variable
        const apiKey = process.env.YOUTUBE_API_KEY;
        if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
            logger.warn('YouTube API key not configured');
            return res.status(503).json({
                error: "YouTube API key not configured. Please add YOUTUBE_API_KEY to your .env file. See youtube_api_setup.md for instructions."
            });
        }

        // Build YouTube Data API request
        const baseUrl = 'https://www.googleapis.com/youtube/v3/playlistItems';
        const params = new URLSearchParams({
            part: 'snippet',
            playlistId: playlistId,
            maxResults: '50', // YouTube API max per page
            key: apiKey
        });

        if (pageToken) {
            params.append('pageToken', pageToken);
        }

        const apiUrl = `${baseUrl}?${params.toString()}`;

        logger.info('Fetching playlist videos', { playlistId, hasPageToken: !!pageToken });

        // Make request to YouTube API
        const axios = require('axios');
        const response = await axios.get(apiUrl);

        if (!response.data || !response.data.items) {
            throw new Error('Invalid response from YouTube API');
        }

        // Extract video information
        const videos = response.data.items.map(item => ({
            id: item.snippet.resourceId.videoId,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || ''
        }));

        logger.info('Playlist videos fetched successfully', {
            playlistId,
            videosCount: videos.length,
            hasNextPage: !!response.data.nextPageToken
        });

        res.json({
            videos,
            nextPageToken: response.data.nextPageToken || null,
            totalResults: response.data.pageInfo?.totalResults || videos.length
        });

    } catch (error) {
        logger.error('Playlist fetch error', {
            error: error.message,
            response: error.response?.data
        });

        // Handle specific YouTube API errors
        if (error.response?.status === 403) {
            return res.status(403).json({
                error: "API quota exceeded or invalid API key. Please check your YouTube API key configuration."
            });
        }

        if (error.response?.status === 404) {
            return res.status(404).json({
                error: "Playlist not found or is private."
            });
        }

        res.status(500).json({
            error: "Failed to fetch playlist videos",
            details: error.message
        });
    }
});
