const http = require("http");
const url = require("url");
const utils = require("./modules/utils");
const strings = require("./lang/en/en.json");

// ChatGPT was used to help write this.
class Server {
  constructor(port) {
    this.port = port;
  }

  handleRequest(req, res) {
    const q = url.parse(req.url, true);
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`<p style="color:blue;">
      ${strings.greeting.replace("%1", q.query["name"])} ${utils.datetime()}
      </p>`);
  }

  start() {
    const server = http.createServer((req, res) =>
      this.handleRequest(req, res)
    );
    server.listen(this.port, () => {
      console.log(`Server is running on port ${this.port}`);
    });
  }
}

const server = new Server(process.env.PORT);
server.start();
