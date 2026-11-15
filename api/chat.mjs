import { handleChat, sendJson } from "../src/core/chat-handler.mjs";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.writeHead(405, { Allow: "POST" });
    response.end();
    return;
  }

  try {
    await handleChat(request, response);
  } catch (error) {
    console.warn(`Chat request failed: ${error.message}`);
    if (!response.headersSent) {
      sendJson(response, error.status || 500, { error: error.message || "Request failed." });
    } else if (!response.writableEnded) {
      response.end();
    }
  }
}
