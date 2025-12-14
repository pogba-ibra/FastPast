const fs = require('fs');
const path = 'c:\\Users\\ZLATAN\\Documents\\FastPast\\style\\style.css';

try {
    const content = fs.readFileSync(path, 'utf8');
    // Strict empty: { followed by whitespace }
    const regex = /\{\s*\}/g;

    let match;
    let found = false;

    console.log('--- START SEARCH ---');
    while ((match = regex.exec(content)) !== null) {
        found = true;
        const upToMatch = content.substring(0, match.index);
        const lineNumber = upToMatch.split('\n').length;

        // Get line content
        const lines = content.split('\n');
        const lineContent = lines[lineNumber - 1];

        console.log(`Line ${lineNumber}: ${lineContent.trim()}`);
    }
    console.log('--- END SEARCH ---');

    if (!found) {
        console.log("No strictly empty rulesets found.");
    }
} catch (e) {
    console.error('Error:', e.message);
}
