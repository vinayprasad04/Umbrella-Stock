const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');
const config = require('./config.js');

async function testSingleUpload() {
  try {
    // Find any Excel file in downloads
    const downloadPath = config.downloadPath;
    const files = fs.readdirSync(downloadPath)
      .filter(file => file.endsWith('.xlsx'));

    if (files.length === 0) {
      console.log('❌ No Excel files found in downloads folder');
      return;
    }

    // Test with first file
    const fileName = files[0];
    const filePath = path.join(downloadPath, fileName);

    console.log(`🧪 Testing upload with: ${fileName}`);
    console.log(`📁 File path: ${filePath}`);
    console.log(`📊 File size: ${(fs.statSync(filePath).size / 1024).toFixed(1)} KB`);

    // Test with a known stock symbol first
    const testSymbol = 'AJANTPHARM'; // We know this exists from your output

    console.log(`🎯 Testing with symbol: ${testSymbol}`);
    console.log(`🔗 Upload URL: ${config.adminBaseUrl}${testSymbol}/upload`);
    console.log(`🔑 Token (first 20 chars): ${config.adminToken.substring(0, 20)}...`);

    const formData = new FormData();
    formData.append('files', fs.createReadStream(filePath));
    formData.append('symbol', testSymbol);

    const uploadUrl = `${config.adminBaseUrl}${testSymbol}/upload`;

    console.log('\n📤 Attempting upload...');

    const response = await axios.post(uploadUrl, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${config.adminToken}`
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 60000
    });

    console.log('✅ Upload successful!');
    console.log('📊 Response status:', response.status);
    console.log('📊 Response data:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.log('❌ Upload failed!');
    console.log('📄 Error message:', error.message);

    if (error.response) {
      console.log('🔍 Status:', error.response.status);
      console.log('🔍 Status text:', error.response.statusText);
      console.log('🔍 Response data:', error.response.data);
      console.log('🔍 Response headers:', JSON.stringify(error.response.headers, null, 2));
    } else if (error.request) {
      console.log('🔍 No response received');
      console.log('🔍 Request details:', error.request);
    } else {
      console.log('🔍 Request setup error:', error.message);
    }

    // Check if it's a token issue
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log('\n💡 This looks like an authentication issue.');
      console.log('💡 Your JWT token might be expired.');
      console.log('💡 Please get a fresh token from your admin login.');
    }

    // Check if it's a server issue
    if (error.response?.status === 404) {
      console.log('\n💡 The API endpoint was not found.');
      console.log('💡 Make sure your Next.js server is running on localhost:3000');
    }

    if (error.response?.status >= 500) {
      console.log('\n💡 This is a server error.');
      console.log('💡 Check your Next.js server logs for more details.');
    }
  }
}

if (require.main === module) {
  testSingleUpload();
}

module.exports = testSingleUpload;