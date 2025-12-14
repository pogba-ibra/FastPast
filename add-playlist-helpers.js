const fs = require('fs');

// Read script.js
const scriptPath = 'c:\\\\Users\\\\ZLATAN\\\\Documents\\\\FastPast\\\\Web\\\\script.js';
let content = fs.readFileSync(scriptPath, 'utf8');

// Helper functions to add after getYouTubeVideoId (around line 721)
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

// Find location after getYouTubeVideoId
const lines = content.split('\\n');
const targetIndex = lines.findIndex((line, idx) => {
    return line.trim() === '}' &&
        idx > 715 && idx < 725 &&
        lines[idx - 3]?.includes('getYouTubeVideoId');
});

if (targetIndex === -1) {
    console.error('ERROR: Could not find insertion point');
    process.exit(1);
}

// Insert helper functions
lines.splice(targetIndex + 1, 0, helperFunctions);

// Write back
fs.writeFileSync(scriptPath, lines.join('\\n'), 'utf8');

console.log('✅ Playlist helper functions added at line ' + (targetIndex + 1));
