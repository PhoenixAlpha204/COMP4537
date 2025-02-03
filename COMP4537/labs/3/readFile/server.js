const http = require("http");
const url = require("url");
const AWS = require("aws-sdk");

// ChatGPT was used to help write this.
AWS.config.update({ region: "us-east-2" });
const s3 = new AWS.S3();

http
  .createServer((req, res) => {
    const q = url.parse(req.url, true);
    const pathName = q.pathname;
    const fileName = pathName.substring(pathName.lastIndexOf("/") + 1);
    const params = {
      Bucket: "phoenixalpha-comp4537",
      Key: fileName,
    };

    s3.getObject(params, (err, data) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/html" });
        return res.end(`404 Not Found: ${fileName}`);
      }
      res.writeHead(200, { "Content-Type": "text/plain" });
      return res.end(data.Body.toString());
    });
  })
  .listen(process.env.PORT || 8888);
