const http = require("http");
const mysql = require("mysql2");
const url = require("url");
const strings = require("./lang/en/en.json");

// ChatGPT was used to help write this.
class Server {
  constructor(port) {
    this.port = port;
    this.userConnection = mysql.createConnection({
      host: "comp4537.cve8c4iaoaf4.us-east-2.rds.amazonaws.com",
      user: process.env.AWS_RDS_USER,
      password: process.env.AWS_RDS_USER_PW,
      database: "comp4537",
      connectTimeout: 10000,
    });
    this.adminConnection = mysql.createConnection({
      host: "comp4537.cve8c4iaoaf4.us-east-2.rds.amazonaws.com",
      user: process.env.AWS_RDS_ADMIN,
      password: process.env.AWS_RDS_ADMIN_PW,
      database: "comp4537",
      connectTimeout: 10000,
    });
  }

  resEnd(res, status, responseMessage) {
    res.writeHead(status, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ responseMessage }));
  }

  async createTable() {
    // Connect to admin account
    await new Promise((resolve, reject) => {
      this.adminConnection.connect((err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    const query = `CREATE TABLE IF NOT EXISTS patients (
      patientid int(11) AUTO_INCREMENT PRIMARY KEY,
      name varchar(100),
      dateOfBirth datetime
    )`;

    // Create the table
    await new Promise((resolve, reject) => {
      this.adminConnection.query(query, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });

    // Disconnect from admin account
    await new Promise((resolve, reject) => {
      this.adminConnection.end((err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  runQuery(query, res) {
    this.userConnection.connect((err) => {
      if (err) throw err;

      this.userConnection.query(query, (err, result) => {
        if (err) throw err;
        this.userConnection.end();
        return this.resEnd(res, 200, result);
      });
    });
  }

  handleGet(req, res) {
    // Get the user's query
    const q = url.parse(req.url, true);
    const pathName = q.pathname;
    const query = decodeURIComponent(
      pathName.substring(pathName.lastIndexOf("/") + 1)
    ).replaceAll('"', "");
    if (query) return this.runQuery(query, res);
    else return this.resEnd(res, 400, strings["400"]);
  }

  handlePost(req, res) {
    // Parse request in chunks
    let body = "";
    req.on("data", (chunk) => chunk != null && (body += chunk));
    req.on("end", () => {
      const q = JSON.parse(body);
      const query = q.query;
      if (query) return this.runQuery(query, res);
      else return this.resEnd(res, 400, strings["400"]);
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

    // Allow requests from frontend website
    res.setHeader(
      "Access-Control-Allow-Origin",
      "https://setrepmygoat.netlify.app"
    );

    // Handle request depending on method
    try {
      await this.createTable();
      if (req.method === "GET") return this.handleGet(req, res);
      else if (req.method === "POST") return this.handlePost(req, res);
    } catch (err) {
      return this.resEnd(res, 500, err);
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
