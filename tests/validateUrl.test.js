const test = require("node:test");
const assert = require("node:assert/strict");
const validateUrl = require("../validateUrl");

test("accepts both approved HTTPS origins", () => {
  assert.equal(
    validateUrl("https://example.com"),
    "https://example.com/"
  );

  assert.equal(
    validateUrl("https://example.org"),
    "https://example.org/"
  );
});

test("trims whitespace and removes fragments", () => {
  assert.equal(
    validateUrl("  https://example.org/health#details  "),
    "https://example.org/health"
  );
});

test("preserves paths and query parameters", () => {
  assert.equal(
    validateUrl("https://example.com/health?full=true"),
    "https://example.com/health?full=true"
  );
});

test("rejects empty and non-string input", () => {
  for (const input of ["", "   ", undefined, null, 123]) {
    assert.throws(
      () => validateUrl(input),
      /Enter a website URL/
    );
  }
});

test("rejects malformed URLs", () => {
  assert.throws(
    () => validateUrl("not a URL"),
    /Enter a complete URL/
  );
});

test("rejects HTTP even for an approved hostname", () => {
  assert.throws(
    () => validateUrl("http://example.com"),
    /Only HTTPS/
  );
});

test("rejects blob URLs with an approved origin", () => {
  assert.throws(
    () => validateUrl("blob:https://example.com/test"),
    /Only HTTPS/
  );
});

test("rejects embedded credentials", () => {
  assert.throws(
    () => validateUrl("https://user:password@example.com"),
    /must not contain usernames or passwords/
  );
});

test("rejects localhost and private IP addresses", () => {
  for (const url of [
    "https://localhost:4000",
    "https://127.0.0.1",
    "https://192.168.1.1",
    "https://[::1]",
  ]) {
    assert.throws(
      () => validateUrl(url),
      /For now, use/
    );
  }
});

test("rejects lookalike hostnames", () => {
  assert.throws(
    () => validateUrl("https://example.com.attacker.test"),
    /For now, use/
  );
});

test("rejects unapproved ports", () => {
  assert.throws(
    () => validateUrl("https://example.com:8443"),
    /For now, use/
  );
});