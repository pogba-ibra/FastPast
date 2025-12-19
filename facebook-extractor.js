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

        // Sniffer: Intercept network requests to find direct video file
        let snortedUrl = null;
        page.on('request', request => {
            const reqUrl = request.url();
            // User Request Dec 2025: Target HD streams (CDNs, DASH, bytestart)
            if (reqUrl.includes('fbcdn.net') && (reqUrl.includes('video') || reqUrl.includes('.mp4') || reqUrl.includes('bytestart') || reqUrl.includes('dash'))) {
                if (reqUrl.includes('bytestart')) {
                    console.log(`🎬 Potential HD Segment detected: ${reqUrl.substring(0, 60)}...`);
                }
                snortedUrl = reqUrl;
            }
        });

        // SITE FALLBACK LOGIC
        // 1. Try FB mbasic first (often less detection/lighter)
        // 2. Then try full site (better for HD)
        const idMatch = url.match(/(?:videos\/|video\.php\?v=|reel\/)(\d+)/);
        const videoId = idMatch ? idMatch[1] : null;

        let targetUrls = [];
        if (videoId) {
            targetUrls.push(`https://mbasic.facebook.com/video.php?v=${videoId}`); // Lightweight first
            targetUrls.push(`https://www.facebook.com/video.php?v=${videoId}`);   // HD Full site
        } else {
            targetUrls.push(url.replace('www.facebook.com', 'mbasic.facebook.com'));
            targetUrls.push(url.replace('mbasic.facebook.com', 'www.facebook.com'));
        }

        let navigationSuccessful = false;
        for (const targetUrl of targetUrls) {
            console.log(`🔍 Attempting Navigation: ${targetUrl}`);
            try {
                // User Request: 60s timeout + networkidle for stability
                await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 60000 });

                // Check if we hit a login wall or empty page
                const isLoginWall = await page.isVisible('input[name="login"], button[name="login"]');
                if (isLoginWall) {
                    console.log(`⚠️ Login block on ${targetUrl}, trying next...`);
                    continue;
                }

                navigationSuccessful = true;
                break; // Stop at the first successful navigation
            } catch (navError) {
                console.log(`⚠️ Navigation to ${targetUrl} failed: ${navError.message}`);
                // Continue to next URL
            }
        }

        if (!navigationSuccessful) {
            throw new Error("Could not navigate to any Facebook endpoint successfully (Detection or Network)");
        }

        // 2. Interaction Loop: Scroll and Simulate Playback
        console.log('👆 Interacting with page to trigger HD streams...');
        try {
            // Scroll down a bit
            await page.evaluate(() => window.scrollBy(0, 500));
            await page.waitForTimeout(1000);
            await page.evaluate(() => window.scrollBy(0, -200));

            // Wait for video element (priority for video[src])
            try {
                // Wait for any video to appear
                await page.waitForSelector('video', { timeout: 10000 });

                // Explicitly click to start/trigger HD loading
                const video = await page.$('video');
                if (video) {
                    await video.hover();
                    await video.click({ force: true });
                    console.log('✅ Video clicked (Playback triggered)');
                }
            } catch {
                console.log('⚠️ No video element found via selector, trying button click...');
                await page.click('div[role="button"][aria-label*="Play"]', { timeout: 3000, force: true }).catch((clickErr) => {
                    console.log('⚠️ Click on play button failed:', clickErr.message);
                });
            }

            // User Request: Wait specifically for a stream to be active
            console.log('⏳ Waiting for HD data to flow (5s buffer)...');
            await page.waitForTimeout(5000);

        } catch (intError) {
            console.log('⚠️ Interaction failed, proceeding with current results:', intError.message);
        }

        // 3. Result Selection
        let videoUrl = snortedUrl;

        // Fallback: If sniffer missed it but DOM has it
        if (!videoUrl) {
            videoUrl = await page.evaluate(() => {
                const video = document.querySelector('video');
                if (video && video.src && !video.src.startsWith('blob:')) return video.src;
                // Check for source tags
                const source = document.querySelector('video source');
                return source ? source.src : null;
            });
        }

        // Extract Title
        let title = 'Facebook Video';
        try {
            title = await page.title();
            if (!title || title === 'Facebook' || title.includes("Log In")) {
                const h1 = await page.$('h1');
                if (h1) title = await h1.innerText();
            }
        } catch (e) {
            console.log('⚠️ Title extraction failed:', e.message);
        }

        const freshCookies = await context.cookies();
        const netscapeCookies = formatCookiesToNetscape(freshCookies);
        const freshCookiePath = cookieFile.replace('.txt', '_fresh.txt');
        fs.writeFileSync(freshCookiePath, netscapeCookies);

        const userAgent = await page.evaluate(() => navigator.userAgent);
        await browser.close();

        return { videoUrl, title, freshCookiePath, userAgent };

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
