const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

function createFixture(t) {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), "pulseops-history-")
  );

  t.after(() => {
    fs.rmSync(directory, { recursive: true, force: true });
  });

  for (const filename of ["checkHistoryStore.js", "validateUrl.js"]) {
    fs.copyFileSync(
      path.join(__dirname, "..", filename),
      path.join(directory, filename)
    );
  }

  return {
    run(code) {
      const output = execFileSync(process.execPath, ["-e", code], {
        cwd: directory,
        encoding: "utf8",
      });

      return JSON.parse(output);
    },
  };
}

test("history starts empty without a storage file", (t) => {
  const fixture = createFixture(t);

  const result = fixture.run(`
    const store = require("./checkHistoryStore");
    console.log(JSON.stringify(store.listChecks()));
  `);

  assert.deepEqual(result, []);
});

test("history preserves successful and failed checks after restart", (t) => {
  const fixture = createFixture(t);

  const created = fixture.run(`
    const store = require("./checkHistoryStore");

    const success = store.recordCheck({
      url: "https://example.org",
      status: "ONLINE",
      httpStatus: 200,
      responseTimeMs: 120,
      error: null
    });

    const failure = store.recordCheck({
      url: "https://example.com",
      status: "FAILED",
      httpStatus: null,
      responseTimeMs: null,
      error: "Network request failed"
    });

    console.log(JSON.stringify({ success, failure }));
  `);

  assert.equal(created.success.url, "https://example.org/");
  assert.notEqual(created.success.id, created.failure.id);
  assert.ok(!Number.isNaN(Date.parse(created.success.checkedAt)));

  const reloaded = fixture.run(`
    const store = require("./checkHistoryStore");
    console.log(JSON.stringify(store.listChecks()));
  `);

  assert.deepEqual(reloaded, [created.failure, created.success]);
});

test("history retains only the latest 20 checks after restart", (t) => {
  const fixture = createFixture(t);

  fixture.run(`
    const store = require("./checkHistoryStore");

    for (let index = 0; index < 25; index++) {
      store.recordCheck({
        url: "https://example.org",
        status: "ONLINE",
        httpStatus: 200,
        responseTimeMs: index,
        error: null
      });
    }

    console.log(JSON.stringify(true));
  `);

  const reloaded = fixture.run(`
    const store = require("./checkHistoryStore");
    console.log(JSON.stringify(store.listChecks()));
  `);

  assert.equal(reloaded.length, 20);
  assert.deepEqual(
    reloaded.map((item) => item.responseTimeMs),
    Array.from({ length: 20 }, (_, index) => 24 - index)
  );
});