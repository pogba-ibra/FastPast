const fs = require('fs');

const serverPath = 'c:\\\\Users\\\\ZLATAN\\\\Documents\\\\FastPast\\\\server.js';
let content = fs.readFileSync(serverPath, 'utf8');

// Add dotenv at the very beginning
if (!content.includes("require('dotenv')")) {
    content = "require('dotenv').config();\\n" + content;
    fs.writeFileSync(serverPath, content, 'utf8');
    console.log('✅ Added dotenv configuration to server.js');
} else {
    console.log('✅ Dotenv already configured');
}
