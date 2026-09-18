const { randomUUID } = require("node:crypto");
const validateUrl = require("./validateUrl");

const monitors = new Map();

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