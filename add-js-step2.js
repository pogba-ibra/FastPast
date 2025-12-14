const fs = require('fs');

console.log('🚀 Adding navigation functions to script.js...');

const scriptPath = 'c:\\Users\\ZLATAN\\Documents\\FastPast\\Web\\script.js';
let content = fs.readFileSync(scriptPath, 'utf8');

// Navigation functions to add before DOMContentLoaded or process button
const navigationFunctions = `
//Fetch playlist videos from server
async function fetchPlaylistVideos(playlistUrl, pageToken = null) {
  try {
    const response = await fetch('http://localhost:3002/get-playlist-videos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playlistUrl, pageToken })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch playlist');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching playlist:', error);
    throw error;
  }
}

// Navigate to specific video in playlist
function navigateToVideo(index) {
  if (index < 0 || index >= playlistState.videos.length) {
    return;
  }
  
  playlistState.currentIndex = index;
  const video = playlistState.videos[index];
  const videoUrl = \`https://www.youtube.com/watch?v=\${video.id}\`;
  
  // Update input
  urlInput.value = videoUrl;
  
  // Update UI
  document.getElementById('current-video-index').textContent = index + 1;
  document.getElementById('prev-video-btn').disabled = index === 0;
  document.getElementById('next-video-btn').disabled = 
    index === playlistState.videos.length - 1 && !playlistState.nextPageToken;
  
  // Load video
  processingStatus.style.display = 'block';
  loadVideoQualities(videoUrl)
    .then(() => showVideoPreview(videoUrl))
    .catch(error => {
      console.error('Error loading video:', error);
      alert('Failed to load video: ' + error.message);
      processingStatus.style.display = 'none';
    });
    
  // Lazy load more if approaching end
  if (index >= playlistState.videos.length - 3 && playlistState.nextPageToken) {
    const playlistUrl = \`https://www.youtube.com/playlist?list=\${playlistState.playlistId}\`;
    fetchPlaylistVideos(playlistUrl, playlistState.nextPageToken)
      .then(data => {
        playlistState.videos.push(...data.videos);
        playlistState.nextPageToken = data.nextPageToken;
        const totalText = playlistState.videos.length + (data.nextPageToken ? '+' : '');
        document.getElementById('total-videos').textContent = totalText;
      })
      .catch(error => console.error('Error loading more videos:', error));
  }
}

// Initialize playlist navigation
function initPlaylistNavigation() {
  const prevBtn = document.getElementById('prev-video-btn');
  const nextBtn = document.getElementById('next-video-btn');
  
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      navigateToVideo(playlistState.currentIndex - 1);
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      navigateToVideo(playlistState.currentIndex + 1);
    });
  }
}
`;

// Find a good insertion point (before DOMContentLoaded)
const lines = content.split('\n');
let insertIdx = -1;

// Look for DOMContentLoaded
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('DOMContentLoaded') || lines[i].includes('document.addEventListener')) {
        insertIdx = i;
        break;
    }
}

// If not found, look for processBtn definition
if (insertIdx === -1) {
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('processBtn = document.getElementById')) {
            insertIdx = i - 2;
            break;
        }
    }
}

if (insertIdx > 0 && !content.includes('fetchPlaylistVideos')) {
    console.log('✅ Adding navigation functions at line ' + insertIdx);
    lines.splice(insertIdx, 0, navigationFunctions);
    fs.writeFileSync(scriptPath, lines.join('\n'), 'utf8');
    console.log('✅ Navigation functions added successfully');
} else if (content.includes('fetchPlaylistVideos')) {
    console.log('✅ Navigation functions already present');
} else {
    console.log('❌ Could not find insertion point');
    process.exit(1);
}

console.log('\n✅ Step 2 complete: Navigation functions added');
console.log('   Moving to step 3: Init call and process button update...');
