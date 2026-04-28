const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config({ path: '/home/abhijith/Desktop/AgroIntel/backend/.env' });

const apiKey = process.env.GROQ_API_KEY;

async function test() {
  try {
    const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: 'test '.repeat(5000) }],
        max_tokens: 8000,
    }, {
        headers: { Authorization: `Bearer ${apiKey}` }
    });
    console.log("Success");
  } catch (err) {
    console.log("Status:", err.response?.status);
    console.log("Status Text:", err.response?.statusText);
    console.log("Data:", err.response?.data);
    console.log("Message:", err.message);
  }
}
test();
