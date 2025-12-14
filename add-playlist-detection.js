const fs = require('fs');

console.log('🎯 Adding playlist detection to process button...');

const scriptPath = 'c:\\Users\\ZLATAN\\Documents\\FastPast\\Web\\script.js';
let content = fs.readFileSync(scriptPath, 'utf8');
const lines = content.split('\n');

// Find the processBtn click handler (around line 910)
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('processBtn.addEventListener("click"')) {
        console.log('Found process button handler at line ' + (i + 1));

        // Look for the line with "const videoUrl = urlInput.value.trim();"
        for (let j = i; j < i + 20; j++) {
            if (lines[j].includes('const videoUrl = urlInput.value.trim()')) {
                console.log('Found videoUrl assignment at line ' + (j + 1));

                // Add playlist detection right after videoUrl assignment
                const playlistDetection = `
        
        // Check if it's a playlist URL
        if (isPlaylistUrl(videoUrl)) {
          processingStatus.style.display = 'block';
          
          try {
            const data = await fetchPlaylistVideos(videoUrl);
            
            if (!data.videos || data.videos.length === 0) {
              alert('No videos found in playlist');
              processingStatus.style.display = 'none';
              return;
            }
            
            // Initialize playlist state
            playlistState.videos = data.videos;
            playlistState.currentIndex = 0;
            playlistState.playlistId = getYouTubePlaylistId(videoUrl);
            playlistState.nextPageToken = data.nextPageToken;
            playlistState.isPlaylist = true;
            
            // Show navigation controls
            document.getElementById('prev-video-btn').style.display = 'flex';
            document.getElementById('next-video-btn').style.display = 'flex';
            document.getElementById('playlist-indicator').style.display = 'block';
            
            const totalText = data.videos.length + (data.nextPageToken ? '+' : '');
            document.getElementById('total-videos').textContent = totalText;
            document.getElementById('current-video-index').textContent = '1';
            
            // Load first video
            navigateToVideo(0);
            return;
          } catch (error) {
            console.error('Playlist error:', error);
            alert('Failed to load playlist: ' + error.message);
            processingStatus.style.display = 'none';
            return;
          }
        } else {
          // Hide playlist controls for single videos
          if (document.getElementById('prev-video-btn')) {
            document.getElementById('prev-video-btn').style.display = 'none';
            document.getElementById('next-video-btn').style.display = 'none';
            document.getElementById('playlist-indicator').style.display = 'none';
          }
          playlistState.isPlaylist = false;
        }
`;

                // Check if already added
                if (content.includes('isPlaylistUrl(videoUrl)')) {
                    console.log('✅ Playlist detection already present!');
                    process.exit(0);
                }

                // Insert after videoUrl line
                lines.splice(j + 1, 0, playlistDetection);

                fs.writeFileSync(scriptPath, lines.join('\n'), 'utf8');

                console.log('✅ Playlist detection added successfully!');
                console.log('\n🎉 COMPLETE! Refresh browser and try:');
                console.log('   https://www.youtube.com/playlist?list=PLM45RE_YsqS5-S58HSmYOhu2m-tRul9jW');
                process.exit(0);
            }
        }
    }
}

console.log('❌ Could not find insertion point');
process.exit(1);
