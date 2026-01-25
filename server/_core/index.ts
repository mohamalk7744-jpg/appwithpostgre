import "dotenv/config";
import * as express from "express";
import { createServer } from "http";
import net from "net";
import path from "path";
import fs from "fs";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  // Use any cast to safely check for .default property on express module import
  // This handles various ways express might be exported/imported in the current environment
  const app = (express as any).default ? (express as any).default() : (express as any)();
  const server = createServer(app);

  // Enable CORS - use 'any' to bypass type resolution issues
  app.use((req: any, res: any, next: any) => {
    const origin = req.headers.origin;
    if (origin) {
      res.header("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    );
    res.header("Access-Control-Allow-Credentials", "true");

    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Use (express as any) to avoid NextHandleFunction mismatch
  app.use((express as any).json({ limit: "50mb" }));
  app.use((express as any).urlencoded({ limit: "50mb", extended: true }));

  // Serve static files from uploads directory
  const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR || './uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadDir));

  // Root route for testing
  app.get("/", (_req: any, res: any) => {
    res.json({ message: "E-Learning API Server is running", status: "ok" });
  });

  registerOAuthRoutes(app);

  app.get("/api/health", (_req: any, res: any) => {
    res.json({ ok: true, timestamp: Date.now() });
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  // Fallback for unknown routes - use 'any' to bypass type resolution issues
  app.use((req: any, res: any) => {
    res.status(404).json({
      error: "Not Found",
      message: `Cannot ${req.method} ${req.path}`,
    });
  });

  const preferredPort = parseInt(process.env.PORT || "3001");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, "0.0.0.0", () => {
    console.log(`[api] server listening on port ${port}`);
    console.log(`[api] local access: http://localhost:${port}`);
  });
}

startServer().catch(console.error);
