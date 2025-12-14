const fs = require('fs');
const path = require('path');

// Pages to update (main pages with login buttons)
const pages = [
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

    // Check if already has profile dropdown
    if (content.includes('profile-dropdown.js')) {
        console.log(`✅ ${page} already has profile dropdown`);
        return;
    }

    // Add CSS link before </head>
    if (!content.includes('profile-dropdown.css')) {
        content = content.replace(
            '</head>',
            '    <link rel="stylesheet" href="style/profile-dropdown.css">\n</head>'
        );
    }

    // Add JS script before </head> or before other scripts
    content = content.replace(
        '</head>',
        '    <script src="js/profile-dropdown.js" defer></script>\n</head>'
    );

    // Write updated content
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated ${page}`);
});

console.log('\n🎉 All pages updated with profile dropdown!');
