import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, isAbsolute, join, normalize, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL(".", import.meta.url));
const ENV_FILE = join(ROOT, ".env");
const MAX_BODY_BYTES = 32_000;
const MAX_MESSAGE_LENGTH = 500;
const MAX_HISTORY_MESSAGES = 10;
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

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
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

const SYSTEM_INSTRUCTION = "You are Laika, a professional space science teacher for Zero-G Academy. Explain concepts using simple, easy-to-understand vocabulary. You must strictly adhere to these rules: 1. Only answer questions related to space, astronomy, physics, space exploration history, and famous astronauts. If a question falls outside these specific domains, politely refuse and redirect the user back to space topics. 2. Your responses must always be between 3 and 5 sentences long. Do not exceed 5 sentences.";


const SOCIAL_REPLIES = [
  {
    pattern: /^(?:hi+|hello+|hey+|howdy|greetings|good (?:morning|afternoon|evening))(?:[, ]+(?:laika|there))?(?:[,! ]+(?:how are you|how(?:'s| is) it going|what can you do|can you help(?: me)?))?[!?. ]*$/i,
    reply: "Welcome to Zero-G Academy! I'm Laika, your space guide. What would you like to discover about space?",
  },
  {
    pattern: /^(?:how are you|how(?:'s| is) it going|what(?:'s| is) up|are you (?:okay|ok|ready))[!?. ]*$/i,
    reply: "I'm ready for launch and happy to help! What would you like to learn about space?",
  },
  {
    pattern: /^(?:who are you|what are you|what(?:'s| is) your name|tell me about yourself|introduce yourself|are you (?:a )?dog)[!?. ]*$/i,
    reply: "I'm Laika, Zero-G Academy's space-dog guide. I help young explorers learn about planets, stars, rockets, astronauts, and space missions!",
  },
  {
    pattern: /^(?:can you help(?: me)?|help(?: me)?|what can you do|what can i ask(?: you)?|what should i ask|how can you help(?: me)?)[!?. ]*$/i,
    reply: "Of course! Ask me anything about space, such as planets, stars, black holes, rockets, astronauts, or NASA missions.",
  },
  {
    pattern: /^(?:thanks|thank you|thank you so much|thx)[!?. ]*$/i,
    reply: "You're welcome, Cadet! Ask me another space question anytime.",
  },
  {
    pattern: /^(?:ok(?:ay)?|cool|wow|awesome|great|interesting|i see|got it|that(?:'s| is) cool)[!?. ]*$/i,
    reply: "Mission understood! What else would you like to discover about space?",
  },
  {
    pattern: /^(?:nice|glad|pleased) to meet you[!?. ]*$/i,
    reply: "It's great to meet you too, Cadet! I'm excited to explore space with you.",
  },
  {
    pattern: /^(?:tell me (?:a )?joke|do you know (?:a )?joke|make me laugh)[!?. ]*$/i,
    reply: "Why did the Sun go to school? To get a little brighter! Want to explore another space mystery?",
  },
  {
    pattern: /^(?:bye|goodbye|see you|see you later|good night|have a good (?:day|night))[!?. ]*$/i,
    reply: "See you next mission, Cadet! Come back anytime for more space questions.",
  },
];

function friendlyConversationReply(messages) {
  const latest = [...messages].reverse().find((message) => message.role === "user")?.text.trim() || "";
  return SOCIAL_REPLIES.find(({ pattern }) => pattern.test(latest))?.reply || null;
}

function normalizeMessages(value) {
  if (!Array.isArray(value)) return null;

  const messages = value
    .slice(-MAX_HISTORY_MESSAGES)
    .map((message) => ({
      role: message?.role === "model" ? "model" : "user",
      text: typeof message?.text === "string" ? message.text.trim().slice(0, MAX_MESSAGE_LENGTH) : "",
    }))
    .filter((message) => message.text.length > 0);

  if (messages.length === 0 || messages.at(-1).role !== "user") return null;
  return messages;
}

async function readJsonBody(request) {
  let size = 0;
  const chunks = [];

  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      const error = new Error("Request is too large.");
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    const error = new Error("Invalid JSON request.");
    error.status = 400;
    throw error;
  }
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(JSON.stringify(payload));
}

function startTextStream(response) {
  response.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
    "Transfer-Encoding": "chunked",
    "X-Content-Type-Options": "nosniff",
  });
}

const rateLimits = new Map();

function allowRequest(ip) {
  const now = Date.now();
  const current = rateLimits.get(ip);
  if (!current || now - current.startedAt >= RATE_LIMIT_WINDOW_MS) {
    rateLimits.set(ip, { startedAt: now, count: 1 });
    return true;
  }
  if (current.count >= RATE_LIMIT_MAX) return false;
  current.count += 1;
  return true;
}

function geminiContents(messages) {
  return messages.map((message) => ({
    role: message.role,
    parts: [{ text: message.text }],
  }));
}

function textFromGeminiEvent(payload) {
  if (!payload || typeof payload !== "object" || !Array.isArray(payload.candidates)) return "";
  let text = "";
  for (const candidate of payload.candidates) {
    const parts = candidate?.content?.parts;
    if (!Array.isArray(parts)) continue;
    for (const part of parts) {
      if (typeof part?.text === "string" && part.thought !== true) text += part.text;
    }
  }
  return text;
}

async function pipeGeminiStream(upstream, response) {
  const decoder = new TextDecoder();
  let buffer = "";
  let wroteText = false;

  for await (const chunk of upstream.body) {
    buffer += decoder.decode(chunk, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const payload = JSON.parse(data);
        const finishReason = payload?.candidates?.[0]?.finishReason;
        if (finishReason && finishReason !== "STOP") {
          console.warn(`Gemini finished with reason ${finishReason}.`);
        }
        const text = textFromGeminiEvent(payload);
        if (text) {
          wroteText = true;
          response.write(text);
        }
      } catch {
        // Ignore one malformed SSE event and keep the remaining stream alive.
      }
    }
  }

  buffer += decoder.decode();
  if (buffer.startsWith("data:")) {
    try {
      const text = textFromGeminiEvent(JSON.parse(buffer.slice(5).trim()));
      if (text) {
        wroteText = true;
        response.write(text);
      }
    } catch {
      // The completed stream can end with an empty line or a non-data event.
    }
  }

  if (!wroteText) response.write("I could not answer that safely. Please try another space question.");
  response.end();
}

async function handleChat(request, response) {
  const ip = request.socket.remoteAddress || "unknown";
  if (!allowRequest(ip)) {
    sendJson(response, 429, { error: "Laika needs a short rest. Please try again soon." });
    return;
  }
  const body = await readJsonBody(request);
  const messages = normalizeMessages(body.messages);
  if (!messages) {
    sendJson(response, 400, { error: "Please send a valid question." });
    return;
  }

  const friendlyReply = friendlyConversationReply(messages);
  if (friendlyReply) {
    startTextStream(response);
    response.end(friendlyReply);
    return;
  }

  if (!GEMINI_API_KEY) {
    sendJson(response, 503, { error: "Laika is not connected yet. Add GEMINI_API_KEY to .env." });
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);
  response.on("close", () => {
    if (!response.writableEnded) controller.abort();
  });

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:streamGenerateContent?alt=sse`;
    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents: geminiContents(messages),
        generationConfig: {
          maxOutputTokens: 4096,
          thinkingConfig: { thinkingLevel: "MINIMAL" },
        },
      }),
      signal: controller.signal,
    });

    if (!upstream.ok || !upstream.body) {
      console.warn(`Gemini request failed with HTTP ${upstream.status}.`);
      sendJson(response, 502, { error: "Laika could not reach mission control. Please try again." });
      return;
    }

    startTextStream(response);
    await pipeGeminiStream(upstream, response);
  } catch (error) {
    console.warn(`Gemini stream failed: ${error.name || "Error"}.`);
    if (!response.headersSent) {
      const message = error.name === "AbortError"
        ? "Laika's answer took too long. Please try again."
        : "Laika lost contact with mission control. Please try again.";
      sendJson(response, 502, { error: message });
    } else if (!response.writableEnded) {
      response.end("\n\nLaika lost contact with mission control.");
    }
  } finally {
    clearTimeout(timeout);
  }
}

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

export { friendlyConversationReply, normalizeMessages, server };
