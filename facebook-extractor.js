const playwright = require('playwright');
const fs = require('fs');
let sharedBrowser = null;
let browserLock = false;

/**
 * Get or launch the shared browser instance
 */
async function getSharedBrowser() {
    if (sharedBrowser) {
        // Check if browser is still connected
        if (sharedBrowser.isConnected()) return sharedBrowser;
        console.log('🔄 Shared browser disconnected, restarting...');
        await sharedBrowser.close().catch(() => { });
        sharedBrowser = null;
    }

    if (browserLock) {
        // Wait for other process to finish launching
        while (browserLock) {
            await new Promise(r => setTimeout(r, 100));
        }
        if (sharedBrowser) return sharedBrowser;
    }

    browserLock = true;
    try {
        console.log('🌐 Launching Shared Chromium Instance...');
        sharedBrowser = await playwright.chromium.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--single-process'
            ]
        });

        // Auto-close browser after 30 mins of inactivity to free memory
        sharedBrowser._lastUsed = Date.now();
        if (sharedBrowser._cleanupInterval) clearInterval(sharedBrowser._cleanupInterval);
        sharedBrowser._cleanupInterval = setInterval(async () => {
            if (Date.now() - sharedBrowser._lastUsed > 30 * 60 * 1000) {
                console.log('🧹 Closing idle shared browser...');
                await sharedBrowser.close().catch(() => { });
                sharedBrowser = null;
                clearInterval(this);
            }
        }, 5 * 60 * 1000);

        return sharedBrowser;
    } finally {
        browserLock = false;
    }
}

/**
 * Extract direct video URL from Facebook using headless browser
 * @param {string} url - Facebook video URL
 * @param {string} cookieFile - Path to Facebook cookies file
 * @param {string} requestUA - Optional User-Agent to sync with
 * @returns {Promise<object>}
 */
