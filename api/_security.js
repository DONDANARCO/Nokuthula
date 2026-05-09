const crypto = require("crypto");

const buckets = new Map();
let accessCount = 0;

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "unknown";
}

function cleanupExpiredBuckets(now) {
  for (const [key, value] of buckets.entries()) {
    if (!value || value.expiresAt <= now) {
      buckets.delete(key);
    }
  }
}

function rateLimit(req, res, keyPrefix, maxRequests, windowMs) {
  const ip = getClientIp(req);
  const key = `${keyPrefix}:${ip}`;
  const now = Date.now();

  // Periodic cleanup so stale entries never accumulate unbounded.
  accessCount += 1;
  if (accessCount % 100 === 0) {
    cleanupExpiredBuckets(now);
  }

  const existing = buckets.get(key);

  if (!existing || existing.expiresAt <= now) {
    buckets.set(key, { count: 1, expiresAt: now + windowMs });
    return true;
  }

  if (existing.count >= maxRequests) {
    const retryAfterSeconds = Math.ceil((existing.expiresAt - now) / 1000);
    res.setHeader("Retry-After", String(Math.max(retryAfterSeconds, 1)));
    res.status(429).json({ error: "Too many requests. Try again later." });
    return false;
  }

  existing.count += 1;
  buckets.set(key, existing);
  return true;
}

function timingSafeEqualString(a, b) {
  const aHash = crypto.createHash("sha256").update(String(a ?? ""), "utf8").digest();
  const bHash = crypto.createHash("sha256").update(String(b ?? ""), "utf8").digest();
  return crypto.timingSafeEqual(aHash, bHash);
}

function toOrigin(value) {
  if (!value || typeof value !== "string") return "";
  try {
    return new URL(value).origin;
  } catch {
    return "";
  }
}

function isAllowedOrigin(req) {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const origin = toOrigin(req.headers.origin || "");
  const refererOrigin = toOrigin(req.headers.referer || "");
  const host = req.headers.host || "";
  const sameHostOrigin = host ? `https://${host}` : "";

  if (origin && sameHostOrigin && origin === sameHostOrigin) return true;
  if (refererOrigin && sameHostOrigin && refererOrigin === sameHostOrigin) return true;

  if (allowedOrigins.length === 0) return false;
  if (origin && allowedOrigins.includes(origin)) return true;
  if (refererOrigin && allowedOrigins.includes(refererOrigin)) return true;
  return false;
}

module.exports = {
  getClientIp,
  rateLimit,
  timingSafeEqualString,
  isAllowedOrigin,
};
