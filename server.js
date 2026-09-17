const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const checkWebsite = require("./checkWebsite");
const validateUrl = require("./validateUrl");

const PORT = 4000;

const homePage = fs.readFileSync(
  path.join(__dirname, "index.html"),
  "utf8"
);

const server = http.createServer(async (request, response) => {
  let requestUrl;

try {
  requestUrl = new URL(request.url, "http://localhost:4000");
} catch {
  response.writeHead(400, {
    "Content-Type": "application/json",
  });
  response.end(
    JSON.stringify({ message: "Invalid request URL." })
  );
  return;
}

  if (request.method === "GET" && requestUrl.pathname === "/") {
    response.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
    });
    response.end(homePage);
    return;
  }

  response.setHeader("Content-Type", "application/json");
  response.setHeader("Cache-Control", "no-store");

  if (
    request.method === "GET" &&
    requestUrl.pathname === "/health"
  ) {
    response.writeHead(200);
    response.end(
      JSON.stringify({
        service: "PulseOps API",
        status: "ok",
      })
    );
    return;
  }

  if (
    request.method === "GET" &&
    requestUrl.pathname === "/check"
  ) {
    const input =
      requestUrl.searchParams.get("url") ??
      "https://example.com";

    let validatedUrl;

    try {
      validatedUrl = validateUrl(input);
    } catch (error) {
      response.writeHead(400);
      response.end(
        JSON.stringify({ message: error.message })
      );
      return;
    }

    try {
      const result = await checkWebsite(validatedUrl);

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