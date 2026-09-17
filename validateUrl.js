function validateUrl(input) {
  if (typeof input !== "string" || input.trim() === "") {
    throw new Error("Enter a website URL.");
  }

  let url;

  try {
    url = new URL(input.trim());
  } catch {
    throw new Error("Enter a complete URL, including https://.");
  }
  if (url.protocol !== "https:") {
  throw new Error("Only HTTPS URLs are supported.");
}
  if (url.username || url.password) {
    throw new Error("URLs must not contain usernames or passwords.");
  }

  const allowedOrigins = [
    "https://example.com",
    "https://example.org",
  ];

  if (!allowedOrigins.includes(url.origin)) {
    throw new Error(
      "For now, use https://example.com or https://example.org."
    );
  }

  url.hash = "";

  return url.href;
}

module.exports = validateUrl;