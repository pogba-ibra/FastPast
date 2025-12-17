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
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });

        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 Chrome/131.0.0.0 Mobile Safari/537.36'
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

        // Ensure we're using mbasic
        const mbasicUrl = url
            .replace('www.facebook.com', 'mbasic.facebook.com')
            .replace('m.facebook.com', 'mbasic.facebook.com');

        console.log(`🔍 Navigating to: ${mbasicUrl}`);

        // Navigate and wait for network to be idle
        await page.goto(mbasicUrl, { waitUntil: 'networkidle', timeout: 30000 });

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

        // 1. Try DOM extraction (The "Direct Source" Fix)
        let videoUrl = null;
        // Find the actual MP4 link in the page (video tag)
        const domVideoUrl = await page.evaluate(() => {
            const video = document.querySelector('video');
            if (video && video.src) return video.src;

            const links = Array.from(document.querySelectorAll('a'));
            for (const link of links) {
                const href = link.href || '';
                if (href.includes('.mp4') || href.includes('/video/')) {
                    return href;
                }
            }

            return null;
        });

        if (domVideoUrl && !domVideoUrl.startsWith('blob:')) {
            videoUrl = domVideoUrl;
            console.log(`🎥 Found video via DOM: ${videoUrl.substring(0, 100)}...`);
        }

        // PRIORITY 0: Simulate human interaction to "warm up" the session
        console.log('👆 Simulating human interaction...');

        // 1. Standard FB Interaction: Click play button to trigger network stream
        try {
            const playButton = await page.locator('div[role="button"] >> text=/Play|Watch/i').first();
            if (await playButton.count() > 0 && await playButton.isVisible()) {
                console.log('▶️ Clicking play button to trigger stream...');
                await playButton.click({ force: true }).catch(() => { });
                await page.waitForTimeout(1000);
            }
        } catch (error) {
            console.log('⚠️ Play button interaction warning:', error.message);
        }

        // 2. mbasic Interaction: Look for "Download Video" link (mbasic specific)
        if (page.url().includes('mbasic.facebook.com')) {
            try {
                const downloadLink = await page.$('a[href*="video_redirect"]');
                if (downloadLink) {
                    const href = await downloadLink.getAttribute('href');
                    if (href) {
                        console.log('✅ Found mbasic redirect link');
                        videoUrl = href;
                    }
                }
            } catch (error) {
                console.log('⚠️ mbasic extraction warning:', error.message);
            }
        }

        await page.mouse.wheel(0, 500); // Scroll down
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
            console.log('⚠️ No direct video URL found, checking network requests...');
            // If not found in DOM, check captured network requests
            const networkResult = await captureVideoFromNetwork(page);
            videoUrl = networkResult.videoUrl;
            // logic for audioUrl if separate
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

    let successCount = 0;
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
                successCount++;
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
