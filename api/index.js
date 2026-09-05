// Vercel serverless function - adapter for TanStack Start SSR output
// The built server exports a fetch() handler (Web API style).
// This adapter converts it to Node.js req/res style that Vercel expects.

import { createServer } from "node:http";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Dynamically import the built SSR handler
const { default: ssrHandler } = await import(
  resolve(__dirname, "../dist/server/server.js")
);

export default async function handler(req, res) {
  // Build a full URL from the request
  const host = req.headers.host || "localhost";
  const protocol = req.headers["x-forwarded-proto"] || "https";
  const url = new URL(req.url, `${protocol}://${host}`);

  // Collect body if present
  let body = null;
  if (req.method !== "GET" && req.method !== "HEAD") {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    body = Buffer.concat(chunks);
  }

  // Build a Web API Request
  const webRequest = new Request(url.toString(), {
    method: req.method,
    headers: req.headers,
    body: body?.length ? body : undefined,
    duplex: "half",
  });

  // Call the SSR fetch handler
  const webResponse = await ssrHandler.fetch(webRequest, process.env, {});

  // Write status + headers
  res.statusCode = webResponse.status;
  webResponse.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  // Stream body back
  if (webResponse.body) {
    const reader = webResponse.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
  }
  res.end();
}
