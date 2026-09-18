const { randomUUID } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const validateUrl = require("./validateUrl");

const dataDirectory = path.join(__dirname, "data");
const storageFile = path.join(dataDirectory, "monitors.json");

function loadMonitors() {
  let contents;

  try {
    contents = fs.readFileSync(storageFile, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return new Map();
    throw error;
  }

  const records = JSON.parse(contents);

  if (!Array.isArray(records)) {
    throw new Error("Monitor storage must contain an array.");
  }

  const loaded = new Map();
  const urls = new Set();

  for (const record of records) {
    if (
      !record ||
      typeof record.id !== "string" ||
      !record.id ||
      typeof record.name !== "string" ||
      !record.name.trim() ||
      record.name.trim().length > 60 ||
      typeof record.createdAt !== "string" ||
      Number.isNaN(Date.parse(record.createdAt))
    ) {
      throw new Error("Monitor storage contains an invalid record.");
    }

    const url = validateUrl(record.url);

    if (loaded.has(record.id) || urls.has(url)) {
      throw new Error("Monitor storage contains a duplicate record.");
    }

    loaded.set(record.id, {
      id: record.id,
      name: record.name.trim(),
      url,
      createdAt: record.createdAt,
    });

    urls.add(url);
  }

  return loaded;
}

const monitors = loadMonitors();

function saveMonitors(records) {
  fs.mkdirSync(dataDirectory, { recursive: true });

  const temporaryFile = `${storageFile}.tmp`;

  fs.writeFileSync(
    temporaryFile,
    JSON.stringify(records, null, 2) + "\n",
    "utf8"
  );

  fs.renameSync(temporaryFile, storageFile);
}

function createMonitor(input) {
  const name = input?.name;

  if (typeof name !== "string" || name.trim() === "") {
    throw new Error("Enter a monitor name.");
  }

  if (name.trim().length > 60) {
    throw new Error("Monitor names must be 60 characters or fewer.");
  }

  const url = validateUrl(input.url);

  for (const monitor of monitors.values()) {
    if (monitor.url === url) {
      throw new Error("A monitor for this URL already exists.");
    }
  }

  const monitor = {
    id: randomUUID(),
    name: name.trim(),
    url,
    createdAt: new Date().toISOString(),
  };

  saveMonitors([...monitors.values(), monitor]);
  monitors.set(monitor.id, monitor);

  return { ...monitor };
}

function listMonitors() {
  return Array.from(monitors.values(), (monitor) => ({
    ...monitor,
  }));
}

module.exports = {
  createMonitor,
  listMonitors,
};