const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config({ path: '/home/abhijith/Desktop/AgroIntel/backend/.env' });

const apiKey = process.env.GEMINI_API_KEY;

async function test() {
  try {
    const res = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        contents: [{ role: 'user', parts: [{ text: "hi" }] }]
    });
    console.log("Success:", res.data?.candidates?.[0]?.content?.parts?.[0]?.text);
  } catch (err) {
    console.log("Error:", err.response?.data?.error?.message || err.message);
  }
}
test();
