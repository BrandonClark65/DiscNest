// tests/utils/testServer.ts

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { pathToFileURL } from "url";
import { existsSync } from "fs";


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
app.use("/api", async (req, res) => {
  try {
    const routePath = req.path.replace("/api", "");
    const parts = routePath.split("/").filter(Boolean);

    // Try to find route file, handling dynamic routes like [threadId]
    let routeFile: string | null = null;
    let params: Record<string, string> = {};

    // First try exact path
    const exactPath = path.join(
      process.cwd(),
      "src",
      "app",
      "api",
      ...parts,
      "route.ts"
    );

    if (existsSync(exactPath)) {
      routeFile = exactPath;
    } else {
      // If exact path doesn't exist, try dynamic route pattern
      // e.g., /api/messages/abc123 -> messages/[threadId]/route.ts
      const dynamicParts: string[] = [];
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        // Check if there's a [param] folder at this level
        // Try common dynamic route names: [id], [threadId], [listingId], etc.
        const possibleParamNames = ["id", "threadId", "listingId", "requestId", "token"];
        let foundDynamic = false;
        
        for (const paramName of possibleParamNames) {
          const dynamicPath = path.join(
            process.cwd(),
            "src",
            "app",
            "api",
            ...dynamicParts,
            `[${paramName}]`,
            "route.ts"
          );
          // Check if file exists before trying to import
          if (existsSync(dynamicPath)) {
            // Found dynamic route, extract param
            params[paramName] = part;
            dynamicParts.push(`[${paramName}]`);
            routeFile = dynamicPath;
            foundDynamic = true;
            break;
          }
        }
        
        if (!foundDynamic) {
          // Not a dynamic route at this level, continue with exact path
          dynamicParts.push(part);
        }
      }
      
      // If we still don't have a route file, try the constructed path
      if (!routeFile) {
        routeFile = path.join(
          process.cwd(),
          "src",
          "app",
          "api",
          ...dynamicParts,
          "route.ts"
        );
      }
    }

    let routeModule;
    try {
      if (!routeFile || !existsSync(routeFile)) {
        return res.status(404).json({ error: "Route not found" });
      }
      const fileUrl = pathToFileURL(routeFile).href;
      routeModule = await import(fileUrl);
    } catch (e) {
      console.error("Route load failed:", routeFile, e);
      return res.status(404).json({ error: "Route not found" });
    }

    const method = req.method.toUpperCase();

    if (!routeModule[method]) {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const webReq = toWebRequest(req);
    
    // For dynamic routes, pass params in context
    // Extract param from URL (e.g., /api/messages/abc123 -> threadId: "abc123")
    const context = Object.keys(params).length > 0 
      ? { params: Promise.resolve(params) }
      : undefined;
    
    const webRes = await routeModule[method](webReq, context);
    return sendWebResponse(webRes, res);
  } catch (err) {
    console.error("Test server error:", err);
    return res.status(500).json({ error: "Test server crashed" });
  }
});

export default app;
