// tests/utils/testServer.ts

import express from "express";
import path from "path";
import { fileURLToPath } from "url";

// Express app for Supertest
const app = express();
app.use(express.json());

// Needed to resolve filesystem paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Convert Node/Express request → Web Request
function toWebRequest(req: any) {
  const url = `http://localhost${req.originalUrl}`;
  const init: RequestInit = {
    method: req.method,
    headers: req.headers,
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = JSON.stringify(req.body);
  }

  return new Request(url, init);
}

// Convert Web Response → Express Response
async function sendWebResponse(webRes: Response, res: any) {
  const status = webRes.status;
  const headers: Record<string, string> = {};

  webRes.headers.forEach((value, key) => {
    headers[key] = value;
  });
  res.status(status);
  Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));

  const text = await webRes.text();

  try {
    const json = JSON.parse(text);
    return res.send(json);
  } catch {
    return res.send(text);
  }
}

// Automatically load ANY API route in app/api/**/route.ts
app.all("/api/*", async (req, res) => {
  try {
    const routePath = req.path.replace("/api", "");
    const parts = routePath.split("/").filter(Boolean);

    // Resolve path to actual route.ts file
    const routeFile = path.join(
      process.cwd(),
      "src",
      "app",
      "api",
      ...parts,
      "route.ts"
    );

    let routeModule;
    try {
      routeModule = await import(routeFile);
    } catch (e) {
      console.error("Dynamic route load failed:", routeFile);
      return res.status(404).json({ error: "Route not found" });
    }

    const method = req.method.toUpperCase();

    if (!routeModule[method]) {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const webReq = toWebRequest(req);
    const webRes = await routeModule[method](webReq);
    return sendWebResponse(webRes, res);
  } catch (err) {
    console.error("Test server error:", err);
    return res.status(500).json({ error: "Test server crashed" });
  }
});

export default app;