async function extractFacebookVideoUrl(url, cookieFile, requestUA) {
    let context = null;
    try {
        const browser = await getSharedBrowser();
        browser._lastUsed = Date.now();

        const proxies = require('./proxies');
        const randomProxy = proxies[Math.floor(Math.random() * proxies.length)];

        // Create fresh context for each request
        context = await browser.newContext({
            userAgent: requestUA || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
            proxy: { server: randomProxy }
        });

        const page = await context.newPage();

        // Load cookies if file exists
        if (fs.existsSync(cookieFile)) {
            console.log(`🍪 Loading cookies from: ${cookieFile}`);
            const cookiesContent = fs.readFileSync(cookieFile, 'utf-8');
            const cookies = parseFacebookCookies(cookiesContent);
            if (cookies.length > 0) {
                await context.addCookies(cookies);
            }
        }

        // User Request: Enhanced Stealth to bypass bot detection
        await page.addInitScript(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
            Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
            Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
        });

        // Sniffer: Intercept network requests to find direct video/audio files
        let snortedVideo = null;
        let snortedAudio = null;
        let snortedThumb = null;
        const candidateStreams = [];

        page.on('response', async (response) => {
            const url = response.url();
            const contentType = response.headers()['content-type'] || '';

            // 1. Sniff for Video/Audio streams
            if ((url.includes('fbcdn.net') || url.includes('cdninstagram.com')) && (url.includes('bytestart=') || url.includes('.mp4') || url.includes('.m4a') || url.includes('.mpd') || url.includes('_n.mp4') || url.includes('_n.m4a'))) {
                const isVideo = contentType.includes('video') || url.includes('video') || (url.includes('bytestart=') && !url.includes('audio'));
                const isAudio = contentType.includes('audio') || url.includes('audio') || (url.includes('bytestart=') && url.includes('audio'));

                if (isVideo) {
                    snortedVideo = url;
                    candidateStreams.push({ url, type: 'video', contentType });
                } else if (isAudio) {
                    snortedAudio = url;
                    candidateStreams.push({ url, type: 'audio', contentType });
                }
            }

            // 2. Sniff for Thumbnail Images
            if ((url.includes('fbcdn.net') || url.includes('cdninstagram.com')) && contentType.includes('image') && (url.includes('/v/t') || url.includes('/p/') || url.includes('_n.jpg'))) {
                // Heuristic: Prefer larger images or those containing specific keywords
                if (!snortedThumb || url.includes('cover') || url.includes('poster') || url.includes('_n.jpg')) {
                    snortedThumb = url;
                }
            }
        });

        // Use FULL site for better extraction and HD support
        if (url.includes('facebook.com/share') || url.includes('fb.watch')) {
            // These should be resolved by server.js first, but as a guard:
            console.log('🔗 Shortened URL detected in extractor, relying on redirect...');
        }

        // User Request Stage 3: Normalize to /watch/ format for maximum desktop compatibility
        let fullUrl = url.includes('facebook.com') ? url.replace('mbasic.facebook.com', 'www.facebook.com') : url;
        if (fullUrl.includes('facebook.com')) {
            const reelMatch = fullUrl.match(/\/(?:reel|reels|video\.php\?v=)(\d+)/);
            if (reelMatch && reelMatch[1]) {
                fullUrl = `https://www.facebook.com/watch/?v=${reelMatch[1]}`;
            }
        } else if (fullUrl.includes('instagram.com')) {
            // Instagram: Try embed URL if it looks like a post/reel
            if (fullUrl.includes('/p/') || fullUrl.includes('/reels/') || fullUrl.includes('/reel/')) {
                const igMatch = fullUrl.match(/\/(?:p|reels|reel)\/([^/]+)/);
                if (igMatch && igMatch[1]) {
                    // Start with embed URL as it's often more resilient to login walls
                    fullUrl = `https://www.instagram.com/reel/${igMatch[1]}/embed/`;
                }
            }
        }

        console.log(`🔍 Navigating to STAGE 3 URL: ${fullUrl}`);

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

        // 1. Check for Login Wall or Terminal Errors (Cookie Verification)
        const blockingText = ['log in', 'sign up', 'you must log in', 'create an account', 'unusual activity', 'content isn\'t available', 'private video', 'video is private'];
        const pageContent = (await page.content()).toLowerCase();
        const textBlocked = blockingText.some(text => pageContent.includes(text));
        const loginWall = await page.isVisible('input[name="login"], button[name="login"], form[action*="login"]');

        if (loginWall || (textBlocked && !pageContent.includes('video'))) {
            const isTerminal = pageContent.includes('content isn\'t available') || pageContent.includes('private video');
            console.error(`❌ ${isTerminal ? 'Terminal Error (Private/Deleted)' : 'Login Wall'} detected!`);
            await page.screenshot({ path: `debug_${isTerminal ? 'terminal' : 'login'}_wall.png` });
            throw new Error(isTerminal ? "Content Unavailable or Private" : "Cookies Expired or IP Blocked");
        }

        // 2. Dismiss Overlays (Cookie Banners/Popups)
        console.log('🧹 Dismissing potential overlays (Stage 3)...');
        try {
            const overlays = [
                'div[aria-label*="Allow all cookies"]',
                'div[aria-label*="Accept all"]',
                'div[aria-label*="Decline optional cookies"]',
                'div[role="dialog"] button',
                'button:has-text("Allow")',
                'button:has-text("Accept")',
                'div[aria-label="Close"]',
                'div[role="button"]:has-text("Accept")',
                'div[aria-label*="Cookie"] button'
            ];
            for (const selector of overlays) {
                const element = await page.$(selector);
                if (element && await element.isVisible()) {
                    await element.click({ timeout: 1000 }).catch(() => { });
                }
            }
        } catch { /* ignore overlay errors */ }

        // 3. Playback Simulation: Trigger HD streams by interacting with the video
        console.log('👇 Simulating Stage 3 playback and scrolling...');
        try {
            await page.evaluate(() => window.scrollBy(0, 500));
            await page.waitForTimeout(2000);

            // Wait for any video element
            const videoElem = await page.waitForSelector('video', { timeout: 15000 }).catch(() => { });

            if (videoElem) {
                console.log('🎬 Video element found, performing multi-point interaction...');
                const box = await videoElem.boundingBox();
                if (box) {
                    // Click center
                    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
                    await page.waitForTimeout(1000);
                    // Click top-left (often where play buttons or toggles are)
                    await page.mouse.click(box.x + 20, box.y + 20);
                } else {
                    await videoElem.click({ force: true }).catch(() => { });
                }
            } else {
                // Proactive fallback: Click common player zones in major viewport
                console.log('🖱️ No video element visible, clicking common zones...');
                const { width, height } = page.viewportSize();
                await page.mouse.click(width / 2, height / 2); // Center
                await page.waitForTimeout(500);
                await page.mouse.click(width / 2, height / 3); // Upper center
            }

            console.log('⏳ Waiting 12 seconds for HD stream discovery...');
            await page.waitForTimeout(12000);

            // User Request Stage 3: Direct SRC Fallback if sniffer failed
            if (!snortedVideo) {
                console.log('🕵️ Sniffer silent. Attempting Stage 3 Direct SRC Fallback...');
                const capturedSrc = await page.evaluate(() => {
                    const v = document.querySelector('video');
                    if (v && v.src && !v.src.startsWith('blob:')) return v.src;
                    const nested = document.querySelector('embed, object');
                    if (nested && (nested.src || nested.data)) return nested.src || nested.data;
                    return null;
                });

                if (capturedSrc) {
                    console.log('✅ Stage 3 Fallback caught direct URL:', capturedSrc);
                    videoUrl = capturedSrc;
                }
            }
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
        if (context) await context.close().catch(() => { });

        // Final thumbnail decision: prefer network-snorted cover if DOM extraction returned nothing or low quality
        const finalThumbnail = snortedThumb || thumbnail;

        // User Request: Fail-Fast if absolutely nothing was found
        if (!videoUrl && !finalThumbnail) {
            console.warn('❌ [Extractor] No video or thumbnail captured. Triggering retry...');
            throw new Error("No Data Captured (Empty Extraction)");
        }

        return { videoUrl, audioUrl, title, thumbnail: finalThumbnail, freshCookiePath, userAgent, candidateStreams };

    } catch (error) {
        console.error('❌ Facebook extraction error:', error.message);
        throw error;
    } finally {
        if (context) await context.close().catch(() => { });
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
            // Filter for Facebook and Instagram domains
            if (domain.includes('facebook.com') || domain.includes('fb.com') || domain.includes('.facebook.com') ||
                domain.includes('instagram.com') || domain.includes('.instagram.com')) {
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
