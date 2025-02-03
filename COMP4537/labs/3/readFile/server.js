const http = require("http");
const url = require("url");
// const fs = require("fs");
const AWS = require("aws-sdk");

// Configure AWS SDK
AWS.config.update({ region: "us-east-2" }); // e.g., 'us-east-1'
const s3 = new AWS.S3();

const bucketName = "phoenixalpha-comp4537"; // Replace with your S3 bucket name

http
  .createServer((req, res) => {
    const q = url.parse(req.url, true);
    const fileName = q.pathname.slice(1);
    // fs.readFile(`..${fileName}`, (err, data) => {
    //   if (err) {
    //     res.writeHead(404, { "Content-Type": "text/html" });
    //     return res.end(`404 Not Found: ${fileName}`);
    //   }
    //   res.writeHead(200, { "Content-Type": "text/html" });
    //   return res.end(data);
    // });

    const params = {
      Bucket: bucketName,
      Key: fileName,
    };
  
    // Retrieve the file from S3
    s3.getObject(params, (err, data) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/html" });
        return res.end(`404 Not Found: ${fileName}`);
      }
      // Send the file content as the response
      res.writeHead(200, { "Content-Type": "text/html" });
      return res.end(data.Body.toString()); // Convert Buffer to string
    });
  })
  .listen(process.env.PORT || 8888);
