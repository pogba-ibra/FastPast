const fs = require('fs');

console.log('🔧 Fixing script.js - removing duplicates and adding helpers...');

const scriptPath = 'c:\\Users\\ZLATAN\\Documents\\FastPast\\Web\\script.js';
let content = fs.readFileSync(scriptPath, 'utf8');
const lines = content.split('\n');

// Find where to insert (after qualitySelect setup in DOMContentLoaded)
let insertIdx = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('qualitySelect.disabled = true')) {
        insertIdx = i + 2; // After the closing }
        break;
    }
}

if (insertIdx > 0) {
    const helperFunctions = `
  // Playlist helper functions
  function getYouTubePlaylistId(url) {
    const regex = /[?&]list=([a-zA-Z0-9_-]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  function isPlaylistUrl(url) {
    return getYouTubePlaylistId(url) !== null && 
           (url.includes('youtube.com') || url.includes('youtu.be'));
  }
`;

    lines.splice(insertIdx, 0, helperFunctions);
    fs.writeFileSync(scriptPath, lines.join('\n'), 'utf8');
    console.log('✅ Helper functions added at line ' + insertIdx);
    console.log('\n🎉 DONE! Refresh browser and test playlist URL!');
} else {
    console.log('❌ Could not find insertion point');
    process.exit(1);
}
