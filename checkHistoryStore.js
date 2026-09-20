const { randomUUID } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const validateUrl = require("./validateUrl");

const storageFile = path.join(__dirname, "data", "check-history.json");
const HISTORY_LIMIT = 20;

function validateResult(result) {
  if (!result || typeof result !== "object") {
    throw new Error("Invalid check result.");
  }

  const url = validateUrl(result.url);

  if (!["ONLINE", "FAILED"].includes(result.status)) {
    throw new Error("Invalid check status.");
  }

  if (
    result.httpStatus !== null &&
    (!Number.isInteger(result.httpStatus) ||
      result.httpStatus < 100 ||
      result.httpStatus > 599)
  ) {
    throw new Error("Invalid HTTP status.");
  }

  if (
    result.responseTimeMs !== null &&
    (!Number.isFinite(result.responseTimeMs) ||
      result.responseTimeMs < 0)
  ) {
    throw new Error("Invalid response time.");
  }

  if (result.error !== null && typeof result.error !== "string") {
    throw new Error("Invalid check error.");
  }

  return {
    url,
    status: result.status,
    httpStatus: result.httpStatus,
    responseTimeMs: result.responseTimeMs,
    error: result.error,
  };
}

function loadHistory() {
  let contents;

  try {
    contents = fs.readFileSync(storageFile, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }

  const records = JSON.parse(contents);

  if (!Array.isArray(records) || records.length > HISTORY_LIMIT) {
    throw new Error("Invalid check history storage.");
  }

  const ids = new Set();

  return records.map((record) => {
    const result = validateResult(record);

    if (
      typeof record.id !== "string" ||
      !record.id ||
      ids.has(record.id) ||
      typeof record.checkedAt !== "string" ||
      Number.isNaN(Date.parse(record.checkedAt))
    ) {
      throw new Error("Invalid check history record.");
    }

    ids.add(record.id);

    return {
      ...result,
      id: record.id,
      checkedAt: record.checkedAt,
    };
  });
}

let history = loadHistory();

function recordCheck(result) {
  const item = {
    ...validateResult(result),
    id: randomUUID(),
    checkedAt: new Date().toISOString(),
  };

  const updated = [item, ...history].slice(0, HISTORY_LIMIT);

  fs.mkdirSync(path.dirname(storageFile), { recursive: true });

  const temporaryFile = `${storageFile}.tmp`;

  fs.writeFileSync(
    temporaryFile,
    JSON.stringify(updated, null, 2) + "\n",
    "utf8"
  );

  fs.renameSync(temporaryFile, storageFile);

  // Update memory only after the file is saved successfully.
  history = updated;

  return { ...item };
}

function listChecks() {
  return history.map((item) => ({ ...item }));
}

module.exports = {
  recordCheck,
  listChecks,
};