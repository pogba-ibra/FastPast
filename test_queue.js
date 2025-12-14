const io = require("socket.io-client");
const axios = require("axios");

const SERVER_URL = "http://localhost:3002";
const socket = io(SERVER_URL);

// Test video URLs (short ones preferably)
const testUrls = [
    "https://www.youtube.com/watch?v=jNQXAC9IVRw", // Me at the zoo
    "https://www.youtube.com/watch?v=aqz-KE-bpKQ"  // Google Search test
];

socket.on("connect", async () => {
    console.log("Connected to WebSocket server");

    try {
        console.log("Sending batch download request...");
        const response = await axios.post(`${SERVER_URL}/batch-download`, {
            urls: testUrls
        });

        console.log("Batch started:", response.data);

    } catch (error) {
        console.error("Error starting batch:", error.message);
    }
});

socket.on("job_start", (data) => {
    console.log(`[JOB START] ${data.jobId} - ${data.url}`);
});

socket.on("job_progress", (data) => {
    // Only log every 10% or so to avoid spamming
    if (Math.round(data.percent) % 10 === 0) {
        console.log(`[JOB PROGRESS] ${data.jobId}: ${data.percent}%`);
    }
});

socket.on("job_complete", (data) => {
    console.log(`[JOB COMPLETE] ${data.jobId}`);
});

socket.on("job_error", (data) => {
    console.error(`[JOB ERROR] ${data.jobId}: ${data.error}`);
});

// Keep alive for a bit to finish
setTimeout(() => {
    console.log("Test finished (timeout)");
    process.exit(0);
}, 60000); // 1 minute timeout
