const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

function createFixture(t) {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), "pulseops-store-")
  );

  t.after(() => {
    fs.rmSync(directory, { recursive: true, force: true });
  });

  // Copy the real implementation into an isolated test folder.
  for (const filename of ["monitorStore.js", "validateUrl.js"]) {
    fs.copyFileSync(
      path.join(__dirname, "..", filename),
      path.join(directory, filename)
    );
  }

  return {
    storageFile: path.join(directory, "data", "monitors.json"),

    run(code) {
      // Each call starts a fresh process, like restarting the backend.
      const output = execFileSync(process.execPath, ["-e", code], {
        cwd: directory,
        encoding: "utf8",
      });

      return JSON.parse(output);
    },
  };
}

test("starts empty when no storage file exists", (t) => {
  const fixture = createFixture(t);

  const monitors = fixture.run(`
    const store = require("./monitorStore");
    console.log(JSON.stringify(store.listMonitors()));
  `);

  assert.deepEqual(monitors, []);
});

test("saves a monitor and reloads it in a new process", (t) => {
  const fixture = createFixture(t);

  const created = fixture.run(`
    const store = require("./monitorStore");
    const monitor = store.createMonitor({
      name: "  Example website  ",
      url: "https://example.org"
    });
    console.log(JSON.stringify(monitor));
  `);

  assert.equal(created.name, "Example website");
  assert.equal(created.url, "https://example.org/");
  assert.equal(typeof created.id, "string");
  assert.ok(created.id.length > 0);
  assert.ok(!Number.isNaN(Date.parse(created.createdAt)));

  const saved = JSON.parse(
    fs.readFileSync(fixture.storageFile, "utf8")
  );

  assert.deepEqual(saved, [created]);

  const reloaded = fixture.run(`
    const store = require("./monitorStore");
    console.log(JSON.stringify(store.listMonitors()));
  `);

  assert.deepEqual(reloaded, [created]);
});

test("rejects duplicate URLs after restarting without changing storage", (t) => {
  const fixture = createFixture(t);

  fixture.run(`
    const store = require("./monitorStore");
    const monitor = store.createMonitor({
      name: "Original",
      url: "https://example.org"
    });
    console.log(JSON.stringify(monitor));
  `);

  const before = fs.readFileSync(fixture.storageFile, "utf8");

  const outcome = fixture.run(`
    const store = require("./monitorStore");
    let message = null;

    try {
      store.createMonitor({
        name: "Duplicate",
        url: "https://example.org/"
      });
    } catch (error) {
      message = error.message;
    }

    console.log(JSON.stringify({
      message,
      count: store.listMonitors().length
    }));
  `);

  assert.equal(
    outcome.message,
    "A monitor for this URL already exists."
  );
  assert.equal(outcome.count, 1);

  assert.equal(
    fs.readFileSync(fixture.storageFile, "utf8"),
    before
  );
});

test("rejects corrupt storage without overwriting it", (t) => {
  const fixture = createFixture(t);

  fs.mkdirSync(path.dirname(fixture.storageFile), {
    recursive: true,
  });

  const corruptContents = "{invalid JSON";
  fs.writeFileSync(fixture.storageFile, corruptContents, "utf8");

  const outcome = fixture.run(`
    let rejected = false;

    try {
      require("./monitorStore");
    } catch {
      rejected = true;
    }

    console.log(JSON.stringify({ rejected }));
  `);

  assert.equal(outcome.rejected, true);

  assert.equal(
    fs.readFileSync(fixture.storageFile, "utf8"),
    corruptContents
  );
});
test("deletes a monitor permanently while preserving other monitors", (t) => {
  const fixture = createFixture(t);

  const created = fixture.run(`
    const store = require("./monitorStore");

    const first = store.createMonitor({
      name: "Delete this",
      url: "https://example.org"
    });

    const second = store.createMonitor({
      name: "Keep this",
      url: "https://example.com"
    });

    console.log(JSON.stringify({ first, second }));
  `);

  const outcome = fixture.run(`
    const store = require("./monitorStore");
    const deleted = store.deleteMonitor(
      ${JSON.stringify(created.first.id)}
    );

    console.log(JSON.stringify({
      deleted,
      monitors: store.listMonitors()
    }));
  `);

  assert.equal(outcome.deleted, true);
  assert.deepEqual(outcome.monitors, [created.second]);

  const reloaded = fixture.run(`
    const store = require("./monitorStore");
    console.log(JSON.stringify(store.listMonitors()));
  `);

  assert.deepEqual(reloaded, [created.second]);
});

test("deleting an unknown monitor leaves storage unchanged", (t) => {
  const fixture = createFixture(t);

  fixture.run(`
    const store = require("./monitorStore");

    console.log(JSON.stringify(store.createMonitor({
      name: "Keep this",
      url: "https://example.org"
    })));
  `);

  const before = fs.readFileSync(fixture.storageFile, "utf8");

  const deleted = fixture.run(`
    const store = require("./monitorStore");
    console.log(JSON.stringify(store.deleteMonitor("missing-id")));
  `);

  assert.equal(deleted, false);
  assert.equal(
    fs.readFileSync(fixture.storageFile, "utf8"),
    before
  );
});
test("renamed monitors retain their new name after restart", (t) => {
  const fixture = createFixture(t);

  const original = fixture.run(`
    const store = require("./monitorStore");

    console.log(JSON.stringify(store.createMonitor({
      name: "Original name",
      url: "https://example.org"
    })));
  `);

  const renamed = fixture.run(`
    const store = require("./monitorStore");

    console.log(JSON.stringify(store.renameMonitor(
      ${JSON.stringify(original.id)},
      { name: "Updated name" }
    )));
  `);

  assert.deepEqual(renamed, {
    ...original,
    name: "Updated name",
  });

  const reloaded = fixture.run(`
    const store = require("./monitorStore");
    console.log(JSON.stringify(store.listMonitors()));
  `);

  assert.deepEqual(reloaded, [renamed]);
});