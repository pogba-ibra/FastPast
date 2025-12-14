const fs = require('fs');

console.log('🔧 Adding missing playlist pieces to script.js...');

const scriptPath = 'c:\\Users\\ZLATAN\\Documents\\FastPast\\Web\\script.js';
let content = fs.readFileSync(scriptPath, 'utf8');

// Check what's missing
const hasPlaylistId = content.includes('getYouTubePlaylistId');
const hasPlaylistState = content.includes('playlistState');
const hasInit = content.includes('initPlaylistNavigation()');

console.log('Current status:');
console.log('  - getYouTubePlaylistId:', hasPlaylistId ? '✅' : '❌');
console.log('  - playlistState:', hasPlaylistState ? '✅' : '❌');
console.log('  - initPlaylistNavigation call:', hasInit ? '✅' : '❌');

// If missing, use manual approach - insert directly after navigation functions
if (!hasPlaylistId || !hasPlaylistState) {
    const lines = content.split('\n');

    // Find fetchPlaylistVideos and add helpers before it
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('fetchPlaylistVideos')) {
            const helperCode = `
  // Helper functions for playlist detection
  function getYouTubePlaylistId(url) {
    const regex = /[?&]list=([a-zA-Z0-9_-]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  function isPlaylistUrl(url) {
    return getYouTubePlaylistId(url) !== null && 
           (url.includes('youtube.com') || url.includes('youtu.be'));
  }

  // Playlist state
  const playlistState = {
    videos: [],
    currentIndex: 0,
    playlistId: null,
    nextPageToken: null,
    isPlaylist: false
  };

`;
            lines.splice(i, 0, helperCode);
            console.log('✅ Added helper functions and state');
            break;
        }
    }

    // Write back
    fs.writeFileSync(scriptPath, lines.join('\n'), 'utf8');
}

// Add init call if missing
content = fs.readFileSync(scriptPath, 'utf8');
if (!hasInit) {
    const lines = content.split('\n');

    // Find end of file or last meaningful line
    const lastLine = lines.length - 1;
    lines.splice(lastLine, 0, '\n  // Initialize playlist navigation\n  initPlaylistNavigation();\n');

    fs.writeFileSync(scriptPath, lines.join('\n'), 'utf8');
    console.log('✅ Added initPlaylistNavigation() call');
}

console.log('\n✅ All playlist pieces added!');
console.log('   Refresh browser and test!');
