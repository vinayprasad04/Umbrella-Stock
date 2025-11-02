// Quick test script to debug OAuth endpoint
const testData = {
  email: "vi04@gmail.com",
  name: "Vd",
  provider: "google",
  providerId: "",
  photoUrl: "c"
};

fetch('http://localhost:3000/api/auth/oauth-login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testData)
})
  .then(res => res.json())
  .then(data => {
    console.log('Response:', JSON.stringify(data, null, 2));
  })
  .catch(err => {
    console.error('Error:', err);
  });
