/* eslint-disable */
const axios = require('axios');

const BASE_URL = 'http://localhost:3002';

// Test URLs for different scenarios
const testUrls = {
  youtube: 'https://youtu.be/V2mNLEhWjXc?si=ry5tuH6497I9Cjej',
  youtubeShort: 'https://youtu.be/dQw4w9WgXcQ',
  invalid: 'https://invalid-url.com/video',
  nonVideo: 'https://google.com'
};

async function testEndpoint(endpoint, method = 'POST', data = {}) {
  try {
    const response = await axios({
      method,
      url: `${BASE_URL}${endpoint}`,
      data,
      timeout: 30000
    });
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    };
  }
}

async function runTests() {
  console.log('🚀 Starting Video Downloader API Tests\n');

  // Test 1: Get qualities for YouTube video
  console.log('📋 Test 1: Get qualities for YouTube video');
  const qualitiesResult = await testEndpoint('/get-qualities', 'POST', {
    videoUrl: testUrls.youtube,
    format: 'mp4'
  });

  if (qualitiesResult.success) {
    console.log('✅ Qualities fetched successfully');
    console.log('Available qualities:', qualitiesResult.data.qualities?.map(q => q.value));
  } else {
    console.log('❌ Failed to get qualities:', qualitiesResult.error);
  }

  // Test 2: Get qualities for invalid URL
  console.log('\n📋 Test 2: Get qualities for invalid URL');
  const invalidResult = await testEndpoint('/get-qualities', 'POST', {
    videoUrl: testUrls.invalid,
    format: 'mp4'
  });

  if (!invalidResult.success) {
    console.log('✅ Correctly rejected invalid URL');
  } else {
    console.log('❌ Should have rejected invalid URL');
  }

  // Test 3: Download test (commented out to avoid actual downloads)
  console.log('\n📋 Test 3: Download test (simulated)');
  console.log('⚠️  Skipping actual download to avoid file creation');
  console.log('To test download, uncomment the code below and run manually:');

  /*
  console.log('\n📋 Test 3: Download YouTube video');
  const downloadResult = await testEndpoint('/download', 'POST', {
    videoUrl: testUrls.youtube,
    format: 'mp4',
    quality: '720p'
  });

  if (downloadResult.success) {
    console.log('✅ Download initiated successfully');
  } else {
    console.log('❌ Download failed:', downloadResult.error);
  }
  */

  // Test 4: Test with different formats
  console.log('\n📋 Test 4: Get MP3 qualities');
  const mp3Result = await testEndpoint('/get-qualities', 'POST', {
    videoUrl: testUrls.youtube,
    format: 'mp3'
  });

  if (mp3Result.success) {
    console.log('✅ MP3 qualities fetched successfully');
    console.log('Available qualities:', mp3Result.data.qualities?.map(q => q.value));
  } else {
    console.log('❌ Failed to get MP3 qualities:', mp3Result.error);
  }

  // Test 5: Test server health
  console.log('\n📋 Test 5: Server health check');
  try {
    const healthResponse = await axios.get('http://localhost:3002/', { timeout: 5000 });
    console.log('✅ Server is responding');
  } catch (error) {
    console.log('❌ Server not responding:', error.message);
  }

  console.log('\n🏁 Tests completed!');
  console.log('\n📝 Manual Testing Instructions:');
  console.log('1. Start the server: npm start');
  console.log('2. Test downloads in browser or with Postman');
  console.log('3. Check logs in ./logs/ directory for detailed information');
  console.log('4. Monitor error logs for any issues');
}

// Handle server not running
process.on('unhandledRejection', (error) => {
  if (error.code === 'ECONNREFUSED') {
    console.log('❌ Server is not running. Please start the server first:');
    console.log('   npm start');
    process.exit(1);
  }
  throw error;
});

runTests().catch(console.error);