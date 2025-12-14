/* eslint-disable */
const fs = require('fs');

console.log('🔧 Fixing playlistState scope issue...');

const scriptPath = 'c:\\Users\\ZLATAN\\Documents\\FastPast\\Web\\script.js';
let content = fs.readFileSync(scriptPath, 'utf8');

// Find where playlistState is currently defined
if (content.includes('const playlistState')) {
    console.log('Found playlistState declaration');

    // Need to move it to global scope (before DOMContentLoaded)
    const lines = content.split('\n');
    let stateLineIdx = -1;

    // Find and remove current playlistState
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('const playlistState')) {
            stateLineIdx = i;
            // Remove the declaration and its object (next ~7 lines)
            lines.splice(i, 8);
            console.log('Removed playlistState from line ' + (i + 1));
            break;
        }
    }

    // Add it at global scope (after isDragging, before any functions)
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('let isDragging') || lines[i].includes('Global variable')) {
            const globalState = `
// Playlist state (global scope)
const playlistState = {
  videos: [],
  currentIndex: 0,
  playlistId: null,
  nextPageToken: null,
  isPlaylist: false
};
`;
            lines.splice(i + 1, 0, globalState);
            console.log('✅ Added playlistState at global scope after line ' + (i + 1));
            break;
        }
    }

    fs.writeFileSync(scriptPath, lines.join('\n'), 'utf8');
    console.log('✅ Fixed! playlistState is now in global scope');
} else {
    console.log('❌ playlistState not found - adding at global scope');

    const lines = content.split('\n');
    const globalState = `
// Playlist state (global scope)
const playlistState = {
  videos: [],
  currentIndex: 0,
  playlistId: null,
  nextPageToken: null,
  isPlaylist: false
};
`;

    // Add after first few lines
    lines.splice(5, 0, globalState);
    fs.writeFileSync(scriptPath, lines.join('\n'), 'utf8');
    console.log('✅ Added playlistState at global scope');
}

console.log('\n🎯 Refresh browser and test again!');
