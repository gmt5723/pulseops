const http = require("node:http");
const checkWebsite = require("./checkWebsite");
const fs = require("node:fs");
const path = require("node:path");

const PORT = 4000;

const homePage = fs.readFileSync(
  path.join(__dirname, "index.html"),
  "utf8"
);

const server = http.createServer(async (request, response) => {
  // Serve the browser interface.
  if (request.method === "GET" && request.url === "/") {
    response.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
    });
    response.end(homePage);
    return;
  }

  // The remaining routes return JSON.
  response.setHeader("Content-Type", "application/json");

  if (request.method === "GET" && request.url === "/health") {
    response.writeHead(200);
    response.end(
      JSON.stringify({
        service: "PulseOps API",
        status: "ok",
      })
    );
    return;
  }

  if (request.method === "GET" && request.url === "/check") {
    try {
      const result = await checkWebsite();

      response.writeHead(200);
      response.end(JSON.stringify(result));
    } catch (error) {
      console.error("Unexpected check error:", error);

      response.writeHead(500);
      response.end(
        JSON.stringify({
          message: "An unexpected error occurred while checking.",
        })
      );
    }
    return;
  }

  response.writeHead(404);
  response.end(
    JSON.stringify({
      message: "Route not found",
    })
  );
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`PulseOps API running at http://localhost:${PORT}`);
});