const http = require("http");
const url = require("url");
const AWS = require("aws-sdk");
const strings = require("./lang/en/en.json");

// ChatGPT was used to help write this.
class Server {
  constructor(port) {
    this.port = port;
  }

  async handleRequest(req, res) {
    // Handle CORS preflight request
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      });
      return res.end();
    }

    // Initialize S3 object
    AWS.config.update({ region: "us-east-2" });
    const s3 = new AWS.S3();

    // Initialize JSON object with number of reqs from S3
    const json = { numReqs: 0, responseMessage: "" }
    const newNum = await this.updateRequestCount(s3);
    json.numReqs = newNum;

    // Allow requests from frontend website
    res.setHeader("Access-Control-Allow-Origin", "*");

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

  // Helper function to update the request count on S3 and return the new count.
  async updateRequestCount(s3) {
    const params = {
      Bucket: "phoenixalpha-comp4537",
      Key: "lab4.txt"
    };

    // Retrieve the current file contents
    const oldData = await s3.getObject(params).promise();
    // Parse the number from the file
    const newNum = parseInt(oldData.Body.toString("utf-8"), 10) + 1;
    
    // Upload the new value to S3
    const uploadParams = {
      Bucket: "phoenixalpha-comp4537",
      Key: "lab4.txt",
      Body: `${newNum}`,
      ContentType: "text/plain",
    };
    await s3.upload(uploadParams).promise();
    return newNum;
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
