/* eslint-disable */
const axios = require("axios");

const SERVER_URL = "http://localhost:3002";

async function testPlaylistUrlHelper() {
    console.log("\nTesting /download endpoint with CLIPPING params...");
    try {
        const downloadRes = await axios.post(`${SERVER_URL}/download`, {
            videoUrl: "https://www.youtube.com/watch?v=jNQXAC9IVRw", // Me at the zoo
            format: "mp4",
            quality: "144p",
            startTime: "00:00",
            endTime: "00:10"
        }, {
            responseType: 'stream'
        });

        console.log("Clipping download stream started successfully (Status: " + downloadRes.status + ")");
        downloadRes.data.on('data', chunk => { });
        downloadRes.data.on('error', err => console.error("Stream error:", err.message));

        await new Promise(resolve => setTimeout(resolve, 5000));
        downloadRes.data.destroy();
        console.log("PASS: Clipping stream established and closed without server crash.");

    } catch (error) {
        console.error("FAIL: Clipping download endpoint error:", error.message);
        if (error.response) console.error("Status:", error.response.status);
    }
}

testPlaylistUrlHelper();
