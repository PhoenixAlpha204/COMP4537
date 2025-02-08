const http = require("http");
const url = require("url");
const AWS = require("aws-sdk");
const strings = require("./lang/en/en.json");

// ChatGPT was used to help write this.
class Server {
  constructor(port) {
    this.port = port;
  }

  handleRequest(req, res) {
    // Handle CORS preflight request
    if (req.headers["access-control-request-method"]) {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST");
      res.end();
    }

    // Initialize S3 object
    AWS.config.update({ region: "us-east-2" });
    const s3 = new AWS.S3();

    // Initialize JSON object
    const json = { numReqs: 1 }; // TODO: read the nums from S3

    // Check method of request
    if (req.method === "GET") {
      // Get the word the user requested
      const q = url.parse(req.url, true);
      const word = q.query["word"];

      // Return 400 error if the word is incorrect
      if (!word || word == parseInt(word)) {
        res.writeHead(400, { "Content-Type": "application/json" });
        json.responseMessage = strings["400"];
        return res.end(JSON.stringify(json));
      }

      // Fetch dictionary from AWS
      const params = {
        Bucket: "phoenixalpha-comp4537",
        Key: "lab4.json",
      };
      s3.getObject(params, (err, data) => {
        // File should exist
        if (err) {
          res.writeHead(500, { "Content-Type": "application/json" });
          json.responseMessage = strings["500"];
          return res.end(JSON.stringify(json));
        }
        const dictionary = JSON.parse(data.Body.toString("utf-8"));
        const definition = dictionary[word];

        // If the definition does not exist return 404
        if (!definition) {
          res.writeHead(404, { "Content-Type": "application/json" });
          json.responseMessage = strings["404"].replace("%1", word);
          return res.end(JSON.stringify(json));
        }

        // Word is valid, return JSON
        res.writeHead(200, { "Content-Type": "application/json" });
        json.responseMessage = `${word}: ${definition}`;
        return res.end(JSON.stringify(json));
      });
    } else if (req.method === "POST") {
      let body = "";
      // req.on(data) gets called when something has been read from stream
      req.on("data", (chunk) => {
        if (chunk != null) body += chunk;
      });
      // req.on(end) gets called when stream has ended
      // (all data has been transferred from client to server)
      req.on("end", () => {
        let q = url.parse(body, true);
        res.end(`Hello: ${q.query.name}, we got your POST request`);
      });
    }
  }

  start() {
    const server = http.createServer((req, res) =>
      this.handleRequest(req, res)
    );
    server.listen(this.port, () => {});
  }
}

const server = new Server(process.env.PORT);
server.start();
