const http = require('http');

console.log('Creating HTTP server...');
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Debug server OK');
});

console.log('Calling server.listen...');
server.listen(5000, 'localhost', () => {
  console.log('✅ LISTEN CALLBACK EXECUTED - Server is running on localhost:5000');
});

server.on('error', (err) => {
  console.error('❌ SERVER ERROR:', err);
});

setTimeout(() => {
  console.log('Server still running after 3 seconds');
  console.log('Server listening?', server.listening);
  console.log('Server address:', server.address());
}, 3000);
