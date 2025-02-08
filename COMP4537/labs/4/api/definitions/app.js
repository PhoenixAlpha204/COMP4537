const http = require("http");
const url = require("url");
const AWS = require("aws-sdk");
const strings = require("./lang/en/en.json");

// ChatGPT was used to help write this.
class Server {
  constructor(port) {
    this.port = port;
  }

  // Return the given error code and message
  resEnd(res, json, status, responseMessage) {
    res.writeHead(status, { "Content-Type": "application/json " });
    json.responseMessage = responseMessage;
    return res.end(JSON.stringify(json));
  }

  handleGet(req, res, json) {
    // Get the word the user requested
    const q = url.parse(req.url, true);
    const word = q.query["word"];

    // Return 400 error if the word is incorrect
    if (!word || word == parseInt(word))
      return this.resEnd(res, json, 400, strings["400"]);

    // Fetch dictionary from AWS
    const params = { Bucket: "phoenixalpha-comp4537", Key: "lab4.json" };
    s3.getObject(params, (err, data) => {
      // File should exist
      if (err) return this.resEnd(res, json, 500, strings["500"]);

      // Parse the dictionary and definition requested
      const dictionary = JSON.parse(data.Body.toString("utf-8"));
      const definition = dictionary[word];

      // If the definition does not exist return 404
      if (!definition) return this.resEnd(res, json, 404, strings["404"]);

      // Word is valid, return JSON
      return this.resEnd(res, json, 200, `${word}: ${definition}`);
    });
  }

  handlePost(req, res, json) {
    // Parse request in chunks
    let body = "";
    req.on("data", (chunk) => {
      if (chunk != null) body += chunk;
    });
    req.on("end", () => {
      // Get the word and definition
      const q = JSON.parse(body);
      const word = q.word;
      const definition = q.definition;

      // Return 400 error if the word is incorrect
      if (!word || word == parseInt(word))
        return this.resEnd(res, json, 400, strings["400"]);

      // Fetch file from s3
      const params = { Bucket: "phoenixalpha-comp4537", Key: "lab4.json" };
      s3.getObject(params, (err, data) => {
        // File should exist
        if (err) return this.resEnd(res, json, 500, strings["500"]);

        // Parse the dictionary
        const dictionary = JSON.parse(data.Body.toString("utf-8"));

        // If the definition already exists return 409
        if (dictionary[word])
          return this.resEnd(res, json, 409, strings["409"]);

        // Word is valid, append to file and return JSON
        dictionary[word] = definition;
        const uploadParams = {
          Bucket: "phoenixalpha-comp4537",
          Key: "lab4.json",
          Body: JSON.stringify(dictionary),
          ContentType: "application/json",
        };
        s3.upload(uploadParams, (uploadErr) => {
          if (uploadErr) return this.resEnd(res, json, 500, strings["500"]);
          const response = `New entry recorded:<br>
                           \"${word}: ${definition}\"<br>
                           total entries: ${Object.keys(dictionary).length}`;
          return this.resEnd(res, json, 200, response);
        });
      });
    });
  }

  async handleRequest(req, res) {
    // Handle CORS preflight request
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "https://setrepmygoat.netlify.app",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      });
      return res.end();
    }

    // Initialize S3 object
    AWS.config.update({ region: "us-east-2" });
    const s3 = new AWS.S3();

    // Initialize JSON object with number of reqs from S3
    const newNum = await this.updateRequestCount(s3);
    const json = { numReqs: newNum, responseMessage: "" };

    // Allow requests from frontend website
    res.setHeader(
      "Access-Control-Allow-Origin",
      "https://setrepmygoat.netlify.app"
    );

    // Handle request depending on method
    if (req.method === "GET") {
      return this.handleGet(req, res, json);
    } else if (req.method === "POST") {
      return this.handlePost(req, res, json);
    }
  }

  // Helper function to update the request count on S3 and return the new count.
  async updateRequestCount(s3) {
    const params = {
      Bucket: "phoenixalpha-comp4537",
      Key: "lab4.txt",
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
