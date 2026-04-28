const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config({ path: '/home/abhijith/Desktop/AgroIntel/backend/.env' });

const apiKey = process.env.GROQ_API_KEY;

const system = `You are AgroIntel AI — an expert Indian agricultural market advisor. Use web search to get CURRENT March 2026 crop price trends in India, global commodity updates, and weather/monsoon outlook. Then generate a precise, farmer-friendly JSON report.
Rules:
- Simple language — farmer may be uneducated
- Be specific with numbers & dates
- Use web search for: "India crop prices March 2026", "Indian agriculture market trends 2026", "Rabi harvest 2026 India", "global rice wheat prices 2026"
- Return ONLY valid JSON — no markdown fences, no text outside JSON
JSON schema: ...`;

const user = `FARMER: Ernakulam, Kerala | Date: 26 March 2026
CROPS: Rice: 5acres, Harvesting, Ernakulam Kerala | Wheat: 2acres, Vegetative, Ernakulam Kerala
MARKET: Rice: local=₹2300 natAvg=₹2250 msp=₹2300 trend=+2% potential=Medium | Wheat: local=₹2400 natAvg=₹2300 msp=₹2275 trend=0% potential=Medium
Search the web for current Indian market prices and trends, then generate the JSON report.`;

async function test() {
  try {
    const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: 'groq/compound',
        messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
        max_tokens: 3000,
    }, {
        headers: { Authorization: `Bearer ${apiKey}` }
    });
    console.log("Success");
  } catch (err) {
    console.log("Status:", err.response?.status);
    console.log("Status Text:", err.response?.statusText);
    console.log("Data:", err.response?.data);
  }
}
test();
