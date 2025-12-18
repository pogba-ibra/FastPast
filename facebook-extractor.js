const { chromium } = require('playwright');
const fs = require('fs');

/**
 * Extract direct video URL from Facebook using headless browser
 * @param {string} url - Facebook video URL (will be converted to mbasic)
 * @param {string} cookieFile - Path to Facebook cookies file
 * @returns {Promise<{videoUrl: string, title: string}>}
 */
async function extractFacebookVideoUrl(url, cookieFile) {
    let browser;
    try {
        console.log('📱 Launching headless browser for Facebook extraction...');

        // Launch Chromium in headless mode
        browser = await chromium.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',      // User Request: Reduce memory
                '--single-process'    // User Request: Reduce memory
            ]
        });

        // User Request: Use REAL User-Agent to bypass detection
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
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
            // Facebook video segments always contain 'fbcdn.net' and usually 'bytestart=' or '.mp4'
            if (reqUrl.includes('fbcdn.net') && (reqUrl.includes('video') || reqUrl.includes('.mp4'))) {
                // console.log(`🕵️ Sniffer caught direct video: ${reqUrl.substring(0, 50)}...`);
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
            // Navigate and wait for DOM
            await page.goto(mbasicUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        } catch (navError) {
            console.log(`⚠️ Navigation timeout/error: ${navError.message}`);
            // Take screenshot for debug
            await page.screenshot({ path: 'debug_nav_error.png' });
        }

        // PRIORITY 1: The "FDown" Method (Direct Redirect Link)
        let videoUrl = null;
        try {
            const directLink = await page.getAttribute('a[href*="video_redirect"]', 'href');
            if (directLink) {
                console.log(`✅ Found direct link (FDown Method): ${directLink.substring(0, 100)}...`);
                videoUrl = directLink;
            }
        } catch (e) {
            console.log('⚠️ Priority redirect check failed/skipped:', e.message);
        }

        // Extract title from page (mbasic structure)
        let title = 'Unknown Title';
        try {
            // Try specific selectors for mbasic post content
            const titleSelectors = ['h3', 'h1', 'div[role="article"] strong', 'p'];
            for (const selector of titleSelectors) {
                const element = await page.$(selector);
                if (element) {
                    const text = await element.innerText();
                    if (text && text.trim().length > 0 && text.length < 100) { // Avoid grabbing full post body
                        title = text.trim();
                        break;
                    }
                }
            }
            // Fallback to page title if selectors failed
            if (title === 'Unknown Title') {
                title = await page.title();
            }
        } catch (e) {
            console.log('⚠️ Title extraction warning:', e.message);
            title = await page.title().catch(() => 'Unknown Title');
        }
        console.log(`📝 Page title: ${title}`);

        // Login Wall / Consent Check
        if (await page.$('button[value="1"], button[name="login"]')) {
            console.log('⚠️ Consent/Login button detected. Attempting click...');
            await page.click('button[value="1"]', { timeout: 5000 }).catch(() => { });
            await page.waitForTimeout(3000);
        }

        // Check for Login Wall (Cookie Verification)
        const content = await page.content();
        if (content.includes('Log In') || content.includes('login_form')) {
            console.error('❌ Login Wall detected! Cookies invalid.');
            await page.screenshot({ path: 'debug_login_wall.png' });
        }

        // 1. Wait for ANY link that looks like a video redirect (Facebook 2025 Layout)
        if (!videoUrl) {
            videoUrl = await page.evaluate(() => {
                // Look for the mobile-basic download link
                const anchor = document.querySelector('a[href*="video_redirect"]');
                if (anchor) return anchor.href;

                // Fallback: Look for the actual <video> tag if it's rendered
                const video = document.querySelector('video');
                return video ? video.src : null;
            });
        }

        if (videoUrl) {
            console.log(`✅ Found direct link via DOM: ${videoUrl.substring(0, 100)}...`);
        } else {
            // Force interaction to trigger network sniffer
            console.log('👆 Simulating interaction to trigger sniffer...');
            await page.click('div[role="button"], [aria-label*="Play"]', { force: true }).catch(() => { });
            await page.waitForTimeout(5000); // Give it time to sniff
        }

        await page.mouse.wheel(0, 500);
        await page.waitForTimeout(1000);
        await page.mouse.wheel(0, -200); // Scroll up slightly
        await page.waitForTimeout(500);

        // Export fresh cookies (now validated/refreshed by Facebook)
        const freshCookies = await context.cookies();
        // Format cookies for yt-dlp (Netscape format)
        const netscapeCookies = formatCookiesToNetscape(freshCookies);
        const freshCookiePath = cookieFile.replace('.txt', '_fresh.txt');
        fs.writeFileSync(freshCookiePath, netscapeCookies);
        console.log(`🍪 Saved fresh cookies to: ${freshCookiePath}`);

        if (!videoUrl) {
            if (snortedUrl) {
                console.log('✅ Used Sniffer URL (FDown Secret) as fallback');
                videoUrl = snortedUrl;
            } else {
                console.log('⚠️ No direct video URL found (DOM or Sniffer), checking likely failed...');
                // Capture generic network as last resort
                const networkResult = await captureVideoFromNetwork(page);
                videoUrl = networkResult.videoUrl;
            }
        }

        // Capture the exact User-Agent used
        const userAgent = await page.evaluate(() => navigator.userAgent);
        console.log(`🕵️ Using User-Agent: ${userAgent}`);

        await browser.close();

        if (videoUrl) {
            console.log(`✅ Extracted video URL: ${videoUrl.substring(0, 100)}...`);
            return { videoUrl, title, freshCookiePath, userAgent };
        } else {
            // Even if direct URL fails, we have fresh cookies + title + UA
            console.log('⚠️ Could not extract direct URL, but returning fresh cookies & title');
            return { videoUrl: null, title, freshCookiePath, userAgent };
        }


    } catch (error) {
        if (browser) {
            await browser.close().catch(() => { });
        }
        console.error('❌ Facebook extraction error:', error.message);
        throw error;
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
 * Capture video and audio URLs from network requests
 */
async function captureVideoFromNetwork(page) {
    return new Promise((resolve) => {
        let videoUrl = null;
        let audioUrl = null;

        page.on('response', async (response) => {
            const responseUrl = response.url();
            const contentType = response.headers()['content-type'] || '';
            const resourceType = response.request().resourceType();

            // Look for video content (direct CDN links)
            if (resourceType === 'media' || contentType.includes('video/') || responseUrl.includes('.mp4')) {
                if (responseUrl.includes('fbcdn.net')) {
                    videoUrl = responseUrl;
                    console.log(`🎥 Found DIRECT FB CDN video: ${responseUrl.substring(0, 100)}...`);
                } else if (!videoUrl) {
                    videoUrl = responseUrl;
                    console.log(`🎥 Found video stream: ${responseUrl.substring(0, 100)}...`);
                }
            }

            // Look for audio content (Nuclear Workaround)
            if (contentType.includes('audio/') || (responseUrl.includes('bytestart') && responseUrl.includes('audio'))) {
                audioUrl = responseUrl;
                console.log(`🎵 Found audio stream: ${responseUrl.substring(0, 100)}...`);
            }
        });

        // Wait for requests to populate (Facebook lazy loads)
        // User requested increased timeout for slow loads
        setTimeout(() => {
            resolve({ videoUrl, audioUrl });
        }, 15000);
    });
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
