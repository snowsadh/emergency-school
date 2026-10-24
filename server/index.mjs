import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createApi } from "./api.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const production = process.argv.includes("--production");
const port = Number(process.env.PORT || 5173);
const host = process.env.APP_HOST || "127.0.0.1";
const api = createApi();
const vite = production
  ? null
  : await (
      await import("vite")
    ).createServer({
      root,
      server: { middlewareMode: true },
      appType: "spa",
    });
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};
const dist = resolve(root, "dist");

const server = http.createServer(async (req, res) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "same-origin");
  res.setHeader("Permissions-Policy", "microphone=(self), camera=()");
  try {
    if (await api(req, res)) return;
    if (vite) return vite.middlewares(req, res);
    if (!["GET", "HEAD"].includes(req.method)) {
      res.writeHead(405);
      return res.end();
    }
    const path = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    let file = resolve(dist, `.${path}`);
    if (file !== dist && !file.startsWith(`${dist}${sep}`)) {
      res.writeHead(403);
      return res.end();
    }
    try {
      if (!(await stat(file)).isFile()) file = resolve(dist, "index.html");
    } catch {
      file = resolve(dist, "index.html");
    }
    const data = await readFile(file);
    res.setHeader(
      "Content-Type",
      mime[extname(file)] || "application/octet-stream",
    );
    res.setHeader(
      "Cache-Control",
      file.includes(`${sep}assets${sep}`)
        ? "public, max-age=31536000, immutable"
        : "no-cache",
    );
    res.end(req.method === "HEAD" ? undefined : data);
  } catch (error) {
    console.error("Request failed:", error.message);
    if (!res.headersSent) {
      res.writeHead(500);
      res.end("Unable to complete the request.");
    } else res.end();
  }
});
server.listen(port, host, () =>
  console.log(`Emergency School is ready at http://${host}:${port}`),
);
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, async () => {
    await vite?.close();
    server.close(() => process.exit(0));
  });
}
