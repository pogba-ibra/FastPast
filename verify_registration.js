const axios = require('axios');

const BASE_URL = 'http://localhost:3002';

async function verifyRegistration() {
    console.log('Starting Verification...');

    // 1. Valid Registration
    try {
        const uniqueUser = `user_${Date.now()}`;
        const res = await axios.post(`${BASE_URL}/auth/register`, {
            username: uniqueUser,
            email: `${uniqueUser}@example.com`,
            password: 'password123'
        });
        console.log('[SUCCESS] Valid Registration:', res.status === 201 ? 'PASSED' : 'FAILED');
    } catch (err) {
        console.error('[FAIL] Valid Registration Error:', err.response ? err.response.data : err.message);
    }

    // 2. Duplicate Email
    try {
        // Register again with same email (if prev step passed, this should fail)
        // To be sure, lets try to register a known conflict if we could, but dynamic is fine.
        // Actually, let's reuse the one we just made if possible, but variables are local scope.
        // Let's just make a specific one for conflict testing.
        const conflictUser = `conflict_${Date.now()}`;
        await axios.post(`${BASE_URL}/auth/register`, {
            username: conflictUser,
            email: `${conflictUser}@example.com`,
            password: 'password123'
        });

        await axios.post(`${BASE_URL}/auth/register`, {
            username: 'other',
            email: `${conflictUser}@example.com`,
            password: 'password123'
        });
        console.log('[FAIL] Duplicate Email Check: Should have failed but passed');
    } catch (err) {
        if (err.response && err.response.status === 400 && err.response.data.error.includes('Email already in use')) {
            console.log('[SUCCESS] Duplicate Email Check: PASSED');
        } else {
            console.log('[FAIL] Duplicate Email Check: Failed with unexpected error', err.response ? err.response.data : err.message);
        }
    }

    // 3. Invalid Email
    try {
        await axios.post(`${BASE_URL}/auth/register`, {
            username: 'bademail',
            email: 'not-an-email',
            password: 'password123'
        });
        console.log('[FAIL] Invalid Email Check: Should have failed but passed');
    } catch (err) {
        if (err.response && err.response.status === 400 && err.response.data.error.includes('valid email')) {
            console.log('[SUCCESS] Invalid Email Check: PASSED');
        } else {
            console.log('[FAIL] Invalid Email Check: Failed with unexpected error', err.response ? err.response.data : err.message);
        }
    }
}

verifyRegistration();
