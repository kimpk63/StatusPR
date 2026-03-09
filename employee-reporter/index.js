const http = require("http");
const https = require("https");
const { exec } = require("child_process");
const os = require("os");

const SERVER_URL = "https://statuspr.onrender.com/api";
const CHECK_INTERVAL = 15000;

let lastStatus = null;

function isPremiereRunning() {
  return new Promise((resolve) => {
    exec("tasklist", (err, stdout) => {
      if (err) {
        resolve(false);
        return;
      }

      const list = stdout.toLowerCase();

      if (
        list.includes("premiere") ||
        list.includes("premierepro") ||
        list.includes("adobe premiere")
      ) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
}

function sendStatus(status) {
  const data = JSON.stringify({
    hostname: os.hostname(),
    status: status,
  });

  const protocol = https;
  const options = {
    hostname: "statuspr.onrender.com",
    port: 443,
    path: "/api/status",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(data),
    },
  };

  const req = protocol.request(options, (res) => {
    console.log(`[${new Date().toISOString()}] Status sent: ${status} (HTTP ${res.statusCode})`);
    res.on("data", () => {});
  });

  req.on("error", (err) => {
    console.error("[ERROR] Send failed:", err.message);
  });

  req.write(data);
  req.end();
}

async function checkStatus() {
  const running = await isPremiereRunning();
  const status = running ? "working" : "idle";

  if (status !== lastStatus) {
    console.log(new Date().toISOString(), status);
    lastStatus = status;
  }

  sendStatus(status);
}

console.log("Employee Reporter started");
console.log("Server URL:", SERVER_URL);

setInterval(checkStatus, CHECK_INTERVAL);

checkStatus();