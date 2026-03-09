const http = require("http");
const { exec } = require("child_process");
const os = require("os");

const SERVER_URL = "http://localhost:3001/api/status";
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

  const url = new URL(SERVER_URL);

  const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(data),
    },
  };

  const req = http.request(options, (res) => {
    res.on("data", () => {});
  });

  req.on("error", (err) => {
    console.error("Send error:", err.message);
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

setInterval(checkStatus, CHECK_INTERVAL);

checkStatus();