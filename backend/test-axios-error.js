const axios = require('axios');
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(413, 'Request Entity Too Large');
  res.end();
});

server.listen(4000, async () => {
  try {
    await axios.get('http://localhost:4000');
  } catch (err) {
    console.log("Axios error message:", err.message);
  }
  server.close();
});
