const axios = require('axios');

async function getFreshToken() {
  try {
    console.log('🔑 Getting fresh admin token...');

    const loginData = {
      email: 'vinay.qss@gmail.com',
      password: '654321'
    };

    console.log('📧 Logging in with admin credentials...');

    const response = await axios.post('http://localhost:3000/api/auth/login', loginData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    if (response.data.success && response.data.data.accessToken) {
      const freshToken = response.data.data.accessToken;

      console.log('✅ Successfully obtained fresh token!');
      console.log('\n📋 Copy this token to your config.js:');
      console.log('=' .repeat(60));
      console.log(freshToken);
      console.log('=' .repeat(60));

      // Also try to update config.js automatically
      const fs = require('fs');
      const path = require('path');

      try {
        const configPath = path.join(__dirname, 'config.js');
        let configContent = fs.readFileSync(configPath, 'utf8');

        // Replace the adminToken line
        const tokenRegex = /adminToken:\s*process\.env\.ADMIN_TOKEN\s*\|\|\s*['"`][^'"`]*['"`]/;
        const newTokenLine = `adminToken: process.env.ADMIN_TOKEN || '${freshToken}'`;

        configContent = configContent.replace(tokenRegex, newTokenLine);

        fs.writeFileSync(configPath, configContent);
        console.log('\n✅ Config.js updated automatically!');
        console.log('🚀 You can now run: npm run test-upload');

      } catch (updateError) {
        console.log('\n⚠️ Could not auto-update config.js');
        console.log('📝 Please manually update the adminToken in config.js with the token above');
      }

    } else {
      console.log('❌ Login failed - invalid response format');
      console.log('Response:', response.data);
    }

  } catch (error) {
    console.log('❌ Error getting fresh token:');

    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Response:`, error.response.data);

      if (error.response.status === 401) {
        console.log('\n💡 Login credentials might be wrong');
        console.log('💡 Check if email: vinay.qss@gmail.com, password: 654321 are correct');
      }

      if (error.response.status === 404) {
        console.log('\n💡 Make sure your Next.js app is running on localhost:3000');
        console.log('💡 Run: npm run dev in your main project directory');
      }
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Cannot connect to localhost:3000');
      console.log('💡 Make sure your Next.js app is running');
      console.log('💡 Run: npm run dev in your main project directory');
    } else {
      console.log('Error:', error.message);
    }
  }
}

if (require.main === module) {
  getFreshToken();
}

module.exports = getFreshToken;