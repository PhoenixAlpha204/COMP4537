const utils = require("./modules/utils");
const http = require("http");
const url = require("url");
const strings = require("./lang/en/en.json");

http
  .createServer((req, res) => {
    let q = url.parse(req.url, true);
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`<p style="color:blue;">
      ${strings.greeting.replace("%1", q.query["name"])}${utils.datetime()}
      </p>`);
  })
  .listen(process.env.PORT || 8888);
