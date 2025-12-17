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

        // Try to find video element with src attribute
        let videoUrl = await page.evaluate(() => {
            // PRIORITY 1: Look for video_redirect link (mbasic.facebook.com specific)
            // This is the direct CDN link that yt-dlp uses
            const videoRedirectLink = document.querySelector('a[href*="video_redirect"]');
            if (videoRedirectLink && videoRedirectLink.href) {
                return videoRedirectLink.href;
            }

            // PRIORITY 2: Try direct video tag
            const video = document.querySelector('video');
            if (video && video.src) {
                return video.src;
            }

            // PRIORITY 3: Try video source tag
            const source = document.querySelector('video source');
            if (source && source.src) {
                return source.src;
            }

            // PRIORITY 4: Try to find any .mp4 links in page
            const links = Array.from(document.querySelectorAll('a'));
            for (const link of links) {
                const href = link.href || '';
                if (href.includes('.mp4') || href.includes('/video/')) {
                    return href;
                }
            }

            return null;
        });

        if (!videoUrl) {
            console.log('⚠️ No direct video URL found, checking network requests...');
            // If not found in DOM, check captured network requests
            videoUrl = await captureVideoFromNetwork(page);
        }

        await browser.close();

        if (videoUrl) {
            console.log(`✅ Extracted video URL: ${videoUrl.substring(0, 100)}...`);
            return { videoUrl, title };
        } else {
            throw new Error('Could not extract video URL from Facebook page');
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

        const parts = line.split('\t');
        if (parts.length >= 7) {
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

    console.log(`🍪 Parsed ${cookies.length} cookies`);
    return cookies;
}

/**
 * Capture video URL from network requests
 */
async function captureVideoFromNetwork(page) {
    return new Promise((resolve) => {
        let videoUrl = null;

        page.on('response', async (response) => {
            const responseUrl = response.url();
            const contentType = response.headers()['content-type'] || '';

            // Look for video content type or .mp4 in URL
            if (contentType.includes('video/') || responseUrl.includes('.mp4')) {
                videoUrl = responseUrl;
                console.log(`🎥 Found video in network: ${responseUrl.substring(0, 100)}...`);
            }
        });

        // Wait a bit for requests to complete
        setTimeout(() => {
            resolve(videoUrl);
        }, 5000);
    });
}

module.exports = { extractFacebookVideoUrl };
