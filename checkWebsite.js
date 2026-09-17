async function checkWebsite(url) {
  const startedAt = performance.now();

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      redirect: "manual",
    });

    const responseTimeMs = Math.round(
      performance.now() - startedAt
    );

    if (response.body) {
      await response.body.cancel();
    }

    return {
      url,
      status: response.ok ? "ONLINE" : "FAILED",
      httpStatus: response.status,
      responseTimeMs,
      error: null,
    };
  } catch (error) {
    return {
      url,
      status: "FAILED",
      httpStatus: null,
      responseTimeMs: null,
      error:
        error.name === "TimeoutError"
          ? "Request timed out after 5 seconds"
          : "Network request failed",
    };
  }
}

module.exports = checkWebsite;