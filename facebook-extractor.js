const { chromium } = require('playwright');
const fs = require('fs');

/**
 * Extract direct video URL from Facebook using headless browser
 * @param {string} url - Facebook video URL (will be converted to mbasic)
 * @param {string} cookieFile - Path to Facebook cookies file
 * @param {string} requestUA - Optional User-Agent to sync with
 * @returns {Promise<{videoUrl: string, title: string}>}
 */
async function extractFacebookVideoUrl(url, cookieFile, requestUA) {
    let browser;
    try {
        console.log('📱 Launching stealth browser for Facebook extraction...');

        const proxies = require('./proxies');
        const randomProxy = proxies[Math.floor(Math.random() * proxies.length)];

        // Launch Chromium with stealth and memory-saving flags
        browser = await chromium.launch({
            headless: true,
            proxy: { server: randomProxy }, // User Request: Use proxy to bypass tarpitting
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--single-process',
                '--js-flags="--max-old-space-size=1024"' // User Request: Limit JS memory
            ]
        });

        // User Request: Use EXACT User-Agent provided by user for full synchronization
        const context = await browser.newContext({
            userAgent: requestUA || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36'
        });

        // Load cookies if file exists
        if (fs.existsSync(cookieFile)) {
            console.log(`🍪 Loading cookies from: ${cookieFile}`);
            const cookiesContent = fs.readFileSync(cookieFile, 'utf-8');
            const cookies = parseFacebookCookies(cookiesContent);
            if (cookies.length > 0) {
                await context.addCookies(cookies);
            }
        }

        const page = await context.newPage();

        // Sniffer: Intercept network requests to find direct video file (The "FDown Secret")
        let snortedUrl = null;
        page.on('request', request => {
            const reqUrl = request.url();
            if (reqUrl.includes('fbcdn.net') && (reqUrl.includes('video') || reqUrl.includes('.mp4'))) {
                snortedUrl = reqUrl;
            }
        });

        // Fix URL Formatting: Convert /reel/ to /video.php?v= for mbasic stability
        let mbasicUrl = url;
        const idMatch = url.match(/(?:videos\/|video\.php\?v=|reel\/)(\d+)/);
        if (idMatch && idMatch[1]) {
            mbasicUrl = `https://mbasic.facebook.com/video.php?v=${idMatch[1]}`;
        } else {
            mbasicUrl = url
                .replace('www.facebook.com', 'mbasic.facebook.com')
                .replace('m.facebook.com', 'mbasic.facebook.com');
        }

        console.log(`🔍 Navigating to: ${mbasicUrl}`);

        try {
            // Navigate and wait for commit (Faster than networkidle)
            await page.goto(mbasicUrl, { waitUntil: 'commit', timeout: 15000 });
        } catch (navError) {
            console.log(`⚠️ Navigation timeout/error: ${navError.message}`);
            await page.screenshot({ path: 'debug_nav_error.png' });
        }

        // 1. Check for Login Wall immediately (Cookie Verification)
        const loginWall = await page.isVisible('input[name="login"], button[name="login"]');
        if (loginWall) {
            console.error('❌ Login Wall detected! Cookies invalid or IP blocked.');
            await page.screenshot({ path: 'debug_login_wall.png' });
            throw new Error("Cookies Expired or IP Blocked");
        }

        // 2. Search for the link directly in HTML without waiting for selectors (FDown Method)
        let videoUrl = null;
        try {
            const html = await page.content();
            const match = html.match(/href="([^"]+video_redirect[^"]+)"/);
            if (match) {
                videoUrl = match[1].replace(/&amp;/g, '&');
                console.log(`✅ Found direct link via Regex: ${videoUrl.substring(0, 100)}...`);
            }
        } catch (regexErr) {
            console.log('⚠️ Regex extraction failed:', regexErr.message);
        }

        // 3. Fallback to DOM if regex failed
        if (!videoUrl) {
            videoUrl = await page.evaluate(() => {
                const anchor = document.querySelector('a[href*="video_redirect"]');
                if (anchor) return anchor.href;
                const video = document.querySelector('video');
                return video ? video.src : null;
            });
        }

        // Extract title
        let title = 'Unknown Title';
        try {
            const titleSelectors = ['h3', 'h1', 'div[role="article"] strong', 'p'];
            for (const selector of titleSelectors) {
                const element = await page.$(selector);
                if (element) {
                    const text = await element.innerText();
                    if (text && text.trim().length > 0 && text.length < 100) {
                        title = text.trim();
                        break;
                    }
                }
            }
            if (title === 'Unknown Title') title = await page.title();
        } catch {
            title = await page.title().catch(() => 'Unknown Title');
        }

        // Force interaction if still no URL (to trigger snortedUrl)
        if (!videoUrl) {
            console.log('👆 Triggering sniffer...');
            await page.click('div[role="button"], [aria-label*="Play"]', { force: true }).catch(() => { });
            await page.waitForTimeout(5000);
            if (snortedUrl) videoUrl = snortedUrl;
        }

        // Export fresh cookies
        const freshCookies = await context.cookies();
        const netscapeCookies = formatCookiesToNetscape(freshCookies);
        const freshCookiePath = cookieFile.replace('.txt', '_fresh.txt');
        fs.writeFileSync(freshCookiePath, netscapeCookies);

        const userAgent = await page.evaluate(() => navigator.userAgent);
        await browser.close();

        if (videoUrl) {
            return { videoUrl, title, freshCookiePath, userAgent };
        } else {
            return { videoUrl: null, title, freshCookiePath, userAgent };
        }

    } catch (error) {
        if (browser) await browser.close().catch(() => { });
        console.error('❌ Facebook extraction error:', error.message);
        throw error;
    } finally {
        if (browser) await browser.close().catch(() => { });
    }
}

