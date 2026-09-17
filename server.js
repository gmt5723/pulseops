const http = require("node:http");

const PORT = 4000;

const server = http.createServer((request, response) => {
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