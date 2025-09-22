const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');
const config = require('./config.js');

async function testUpload() {
  const symbol = 'RELIANCE';
  const filePath = path.join('./downloads', `${symbol}.xlsx`);

  console.log(`🧪 Testing upload for ${symbol}`);
  console.log(`📁 File path: ${filePath}`);
  console.log(`🔗 Upload URL: ${config.adminBaseUrl}${symbol}/upload`);
  console.log(`🔑 Token: ${config.adminToken.substring(0, 20)}...`);

  if (!fs.existsSync(filePath)) {
    console.log('❌ File not found');
    return;
  }

  try {
    const formData = new FormData();
    formData.append('files', fs.createReadStream(filePath));
    formData.append('symbol', symbol);

    const uploadUrl = `${config.adminBaseUrl}${symbol}/upload`;

    console.log('\n📤 Attempting upload...');

    const response = await axios.post(uploadUrl, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${config.adminToken}`
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: config.uploadTimeout
    });

    console.log('✅ Upload successful!');
    console.log('📊 Response:', response.data);

  } catch (error) {
    console.log('❌ Upload failed!');
    console.log('📄 Error message:', error.message);

    if (error.response) {
      console.log('🔍 Status:', error.response.status);
      console.log('🔍 Response data:', error.response.data);
      console.log('🔍 Response headers:', error.response.headers);
    } else if (error.request) {
      console.log('🔍 No response received');
      console.log('🔍 Request:', error.request);
    }
  }
}

testUpload();