const http = require("http");
const url = require("url");
const AWS = require("aws-sdk");

AWS.config.update({ region: "us-east-2" });
const s3 = new AWS.S3();
const bucketName = "phoenixalpha-comp4537";

http
  .createServer((req, res) => {
    const q = url.parse(req.url, true);
    let data = `${q.query["text"]}\n`;
    const params = {
      Bucket: bucketName,
      Key: "file.txt",
    };

    s3.getObject(params, (err, oldData) => {
      let existingData = "";
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
  })
  .listen(process.env.port || 8888);
