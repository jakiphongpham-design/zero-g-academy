(() => {
  "use strict";

  const MAX_MESSAGE_LENGTH = 500;
  const MAX_HISTORY_MESSAGES = 10;
  const SUGGESTIONS = [
    "Why is Mars red?",
    "How do rockets reach space?",
    "What is a black hole?",
  ];

  const root = document.createElement("div");
  root.className = "space-chat-root";
  root.innerHTML = `
    <button class="space-chat-launcher" type="button" aria-expanded="false" aria-controls="space-chat-panel">
      <img src="laika.jpg" alt="">
      <span>Ask Laika</span>
    </button>
    <section class="space-chat-panel" id="space-chat-panel" role="dialog" aria-labelledby="space-chat-title" hidden>
      <header class="space-chat-header">
        <img src="laika.jpg" alt="Laika, the Zero-G Academy space dog">
        <div class="space-chat-identity">
          <p class="space-chat-name" id="space-chat-title">Laika</p>
          <p class="space-chat-status">Space guide online</p>
        </div>
        <button class="space-chat-close" type="button" aria-label="Close Laika chat">&times;</button>
      </header>
      <div class="space-chat-log" role="log" aria-live="polite" aria-relevant="additions text">
        <div class="space-chat-welcome">
          <img src="laika.jpg" alt="">
          <p><strong>Hello, Cadet!</strong>Ask me anything about space.</p>
        </div>
        <div class="space-chat-suggestions" aria-label="Suggested space questions"></div>
      </div>
      <form class="space-chat-form">
        <div class="space-chat-input-wrap">
          <textarea class="space-chat-input" rows="1" maxlength="500" placeholder="Ask a space question…" aria-label="Your space question"></textarea>
          <p class="space-chat-meta">Space questions only · 500 characters</p>
        </div>
        <button class="space-chat-send" type="submit" aria-label="Send question" disabled>➜</button>
      </form>
    </section>
  `;
  document.body.append(root);

  const launcher = root.querySelector(".space-chat-launcher");
  const panel = root.querySelector(".space-chat-panel");
  const closeButton = root.querySelector(".space-chat-close");
  const log = root.querySelector(".space-chat-log");
  const suggestions = root.querySelector(".space-chat-suggestions");
  const form = root.querySelector(".space-chat-form");
  const input = root.querySelector(".space-chat-input");
  const sendButton = root.querySelector(".space-chat-send");

  let history = [];
  let streaming = false;
  let activeController = null;

  function setOpen(open) {
    panel.hidden = !open;
    launcher.setAttribute("aria-expanded", String(open));
    if (open) {
      window.requestAnimationFrame(() => input.focus());
    } else {
      launcher.focus();
    }
  }

  function setBusy(busy) {
    streaming = busy;
    input.disabled = busy;
    sendButton.disabled = busy || input.value.trim().length === 0;
    suggestions.querySelectorAll("button").forEach((button) => {
      button.disabled = busy;
    });
  }

  function scrollToLatest() {
    log.scrollTop = log.scrollHeight;
  }

  function addMessage(role, text = "") {
    const message = document.createElement("p");
    message.className = "space-chat-message";
    message.dataset.role = role;
    message.textContent = text;
    log.append(message);
    scrollToLatest();
    return message;
  }

  function friendlyError(status) {
    if (status === 503) {
      return "Laika is not connected yet. Please check the Gemini API key.";
    }
    if (status === 429) {
      return "Laika needs a short rest. Please try another space question soon.";
    }
    return "Laika lost contact with mission control. Please try again.";
  }

  async function readError(response) {
    try {
      const data = await response.json();
      return typeof data.error === "string" ? data.error : friendlyError(response.status);
    } catch {
      return friendlyError(response.status);
    }
  }

  async function askLaika(questionText) {
    const question = questionText.trim().slice(0, MAX_MESSAGE_LENGTH);
    if (!question || streaming) return;

    suggestions.hidden = true;
    addMessage("user", question);
    history.push({ role: "user", text: question });
    input.value = "";
    input.style.height = "auto";

    const reply = addMessage("model", "");
    reply.classList.add("is-streaming");
    setBusy(true);
    activeController = new AbortController();

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.slice(-MAX_HISTORY_MESSAGES) }),
        signal: activeController.signal,
      });

      if (!response.ok) throw new Error(await readError(response));
      if (!response.body) throw new Error("Laika could not start the answer stream.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let answer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        reply.textContent = answer;
        scrollToLatest();
      }

      answer += decoder.decode();
      reply.textContent = answer.trim() || "I could not find an answer. Try another space question.";
      history.push({ role: "model", text: reply.textContent });
    } catch (error) {
      if (error.name === "AbortError") return;
      reply.textContent = error.message || friendlyError(500);
    } finally {
      reply.classList.remove("is-streaming");
      activeController = null;
      setBusy(false);
      input.focus();
      scrollToLatest();
    }
  }

  SUGGESTIONS.forEach((question) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "space-chat-suggestion";
    button.textContent = question;
    button.addEventListener("click", () => askLaika(question));
    suggestions.append(button);
  });

  launcher.addEventListener("click", () => setOpen(true));
  closeButton.addEventListener("click", () => setOpen(false));

  input.addEventListener("input", () => {
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 112)}px`;
    sendButton.disabled = streaming || input.value.trim().length === 0;
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!sendButton.disabled) form.requestSubmit();
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    askLaika(input.value);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) setOpen(false);
  });

  window.addEventListener("pagehide", () => activeController?.abort());
})();
