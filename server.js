const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const checkWebsite = require("./checkWebsite");
const validateUrl = require("./validateUrl");
const cloudStorage = Boolean(process.env.SUPABASE_URL || process.env.SUPABASE_SECRET_KEY);
const store = cloudStorage
  ? require("./supabaseStore").createSupabaseStore({
      url: process.env.SUPABASE_URL,
      key: process.env.SUPABASE_SECRET_KEY,
    })
  : { ...require("./monitorStore"), ...require("./checkHistoryStore") };
const { recordCheck, listChecks, createMonitor, listMonitors, renameMonitor, deleteMonitor } = store;

const PORT = Number(process.env.PORT || 4000);
const HOST = process.env.HOST || "127.0.0.1";

const homePage = fs.readFileSync(
  path.join(__dirname, "index.html"),
  "utf8"
);

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(data));
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

    request.on("data", (chunk) => {
      size += chunk.length;

      if (size > 4096) {
        reject(
          Object.assign(new Error("Request body is too large."), {
            statusCode: 413,
          })
        );
        return;
      }

      chunks.push(chunk);
    });

    request.on("end", () => {
      if (size > 4096) return;

      try {
        const text = Buffer.concat(chunks).toString("utf8");
        resolve(JSON.parse(text));
      } catch {
        reject(
          Object.assign(new Error("Send a valid JSON request body."), {
            statusCode: 400,
          })
        );
      }
    });

    request.on("error", reject);
  });
}

async function handleRequest(request, response) {
  let requestUrl;

  try {
    requestUrl = new URL(request.url, "http://localhost:4000");
  } catch {
    sendJson(response, 400, { message: "Invalid request URL." });
    return;
  }

  const route = requestUrl.pathname;

  if (request.method === "GET" && route === "/") {
    response.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
    });
    response.end(homePage);
    return;
  }

  if (request.method === "GET" && route === "/health") {
    sendJson(response, 200, {
      service: "PulseOps API",
      status: "ok",
    });
    return;
  }
   if (request.method === "GET" && route === "/checks") {
    sendJson(response, 200, { checks: await listChecks() });
    return;
  }
  if (request.method === "GET" && route === "/monitors") {
    sendJson(response, 200, { monitors: await listMonitors() });
    return;
  }

  if (request.method === "POST" && route === "/monitors") {
    const contentType = request.headers["content-type"]
      ?.split(";")[0]
      .trim()
      .toLowerCase();

    if (contentType !== "application/json") {
      sendJson(response, 415, {
        message: "Use Content-Type: application/json.",
      });
      return;
    }

    try {
      const input = await readJsonBody(request);
      const monitor = await createMonitor(input);

      sendJson(response, 201, { monitor });
    } catch (error) {
      sendJson(response, error.statusCode ?? 400, {
        message: error.message,
      });
    }
    return;
  }

  const monitorMatch = route.match(/^\/monitors\/([^/]+)$/);

  if (request.method === "PATCH" && monitorMatch) {
    const contentType = request.headers["content-type"]
      ?.split(";")[0]
      .trim()
      .toLowerCase();

    if (contentType !== "application/json") {
      sendJson(response, 415, {
        message: "Use Content-Type: application/json.",
      });
      return;
    }

    try {
      const input = await readJsonBody(request);
      const monitor = await renameMonitor(monitorMatch[1], input);

      if (!monitor) {
        sendJson(response, 404, {
          message: "Monitor not found.",
        });
        return;
      }

      sendJson(response, 200, { monitor });
    } catch (error) {
      if (error.statusCode === 400 || error.statusCode === 413) {
        sendJson(response, error.statusCode, {
          message: error.message,
        });
      } else {
        console.error("Could not rename monitor:", error);

        sendJson(response, 500, {
          message: "Could not save the new name. Please try again.",
        });
      }
    }

    return;
  }

  if (request.method === "DELETE" && monitorMatch) {
    const id = monitorMatch[1];

    try {
      const deleted = await deleteMonitor(id);

      if (!deleted) {
        sendJson(response, 404, {
          message: "Monitor not found.",
        });
        return;
      }

      sendJson(response, 200, { deleted: true, id });
    } catch (error) {
      console.error("Could not delete monitor:", error);

      sendJson(response, 500, {
        message: "Could not save the deletion. Please try again.",
      });
    }

    return;
  }

  if (request.method === "GET" && route === "/check") {
    const input =
      requestUrl.searchParams.get("url") ?? "https://example.com";

    let validatedUrl;

    try {
      validatedUrl = validateUrl(input);
    } catch (error) {
      sendJson(response, 400, { message: error.message });
      return;
    }

    try {
           const result = await checkWebsite(validatedUrl);
      const savedCheck = await recordCheck(result);
      sendJson(response, 200, savedCheck);
    } catch (error) {
      console.error("Unexpected check error:", error);
      sendJson(response, 500, {
        message: "An unexpected error occurred while checking.",
      });
    }
    return;
  }

  sendJson(response, 404, { message: "Route not found" });
}

const server = http.createServer((request, response) => {
  handleRequest(request, response).catch(() => {
    if (!response.headersSent) sendJson(response, 503, { message: "Storage unavailable. Please retry shortly." });
    else response.end();
  });
});

if (require.main === module) {
  server.listen(PORT, HOST, () => {
    console.log(`PulseOps API running at http://${HOST}:${PORT}`);
  });
}

module.exports = server;