const axios = require("axios");
const https = require("https");

const SERVER_URL = "https://localhost:443";

// Ignore self-signed certs
const agent = new https.Agent({
    rejectUnauthorized: false
});

async function testArgInjection() {
    console.log("Testing Argument Injection on /download...");
    try {
        // Attempt to pass a flag as the URL
        const res = await axios.post(`${SERVER_URL}/download`, {
            videoUrl: "--version",
            format: "mp4",
            quality: "720p"
        }, { httpsAgent: agent });

        console.log("Response Status:", res.status);
        if (res.status === 400 && res.data.error === "Invalid URL format.") {
            console.log("PASS: Argument injection blocked.");
        } else {
            console.log("FAIL: Argument injection NOT blocked or unexpected response.");
            console.log(res.data);
        }

    } catch (error) {
        if (error.response && error.response.status === 400 && error.response.data.error === "Invalid URL format.") {
            console.log("PASS: Argument injection blocked (400 Bad Request).");
        } else {
            console.log("Request failed:", error.message);
            if (error.response) {
                console.log("Status:", error.response.status);
                console.log("Data:", error.response.data);
            }
        }
    }
}

testArgInjection();
