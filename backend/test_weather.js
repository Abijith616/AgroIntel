
const axios = require('axios');

async function testWeather() {
    try {
        const lat = 9.9312;
        const lon = 76.2673;
        const url = 'https://api.open-meteo.com/v1/forecast';
        const params = {
            latitude: lat,
            longitude: lon,
            current: 'temperature_2m,relative_humidity_2m,rain',
            daily: 'temperature_2m_max,temperature_2m_min,rain_sum',
            timezone: 'auto'
        };

        console.log("Fetching from:", url, params);

        const response = await axios.get(url, { params });
        console.log("Response:", JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error("Full Error:", error);
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", error.response.data);
        }
    }
}

testWeather();
