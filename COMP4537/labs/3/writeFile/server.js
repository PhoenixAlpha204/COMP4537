const http = require("http");
const url = require("url");
const AWS = require("aws-sdk");

// ChatGPT was used to help write this.
class Server {
  constructor(port) {
    this.port = port;
  }

  handleRequest(req, res) {
    AWS.config.update({ region: "us-east-2" });
    const s3 = new AWS.S3();
    const bucketName = "phoenixalpha-comp4537";

    const q = url.parse(req.url, true);
    let data = `${q.query["text"]}\n`;
    const params = {
      Bucket: bucketName,
      Key: "file.txt",
    };

    s3.getObject(params, (err, oldData) => {
      if (!err) data = oldData.Body.toString() + data;

      const uploadParams = {
        Bucket: bucketName,
        Key: "file.txt",
        Body: data,
        ContentType: "text/plain",
      };

      s3.upload(uploadParams, (uploadErr) => {
        if (uploadErr) {
          res.writeHead(500, { "Content-Type": "text/html" });
          return res.end(`Error appending to file: ${uploadErr}`);
        }
        res.writeHead(200, { "Content-Type": "text/html" });
        return res.end("Data appended successfully!");
      });
    });
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
