// const http = require("http");
// const url = require("url");
// const fs = require("fs");

// http
//   .createServer((req, res) => {
//     const q = url.parse(req.url, true);
//     const data = `${q.query["text"]}\n`;
//     fs.appendFile("../file.txt", data, { flag: "a" }, (err) => {
//       if (err) {
//         res.writeHead(500, { "Content-Type": "text/html" });
//         return res.end(`Error appending to file: ${err}`);
//       }
//       res.writeHead(200, { "Content-Type": "text/html" });
//       return res.end("Data appended successfully!");
//     });
//   })
//   .listen(process.env.PORT || 8888);

const http = require("http");
const url = require("url");
const AWS = require("aws-sdk");

// Configure AWS SDK
AWS.config.update({ region: "us-east-2" }); // e.g., 'us-east-1'
const s3 = new AWS.S3();

const bucketName = "phoenixalpha-comp4537"; // Replace with your S3 bucket name

http
  .createServer((req, res) => {
    const q = url.parse(req.url, true);
    const data = `${q.query["text"]}\n`;
    const params = {
      Bucket: bucketName,
      Key: "file.txt", // Unique file name
      Body: data,
      ContentType: "text/plain",
    };

    // Upload data to S3
    s3.upload(params, (err, data) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/html" });
        return res.end(`Error appending to file: ${err}`);
      }
      res.writeHead(200, { "Content-Type": "text/html" });
      return res.end("Data appended successfully!");
    });
  })
  .listen(process.env.port || 8888);
