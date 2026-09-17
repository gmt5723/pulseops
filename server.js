const http = require("node:http");
const checkWebsite = require("./checkWebsite");

const PORT = 4000;

const server = http.createServer(async (request, response) => {
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
    const result = await checkWebsite();

    response.writeHead(200);
    response.end(JSON.stringify(result));
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