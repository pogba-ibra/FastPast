const axios = require("axios");
const https = require("https");

const SERVER_URL = "https://localhost:443";

// Ignore self-signed certs
const agent = new https.Agent({
    rejectUnauthorized: false
});

async function testNoSqlInjection() {
    console.log("Testing NoSQL Injection on /test/set-subscription-expiry...");
    try {
        // Attempt to update subscription for ANY user (likely the first one found)
        const res = await axios.post(`${SERVER_URL}/test/set-subscription-expiry`, {
            email: { "$ne": null },
            expiresIn: 3600
        }, { httpsAgent: agent });

        console.log("Response Status:", res.status);
        console.log("Response Data:", res.data);

        if (res.status === 200) {
            console.log("\n[CRITICAL] NoSQL Injection Success! We modified a user's subscription without knowing their email.");
        } else {
            console.log("NoSQL Injection didn't return 200.");
        }

    } catch (error) {
        console.log("Request failed (possibly good):", error.message);
        if (error.response) {
            console.log("Status:", error.response.status);
            console.log("Data:", error.response.data);
        }
    }
}

testNoSqlInjection();
