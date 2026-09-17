const test = require("node:test");
const assert = require("node:assert/strict");
const checkWebsite = require("../checkWebsite");

test("records a successful HTTP response", async (t) => {
  const fakeFetch = t.mock.method(globalThis, "fetch", async () => {
    return new Response("OK", { status: 200 });
  });

  const result = await checkWebsite("https://example.com/");

  assert.equal(result.url, "https://example.com/");
  assert.equal(result.status, "ONLINE");
  assert.equal(result.httpStatus, 200);
  assert.equal(result.error, null);
  assert.ok(Number.isInteger(result.responseTimeMs));
  assert.ok(result.responseTimeMs >= 0);

  const [url, options] = fakeFetch.mock.calls[0].arguments;

  assert.equal(url, "https://example.com/");
  assert.equal(options.redirect, "manual");
  assert.ok(options.signal instanceof AbortSignal);
});

test("records HTTP 503 as a failed check", async (t) => {
  t.mock.method(globalThis, "fetch", async () => {
    return new Response("Service unavailable", { status: 503 });
  });

  const result = await checkWebsite("https://example.com/");

  assert.equal(result.status, "FAILED");
  assert.equal(result.httpStatus, 503);
  assert.ok(Number.isInteger(result.responseTimeMs));
});

test("records a redirect as unsuccessful", async (t) => {
  t.mock.method(globalThis, "fetch", async () => {
    return new Response(null, {
      status: 302,
      headers: { Location: "https://example.org/" },
    });
  });

  const result = await checkWebsite("https://example.com/");

  assert.equal(result.status, "FAILED");
  assert.equal(result.httpStatus, 302);
});

test("handles a network failure without an HTTP response", async (t) => {
  t.mock.method(globalThis, "fetch", async () => {
    throw new TypeError("fetch failed");
  });

  const result = await checkWebsite("https://example.com/");

  assert.equal(result.status, "FAILED");
  assert.equal(result.httpStatus, null);
  assert.equal(result.responseTimeMs, null);
  assert.equal(result.error, "Network request failed");
});

test("handles a timeout error", async (t) => {
  t.mock.method(globalThis, "fetch", async () => {
    throw new DOMException("Request timed out", "TimeoutError");
  });

  const result = await checkWebsite("https://example.com/");

  assert.equal(result.status, "FAILED");
  assert.equal(result.httpStatus, null);
  assert.equal(result.responseTimeMs, null);
  assert.equal(result.error, "Request timed out after 5 seconds");
});