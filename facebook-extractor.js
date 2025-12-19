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

        // User Request: Enhanced Stealth to bypass bot detection
        await page.addInitScript(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
            Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
            Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
        });

        // Sniffer: Intercept network requests to find direct video/audio files
        let snortedVideo = null;
        let snortedAudio = null;
        let candidateStreams = [];

        // User Request: "Ultimate Fallback" Sniffer (fdownloader style)
        // Intercept network responses to find confirmed video/audio stream URLs
        page.on('response', async response => {
            const resUrl = response.url();
            const contentType = response.headers()['content-type'] || '';

            // Focus on common video/audio patterns and CDN sources
            if (resUrl.includes('.mp4') || resUrl.includes('dash') || resUrl.includes('fbcdn.net') || contentType.includes('video') || contentType.includes('audio')) {
                const isVideo = resUrl.includes('video') || resUrl.includes('.mp4') || resUrl.includes('cat=video') || contentType.includes('video');
                const isAudio = resUrl.includes('audio') || resUrl.includes('.m4a') || resUrl.includes('cat=audio') || contentType.includes('audio');

                if (isVideo || isAudio) {
                    candidateStreams.push({
                        url: resUrl,
                        type: isVideo ? 'video' : 'audio',
                        isDash: resUrl.includes('bytestart') || resUrl.includes('.mpd') || resUrl.includes('dash'),
                        contentType: contentType
                    });

                    // Prioritize DASH segments for HD (often contains 'bytestart' or 'dash')
                    if (isVideo && (resUrl.includes('bytestart') || resUrl.includes('dash'))) {
                        snortedVideo = resUrl;
                        console.log(`💎 [Sniffer] High-quality video stream captured: ${resUrl.substring(0, 80)}...`);
                    }
                    if (isAudio && (resUrl.includes('bytestart') || resUrl.includes('audio'))) {
                        snortedAudio = resUrl;
                        console.log(`💎 [Sniffer] Audio stream captured: ${resUrl.substring(0, 80)}...`);
                    }

                    // Fallback for simple MP4/M4A if nothing better found yet
                    if (!snortedVideo && isVideo) snortedVideo = resUrl;
                    if (!snortedAudio && isAudio) snortedAudio = resUrl;
                }
            }
        });

        // Use FULL site for better extraction and HD support
        let fullUrl = url;
        if (url.includes('facebook.com/share') || url.includes('fb.watch')) {
            // These should be resolved by server.js first, but as a guard:
            console.log('🔗 Shortened URL detected in extractor, relying on redirect...');
        }

        // Ensure we are on www or m (not mbasic) for better DOM/Features
        fullUrl = url.replace('mbasic.facebook.com', 'www.facebook.com');

        console.log(`🔍 Navigating to FULL site: ${fullUrl}`);

        try {
            // Navigate and wait for reasonable load (User Request: Use networkidle and longer timeout)
            await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 60000 });

            // User Request: Add random longer wait and simulated mouse movement for human-like behavior
            console.log('🖱️ Simulating human-like delay and mouse activity...');
            await page.waitForTimeout(10000 + Math.random() * 10000);
            await page.mouse.move(Math.random() * 1920, Math.random() * 1080);
        } catch (navError) {
            console.log(`⚠️ Navigation timeout/error: ${navError.message}`);
            // Fallback: try to continue anyway as sniffer might have worked
        }

        // 1. Check for Login Wall immediately (Cookie Verification)
        const loginWall = await page.isVisible('input[name="login"], button[name="login"]');
        if (loginWall) {
            console.error('❌ Login Wall detected! Cookies invalid or IP blocked.');
            await page.screenshot({ path: 'debug_login_wall.png' });
            throw new Error("Cookies Expired or IP Blocked");
        }

        // 2. Playback Simulation: Trigger HD streams by interacting with the video
        console.log('👇 Simulating playback and scrolling to trigger HD streams...');
        try {
            // Force load via scroll (User Request)
            await page.evaluate(() => window.scrollBy(0, 500));
            await page.waitForTimeout(2000);

            // Wait for any video element or specific reel dialog video (User Request: Improved Selectors)
            await page.waitForSelector('div[role="dialog"] video, video[src], video', { timeout: 30000 }).catch(() => { });

            const videoElement = await page.$('video');
            if (videoElement) {
                console.log('🎬 Video element found, clicking to start playback...');
                await videoElement.click();
            } else {
                // Try clicking common play button areas
                await page.click('div[role="button"][aria-label*="Play"]', { timeout: 2000 }).catch(() => { });
            }
            // Wait longer for network activity to settle/streams to start (as requested)
            console.log('⏳ Waiting 12 seconds for HD stream discovery...');
            await page.waitForTimeout(12000);
        } catch (simError) {
            console.log('⚠️ Playback simulation interaction failed:', simError.message);
        }

        // 3. Robust URL Selection
        let videoUrl = snortedVideo;
        let audioUrl = snortedAudio;

        // Fallback: DOM Search if sniffer missed something
        if (!videoUrl) {
            videoUrl = await page.evaluate(() => {
                const video = document.querySelector('video');
                return video ? video.src : null;
            });
        }

        // Extract title and thumbnail
        let title = 'Unknown Title';
        let thumbnail = null;

        try {
            thumbnail = await page.evaluate(() => {
                const results = [];

                // 1. Try LD+JSON (Very reliable for video metadata)
                try {
                    const jsonScripts = document.querySelectorAll('script[type="application/ld+json"]');
                    for (const script of jsonScripts) {
                        try {
                            const data = JSON.parse(script.innerText);
                            if (data && data.thumbnailUrl) results.push({ url: data.thumbnailUrl, priority: 10 });
                            if (data && data.image) {
                                const imgUrl = typeof data.image === 'string' ? data.image : (data.image.url || data.image[0]);
                                if (imgUrl) results.push({ url: imgUrl, priority: 9 });
                            }
                        } catch { /* ignore parse error */ }
                    }
                } catch { /* ignore */ }

                // 2. Try OG Image / Twitter Image
                const ogImage = document.querySelector('meta[property="og:image"]');
                if (ogImage && ogImage.content) results.push({ url: ogImage.content, priority: 8 });

                const twitterImage = document.querySelector('meta[name="twitter:image"]');
                if (twitterImage && twitterImage.content) results.push({ url: twitterImage.content, priority: 7 });

                // 3. Try Background Images from Video Containers/Placeholders
                // Often Facebook uses a div with a background-image as the cover
                try {
                    const potentialDivs = document.querySelectorAll('div[style*="background-image"]');
                    for (const div of potentialDivs) {
                        const bg = div.style.backgroundImage;
                        if (bg && bg.includes('url(')) {
                            const url = bg.match(/url\(["']?([^"']+)["']?\)/)?.[1];
                            if (url && url.includes('fbcdn.net')) results.push({ url, priority: 6 });
                        }
                    }
                } catch { /* ignore */ }

                // 4. Search for high-quality fbcdn images in DOM
                try {
                    // Try to find image within Reel or Video containers first
                    const reelImgs = Array.from(document.querySelectorAll('div[aria-label="Reel"] img[src*="fbcdn.net"], img[src*="fbcdn.net"]'));
                    for (const img of reelImgs) {
                        // Usually covers are larger or have specific classes, but we can check dimensions
                        if (img.width > 200 || img.height > 200) {
                            results.push({ url: img.src, priority: 5 });
                        }
                    }
                } catch { /* ignore */ }

                // 5. Try Video Poster
                const video = document.querySelector('video');
                if (video && video.poster) results.push({ url: video.poster, priority: 4 });

                // Sort by priority and return best
                results.sort((a, b) => b.priority - a.priority);
                return results.length > 0 ? results[0].url : null;
            });

            title = await page.title();
            if (!title || title === 'Facebook') {
                const h1 = await page.$('h1');
                if (h1) title = await h1.innerText();
            }
        } catch (metadataError) {
            console.warn('⚠️ Metadata extraction partial failure:', metadataError.message);
            title = title || 'Facebook Video';
        }

        // Export fresh cookies
        const freshCookies = await context.cookies();
        const netscapeCookies = formatCookiesToNetscape(freshCookies);
        const freshCookiePath = cookieFile.replace('.txt', '_fresh.txt');
        fs.writeFileSync(freshCookiePath, netscapeCookies);

        const userAgent = await page.evaluate(() => navigator.userAgent);
        await browser.close();

        return { videoUrl, audioUrl, title, thumbnail, freshCookiePath, userAgent, candidateStreams };

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
