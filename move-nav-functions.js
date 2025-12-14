const fs = require('fs');

console.log('🔧 Moving navigation functions inside DOMContentLoaded...');

const scriptPath = 'c:\\Users\\ZLATAN\\Documents\\FastPast\\Web\\script.js';
let content = fs.readFileSync(scriptPath, 'utf8');
let lines = content.split('\n');

// Find the navigation functions (fetchPlaylistVideos, navigateToVideo, initPlaylistNavigation)
let navFunctionsStart = -1;
let navFunctionsEnd = -1;
let navFunctionsCode = [];

// Find fetchPlaylistVideos
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('//Fetch playlist videos from server') || lines[i].includes('async function fetchPlaylistVideos')) {
        navFunctionsStart = i;
        break;
    }
}

if (navFunctionsStart > 0) {
    // Find the end of initPlaylistNavigation function (the last navigation function)
    for (let i = navFunctionsStart; i < lines.length; i++) {
        if (lines[i].includes('function initPlaylistNavigation')) {
            // Find its closing brace
            let braceCount = 0;
            for (let j = i; j < lines.length; j++) {
                if (lines[j].includes('{')) braceCount++;
                if (lines[j].includes('}')) {
                    braceCount--;
                    if (braceCount === 0) {
                        navFunctionsEnd = j;
                        break;
                    }
                }
            }
            break;
        }
    }

    if (navFunctionsEnd > 0) {
        // Extract the navigation functions code
        navFunctionsCode = lines.slice(navFunctionsStart, navFunctionsEnd + 1);

        // Remove from current location
        lines.splice(navFunctionsStart, navFunctionsEnd - navFunctionsStart + 1);

        console.log('✅ Extracted navigation functions (lines ' + navFunctionsStart + ' to ' + navFunctionsEnd + ')');

        // Find DOMContentLoaded and insert right after the variable declarations
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('DOMContentLoaded')) {
                // Find where variables are declared (urlInput, processBtn, etc.)
                for (let j = i; j < i + 50; j++) {
                    if (lines[j].includes('const qualitySelect') || lines[j].includes('qualitySelect.disabled')) {
                        // Insert navigation functions after variable declarations
                        lines.splice(j + 2, 0, '\n  // ========== Playlist Navigation Functions ==========\n', ...navFunctionsCode.map(l => '  ' + l), '\n  // ========== End Playlist Functions ==========\n');
                        console.log('✅ Inserted navigation functions after line ' + (j + 2));
                        break;
                    }
                }
                break;
            }
        }

        fs.writeFileSync(scriptPath, lines.join('\n'), 'utf8');
        console.log('✅ Navigation functions moved inside DOMContentLoaded!');
        console.log('\n🎯 Refresh browser and test!');
    }
}
