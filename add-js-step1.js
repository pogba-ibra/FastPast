const fs = require('fs');

console.log('🚀 Adding playlist JavaScript to script.js...');

const scriptPath = 'c:\\Users\\ZLATAN\\Documents\\FastPast\\Web\\script.js';
let content = fs.readFileSync(scriptPath, 'utf8');
const lines = content.split('\n');

// 1. Add helper functions after getYouTubeVideoId
const helperFunctions = `
  // Extract YouTube playlist ID from URL
  function getYouTubePlaylistId(url) {
    const regex = /[?&]list=([a-zA-Z0-9_-]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  // Check if URL is a playlist
  function isPlaylistUrl(url) {
    return getYouTubePlaylistId(url) !== null && 
           (url.includes('youtube.com') || url.includes('youtu.be'));
  }
`;

// Find getYouTubeVideoId function end
let helperInsertIdx = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('function getYouTubeVideoId')) {
        // Find closing brace
        for (let j = i; j < i + 20; j++) {
            if (lines[j].trim() === '}') {
                helperInsertIdx = j + 1;
                break;
            }
        }
        break;
    }
}

if (helperInsertIdx > 0 && !content.includes('getYouTubePlaylistId')) {
    console.log('✅ Adding playlist helper functions...');
    lines.splice(helperInsertIdx, 0, helperFunctions);
}

// 2. Add playlist state after downloadState
const playlistState = `
  // Playlist state management
  const playlistState = {
    videos: [],           // Array of video objects
    currentIndex: 0,      // Current video index
    playlistId: null,     // Current playlist ID
    nextPageToken: null,  // For pagination
    isPlaylist: false     // Whether current URL is a playlist
  };
`;

let stateInsertIdx = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('const downloadState = {')) {
        // Find closing brace
        let braceCount = 0;
        for (let j = i; j < i + 30; j++) {
            if (lines[j].includes('{')) braceCount++;
            if (lines[j].includes('}')) {
                braceCount--;
                if (braceCount === 0) {
                    stateInsertIdx = j + 2;
                    break;
                }
            }
        }
        break;
    }
}

if (stateInsertIdx > 0 && !content.includes('playlistState')) {
    console.log('✅ Adding playlist state management...');
    lines.splice(stateInsertIdx, 0, playlistState);
}

// Write back
fs.writeFileSync(scriptPath, lines.join('\n'), 'utf8');

console.log('\n✅ Step 1 complete: Helper functions and state added');
console.log('   Moving to step 2: Navigation functions...');
