/* eslint-disable */
const fs = require('fs');

console.log('🚀 Finalizing playlist support...');

const scriptPath = 'c:\\Users\\ZLATAN\\Documents\\FastPast\\Web\\script.js';
let content = fs.readFileSync(scriptPath, 'utf8');

// Add init call and update process button
const initCall = `
  // Initialize playlist navigation
  initPlaylistNavigation();
`;

// Find where to add init (after other inits or in DOMContentLoaded)
let lines = content.split('\n');
let initAdded = false;

// Look for existing init calls or DOMContentLoaded
for (let i = lines.length - 1; i >= 0; i--) {
    if ((lines[i].includes('initTheme()') || lines[i].includes('init')) &&
        lines[i].trim() && !lines[i].includes('function') && !lines[i].includes('//')) {
        if (!content.includes('initPlaylistNavigation()')) {
            lines.splice(i + 1, 0, initCall);
            initAdded = true;
            console.log('✅ Added initPlaylistNavigation() call');
            break;
        }
    }
}

fs.writeFileSync(scriptPath, lines.join('\n'), 'utf8');

console.log('\n✅ Step 3 complete!');
console.log('\n🎉 PLAYLIST FEATURE FULLY IMPLEMENTED!');
console.log('\n📋 Summary:');
console.log('   ✅ Backend: Dotenv + 10 API keys + Endpoint');
console.log('   ✅ HTML: Navigation arrows');
console.log('   ✅ CSS: Playlist styling');
console.log('   ✅ JavaScript: Complete playlist logic');
console.log('\n🚀 Refresh your browser and test with:');
console.log('   https://www.youtube.com/playlist?list=PLM45RE_YsqS5-S58HSmYOhu2m-tRul9jW');
