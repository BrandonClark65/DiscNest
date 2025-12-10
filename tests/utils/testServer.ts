// tests/utils/testServer.ts

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { pathToFileURL } from "url";
import { existsSync } from "fs";
import multer from "multer";

// Express app for Supertest
const app = express();
app.use(express.json());

// Handle multipart/form-data for file uploads using multer
const upload = multer({ storage: multer.memoryStorage() });
app.use((req, res, next) => {
  if (req.headers["content-type"]?.includes("multipart/form-data")) {
    upload.any()(req, res, next);
  } else {
    next();
  }
});

// Needed to resolve filesystem paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Convert Node/Express request → Web Request
async function toWebRequest(req: any) {
  const url = `http://localhost${req.originalUrl}`;
  
  // Handle multipart/form-data (or requests that might have files)
  const hasMultipartHeader = req.headers["content-type"]?.includes("multipart/form-data");
  const hasFiles = req.files && Array.isArray(req.files) && req.files.length > 0;
  // Also check if this is an upload route that expects FormData
  const isUploadRoute = req.path === "/upload" || req.originalUrl.includes("/upload");
  
  if (req.method !== "GET" && req.method !== "HEAD" && (hasMultipartHeader || hasFiles || isUploadRoute)) {
    // Create a custom FormData-like object that preserves File objects
    const entries = new Map<string, File | string>();
    
    // Add files from multer
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        // Convert Buffer to ArrayBuffer
        const arrayBuffer = file.buffer.buffer.slice(
          file.buffer.byteOffset,
          file.buffer.byteOffset + file.buffer.byteLength
        );
        
        // Create a custom File-like object that definitely has arrayBuffer()
        const fileLike = {
          name: file.originalname || "file",
          type: file.mimetype || "application/octet-stream",
          size: file.buffer.length,
          lastModified: Date.now(),
          arrayBuffer: async () => arrayBuffer,
          stream: () => new ReadableStream({
            start(controller) {
              controller.enqueue(new Uint8Array(arrayBuffer));
              controller.close();
            },
          }),
          text: async () => new TextDecoder().decode(arrayBuffer),
          slice: (start?: number, end?: number, contentType?: string) => {
            const sliced = arrayBuffer.slice(start, end);
            return {
              arrayBuffer: async () => sliced,
              size: sliced.byteLength,
              type: contentType || fileLike.type,
            } as Blob;
          },
        } as File;
        
        entries.set(file.fieldname, fileLike);
      }
    }
    
    // Add fields from req.body (multer puts non-file fields here)
    if (req.body) {
      for (const [key, value] of Object.entries(req.body)) {
        if (typeof value === "string") {
          entries.set(key, value);
        }
      }
    }
    
    // Create a custom FormData-like object
    const customFormData = {
      get(name: string): File | string | null {
        return entries.get(name) || null;
      },
      getAll(name: string): (File | string)[] {
        const value = entries.get(name);
        return value ? [value] : [];
      },
      has(name: string): boolean {
        return entries.has(name);
      },
      set(name: string, value: File | string): void {
        entries.set(name, value);
      },
      append(name: string, value: File | string): void {
        entries.set(name, value);
      },
      delete(name: string): void {
        entries.delete(name);
      },
      entries(): IterableIterator<[string, File | string]> {
        return entries.entries();
      },
      keys(): IterableIterator<string> {
        return entries.keys();
      },
      values(): IterableIterator<File | string> {
        return entries.values();
      },
      forEach(callback: (value: File | string, key: string, parent: typeof customFormData) => void): void {
        entries.forEach((value, key) => callback(value, key, customFormData));
      },
    } as FormData;
    
    // Create Request without body - we'll override formData() to return our custom FormData
    const baseRequest = new Request(url, {
      method: req.method,
    });
    
    // Use Proxy to override formData() method while keeping all other properties
    // This ensures formData() returns our custom FormData instance with proper File objects
    return new Proxy(baseRequest, {
      get(target, prop) {
        if (prop === "formData") {
          return async () => customFormData;
        }
        return (target as any)[prop];
      },
    }) as Request;
  }
  
  // For non-multipart requests
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

    const webReq = await toWebRequest(req);
    
    // For dynamic routes, pass params in context
    // Extract param from URL (e.g., /api/messages/abc123 -> threadId: "abc123")
    // Always provide context with params (even if empty) to match Next.js behavior
    const context = { params: Promise.resolve(params) };
    
    const webRes = await routeModule[method](webReq, context);
    return sendWebResponse(webRes, res);
  } catch (err) {
    console.error("Test server error:", err);
    return res.status(500).json({ error: "Test server crashed" });
  }
});

export default app;
