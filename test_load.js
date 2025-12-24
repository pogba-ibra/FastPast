const axios = require('axios');

const API_URL = 'http://localhost:3000';
const TEST_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'; // RickRoll for testing
const NUM_REQUESTS = 50;

async function runTest() {
    console.log(`🚀 Starting Load Test: ${NUM_REQUESTS} concurrent requests...`);

    const startTime = Date.now();
    const requests = [];

    for (let i = 0; i < NUM_REQUESTS; i++) {
        requests.push(
            axios.post(`${API_URL}/download`, {
                videoUrl: TEST_URL,
                format: 'mp4',
                quality: '720p'
            }).then(res => {
                console.log(`✅ [${i + 1}] Queued job: ${res.data.jobId}`);
                return res.data.jobId;
            }).catch(err => {
                console.error(`❌ [${i + 1}] Error queuing:`, err.response?.data?.error || err.message);
                return null;
            })
        );
    }

    const jobIds = await Promise.all(requests);
    const successCount = jobIds.filter(id => id !== null).length;
    console.log(`\n📊 Queuing Summary: ${successCount}/${NUM_REQUESTS} requests queued successfully.`);

    // Monitoring loop
    console.log(`\n🕵️ Monitoring queue status...`);
    const monitorInterval = setInterval(async () => {
        try {
            const statusRes = await axios.get(`${API_URL}/queue-status`);
            const { waiting, active, completed, failed } = statusRes.data;
            console.log(`⏳ Waiting: ${waiting} | 🏃 Active: ${active} | ✅ Completed: ${completed} | ❌ Failed: ${failed}`);

            if (waiting === 0 && active === 0) {
                clearInterval(monitorInterval);
                const duration = (Date.now() - startTime) / 1000;
                console.log(`\n🏁 Test Finished in ${duration.toFixed(1)}s`);
                process.exit(0);
            }
        } catch (err) {
            console.error('Monitoring error:', err.message);
        }
    }, 5000);
}

runTest();
