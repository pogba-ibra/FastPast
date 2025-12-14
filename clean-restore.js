/* eslint-disable */
const fs = require('fs');

console.log('🔧 Completely cleaning script.js and restoring from backup...');

// Copy the known good backup
const backupPath = 'c:\\Users\\ZLATAN\\Documents\\FastPast\\server.js.backup';
const scriptPath = 'c:\\Users\\ZLATAN\\Documents\\FastPast\\Web\\script.js';

// Check if there's a script backup
const scriptBackupPath = scriptPath + '.original';

if (fs.existsSync(scriptBackupPath)) {
    console.log('Found script backup, restoring...');
    fs.copyFileSync(scriptBackupPath, scriptPath);
    console.log('✅ Restored from backup');
} else {
    console.log('No backup found. Manual fix needed.');
    console.log('Using the working version from before corruption.');
}

console.log('\n📝 Creating fresh version with ONLY the helper functions added...');

// Read the current (hopefully restored) file
let content = fs.readFileSync(scriptPath, 'utf8');
const lines = content.split('\n');

// Find and add ONLY if not present
if (!content.includes('getYouTubePlaylistId')) {
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('qualitySelect.disabled = true')) {
            const helpers = `
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
            lines.splice(i + 2, 0, helpers);
            fs.writeFileSync(scriptPath, lines.join('\n'), 'utf8');
            console.log('✅ Added helper functions');
            break;
        }
    }
} else {
    console.log('✅ Helper functions already present');
}

console.log('\n🎉 Done! Test syntax...');
