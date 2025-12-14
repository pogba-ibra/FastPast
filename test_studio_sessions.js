

const BASE_URL = 'https://localhost:443';
// The server.js mentions port 443 for https and fallback http. Let's try http on 3000 if 443 fails or just check what the server is listening on.
// The metadata says "npm start" is running. server.js has "server = http.createServer(app)" or https.
// The snippet says "const port = 443;".
// BUT, if SSL is not found, it falls back to HTTP.
// Let's assume HTTP on port 443? No, usually non-root can't bind 443 easily on some systems, but this is Windows.
// Let's check the logs or just try to hit it.
// Actually, let's look at server.js again to see the port listener.
// I missed the `server.listen` part in the view_file output.

async function runTest() {
    // 1. Register a NEW studio user
    const timestamp = Date.now();
    const email = `studio_test_${timestamp}@example.com`;
    const password = 'TestPassword123!';

    console.log(`Creating user: ${email}`);

    // Register
    // Note: server logic forces 'free' on register, we need to upgrade manually or mock it.
    // In JSON mode, we can manually edit the file, but let's try to register first.
    try {
        let res = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: `studio_${timestamp}`,
                email,
                password,
                membershipType: 'studio' // Trying to send studio directly, though server might force free
            })
        });

        // If server forces free, we need to upgrade.
        // Let's check the response.
        let data = await res.json();
        console.log('Register response:', data);

        if (data.status === 'success') {
            const firstSessionToken = data.data.sessionToken;
            console.log('Upgrading user to STUDIO via API...');

            const paymentRes = await fetch(`${BASE_URL}/payment/process`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${firstSessionToken}`
                },
                body: JSON.stringify({
                    orderId: `test_order_${timestamp}`,
                    planId: 'studio',
                    amount: 20
                })
            });

            const paymentData = await paymentRes.json();
            console.log('Payment response:', paymentData);

            if (paymentRes.status !== 200) {
                console.error('Failed to upgrade user');
                return;
            }
        } else {
            console.error('Registration failed');
            return;
        }

        // 3. Login 4 times (including the first one we just did? No, we need 4 *new* sessions or 3 more)
        // The first session was created at registration.
        // We have 1 session (S1).
        // If we login 3 more times: S2, S3, S4.
        // Total 4 sessions.
        // S1 should be invalidated.

        const sessions = [];
        // Capture the first session from registration if we want to test it
        // data is from register response
        sessions.push(data.data.sessionToken);

        console.log('Performing 3 additional logins...');

        for (let i = 1; i <= 3; i++) {
            await new Promise(r => setTimeout(r, 1000)); // Wait a bit
            res = await fetch(`${BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            let loginData = await res.json();
            if (loginData.status === 'success') {
                console.log(`Login ${i + 1} successful`);
                sessions.push(loginData.data.sessionToken);
            } else {
                console.error(`Login ${i + 1} failed:`, loginData);
            }
        }

        // 4. Verify sessions
        console.log('Verifying active sessions...');
        // We can check /auth/session endpoint with each token

        for (let i = 0; i < sessions.length; i++) {
            const token = sessions[i];
            res = await fetch(`${BASE_URL}/auth/session`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            // 401 means invalid
            const status = res.status;
            console.log(`Session ${i + 1} (Login order) status: ${status} ${status === 200 ? 'ACTIVE' : 'INVALID'}`);
        }

    } catch (e) {
        console.error('Test error:', e);
    }
}



runTest();
