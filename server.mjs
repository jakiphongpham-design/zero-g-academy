import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, isAbsolute, join, normalize, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { handleChat, sendJson } from "./src/core/chat-handler.mjs";

const ROOT = fileURLToPath(new URL(".", import.meta.url));
const ENV_FILE = join(ROOT, ".env");

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const source = readFileSync(path, "utf8");

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;

    const key = line.slice(0, separator).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) || process.env[key] !== undefined) continue;

    let value = line.slice(separator + 1).trim();
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadEnvFile(ENV_FILE);

const PORT = Number.parseInt(process.env.PORT || "8000", 10);
const HOST = process.env.HOST || "127.0.0.1";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

const MIME_TYPES = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"],
]);

function safeStaticPath(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return null;
  }

  const clean = normalize(decoded).replace(/^[/\\]+/, "");
  if (!clean || clean === ".") return join(ROOT, "index.html");
  if (clean.split(/[\\/]/).some((segment) => segment.startsWith("."))) return null;

  const candidate = resolve(ROOT, clean);
  const pathFromRoot = relative(ROOT, candidate);
  if (pathFromRoot.startsWith(`..${sep}`) || pathFromRoot === ".." || isAbsolute(pathFromRoot)) return null;
  return candidate;
}

function serveStatic(request, response, pathname) {
  let filePath = safeStaticPath(pathname);
  if (!filePath || !existsSync(filePath)) {
    sendJson(response, 404, { error: "Not found." });
    return;
  }

  if (statSync(filePath).isDirectory()) filePath = join(filePath, "index.html");
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    sendJson(response, 404, { error: "Not found." });
    return;
  }

  const contentType = MIME_TYPES.get(extname(filePath).toLowerCase()) || "application/octet-stream";
  response.writeHead(200, {
    "Content-Type": contentType,
    "Cache-Control": "no-cache",
    "X-Content-Type-Options": "nosniff",
  });

  if (request.method === "HEAD") {
    response.end();
    return;
  }

  createReadStream(filePath)
    .on("error", () => {
      if (!response.headersSent) sendJson(response, 500, { error: "Could not read file." });
      else response.destroy();
    })
    .pipe(response);
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);

  try {
    if (url.pathname === "/api/chat") {
      if (request.method !== "POST") {
        response.writeHead(405, { Allow: "POST" });
        response.end();
        return;
      }
      await handleChat(request, response);
      return;
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405, { Allow: "GET, HEAD" });
      response.end();
      return;
    }
    serveStatic(request, response, url.pathname);
  } catch (error) {
    console.warn(`Request failed: ${error.message}`);
    if (!response.headersSent) sendJson(response, error.status || 500, { error: error.message || "Request failed." });
    else if (!response.writableEnded) response.end();
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Zero-G Academy is ready at http://${HOST}:${PORT}`);
  console.log(`Laika model: ${GEMINI_MODEL}`);
});

export { server };