/**
 * Parse Netscape cookies format to Playwright cookies
 */
function parseFacebookCookies(cookiesContent) {
    const cookies = [];
    const lines = cookiesContent.split('\n');


    for (const line of lines) {
        if (!line.trim() || line.startsWith('#')) continue;

        let parts = line.split('\t');
        // Fallback: If tabs fail, try splitting by whitespace (some exporters use spaces)
        if (parts.length < 7) {
            parts = line.trim().split(/\s+/);
        }

        if (parts.length >= 7) {
            const domain = parts[0];
            // Filter for Facebook domains only to reduce overhead
            if (domain.includes('facebook.com') || domain.includes('fb.com') || domain.includes('.facebook.com')) {
                cookies.push({
                    name: parts[5],
                    value: parts[6],
                    domain: parts[0],
                    path: parts[2],
                    expires: parseInt(parts[4]) || -1,
                    httpOnly: parts[1] === 'TRUE',
                    secure: parts[3] === 'TRUE',
                    sameSite: 'Lax'
                });

            }
        }
    }

    console.log(`🍪 Parsed ${cookies.length} Facebook cookies (from ${lines.length} total lines)`);
    return cookies;
}



/**
 * Format Playwright cookies to Netscape format for yt-dlp
 */
function formatCookiesToNetscape(cookies) {
    let output = "# Netscape HTTP Cookie File\n# This file is generated by Playwright\n\n";
    for (const cookie of cookies) {
        const domain = cookie.domain.startsWith('.') ? cookie.domain : '.' + cookie.domain;
        const includeSubdomains = domain.startsWith('.') ? 'TRUE' : 'FALSE';
        const path = cookie.path;
        const secure = cookie.secure ? 'TRUE' : 'FALSE';
        const expires = cookie.expires === -1 ? 0 : Math.round(cookie.expires);
        const name = cookie.name;
        const value = cookie.value;

        output += `${domain}\t${includeSubdomains}\t${path}\t${secure}\t${expires}\t${name}\t${value}\n`;
    }
    return output;
}

module.exports = { extractFacebookVideoUrl };
