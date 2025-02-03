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
    const newData = `${q.query["text"]}\n`;
    const params = {
      Bucket: bucketName,
      Key: "file.txt",
    };

    s3.getObject(params, (err, data) => {
      let existingData = "";

      if (!err) {
        existingData = data.Body.toString(); // Convert Buffer to string
      }

      // Combine existing data with new data
      const combinedData = existingData + newData;

      // Upload the combined data back to S3
      const uploadParams = {
        Bucket: bucketName,
        Key: "file.txt",
        Body: combinedData,
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
  })
  .listen(process.env.port || 8888);
