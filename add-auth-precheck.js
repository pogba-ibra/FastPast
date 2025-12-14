const fs = require('fs');
const path = require('path');

// All pages that need the auth precheck
const pages = [
    'index.html',
    'features.html',
    'pricing.html',
    'faq.html',
    'terms.html',
    'privacy.html',
    'gopremium.html'
];

const webDir = path.join(__dirname, 'Web');

pages.forEach(page => {
    const filePath = path.join(webDir, page);

    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Skipping ${page} - file not found`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // Check if already has auth-precheck
    if (content.includes('auth-precheck.js')) {
        console.log(`✅ ${page} already has auth precheck`);
        return;
    }

    // Add auth-precheck script in <head> BEFORE other scripts (no defer!)
    // This ensures it runs immediately to prevent flash
    content = content.replace(
        '<head>',
        '<head>\n    <script src="js/auth-precheck.js"></script>'
    );

    // Write updated content
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Added auth precheck to ${page}`);
});

console.log('\n🎉 Auth precheck added to all pages! No more flash!');
