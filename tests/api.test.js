const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

async function startApi(t) {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), "pulseops-api-")
  );

  let server;

  t.after(async () => {
    try {
      if (server?.listening) {
        await new Promise((resolve, reject) => {
          server.close((error) => {
            if (error) reject(error);
            else resolve();
          });
          server.closeAllConnections();
        });
      }
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  });

    for (const filename of [
    "server.js",
    "monitorStore.js",
    "checkHistoryStore.js",
    "validateUrl.js",
    "checkWebsite.js",
    "index.html",
  ]) {
    fs.copyFileSync(
      path.join(__dirname, "..", filename),
      path.join(directory, filename)
    );
  }

  server = require(path.join(directory, "server.js"));

  await new Promise((resolve, reject) => {
    server.once("error", reject);

    // Port 0 asks the operating system to choose a free port.
    server.listen(0, "127.0.0.1", () => {
      server.removeListener("error", reject);
      resolve();
    });
  });

  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  return async function request(route, options = {}) {
    const response = await fetch(`${baseUrl}${route}`, {
      ...options,
      signal: AbortSignal.timeout(5000),
    });

    return {
      status: response.status,
      contentType: response.headers.get("content-type"),
      body: await response.json(),
    };
  };
}

function jsonPost(body) {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

test("API: health returns HTTP 200 and JSON", async (t) => {
  const request = await startApi(t);
  const result = await request("/health");

  assert.equal(result.status, 200);
  assert.match(result.contentType, /application\/json/);
  assert.deepEqual(result.body, {
    service: "PulseOps API",
    status: "ok",
  });
});

test("API: creates, lists, and deletes a monitor", async (t) => {
  const request = await startApi(t);

  const initial = await request("/monitors");
  assert.equal(initial.status, 200);
  assert.deepEqual(initial.body, { monitors: [] });

  const created = await request(
    "/monitors",
    jsonPost({
      name: "Example website",
      url: "https://example.org",
    })
  );

  assert.equal(created.status, 201);

  const monitor = created.body.monitor;
  assert.equal(monitor.name, "Example website");
  assert.equal(monitor.url, "https://example.org/");
  assert.equal(typeof monitor.id, "string");
  assert.ok(monitor.id.length > 0);

  const listed = await request("/monitors");
  assert.equal(listed.status, 200);
  assert.deepEqual(listed.body.monitors, [monitor]);

  const deleted = await request(`/monitors/${monitor.id}`, {
    method: "DELETE",
  });

  assert.equal(deleted.status, 200);
  assert.deepEqual(deleted.body, {
    deleted: true,
    id: monitor.id,
  });

  const afterDeletion = await request("/monitors");
  assert.deepEqual(afterDeletion.body, { monitors: [] });
});

test("API: rejects duplicate monitor URLs with HTTP 400", async (t) => {
  const request = await startApi(t);

  const input = {
    name: "Example",
    url: "https://example.org",
  };

  const first = await request("/monitors", jsonPost(input));
  assert.equal(first.status, 201);

  const duplicate = await request("/monitors", jsonPost(input));
  assert.equal(duplicate.status, 400);
  assert.equal(
    duplicate.body.message,
    "A monitor for this URL already exists."
  );

  const listed = await request("/monitors");
  assert.equal(listed.body.monitors.length, 1);
});

test("API: rejects malformed JSON with HTTP 400", async (t) => {
  const request = await startApi(t);

  const result = await request("/monitors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{invalid",
  });

  assert.equal(result.status, 400);
  assert.equal(
    result.body.message,
    "Send a valid JSON request body."
  );
});

test("API: rejects incorrect content type with HTTP 415", async (t) => {
  const request = await startApi(t);

  const result = await request("/monitors", {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: "{}",
  });

  assert.equal(result.status, 415);
  assert.equal(
    result.body.message,
    "Use Content-Type: application/json."
  );
});

test("API: rejects an unapproved monitor URL", async (t) => {
  const request = await startApi(t);

  const result = await request(
    "/monitors",
    jsonPost({
      name: "Blocked destination",
      url: "https://unapproved.invalid",
    })
  );

  assert.equal(result.status, 400);
  assert.equal(
    result.body.message,
    "For now, use https://example.com or https://example.org."
  );

  const listed = await request("/monitors");
  assert.deepEqual(listed.body, { monitors: [] });
});

test("API: deleting an unknown monitor returns HTTP 404", async (t) => {
  const request = await startApi(t);

  const result = await request("/monitors/missing-id", {
    method: "DELETE",
  });

  assert.equal(result.status, 404);
  assert.deepEqual(result.body, {
    message: "Monitor not found.",
  });
});

test("API: unknown routes return HTTP 404", async (t) => {
  const request = await startApi(t);
  const result = await request("/unknown");

  assert.equal(result.status, 404);
  assert.deepEqual(result.body, {
    message: "Route not found",
  });
});
test("API: renames a monitor while preserving its other fields", async (t) => {
  const request = await startApi(t);

  const created = await request(
    "/monitors",
    jsonPost({
      name: "Original name",
      url: "https://example.org",
    })
  );

  assert.equal(created.status, 201);
  const original = created.body.monitor;

  const renamed = await request(`/monitors/${original.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "  Updated name  " }),
  });

  assert.equal(renamed.status, 200);
  assert.deepEqual(renamed.body.monitor, {
    ...original,
    name: "Updated name",
  });

  const listed = await request("/monitors");
  assert.deepEqual(listed.body.monitors, [
    { ...original, name: "Updated name" },
  ]);
});

test("API: rejects invalid monitor names without changing the monitor", async (t) => {
  const request = await startApi(t);

  const created = await request(
    "/monitors",
    jsonPost({
      name: "Keep this name",
      url: "https://example.org",
    })
  );

  assert.equal(created.status, 201);
  const original = created.body.monitor;

  for (const name of ["", "   ", "x".repeat(61), null, 123]) {
    const result = await request(`/monitors/${original.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    assert.equal(result.status, 400);
  }

  const listed = await request("/monitors");
  assert.deepEqual(listed.body.monitors, [original]);
});

test("API: renaming an unknown monitor returns HTTP 404", async (t) => {
  const request = await startApi(t);

  const result = await request("/monitors/missing-id", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "New name" }),
  });

  assert.equal(result.status, 404);
  assert.deepEqual(result.body, {
    message: "Monitor not found.",
  });
});
test("API: history starts empty and excludes rejected URLs", async (t) => {
  const request = await startApi(t);

  const initial = await request("/checks");
  assert.equal(initial.status, 200);
  assert.deepEqual(initial.body, { checks: [] });

  const params = new URLSearchParams({
    url: "https://unapproved.invalid",
  });

  const rejected = await request(`/check?${params}`);
  assert.equal(rejected.status, 400);

  const afterRejection = await request("/checks");
  assert.equal(afterRejection.status, 200);
  assert.deepEqual(afterRejection.body, { checks: [] });
});