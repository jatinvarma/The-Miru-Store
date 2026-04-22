const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const STATIC_DIR = __dirname;

const server = http.createServer((req, res) => {
  let filePath = path.join(STATIC_DIR, req.url);
  
  // Default to index.html for root
  if (req.url === '/') {
    filePath = path.join(STATIC_DIR, 'index.html');
  }
  
  // Prevent directory listing - serve index.html for directories
  fs.stat(filePath, (err, stats) => {
    if (err) {
      // File not found, try index.html
      filePath = path.join(STATIC_DIR, 'index.html');
      fs.readFile(filePath, 'utf-8', (err, data) => {
        if (err) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(data);
        }
      });
    } else if (stats.isDirectory()) {
      // Serve index.html for directories
      filePath = path.join(filePath, 'index.html');
      fs.readFile(filePath, 'utf-8', (err, data) => {
        if (err) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(data);
        }
      });
    } else {
      // Serve the file
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'text/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon'
      };
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('500 Server Error');
        } else {
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(data);
        }
      });
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Frontend server running on http://localhost:${PORT}`);
});
