const http = require("http");
const url = require("url");
const fs = require("fs");

http
  .createServer((req, res) => {
    const q = url.parse(req.url, true);
    const data = `${q.query["text"]}\n`;
    fs.appendFile("../file.txt", data, { flag: "a" }, (err) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        return res.end(`Error appending to file: ${err}`);
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      return res.end('Data appended successfully!');
    });
  })
  .listen(process.env.PORT || 8888);
