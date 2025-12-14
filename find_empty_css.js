const fs = require('fs');
const path = 'c:\\Users\\ZLATAN\\Documents\\FastPast\\style\\style.css';

try {
    const content = fs.readFileSync(path, 'utf8');
    console.log(`Read file of size: ${content.length} characters`);

    // Regex for {} with whitespace/comments
    // matches { then (whitespace OR comment)* then }
    const regex = /\{\s*(?:\/\*[\s\S]*?\*\/\s*)*\}/g;

    let match;
    let count = 0;

    console.log('Searching for empty rulesets (including commented ones)...');

    while ((match = regex.exec(content)) !== null) {
        count++;
        const upToMatch = content.substring(0, match.index);
        const lineNumber = upToMatch.split('\n').length;

        let contextStart = Math.max(0, match.index - 50);
        let contextEnd = Math.min(content.length, match.index + match[0].length + 20);
        let context = content.substring(contextStart, contextEnd).replace(/\n/g, '\\n');

        console.log(`Match ${count} at line ${lineNumber}: "${context}"`);
    }

    if (count === 0) {
        console.log("No empty rulesets found with regex.");
    }
} catch (e) {
    console.error('Error:', e.message);
}
