const fs = require('fs');
const path = 'c:\\Users\\ZLATAN\\Documents\\FastPast\\style\\style.css';

try {
    const content = fs.readFileSync(path, 'utf8');
    const regex = /\{\s*(?:\/\*[\s\S]*?\*\/\s*)*\}/g;

    let match;
    console.log('--- SEARCHING COMMENTED ---');
    while ((match = regex.exec(content)) !== null) {
        const upToMatch = content.substring(0, match.index);
        const lineNumber = upToMatch.split('\n').length;
        console.log(`Line ${lineNumber} MATCH`);
    }
} catch (e) {
    console.error('Error:', e.message);
}
